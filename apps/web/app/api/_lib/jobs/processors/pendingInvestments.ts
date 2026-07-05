import { prisma } from "@repo/db";
import type { ProcessCounts } from "../types";
import { getErrorMessage } from "../utils";

export async function applyPendingInvestmentsForMonth(
  monthId: number,
  jobRunId: number
): Promise<ProcessCounts> {
  const counts: ProcessCounts = { processed: 0, failed: 0, skipped: 0 };

  const pendingInvestments = await prisma.investment.findMany({
    where: { month_id: monthId, status: "PENDING" },
    orderBy: { id: "asc" },
  });

  for (const pending of pendingInvestments) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const claimResult = await tx.investment.updateMany({
          where: { id: pending.id, status: "PENDING" },
          data: {
            status: "COMPLETED",
            processed_at: new Date(),
            processing_error: null,
            job_run_id: jobRunId,
          },
        });

        if (claimResult.count === 0) return "skipped" as const;

        if (pending.type === "BUY") {
          await tx.account.update({
            where: { id: pending.account_id },
            data: { balance: { decrement: pending.total_amount } },
          });
        } else {
          await tx.account.update({
            where: { id: pending.account_id },
            data: { balance: { increment: pending.total_amount } },
          });
        }

        return "processed" as const;
      });

      if (result === "processed") counts.processed += 1;
      else counts.skipped += 1;
    } catch (error) {
      counts.failed += 1;
      await prisma.investment.updateMany({
        where: { id: pending.id, status: "PENDING" },
        data: { processing_error: getErrorMessage(error) },
      });
    }
  }

  return counts;
}
