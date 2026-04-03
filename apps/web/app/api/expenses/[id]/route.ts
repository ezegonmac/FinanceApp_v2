import { prisma } from "@repo/db";
import { getEuropeMadridDateParts } from "@repo/utils";
import { NextResponse } from "next/server";
import { z } from "zod";
import { recalculateMonthSnapshot } from "@/app/api/_lib/snapshots/recalculateMonthSnapshot";

export const dynamic = "force-dynamic";

const expenseSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
  analytics_amount: z.number().nonnegative().optional(),
  kind: z.enum(["FIXED", "VARIABLE"]),
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
});

function getEffectiveStatus(year: number, month: number) {
  const { year: currentYear, month: currentMonth } = getEuropeMadridDateParts();

  const isCurrentMonth = year === currentYear && month === currentMonth;
  const isPreviousMonth =
    year < currentYear || (year === currentYear && month < currentMonth);

  return isCurrentMonth || isPreviousMonth ? "COMPLETED" : "PENDING";
}

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const expenseId = Number(id);

    if (Number.isNaN(expenseId)) {
      return NextResponse.json({ error: "Invalid expense id" }, { status: 400 });
    }

    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        month: true,
        account: true,
        job_run: true,
      },
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json(expense, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch expense", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const expenseId = Number(id);

    if (Number.isNaN(expenseId)) {
      return NextResponse.json({ error: "Invalid expense id" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = expenseSchema.parse(body);

    const existingExpense = await prisma.expense.findUnique({
      where: { id: expenseId },
    });

    if (!existingExpense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    const targetMonth = await prisma.month.upsert({
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

    const nextStatus = getEffectiveStatus(targetMonth.year, targetMonth.month);

    const updatedExpense = await prisma.$transaction(async (tx) => {
      if (existingExpense.status === "COMPLETED") {
        await tx.account.update({
          where: { id: existingExpense.account_id },
          data: { balance: { increment: existingExpense.amount } },
        });
      }

      const expense = await tx.expense.update({
        where: { id: expenseId },
        data: {
          description: parsed.description,
          amount: parsed.amount,
          analytics_amount: parsed.analytics_amount ?? parsed.amount,
          kind: parsed.kind,
          month_id: targetMonth.id,
          status: nextStatus,
          processed_at: nextStatus === "COMPLETED" ? new Date() : null,
          processing_error: null,
        },
        include: {
          month: true,
          account: true,
          job_run: true,
        },
      });

      if (nextStatus === "COMPLETED") {
        await tx.account.update({
          where: { id: existingExpense.account_id },
          data: { balance: { decrement: parsed.amount } },
        });
      }

      return expense;
    });

    const affectedMonthIds = new Set<number>();
    if (existingExpense.status === "COMPLETED") {
      affectedMonthIds.add(existingExpense.month_id);
    }
    if (nextStatus === "COMPLETED") {
      affectedMonthIds.add(targetMonth.id);
    }

    for (const monthId of affectedMonthIds) {
      await recalculateMonthSnapshot(existingExpense.account_id, monthId);
    }

    return NextResponse.json(updatedExpense, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update expense", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const expenseId = Number(id);

    if (Number.isNaN(expenseId)) {
      return NextResponse.json({ error: "Invalid expense id" }, { status: 400 });
    }

    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // Revert account balance if expense was already applied
      if (expense.status === "COMPLETED") {
        await tx.account.update({
          where: { id: expense.account_id },
          data: { balance: { increment: expense.amount } },
        });
      }

      await tx.recurrentExpenseRun.updateMany({
        where: { expense_id: expenseId },
        data: { expense_id: null },
      });

      await tx.expense.delete({
        where: { id: expenseId },
      });
    });

    if (expense.status === "COMPLETED") {
      await recalculateMonthSnapshot(expense.account_id, expense.month_id);
    }

    return NextResponse.json({ deleted: true, expense_id: expenseId }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete expense", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export function OPTIONS() {
  return NextResponse.json({}, { status: 405, headers: { Allow: "GET, PUT, DELETE" } });
}
