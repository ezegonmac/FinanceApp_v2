import { prisma } from "@repo/db";
import { getEuropeMadridDateKey, getEuropeMadridDateParts } from "@repo/utils";
import {
  finalizeMonthSnapshots,
  recalculateAllSnapshotsForMonth,
} from "../snapshots/recalculateMonthSnapshot";
import { completeJobRun, failJobRun, prepareDailyJobRun } from "./jobRun";
import {
  applyPendingExpensesForMonth,
  applyPendingIncomesForMonth,
  applyPendingTransactionsForMonth,
} from "./processors/pendingItems";
import { applyRecurrentIncomesForMonth } from "./processors/recurrentIncomes";
import type { ApplyPendingTransactionsResult, ProcessCounts } from "./types";
import { addCounts, getPreviousYearMonth } from "./utils";

export async function applyPendingTransactionsForCurrentMadridMonth(): Promise<ApplyPendingTransactionsResult> {
  const madridDate = getEuropeMadridDateKey();
  const { year, month } = getEuropeMadridDateParts();

  const prepared = await prepareDailyJobRun(madridDate);
  if (prepared.shouldExit) {
    return prepared.result;
  }

  const jobRun = prepared.jobRun;
  const counts: ProcessCounts = { processed: 0, failed: 0, skipped: 0 };

  try {
    const monthRecord = await prisma.month.upsert({
      where: {
        year_month: {
          year,
          month,
        },
      },
      update: {},
      create: {
        year,
        month,
      },
    });

    const recurrentResult = await applyRecurrentIncomesForMonth(
      year,
      month,
      monthRecord.id,
      jobRun.id
    );
    addCounts(counts, recurrentResult);

    addCounts(
      counts,
      await applyPendingTransactionsForMonth(monthRecord.id, jobRun.id)
    );
    addCounts(
      counts,
      await applyPendingIncomesForMonth(monthRecord.id, jobRun.id)
    );
    addCounts(
      counts,
      await applyPendingExpensesForMonth(monthRecord.id, jobRun.id)
    );

    // Recalculate current month snapshots for all active accounts (provisional/live)
    await recalculateAllSnapshotsForMonth(monthRecord.id, {
      includeAllActiveAccounts: true,
      isFinal: false,
    });

    // Finalize previous month snapshots so historical metrics are locked
    const previous = getPreviousYearMonth(year, month);
    await finalizeMonthSnapshots(previous.year, previous.month);

    await completeJobRun(jobRun.id, counts);

    return {
      alreadyRun: false,
      status: "completed",
      madridDate,
      processed: counts.processed,
      failed: counts.failed,
      skipped: counts.skipped,
    };
  } catch (error) {
    await failJobRun(jobRun.id, counts, error);

    throw error;
  }
}
