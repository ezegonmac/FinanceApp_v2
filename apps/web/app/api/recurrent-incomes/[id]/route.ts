import { prisma } from "@repo/db";
import { NextResponse } from "next/server";
import { recalculateMonthSnapshot } from "@/app/api/_lib/snapshots/recalculateMonthSnapshot";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// DELETE /api/recurrent-incomes/:id
export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const recurrentIncomeId = Number(id);

    if (Number.isNaN(recurrentIncomeId)) {
      return NextResponse.json({ error: "Invalid recurrent income id" }, { status: 400 });
    }

    const recurrentIncome = await prisma.recurrentIncome.findUnique({
      where: { id: recurrentIncomeId },
      include: {
        runs: {
          include: {
            income: true,
          },
        },
      },
    });

    if (!recurrentIncome) {
      return NextResponse.json({ error: "Recurrent income not found" }, { status: 404 });
    }

    const childIncomes = recurrentIncome.runs
      .map((run) => run.income)
      .filter((income): income is NonNullable<typeof income> => Boolean(income));

    const completedAmountToRevert = childIncomes.reduce((sum, income) => {
      if (income.status !== "COMPLETED") return sum;
      return sum + Number(income.amount);
    }, 0);

    const incomeIds = childIncomes.map((income) => income.id);

    const affectedMonthIds = Array.from(
      new Set(childIncomes.map((income) => income.month_id))
    );

    await prisma.$transaction(async (tx) => {
      if (completedAmountToRevert > 0) {
        await tx.account.update({
          where: { id: recurrentIncome.account_id },
          data: { balance: { decrement: completedAmountToRevert } },
        });
      }

      if (incomeIds.length > 0) {
        await tx.income.deleteMany({
          where: {
            id: { in: incomeIds },
          },
        });
      }

      await tx.recurrentIncomeRun.deleteMany({
        where: {
          recurrent_income_id: recurrentIncomeId,
        },
      });

      await tx.recurrentIncome.delete({
        where: {
          id: recurrentIncomeId,
        },
      });
    });

    for (const monthId of affectedMonthIds) {
      await recalculateMonthSnapshot(recurrentIncome.account_id, monthId);
    }

    return NextResponse.json(
      {
        deleted: true,
        recurrent_income_id: recurrentIncomeId,
        deleted_child_incomes: incomeIds.length,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to delete recurrent income",
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
