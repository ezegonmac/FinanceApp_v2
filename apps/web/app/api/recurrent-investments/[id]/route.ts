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
    const recurrentInvestmentId = Number(id);

    if (Number.isNaN(recurrentInvestmentId)) {
      return NextResponse.json({ error: "Invalid recurrent investment id" }, { status: 400 });
    }

    const recurrentInvestment = await prisma.recurrentInvestment.findUnique({
      where: { id: recurrentInvestmentId },
      include: {
        runs: {
          include: {
            investment: true,
          },
        },
      },
    });

    if (!recurrentInvestment) {
      return NextResponse.json({ error: "Recurrent investment not found" }, { status: 404 });
    }

    const childInvestments = recurrentInvestment.runs
      .map((run) => run.investment)
      .filter((investment): investment is NonNullable<typeof investment> => Boolean(investment));

    // Revert balance for all COMPLETED child investments
    let balanceRevert = 0;
    for (const investment of childInvestments) {
      if (investment.status !== "COMPLETED") continue;
      if (investment.type === "BUY") {
        balanceRevert += Number(investment.total_amount);
      } else {
        balanceRevert -= Number(investment.total_amount);
      }
    }

    const investmentIds = childInvestments.map((inv) => inv.id);
    const affectedMonthIds = Array.from(new Set(childInvestments.map((inv) => inv.month_id)));

    await prisma.$transaction(async (tx) => {
      if (balanceRevert > 0) {
        await tx.account.update({
          where: { id: recurrentInvestment.account_id },
          data: { balance: { increment: balanceRevert } },
        });
      } else if (balanceRevert < 0) {
        await tx.account.update({
          where: { id: recurrentInvestment.account_id },
          data: { balance: { decrement: Math.abs(balanceRevert) } },
        });
      }

      if (investmentIds.length > 0) {
        await tx.investment.deleteMany({
          where: { id: { in: investmentIds } },
        });
      }

      await tx.recurrentInvestmentRun.deleteMany({
        where: { recurrent_investment_id: recurrentInvestmentId },
      });

      await tx.recurrentInvestment.delete({
        where: { id: recurrentInvestmentId },
      });
    });

    for (const monthId of affectedMonthIds) {
      await recalculateMonthSnapshot(recurrentInvestment.account_id, monthId);
    }

    return NextResponse.json(
      {
        deleted: true,
        recurrent_investment_id: recurrentInvestmentId,
        deleted_child_investments: investmentIds.length,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to delete recurrent investment",
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
