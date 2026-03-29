import { Prisma } from "@repo/db";
import type { ProcessCounts } from "./types";

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}

export function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export function getPreviousYearMonth(year: number, month: number) {
  if (month === 1) {
    return { year: year - 1, month: 12 };
  }

  return { year, month: month - 1 };
}

export function getNextYearMonth(year: number, month: number) {
  if (month === 12) {
    return { year: year + 1, month: 1 };
  }

  return { year, month: month + 1 };
}

export function addCounts(target: ProcessCounts, value: ProcessCounts) {
  target.processed += value.processed;
  target.failed += value.failed;
  target.skipped += value.skipped;
}
