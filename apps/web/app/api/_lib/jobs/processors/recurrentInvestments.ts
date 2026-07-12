import { prisma } from "@repo/db";
import type { ProcessCounts } from "../types";
import { getErrorMessage, getNextYearMonth } from "../utils";

export async function applyRecurrentInvestmentsForMonth(
  year: number,
  month: number,
  monthId: number,
  jobRunId: number
): Promise<ProcessCounts> {
  const counts: ProcessCounts = { processed: 0, failed: 0, skipped: 0 };

  const monthStart = new Date(Date.UTC(year, month - 1, 1));

  const recurrentInvestments = await prisma.recurrentInvestment.findMany({
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
    include: {
      asset: {
        select: {
          id: true,
          providerMappings: {
            select: { provider: true, provider_symbol: true },
          },
        },
      },
    },
    orderBy: { id: "asc" },
  });

  for (const recurrentInvestment of recurrentInvestments) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const existingRun = await tx.recurrentInvestmentRun.findUnique({
          where: {
            recurrent_investment_month: {
              recurrent_investment_id: recurrentInvestment.id,
              month_id: monthId,
            },
          },
        });

        if (existingRun?.status === "APPLIED") {
          return "skipped" as const;
        }

        if (recurrentInvestment.last_applied_month_id === monthId) {
          return "skipped" as const;
        }

        if (existingRun) {
          await tx.recurrentInvestmentRun.update({
            where: { id: existingRun.id },
            data: {
              status: "FAILED",
              processing_error: null,
              investment_id: null,
              job_run_id: jobRunId,
            },
          });
        } else {
          await tx.recurrentInvestmentRun.create({
            data: {
              recurrent_investment_id: recurrentInvestment.id,
              month_id: monthId,
              status: "FAILED",
              job_run_id: jobRunId,
            },
          });
        }

        // Look up latest price for the asset to derive units
        const latestPrice = await tx.assetPrice.findFirst({
          where: { asset_id: recurrentInvestment.asset_id },
          orderBy: { timestamp: "desc" },
          select: { price: true },
        });

        const unitPrice = latestPrice ? Number(latestPrice.price) : null;

        if (!unitPrice || unitPrice <= 0) {
          throw new Error(
            `No price available for asset ${recurrentInvestment.asset_id}`
          );
        }

        const totalAmount = Number(recurrentInvestment.total_amount);
        const units =
          Math.round((totalAmount / unitPrice) * 1_000_000) / 1_000_000;

        // Use a price point timestamp within this month as executed_at so the
        // chart marker aligns with the price line for the correct month rather
        // than clustering all backfilled operations on today's date.
        const monthStartDate = new Date(Date.UTC(year, month - 1, 1));
        const monthEndDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

        const monthPrice = await tx.assetPrice.findFirst({
          where: {
            asset_id: recurrentInvestment.asset_id,
            timestamp: { gte: monthStartDate, lte: monthEndDate },
          },
          orderBy: { timestamp: "desc" },
          select: { timestamp: true },
        });

        const executedAt = monthPrice?.timestamp ?? monthStartDate;

        const investment = await tx.investment.create({
          data: {
            account_id: recurrentInvestment.account_id,
            asset_id: recurrentInvestment.asset_id,
            month_id: monthId,
            type: recurrentInvestment.type,
            units,
            unit_price: unitPrice,
            total_amount: totalAmount,
            description: recurrentInvestment.description,
            status: "COMPLETED",
            executed_at: executedAt,
            processed_at: new Date(),
            job_run_id: jobRunId,
          },
        });

        if (recurrentInvestment.type === "BUY") {
          await tx.account.update({
            where: { id: recurrentInvestment.account_id },
            data: { balance: { decrement: totalAmount } },
          });
        } else {
          await tx.account.update({
            where: { id: recurrentInvestment.account_id },
            data: { balance: { increment: totalAmount } },
          });
        }

        await tx.recurrentInvestmentRun.update({
          where: {
            recurrent_investment_month: {
              recurrent_investment_id: recurrentInvestment.id,
              month_id: monthId,
            },
          },
          data: {
            status: "APPLIED",
            investment_id: investment.id,
            processing_error: null,
            job_run_id: jobRunId,
          },
        });

        const next = getNextYearMonth(year, month);
        await tx.recurrentInvestment.update({
          where: { id: recurrentInvestment.id },
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

      await prisma.recurrentInvestmentRun.upsert({
        where: {
          recurrent_investment_month: {
            recurrent_investment_id: recurrentInvestment.id,
            month_id: monthId,
          },
        },
        update: {
          status: "FAILED",
          processing_error: getErrorMessage(error),
          job_run_id: jobRunId,
          investment_id: null,
        },
        create: {
          recurrent_investment_id: recurrentInvestment.id,
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
