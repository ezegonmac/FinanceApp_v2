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
    const recurrentExpenseId = Number(id);

    if (Number.isNaN(recurrentExpenseId)) {
      return NextResponse.json({ error: "Invalid recurrent expense id" }, { status: 400 });
    }

    const recurrentExpense = await prisma.recurrentExpense.findUnique({
      where: { id: recurrentExpenseId },
      include: {
        runs: {
          include: {
            expense: true,
          },
        },
      },
    });

    if (!recurrentExpense) {
      return NextResponse.json({ error: "Recurrent expense not found" }, { status: 404 });
    }

    const childExpenses = recurrentExpense.runs
      .map((run) => run.expense)
      .filter((expense): expense is NonNullable<typeof expense> => Boolean(expense));

    const completedAmountToRevert = childExpenses.reduce((sum, expense) => {
      if (expense.status !== "COMPLETED") return sum;
      return sum + Number(expense.amount);
    }, 0);

    const expenseIds = childExpenses.map((expense) => expense.id);
    const affectedMonthIds = Array.from(new Set(childExpenses.map((expense) => expense.month_id)));

    await prisma.$transaction(async (tx) => {
      if (completedAmountToRevert > 0) {
        await tx.account.update({
          where: { id: recurrentExpense.account_id },
          data: { balance: { increment: completedAmountToRevert } },
        });
      }

      if (expenseIds.length > 0) {
        await tx.expense.deleteMany({
          where: { id: { in: expenseIds } },
        });
      }

      await tx.recurrentExpenseRun.deleteMany({
        where: { recurrent_expense_id: recurrentExpenseId },
      });

      await tx.recurrentExpense.delete({
        where: { id: recurrentExpenseId },
      });
    });

    for (const monthId of affectedMonthIds) {
      await recalculateMonthSnapshot(recurrentExpense.account_id, monthId);
    }

    return NextResponse.json(
      {
        deleted: true,
        recurrent_expense_id: recurrentExpenseId,
        deleted_child_expenses: expenseIds.length,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to delete recurrent expense",
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
        Allow: "DELETE",
      },
    }
  );
}
