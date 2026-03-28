"use server";

import { applyPendingTransactionsForCurrentMadridMonth } from "@/app/api/_lib/jobs/applyPendingTransactions";

export type RunPendingJobState = {
  ok: boolean;
  message: string;
  processed?: number;
  failed?: number;
  skipped?: number;
  alreadyRun?: boolean;
};

export async function runPendingJobAction(): Promise<RunPendingJobState> {
  try {
    const result = await applyPendingTransactionsForCurrentMadridMonth();

    return {
      ok: true,
      message: "Pending transactions job executed successfully.",
      processed: result.processed,
      failed: result.failed,
      skipped: result.skipped,
      alreadyRun: result.alreadyRun,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to execute pending transactions job.",
    };
  }
}
