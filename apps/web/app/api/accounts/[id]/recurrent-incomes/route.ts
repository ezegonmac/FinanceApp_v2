import { prisma } from "@repo/db";
import { getEuropeMadridDateParts } from "@repo/utils";
import { NextResponse } from "next/server";
import { z } from "zod";
import { recalculateMonthSnapshot } from "@/app/api/_lib/snapshots/recalculateMonthSnapshot";

export const dynamic = "force-dynamic";

const recurrentIncomeSchema = z.object({
  amount: z.number().positive(),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "PAUSED", "CANCELLED"]).optional(),
  start_month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  end_month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  next_run_year: z.number().int().optional(),
  next_run_month: z.number().int().min(1).max(12).optional(),
});

function parseYearMonthToDate(value?: string) {
  if (!value) return null;
  const [yearStr, monthStr] = value.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  return new Date(Date.UTC(year, month - 1, 1));
}

function compareYearMonth(aYear: number, aMonth: number, bYear: number, bMonth: number) {
  if (aYear !== bYear) return aYear - bYear;
  return aMonth - bMonth;
}

function getNextYearMonth(year: number, month: number) {
  if (month === 12) return { year: year + 1, month: 1 };
  return { year, month: month + 1 };
}

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/accounts/:id/recurrent-incomes
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const accountId = Number(id);

    if (Number.isNaN(accountId)) {
      return NextResponse.json({ error: "Invalid account id" }, { status: 400 });
    }

    const recurrentIncomes = await prisma.recurrentIncome.findMany({
      where: { account_id: accountId },
      include: {
        last_applied_month: true,
      },
      orderBy: { id: "desc" },
    });

    return NextResponse.json(recurrentIncomes, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch recurrent incomes",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST /api/accounts/:id/recurrent-incomes
export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const accountId = Number(id);

    if (Number.isNaN(accountId)) {
      return NextResponse.json({ error: "Invalid account id" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = recurrentIncomeSchema.parse(body);
    const { year: currentYear, month: currentMonth } = getEuropeMadridDateParts();
    const startMonthDate = parseYearMonthToDate(parsed.start_month) ?? null;
    const endMonthDate = parseYearMonthToDate(parsed.end_month) ?? null;

    if (startMonthDate && endMonthDate && endMonthDate < startMonthDate) {
      return NextResponse.json(
        { error: "end_month cannot be earlier than start_month" },
        { status: 400 }
      );
    }

    const recurrentIncome = await prisma.recurrentIncome.create({
      data: {
        account_id: accountId,
        amount: parsed.amount,
        description: parsed.description,
        status: parsed.status ?? "ACTIVE",
        start_month: startMonthDate ?? undefined,
        end_month: endMonthDate ?? undefined,
        next_run_year: parsed.next_run_year ?? currentYear,
        next_run_month: parsed.next_run_month ?? currentMonth,
      },
    });

    const affectedMonthIds = new Set<number>();
    let appliedCount = 0;

    if (recurrentIncome.status === "ACTIVE" && startMonthDate) {
      const startYear = startMonthDate.getUTCFullYear();
      const startMonth = startMonthDate.getUTCMonth() + 1;

      let endYear = currentYear;
      let endMonth = currentMonth;

      if (endMonthDate) {
        const endYearCandidate = endMonthDate.getUTCFullYear();
        const endMonthCandidate = endMonthDate.getUTCMonth() + 1;
        if (
          compareYearMonth(endYearCandidate, endMonthCandidate, endYear, endMonth) < 0
        ) {
          endYear = endYearCandidate;
          endMonth = endMonthCandidate;
        }
      }

      if (compareYearMonth(startYear, startMonth, endYear, endMonth) <= 0) {
        let runYear = startYear;
        let runMonth = startMonth;

        while (compareYearMonth(runYear, runMonth, endYear, endMonth) <= 0) {
          const monthRecord = await prisma.month.upsert({
            where: {
              year_month: {
                year: runYear,
                month: runMonth,
              },
            },
            update: {},
            create: {
              year: runYear,
              month: runMonth,
            },
          });

          const result = await prisma.$transaction(async (tx) => {
            const existingRun = await tx.recurrentIncomeRun.findUnique({
              where: {
                recurrent_income_month: {
                  recurrent_income_id: recurrentIncome.id,
                  month_id: monthRecord.id,
                },
              },
            });

            if (existingRun?.status === "APPLIED") {
              return false;
            }

            if (existingRun) {
              await tx.recurrentIncomeRun.update({
                where: { id: existingRun.id },
                data: {
                  status: "FAILED",
                  processing_error: null,
                  income_id: null,
                },
              });
            } else {
              await tx.recurrentIncomeRun.create({
                data: {
                  recurrent_income_id: recurrentIncome.id,
                  month_id: monthRecord.id,
                  status: "FAILED",
                },
              });
            }

            const income = await tx.income.create({
              data: {
                account_id: accountId,
                month_id: monthRecord.id,
                amount: recurrentIncome.amount,
                description: recurrentIncome.description,
                status: "COMPLETED",
                processed_at: new Date(),
              },
            });

            await tx.account.update({
              where: { id: accountId },
              data: { balance: { increment: recurrentIncome.amount } },
            });

            await tx.recurrentIncomeRun.update({
              where: {
                recurrent_income_month: {
                  recurrent_income_id: recurrentIncome.id,
                  month_id: monthRecord.id,
                },
              },
              data: {
                status: "APPLIED",
                income_id: income.id,
                processing_error: null,
              },
            });

            return true;
          });

          if (result) {
            appliedCount += 1;
            affectedMonthIds.add(monthRecord.id);
          }

          const next = getNextYearMonth(runYear, runMonth);
          runYear = next.year;
          runMonth = next.month;
        }

        if (appliedCount > 0) {
          const next = getNextYearMonth(endYear, endMonth);
          const lastAppliedMonth = await prisma.month.findUnique({
            where: {
              year_month: {
                year: endYear,
                month: endMonth,
              },
            },
          });

          await prisma.recurrentIncome.update({
            where: { id: recurrentIncome.id },
            data: {
              last_applied_month_id: lastAppliedMonth?.id,
              next_run_year: next.year,
              next_run_month: next.month,
            },
          });
        }
      }
    }

    for (const monthId of affectedMonthIds) {
      await recalculateMonthSnapshot(accountId, monthId);
    }

    return NextResponse.json(
      {
        recurrentIncome,
        backfilled_months_applied: appliedCount,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create recurrent income",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 405,
      headers: {
        Allow: "GET, POST",
      },
    }
  );
}
