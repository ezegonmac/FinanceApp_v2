import { prisma } from "@repo/db";
import type { ProcessCounts } from "../types";
import { getErrorMessage, getNextYearMonth } from "../utils";

export async function applyRecurrentTransactionsForMonth(
  year: number,
  month: number,
  monthId: number,
  jobRunId: number
): Promise<ProcessCounts> {
  const counts: ProcessCounts = { processed: 0, failed: 0, skipped: 0 };

  const monthStart = new Date(Date.UTC(year, month - 1, 1));

  const recurrentTransactions = await prisma.recurrentTransaction.findMany({
    where: {
      status: "ACTIVE",
      from_account: { active: true },
      to_account: { active: true },
      AND: [
        {
          OR: [{ start_month: null }, { start_month: { lte: monthStart } }],
        },
        {
          OR: [{ end_month: null }, { end_month: { gte: monthStart } }],
        },
        {
          OR: [
            {
              AND: [{ next_run_year: null }, { next_run_month: null }],
            },
            { next_run_year: { lt: year } },
            {
              AND: [{ next_run_year: year }, { next_run_month: { lte: month } }],
            },
          ],
        },
      ],
    },
    orderBy: { id: "asc" },
  });

  for (const recurrentTransaction of recurrentTransactions) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const existingRun = await tx.recurrentTransactionRun.findUnique({
          where: {
            recurrent_transaction_month: {
              recurrent_transaction_id: recurrentTransaction.id,
              month_id: monthId,
            },
          },
        });

        if (existingRun?.status === "APPLIED") {
          return "skipped" as const;
        }

        if (recurrentTransaction.last_applied_month_id === monthId) {
          return "skipped" as const;
        }

        if (existingRun) {
          await tx.recurrentTransactionRun.update({
            where: { id: existingRun.id },
            data: {
              status: "FAILED",
              processing_error: null,
              transaction_id: null,
              job_run_id: jobRunId,
            },
          });
        } else {
          await tx.recurrentTransactionRun.create({
            data: {
              recurrent_transaction_id: recurrentTransaction.id,
              month_id: monthId,
              status: "FAILED",
              job_run_id: jobRunId,
            },
          });
        }

        const transaction = await tx.transaction.create({
          data: {
            from_account_id: recurrentTransaction.from_account_id,
            to_account_id: recurrentTransaction.to_account_id,
            amount: recurrentTransaction.amount,
            description: recurrentTransaction.description,
            month_id: monthId,
            status: "COMPLETED",
            processed_at: new Date(),
            job_run_id: jobRunId,
          },
        });

        await tx.account.update({
          where: { id: recurrentTransaction.from_account_id },
          data: { balance: { decrement: recurrentTransaction.amount } },
        });

        await tx.account.update({
          where: { id: recurrentTransaction.to_account_id },
          data: { balance: { increment: recurrentTransaction.amount } },
        });

        await tx.recurrentTransactionRun.update({
          where: {
            recurrent_transaction_month: {
              recurrent_transaction_id: recurrentTransaction.id,
              month_id: monthId,
            },
          },
          data: {
            status: "APPLIED",
            transaction_id: transaction.id,
            processing_error: null,
            job_run_id: jobRunId,
          },
        });

        const next = getNextYearMonth(year, month);
        await tx.recurrentTransaction.update({
          where: { id: recurrentTransaction.id },
          data: {
            last_applied_month_id: monthId,
            next_run_year: next.year,
            next_run_month: next.month,
          },
        });

        return "processed" as const;
      });

      if (result === "processed") {
        counts.processed += 1;
      } else {
        counts.skipped += 1;
      }
    } catch (error) {
      counts.failed += 1;

      await prisma.recurrentTransactionRun.upsert({
        where: {
          recurrent_transaction_month: {
            recurrent_transaction_id: recurrentTransaction.id,
            month_id: monthId,
          },
        },
        update: {
          status: "FAILED",
          processing_error: getErrorMessage(error),
          job_run_id: jobRunId,
          transaction_id: null,
        },
        create: {
          recurrent_transaction_id: recurrentTransaction.id,
          month_id: monthId,
          status: "FAILED",
          processing_error: getErrorMessage(error),
          job_run_id: jobRunId,
        },
      });
    }
  }

  return counts;
}
