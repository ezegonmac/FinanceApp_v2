import { prisma } from "@repo/db";
import { NextResponse } from "next/server";
import { recalculateMonthSnapshot } from "@/app/api/_lib/snapshots/recalculateMonthSnapshot";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
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
  return NextResponse.json({}, { status: 405, headers: { Allow: "DELETE" } });
}
