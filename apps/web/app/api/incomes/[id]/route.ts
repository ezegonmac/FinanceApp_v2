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
    const incomeId = Number(id);

    if (Number.isNaN(incomeId)) {
      return NextResponse.json({ error: "Invalid income id" }, { status: 400 });
    }

    const income = await prisma.income.findUnique({
      where: { id: incomeId },
    });

    if (!income) {
      return NextResponse.json({ error: "Income not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // Revert account balance if income was already applied
      if (income.status === "COMPLETED") {
        await tx.account.update({
          where: { id: income.account_id },
          data: { balance: { decrement: income.amount } },
        });
      }

      await tx.recurrentIncomeRun.updateMany({
        where: { income_id: incomeId },
        data: { income_id: null },
      });

      await tx.income.delete({
        where: { id: incomeId },
      });
    });

    if (income.status === "COMPLETED") {
      await recalculateMonthSnapshot(income.account_id, income.month_id);
    }

    return NextResponse.json({ deleted: true, income_id: incomeId }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete income", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export function OPTIONS() {
  return NextResponse.json({}, { status: 405, headers: { Allow: "DELETE" } });
}
