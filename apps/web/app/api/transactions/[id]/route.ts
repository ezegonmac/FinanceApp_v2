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
    const transactionId = Number(id);

    if (Number.isNaN(transactionId)) {
      return NextResponse.json({ error: "Invalid transaction id" }, { status: 400 });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // Revert both account balances if transaction was already applied
      if (transaction.status === "COMPLETED") {
        await tx.account.update({
          where: { id: transaction.from_account_id },
          data: { balance: { increment: transaction.amount } },
        });
        await tx.account.update({
          where: { id: transaction.to_account_id },
          data: { balance: { decrement: transaction.amount } },
        });
      }

      await tx.recurrentTransactionRun.updateMany({
        where: { transaction_id: transactionId },
        data: { transaction_id: null },
      });

      await tx.transaction.delete({
        where: { id: transactionId },
      });
    });

    if (transaction.status === "COMPLETED") {
      await recalculateMonthSnapshot(transaction.from_account_id, transaction.month_id);
      await recalculateMonthSnapshot(transaction.to_account_id, transaction.month_id);
    }

    return NextResponse.json({ deleted: true, transaction_id: transactionId }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete transaction", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export function OPTIONS() {
  return NextResponse.json({}, { status: 405, headers: { Allow: "DELETE" } });
}
