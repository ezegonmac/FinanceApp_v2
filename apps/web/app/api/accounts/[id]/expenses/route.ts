import { prisma } from "@repo/db";
import { getEuropeMadridDateParts } from "@repo/utils";
import { NextResponse } from "next/server";
import { z } from "zod";
import { recalculateMonthSnapshot } from "@/app/api/_lib/snapshots/recalculateMonthSnapshot";

export const dynamic = "force-dynamic";

const expenseSchema = z.object({
  description: z.string().min(1),
  amount: z.number().nonnegative(),
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

    const expenses = await prisma.expense.findMany({
      where: { account_id: accountId },
      include: {
        month: true,
        job_run: true,
      },
    });

    return NextResponse.json(expenses, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
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
