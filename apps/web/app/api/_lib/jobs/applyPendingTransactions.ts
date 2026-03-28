import { Prisma, prisma } from "@repo/db";
import { getEuropeMadridDateKey, getEuropeMadridDateParts } from "@repo/utils";

const APPLY_PENDING_JOB_NAME = "apply-pending-transactions";

type ApplyPendingTransactionsResult = {
  alreadyRun: boolean;
  status: "completed" | "failed" | "running";
  madridDate: string;
  processed: number;
  failed: number;
  skipped: number;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function applyPendingTransactionsForCurrentMadridMonth(): Promise<ApplyPendingTransactionsResult> {
  const madridDate = getEuropeMadridDateKey();
  const { year, month } = getEuropeMadridDateParts();

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
      alreadyRun: true,
      status: "completed",
      madridDate,
      processed: jobRun.processed_count,
      failed: jobRun.failed_count,
      skipped: jobRun.skipped_count,
    };
  }

  if (jobRun?.status === "RUNNING") {
    return {
      alreadyRun: true,
      status: "running",
      madridDate,
      processed: jobRun.processed_count,
      failed: jobRun.failed_count,
      skipped: jobRun.skipped_count,
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
  }

  if (!jobRun) {
    try {
      jobRun = await prisma.jobRun.create({
        data: {
          job_name: APPLY_PENDING_JOB_NAME,
          madrid_date: madridDate,
          status: "RUNNING",
        },
      });
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
            alreadyRun: true,
            status: existingJobRun.status === "COMPLETED" ? "completed" : "running",
            madridDate,
            processed: existingJobRun.processed_count,
            failed: existingJobRun.failed_count,
            skipped: existingJobRun.skipped_count,
          };
        }
      }

      throw error;
    }
  }

  let processed = 0;
  let failed = 0;
  let skipped = 0;

  try {
    const monthRecord = await prisma.month.findUnique({
      where: {
        year_month: {
          year,
          month,
        },
      },
    });

    if (!monthRecord) {
      await prisma.jobRun.update({
        where: { id: jobRun.id },
        data: {
          status: "COMPLETED",
          finished_at: new Date(),
          processed_count: 0,
          failed_count: 0,
          skipped_count: 0,
        },
      });

      return {
        alreadyRun: false,
        status: "completed",
        madridDate,
        processed: 0,
        failed: 0,
        skipped: 0,
      };
    }

    const pendingTransactions = await prisma.transaction.findMany({
      where: {
        month_id: monthRecord.id,
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
              job_run_id: jobRun.id,
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
          processed += 1;
        } else {
          skipped += 1;
        }
      } catch (error) {
        failed += 1;

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

    await prisma.jobRun.update({
      where: { id: jobRun.id },
      data: {
        status: "COMPLETED",
        finished_at: new Date(),
        processed_count: processed,
        failed_count: failed,
        skipped_count: skipped,
      },
    });

    return {
      alreadyRun: false,
      status: "completed",
      madridDate,
      processed,
      failed,
      skipped,
    };
  } catch (error) {
    await prisma.jobRun.update({
      where: { id: jobRun.id },
      data: {
        status: "FAILED",
        finished_at: new Date(),
        processed_count: processed,
        failed_count: failed,
        skipped_count: skipped,
        error_message: getErrorMessage(error),
      },
    });

    throw error;
  }
}
