import { prisma } from "@repo/db";
import type { JobRun } from "@repo/db";
import type { ApplyPendingTransactionsResult, ProcessCounts } from "./types";
import { getErrorMessage, isUniqueConstraintError } from "./utils";

export const APPLY_PENDING_JOB_NAME = "apply-pending-transactions";

type PrepareJobRunResult =
  | {
      shouldExit: true;
      result: ApplyPendingTransactionsResult;
    }
  | {
      shouldExit: false;
      jobRun: JobRun;
    };

export async function prepareDailyJobRun(
  madridDate: string
): Promise<PrepareJobRunResult> {
  let jobRun = await prisma.jobRun.findUnique({
    where: {
      job_name_madrid_date: {
        job_name: APPLY_PENDING_JOB_NAME,
        madrid_date: madridDate,
      },
    },
  });

  if (jobRun?.status === "COMPLETED") {
    return {
      shouldExit: true,
      result: {
        alreadyRun: true,
        status: "completed",
        madridDate,
        processed: jobRun.processed_count,
        failed: jobRun.failed_count,
        skipped: jobRun.skipped_count,
      },
    };
  }

  if (jobRun?.status === "RUNNING") {
    return {
      shouldExit: true,
      result: {
        alreadyRun: true,
        status: "running",
        madridDate,
        processed: jobRun.processed_count,
        failed: jobRun.failed_count,
        skipped: jobRun.skipped_count,
      },
    };
  }

  if (jobRun?.status === "FAILED") {
    jobRun = await prisma.jobRun.update({
      where: { id: jobRun.id },
      data: {
        status: "RUNNING",
        started_at: new Date(),
        finished_at: null,
        processed_count: 0,
        failed_count: 0,
        skipped_count: 0,
        error_message: null,
      },
    });

    return { shouldExit: false, jobRun };
  }

  try {
    const created = await prisma.jobRun.create({
      data: {
        job_name: APPLY_PENDING_JOB_NAME,
        madrid_date: madridDate,
        status: "RUNNING",
      },
    });

    return { shouldExit: false, jobRun: created };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const existingJobRun = await prisma.jobRun.findUnique({
        where: {
          job_name_madrid_date: {
            job_name: APPLY_PENDING_JOB_NAME,
            madrid_date: madridDate,
          },
        },
      });

      if (existingJobRun) {
        return {
          shouldExit: true,
          result: {
            alreadyRun: true,
            status: existingJobRun.status === "COMPLETED" ? "completed" : "running",
            madridDate,
            processed: existingJobRun.processed_count,
            failed: existingJobRun.failed_count,
            skipped: existingJobRun.skipped_count,
          },
        };
      }
    }

    throw error;
  }
}

export async function completeJobRun(jobRunId: number, counts: ProcessCounts) {
  await prisma.jobRun.update({
    where: { id: jobRunId },
    data: {
      status: "COMPLETED",
      finished_at: new Date(),
      processed_count: counts.processed,
      failed_count: counts.failed,
      skipped_count: counts.skipped,
    },
  });
}

export async function failJobRun(jobRunId: number, counts: ProcessCounts, error: unknown) {
  await prisma.jobRun.update({
    where: { id: jobRunId },
    data: {
      status: "FAILED",
      finished_at: new Date(),
      processed_count: counts.processed,
      failed_count: counts.failed,
      skipped_count: counts.skipped,
      error_message: getErrorMessage(error),
    },
  });
}
