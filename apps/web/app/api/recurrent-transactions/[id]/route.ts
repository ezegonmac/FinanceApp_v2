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
    const recurrentTransactionId = Number(id);

    if (Number.isNaN(recurrentTransactionId)) {
      return NextResponse.json({ error: "Invalid recurrent transaction id" }, { status: 400 });
    }

    const recurrentTransaction = await prisma.recurrentTransaction.findUnique({
      where: { id: recurrentTransactionId },
      include: {
        runs: {
          include: {
            transaction: true,
          },
        },
      },
    });

    if (!recurrentTransaction) {
      return NextResponse.json({ error: "Recurrent transaction not found" }, { status: 404 });
    }

    const childTransactions = recurrentTransaction.runs
      .map((run) => run.transaction)
      .filter((tx): tx is NonNullable<typeof tx> => Boolean(tx));

    const transactionIds = childTransactions.map((tx) => tx.id);
    const affectedMonthIds = Array.from(
      new Set(childTransactions.map((tx) => tx.month_id))
    );

    // Calculate the total completed amount to revert balances
    const completedAmountToRevert = childTransactions.reduce((sum, tx) => {
      if (tx.status !== "COMPLETED") return sum;
      return sum + Number(tx.amount);
    }, 0);

    await prisma.$transaction(async (prismaTx) => {
      if (completedAmountToRevert > 0) {
        // Revert: increment from_account, decrement to_account
        await prismaTx.account.update({
          where: { id: recurrentTransaction.from_account_id },
          data: { balance: { increment: completedAmountToRevert } },
        });
        await prismaTx.account.update({
          where: { id: recurrentTransaction.to_account_id },
          data: { balance: { decrement: completedAmountToRevert } },
        });
      }

      if (transactionIds.length > 0) {
        await prismaTx.transaction.deleteMany({
          where: { id: { in: transactionIds } },
        });
      }

      await prismaTx.recurrentTransactionRun.deleteMany({
        where: { recurrent_transaction_id: recurrentTransactionId },
      });

      await prismaTx.recurrentTransaction.delete({
        where: { id: recurrentTransactionId },
      });
    });

    for (const monthId of affectedMonthIds) {
      await recalculateMonthSnapshot(recurrentTransaction.from_account_id, monthId);
      await recalculateMonthSnapshot(recurrentTransaction.to_account_id, monthId);
    }

    return NextResponse.json(
      {
        deleted: true,
        recurrent_transaction_id: recurrentTransactionId,
        deleted_child_transactions: transactionIds.length,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to delete recurrent transaction",
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
