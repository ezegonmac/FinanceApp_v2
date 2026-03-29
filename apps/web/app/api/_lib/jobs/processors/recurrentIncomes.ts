import { prisma } from "@repo/db";
import type { ProcessCounts } from "../types";
import { getErrorMessage, getNextYearMonth } from "../utils";

export async function applyRecurrentIncomesForMonth(
  year: number,
  month: number,
  monthId: number,
  jobRunId: number
): Promise<ProcessCounts> {
  const counts: ProcessCounts = { processed: 0, failed: 0, skipped: 0 };

  const monthStart = new Date(Date.UTC(year, month - 1, 1));

  const recurrentIncomes = await prisma.recurrentIncome.findMany({
    where: {
      status: "ACTIVE",
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

  for (const recurrentIncome of recurrentIncomes) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const existingRun = await tx.recurrentIncomeRun.findUnique({
          where: {
            recurrent_income_month: {
              recurrent_income_id: recurrentIncome.id,
              month_id: monthId,
            },
          },
        });

        if (existingRun?.status === "APPLIED") {
          return "skipped" as const;
        }

        if (recurrentIncome.last_applied_month_id === monthId) {
          return "skipped" as const;
        }

        if (existingRun) {
          await tx.recurrentIncomeRun.update({
            where: { id: existingRun.id },
            data: {
              status: "FAILED",
              processing_error: null,
              income_id: null,
              job_run_id: jobRunId,
            },
          });
        } else {
          await tx.recurrentIncomeRun.create({
            data: {
              recurrent_income_id: recurrentIncome.id,
              month_id: monthId,
              status: "FAILED",
              job_run_id: jobRunId,
            },
          });
        }

        const income = await tx.income.create({
          data: {
            description: recurrentIncome.description,
            amount: recurrentIncome.amount,
            month_id: monthId,
            account_id: recurrentIncome.account_id,
            status: "COMPLETED",
            processed_at: new Date(),
            job_run_id: jobRunId,
          },
        });

        await tx.account.update({
          where: { id: recurrentIncome.account_id },
          data: { balance: { increment: recurrentIncome.amount } },
        });

        await tx.recurrentIncomeRun.update({
          where: {
            recurrent_income_month: {
              recurrent_income_id: recurrentIncome.id,
              month_id: monthId,
            },
          },
          data: {
            status: "APPLIED",
            income_id: income.id,
            processing_error: null,
            job_run_id: jobRunId,
          },
        });

        const next = getNextYearMonth(year, month);
        await tx.recurrentIncome.update({
          where: { id: recurrentIncome.id },
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

      await prisma.recurrentIncomeRun.upsert({
        where: {
          recurrent_income_month: {
            recurrent_income_id: recurrentIncome.id,
            month_id: monthId,
          },
        },
        update: {
          status: "FAILED",
          processing_error: getErrorMessage(error),
          job_run_id: jobRunId,
          income_id: null,
        },
        create: {
          recurrent_income_id: recurrentIncome.id,
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
