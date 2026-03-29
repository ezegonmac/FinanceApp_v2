export type ProcessCounts = {
  processed: number;
  failed: number;
  skipped: number;
};

export type ApplyPendingTransactionsResult = {
  alreadyRun: boolean;
  status: "completed" | "failed" | "running";
  madridDate: string;
  processed: number;
  failed: number;
  skipped: number;
};
