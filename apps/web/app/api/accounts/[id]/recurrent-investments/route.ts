import { prisma } from "@repo/db";
import { getEuropeMadridDateParts } from "@repo/utils";
import { NextResponse } from "next/server";
import { z } from "zod";
import { recalculateMonthSnapshot } from "@/app/api/_lib/snapshots/recalculateMonthSnapshot";

export const dynamic = "force-dynamic";

const recurrentInvestmentSchema = z.object({
  asset_id: z.number().int().positive(),
  type: z.enum(["BUY", "SELL"]),
  total_amount: z.number().positive(),
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

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const accountId = Number(id);

    if (Number.isNaN(accountId)) {
      return NextResponse.json({ error: "Invalid account id" }, { status: 400 });
    }

    const recurrentInvestments = await prisma.recurrentInvestment.findMany({
      where: { account_id: accountId },
      include: {
        asset: { select: { id: true, name: true, ticker: true } },
        last_applied_month: true,
      },
      orderBy: { id: "desc" },
    });

    return NextResponse.json(recurrentInvestments, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch recurrent investments",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const accountId = Number(id);

    if (Number.isNaN(accountId)) {
      return NextResponse.json({ error: "Invalid account id" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = recurrentInvestmentSchema.parse(body);
    const { year: currentYear, month: currentMonth } = getEuropeMadridDateParts();
    const startMonthDate = parseYearMonthToDate(parsed.start_month) ?? null;
    const endMonthDate = parseYearMonthToDate(parsed.end_month) ?? null;

    if (startMonthDate && endMonthDate && endMonthDate < startMonthDate) {
      return NextResponse.json(
        { error: "end_month cannot be earlier than start_month" },
        { status: 400 }
      );
    }

    // Verify account exists
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { id: true, active: true },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Verify asset exists
    const asset = await prisma.asset.findUnique({
      where: { id: parsed.asset_id },
      select: { id: true },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    const recurrentInvestment = await prisma.recurrentInvestment.create({
      data: {
        account_id: accountId,
        asset_id: parsed.asset_id,
        type: parsed.type,
        total_amount: parsed.total_amount,
        description: parsed.description,
        automated: parsed.automated ?? true,
        status: parsed.status ?? "ACTIVE",
        start_month: startMonthDate ?? undefined,
        end_month: endMonthDate ?? undefined,
        next_run_year: parsed.next_run_year ?? currentYear,
        next_run_month: parsed.next_run_month ?? currentMonth,
      },
    });

    const affectedMonthIds = new Set<number>();
    let appliedCount = 0;

    // If ACTIVE + automated + has start_month, backfill from start_month to current month
    if (recurrentInvestment.status === "ACTIVE" && recurrentInvestment.automated && startMonthDate) {
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
        // Look up latest price for the asset
        const latestPrice = await prisma.assetPrice.findFirst({
          where: { asset_id: parsed.asset_id },
          orderBy: { timestamp: "desc" },
          select: { price: true },
        });

        const unitPrice = latestPrice ? Number(latestPrice.price) : null;

        if (unitPrice && unitPrice > 0) {
          const totalAmount = Number(recurrentInvestment.total_amount);
          const units = Math.round((totalAmount / unitPrice) * 1_000_000) / 1_000_000;
          const dueMonths = getYearMonthRange(startYear, startMonth, endYear, endMonth);

          for (const { year: runYear, month: runMonth } of dueMonths) {
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

            // Find a price point within this month for accurate chart positioning
            const monthStartUTC = new Date(Date.UTC(runYear, runMonth - 1, 1));
            const monthEndUTC = new Date(Date.UTC(runYear, runMonth, 0, 23, 59, 59, 999));
            const monthPrice = await prisma.assetPrice.findFirst({
              where: {
                asset_id: parsed.asset_id,
                timestamp: { gte: monthStartUTC, lte: monthEndUTC },
              },
              orderBy: { timestamp: "desc" },
              select: { timestamp: true },
            });
            const executedAt = monthPrice?.timestamp ?? monthStartUTC;

            const result = await prisma.$transaction(async (tx) => {
              const existingRun = await tx.recurrentInvestmentRun.findUnique({
                where: {
                  recurrent_investment_month: {
                    recurrent_investment_id: recurrentInvestment.id,
                    month_id: monthRecord.id,
                  },
                },
              });

              if (existingRun?.status === "APPLIED") {
                return false;
              }

              if (existingRun) {
                await tx.recurrentInvestmentRun.update({
                  where: { id: existingRun.id },
                  data: {
                    status: "FAILED",
                    processing_error: null,
                    investment_id: null,
                  },
                });
              } else {
                await tx.recurrentInvestmentRun.create({
                  data: {
                    recurrent_investment_id: recurrentInvestment.id,
                    month_id: monthRecord.id,
                    status: "FAILED",
                  },
                });
              }

              const investment = await tx.investment.create({
                data: {
                  account_id: accountId,
                  asset_id: parsed.asset_id,
                  month_id: monthRecord.id,
                  type: recurrentInvestment.type,
                  units,
                  unit_price: unitPrice,
                  total_amount: totalAmount,
                  description: recurrentInvestment.description,
                  status: "COMPLETED",
                  executed_at: executedAt,
                  processed_at: new Date(),
                },
              });

              if (recurrentInvestment.type === "BUY") {
                await tx.account.update({
                  where: { id: accountId },
                  data: { balance: { decrement: totalAmount } },
                });
              } else {
                await tx.account.update({
                  where: { id: accountId },
                  data: { balance: { increment: totalAmount } },
                });
              }

              await tx.recurrentInvestmentRun.update({
                where: {
                  recurrent_investment_month: {
                    recurrent_investment_id: recurrentInvestment.id,
                    month_id: monthRecord.id,
                  },
                },
                data: {
                  status: "APPLIED",
                  investment_id: investment.id,
                  processing_error: null,
                },
              });

              return true;
            });

            if (result) {
              appliedCount += 1;
              affectedMonthIds.add(monthRecord.id);
            }
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

            await prisma.recurrentInvestment.update({
              where: { id: recurrentInvestment.id },
              data: {
                last_applied_month_id: lastAppliedMonth?.id,
                next_run_year: next.year,
                next_run_month: next.month,
              },
            });
          }
        }
      }
    }

    for (const monthId of affectedMonthIds) {
      await recalculateMonthSnapshot(accountId, monthId);
    }

    return NextResponse.json(
      {
        recurrentInvestment,
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
        error: "Failed to create recurrent investment",
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
