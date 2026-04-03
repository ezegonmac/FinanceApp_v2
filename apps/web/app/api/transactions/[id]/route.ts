import { prisma } from "@repo/db";
import { getEuropeMadridDateParts } from "@repo/utils";
import { NextResponse } from "next/server";
import { z } from "zod";
import { recalculateMonthSnapshot } from "@/app/api/_lib/snapshots/recalculateMonthSnapshot";

export const dynamic = "force-dynamic";

const transactionSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  from_account_id: z.number().int(),
  to_account_id: z.number().int(),
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
    const transactionId = Number(id);

    if (Number.isNaN(transactionId)) {
      return NextResponse.json({ error: "Invalid transaction id" }, { status: 400 });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        month: true,
        from_account: true,
        to_account: true,
        job_run: true,
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    return NextResponse.json(transaction, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch transaction", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const transactionId = Number(id);

    if (Number.isNaN(transactionId)) {
      return NextResponse.json({ error: "Invalid transaction id" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = transactionSchema.parse(body);

    if (parsed.from_account_id === parsed.to_account_id) {
      return NextResponse.json(
        { error: "Source and destination accounts must be different" },
        { status: 400 }
      );
    }

    const existingTransaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!existingTransaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
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

    const updatedTransaction = await prisma.$transaction(async (tx) => {
      if (existingTransaction.status === "COMPLETED") {
        await tx.account.update({
          where: { id: existingTransaction.from_account_id },
          data: { balance: { increment: existingTransaction.amount } },
        });
        await tx.account.update({
          where: { id: existingTransaction.to_account_id },
          data: { balance: { decrement: existingTransaction.amount } },
        });
      }

      const transaction = await tx.transaction.update({
        where: { id: transactionId },
        data: {
          description: parsed.description,
          amount: parsed.amount,
          from_account_id: parsed.from_account_id,
          to_account_id: parsed.to_account_id,
          month_id: targetMonth.id,
          status: nextStatus,
          processed_at: nextStatus === "COMPLETED" ? new Date() : null,
          processing_error: null,
        },
        include: {
          month: true,
          from_account: true,
          to_account: true,
          job_run: true,
        },
      });

      if (nextStatus === "COMPLETED") {
        await tx.account.update({
          where: { id: parsed.from_account_id },
          data: { balance: { decrement: parsed.amount } },
        });
        await tx.account.update({
          where: { id: parsed.to_account_id },
          data: { balance: { increment: parsed.amount } },
        });
      }

      return transaction;
    });

    const affectedPairs = new Set<string>();
    if (existingTransaction.status === "COMPLETED") {
      affectedPairs.add(`${existingTransaction.from_account_id}:${existingTransaction.month_id}`);
      affectedPairs.add(`${existingTransaction.to_account_id}:${existingTransaction.month_id}`);
    }
    if (nextStatus === "COMPLETED") {
      affectedPairs.add(`${parsed.from_account_id}:${targetMonth.id}`);
      affectedPairs.add(`${parsed.to_account_id}:${targetMonth.id}`);
    }

    for (const pair of affectedPairs) {
      const [accountIdRaw, monthIdRaw] = pair.split(":");
      const accountId = Number(accountIdRaw);
      const monthId = Number(monthIdRaw);
      await recalculateMonthSnapshot(accountId, monthId);
    }

    return NextResponse.json(updatedTransaction, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update transaction", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
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
  return NextResponse.json({}, { status: 405, headers: { Allow: "GET, PUT, DELETE" } });
}
