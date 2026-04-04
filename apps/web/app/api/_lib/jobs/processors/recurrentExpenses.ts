import { prisma } from "@repo/db";
import type { ProcessCounts } from "../types";
import { getErrorMessage, getNextYearMonth } from "../utils";

export async function applyRecurrentExpensesForMonth(
  year: number,
  month: number,
  monthId: number,
  jobRunId: number
): Promise<ProcessCounts> {
  const counts: ProcessCounts = { processed: 0, failed: 0, skipped: 0 };

  const monthStart = new Date(Date.UTC(year, month - 1, 1));

  const recurrentExpenses = await prisma.recurrentExpense.findMany({
    where: {
      status: "ACTIVE",
      automated: true,
      account: {
        active: true,
      },
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

  for (const recurrentExpense of recurrentExpenses) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const existingRun = await tx.recurrentExpenseRun.findUnique({
          where: {
            recurrent_expense_month: {
              recurrent_expense_id: recurrentExpense.id,
              month_id: monthId,
            },
          },
        });

        if (existingRun?.status === "APPLIED") {
          return "skipped" as const;
        }

        if (recurrentExpense.last_applied_month_id === monthId) {
          return "skipped" as const;
        }

        if (existingRun) {
          await tx.recurrentExpenseRun.update({
            where: { id: existingRun.id },
            data: {
              status: "FAILED",
              processing_error: null,
              expense_id: null,
              job_run_id: jobRunId,
            },
          });
        } else {
          await tx.recurrentExpenseRun.create({
            data: {
              recurrent_expense_id: recurrentExpense.id,
              month_id: monthId,
              status: "FAILED",
              job_run_id: jobRunId,
            },
          });
        }

        const expense = await tx.expense.create({
          data: {
            description: recurrentExpense.description,
            amount: recurrentExpense.amount,
            analytics_amount: recurrentExpense.analytics_amount ?? recurrentExpense.amount,
            kind: recurrentExpense.kind,
            month_id: monthId,
            account_id: recurrentExpense.account_id,
            status: "COMPLETED",
            processed_at: new Date(),
            job_run_id: jobRunId,
          },
        });

        await tx.account.update({
          where: { id: recurrentExpense.account_id },
          data: { balance: { decrement: recurrentExpense.amount } },
        });

        await tx.recurrentExpenseRun.update({
          where: {
            recurrent_expense_month: {
              recurrent_expense_id: recurrentExpense.id,
              month_id: monthId,
            },
          },
          data: {
            status: "APPLIED",
            expense_id: expense.id,
            processing_error: null,
            job_run_id: jobRunId,
          },
        });

        const next = getNextYearMonth(year, month);
        await tx.recurrentExpense.update({
          where: { id: recurrentExpense.id },
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

      await prisma.recurrentExpenseRun.upsert({
        where: {
          recurrent_expense_month: {
            recurrent_expense_id: recurrentExpense.id,
            month_id: monthId,
          },
        },
        update: {
          status: "FAILED",
          processing_error: getErrorMessage(error),
          job_run_id: jobRunId,
          expense_id: null,
        },
        create: {
          recurrent_expense_id: recurrentExpense.id,
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
