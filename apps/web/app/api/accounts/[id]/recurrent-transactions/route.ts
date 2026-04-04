import { prisma } from "@repo/db";
import { getEuropeMadridDateParts } from "@repo/utils";
import { NextResponse } from "next/server";
import { z } from "zod";
import { recalculateMonthSnapshot } from "@/app/api/_lib/snapshots/recalculateMonthSnapshot";

export const dynamic = "force-dynamic";

const recurrentTransactionSchema = z.object({
  to_account_id: z.number().int().positive(),
  amount: z.number().positive(),
  description: z.string().optional(),
  automated: z.boolean().optional(),
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

function getYearMonthRange(startYear: number, startMonth: number, endYear: number, endMonth: number) {
  const result: Array<{ year: number; month: number }> = [];
  let cursorYear = startYear;
  let cursorMonth = startMonth;

  while (compareYearMonth(cursorYear, cursorMonth, endYear, endMonth) <= 0) {
    result.push({ year: cursorYear, month: cursorMonth });
    const next = getNextYearMonth(cursorYear, cursorMonth);
    cursorYear = next.year;
    cursorMonth = next.month;
  }

  return result;
}

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/accounts/:id/recurrent-transactions
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const accountId = Number(id);

    if (Number.isNaN(accountId)) {
      return NextResponse.json({ error: "Invalid account id" }, { status: 400 });
    }

    const recurrentTransactions = await prisma.recurrentTransaction.findMany({
      where: {
        OR: [{ from_account_id: accountId }, { to_account_id: accountId }],
      },
      include: {
        from_account: { select: { name: true } },
        to_account: { select: { name: true } },
        last_applied_month: true,
      },
      orderBy: { id: "desc" },
    });

    return NextResponse.json(recurrentTransactions, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch recurrent transactions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST /api/accounts/:id/recurrent-transactions
export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const fromAccountId = Number(id);

    if (Number.isNaN(fromAccountId)) {
      return NextResponse.json({ error: "Invalid account id" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = recurrentTransactionSchema.parse(body);

    if (parsed.to_account_id === fromAccountId) {
      return NextResponse.json({ error: "from and to accounts must be different" }, { status: 400 });
    }

    const [fromAccount, toAccount] = await Promise.all([
      prisma.account.findUnique({ where: { id: fromAccountId } }),
      prisma.account.findUnique({ where: { id: parsed.to_account_id } }),
    ]);

    if (!fromAccount || !toAccount) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const { year: currentYear, month: currentMonth } = getEuropeMadridDateParts();
    const startMonthDate = parseYearMonthToDate(parsed.start_month) ?? null;
    const endMonthDate = parseYearMonthToDate(parsed.end_month) ?? null;

    if (startMonthDate && endMonthDate && endMonthDate < startMonthDate) {
      return NextResponse.json(
        { error: "end_month cannot be earlier than start_month" },
        { status: 400 }
      );
    }

    const recurrentTransaction = await prisma.recurrentTransaction.create({
      data: {
        from_account_id: fromAccountId,
        to_account_id: parsed.to_account_id,
        amount: parsed.amount,
        description: parsed.description,
        automated: parsed.automated ?? true,
        status: parsed.status ?? "ACTIVE",
        start_month: startMonthDate ?? undefined,
        end_month: endMonthDate ?? undefined,
        next_run_year: parsed.next_run_year ?? currentYear,
        next_run_month: parsed.next_run_month ?? currentMonth,
      },
    });

    const affectedByMonth = new Map<number, Set<number>>();
    let appliedCount = 0;

    if (recurrentTransaction.status === "ACTIVE" && !recurrentTransaction.automated) {
      const startYear = startMonthDate ? startMonthDate.getUTCFullYear() : currentYear;
      const startMonth = startMonthDate ? startMonthDate.getUTCMonth() + 1 : currentMonth;
      let endYear = currentYear;
      let endMonth = currentMonth;

      if (endMonthDate) {
        const candidateYear = endMonthDate.getUTCFullYear();
        const candidateMonth = endMonthDate.getUTCMonth() + 1;
        if (compareYearMonth(candidateYear, candidateMonth, endYear, endMonth) < 0) {
          endYear = candidateYear;
          endMonth = candidateMonth;
        }
      }

      if (compareYearMonth(startYear, startMonth, endYear, endMonth) <= 0) {
        const dueMonths = getYearMonthRange(startYear, startMonth, endYear, endMonth);
        await prisma.todo.createMany({
          data: dueMonths.map(({ year, month }) => ({
            type: "TRANSACTION",
            origin: "RECURRENT",
            status: "OPEN",
            due_year: year,
            due_month: month,
            title: recurrentTransaction.description?.trim() || "Manual recurrent transaction",
            description: recurrentTransaction.description,
            amount: recurrentTransaction.amount,
            from_account_id: fromAccountId,
            to_account_id: parsed.to_account_id,
            recurrent_transaction_id: recurrentTransaction.id,
          })),
          skipDuplicates: true,
        });
      }
    }

    if (recurrentTransaction.status === "ACTIVE" && recurrentTransaction.automated && startMonthDate) {
      const startYear = startMonthDate.getUTCFullYear();
      const startMonth = startMonthDate.getUTCMonth() + 1;

      let endYear = currentYear;
      let endMonth = currentMonth;

      if (endMonthDate) {
        const endYearCandidate = endMonthDate.getUTCFullYear();
        const endMonthCandidate = endMonthDate.getUTCMonth() + 1;
        if (compareYearMonth(endYearCandidate, endMonthCandidate, endYear, endMonth) < 0) {
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
            const existingRun = await tx.recurrentTransactionRun.findUnique({
              where: {
                recurrent_transaction_month: {
                  recurrent_transaction_id: recurrentTransaction.id,
                  month_id: monthRecord.id,
                },
              },
            });

            if (existingRun?.status === "APPLIED") {
              return false;
            }

            if (existingRun) {
              await tx.recurrentTransactionRun.update({
                where: { id: existingRun.id },
                data: {
                  status: "FAILED",
                  processing_error: null,
                  transaction_id: null,
                },
              });
            } else {
              await tx.recurrentTransactionRun.create({
                data: {
                  recurrent_transaction_id: recurrentTransaction.id,
                  month_id: monthRecord.id,
                  status: "FAILED",
                },
              });
            }

            const transaction = await tx.transaction.create({
              data: {
                from_account_id: fromAccountId,
                to_account_id: parsed.to_account_id,
                month_id: monthRecord.id,
                amount: recurrentTransaction.amount,
                description: recurrentTransaction.description,
                status: "COMPLETED",
                processed_at: new Date(),
              },
            });

            await tx.account.update({
              where: { id: fromAccountId },
              data: { balance: { decrement: recurrentTransaction.amount } },
            });

            await tx.account.update({
              where: { id: parsed.to_account_id },
              data: { balance: { increment: recurrentTransaction.amount } },
            });

            await tx.recurrentTransactionRun.update({
              where: {
                recurrent_transaction_month: {
                  recurrent_transaction_id: recurrentTransaction.id,
                  month_id: monthRecord.id,
                },
              },
              data: {
                status: "APPLIED",
                transaction_id: transaction.id,
                processing_error: null,
              },
            });

            return true;
          });

          if (result) {
            appliedCount += 1;
            const existing = affectedByMonth.get(monthRecord.id) ?? new Set<number>();
            existing.add(fromAccountId);
            existing.add(parsed.to_account_id);
            affectedByMonth.set(monthRecord.id, existing);
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

          await prisma.recurrentTransaction.update({
            where: { id: recurrentTransaction.id },
            data: {
              last_applied_month_id: lastAppliedMonth?.id,
              next_run_year: next.year,
              next_run_month: next.month,
            },
          });
        }
      }
    }

    for (const [monthId, accountIds] of affectedByMonth) {
      for (const accountId of accountIds) {
        await recalculateMonthSnapshot(accountId, monthId);
      }
    }

    return NextResponse.json(
      {
        recurrentTransaction,
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
        error: "Failed to create recurrent transaction",
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
