import { prisma } from "@repo/db";
import type { ProcessCounts } from "../types";
import { getErrorMessage } from "../utils";

export async function applyPendingTransactionsForMonth(
  monthId: number,
  jobRunId: number
): Promise<ProcessCounts> {
  const counts: ProcessCounts = { processed: 0, failed: 0, skipped: 0 };

  const pendingTransactions = await prisma.transaction.findMany({
    where: {
      month_id: monthId,
      status: "PENDING",
    },
    orderBy: { id: "asc" },
  });

  for (const pendingTransaction of pendingTransactions) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const claimResult = await tx.transaction.updateMany({
          where: {
            id: pendingTransaction.id,
            status: "PENDING",
          },
          data: {
            status: "COMPLETED",
            processed_at: new Date(),
            processing_error: null,
            job_run_id: jobRunId,
          },
        });

        if (claimResult.count === 0) {
          return "skipped" as const;
        }

        await tx.account.update({
          where: { id: pendingTransaction.from_account_id },
          data: { balance: { decrement: pendingTransaction.amount } },
        });

        await tx.account.update({
          where: { id: pendingTransaction.to_account_id },
          data: { balance: { increment: pendingTransaction.amount } },
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

      await prisma.transaction.updateMany({
        where: {
          id: pendingTransaction.id,
          status: "PENDING",
        },
        data: {
          processing_error: getErrorMessage(error),
        },
      });
    }
  }

  return counts;
}

export async function applyPendingIncomesForMonth(
  monthId: number,
  jobRunId: number
): Promise<ProcessCounts> {
  const counts: ProcessCounts = { processed: 0, failed: 0, skipped: 0 };

  const pendingIncomes = await prisma.income.findMany({
    where: {
      month_id: monthId,
      status: "PENDING",
    },
    orderBy: { id: "asc" },
  });

  for (const pendingIncome of pendingIncomes) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const claimResult = await tx.income.updateMany({
          where: {
            id: pendingIncome.id,
            status: "PENDING",
          },
          data: {
            status: "COMPLETED",
            processed_at: new Date(),
            processing_error: null,
            job_run_id: jobRunId,
          },
        });

        if (claimResult.count === 0) {
          return "skipped" as const;
        }

        await tx.account.update({
          where: { id: pendingIncome.account_id },
          data: { balance: { increment: pendingIncome.amount } },
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

      await prisma.income.updateMany({
        where: {
          id: pendingIncome.id,
          status: "PENDING",
        },
        data: {
          processing_error: getErrorMessage(error),
        },
      });
    }
  }

  return counts;
}

export async function applyPendingExpensesForMonth(
  monthId: number,
  jobRunId: number
): Promise<ProcessCounts> {
  const counts: ProcessCounts = { processed: 0, failed: 0, skipped: 0 };

  const pendingExpenses = await prisma.expense.findMany({
    where: {
      month_id: monthId,
      status: "PENDING",
    },
    orderBy: { id: "asc" },
  });

  for (const pendingExpense of pendingExpenses) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const claimResult = await tx.expense.updateMany({
          where: {
            id: pendingExpense.id,
            status: "PENDING",
          },
          data: {
            status: "COMPLETED",
            processed_at: new Date(),
            processing_error: null,
            job_run_id: jobRunId,
          },
        });

        if (claimResult.count === 0) {
          return "skipped" as const;
        }

        await tx.account.update({
          where: { id: pendingExpense.account_id },
          data: { balance: { decrement: pendingExpense.amount } },
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

      await prisma.expense.updateMany({
        where: {
          id: pendingExpense.id,
          status: "PENDING",
        },
        data: {
          processing_error: getErrorMessage(error),
        },
      });
    }
  }

  return counts;
}
