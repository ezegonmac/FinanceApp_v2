import { prisma } from "@repo/db";
import { getEuropeMadridDateParts } from "@repo/utils";
import { NextResponse } from "next/server";
import { z } from "zod";
import { recalculateMonthSnapshot } from "@/app/api/_lib/snapshots/recalculateMonthSnapshot";

export const dynamic = "force-dynamic";

const expenseSchema = z.object({
  description: z.string().min(1),
  amount: z.number().nonnegative(),
  analytics_amount: z.number().nonnegative().optional(),
  kind: z.enum(["FIXED", "VARIABLE"]).optional(),
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
});

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/accounts/:id/expenses
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const accountId = Number(id);

    if (Number.isNaN(accountId)) {
      return NextResponse.json({ error: "Invalid account id" }, { status: 400 });
    }

    const url = new URL(request.url);
    const startMonth = url.searchParams.get("startMonth") ?? "1900-01";
    const endMonth = url.searchParams.get("endMonth") ?? "9999-12";
    const cursorParam = url.searchParams.get("cursor");
    const cursor = cursorParam ? Number(cursorParam) : null;
    const limit = Math.min(Number(url.searchParams.get("limit") ?? "30"), 100);

    const [startYear, startM] = startMonth.split("-").map(Number);
    const [endYear, endM] = endMonth.split("-").map(Number);

    const monthFilter = {
      AND: [
        { OR: [{ year: { gt: startYear } }, { year: startYear, month: { gte: startM } }] },
        { OR: [{ year: { lt: endYear } }, { year: endYear, month: { lte: endM } }] },
      ],
    };

    const where = { account_id: accountId, month: monthFilter };

    const orderBy = [
      { month: { year: "desc" as const } },
      { month: { month: "desc" as const } },
      { description: "asc" as const },
      { amount: "asc" as const },
      { id: "asc" as const },
    ];

    const [items, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy,
        include: { month: true, job_run: true },
        take: limit + 1,
        ...(cursor != null ? { cursor: { id: cursor }, skip: 1 } : {}),
      }),
      prisma.expense.count({ where }),
    ]);

    const hasMore = items.length > limit;
    const data = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return NextResponse.json({ data, total, nextCursor }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

// POST /api/accounts/:id/expenses
export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const accountId = Number(id);

    if (Number.isNaN(accountId)) {
      return NextResponse.json({ error: "Invalid account id" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = expenseSchema.parse(body);

    const monthRecord = await prisma.month.upsert({
      where: {
        year_month: {
          year: parsed.year,
          month: parsed.month,
        },
      },
      update: {},
      create: {
        year: parsed.year,
        month: parsed.month,
      },
    });

    const { year: currentYear, month: currentMonth } = getEuropeMadridDateParts();

    const isCurrentMonth =
      monthRecord.year === currentYear && monthRecord.month === currentMonth;

    const isPreviousMonth =
      monthRecord.year < currentYear ||
      (monthRecord.year === currentYear && monthRecord.month < currentMonth);

    const isEffectiveNow = isCurrentMonth || isPreviousMonth;

    let newExpense;
    if (isEffectiveNow) {
      newExpense = await prisma.$transaction(async (tx) => {
        const expense = await tx.expense.create({
          data: {
            description: parsed.description,
            amount: parsed.amount,
            analytics_amount: parsed.analytics_amount ?? parsed.amount,
            kind: parsed.kind ?? "FIXED",
            month_id: monthRecord.id,
            account_id: accountId,
            status: "COMPLETED",
            processed_at: new Date(),
          },
        });

        await tx.account.update({
          where: { id: accountId },
          data: { balance: { decrement: parsed.amount } },
        });

        return expense;
      });

      await recalculateMonthSnapshot(accountId, monthRecord.id);
    } else {
      newExpense = await prisma.expense.create({
        data: {
          description: parsed.description,
          amount: parsed.amount,
          analytics_amount: parsed.analytics_amount ?? parsed.amount,
          kind: parsed.kind ?? "FIXED",
          month_id: monthRecord.id,
          account_id: accountId,
          status: "PENDING",
        },
      });
    }

    return NextResponse.json(newExpense, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create expense" },
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
