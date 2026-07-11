"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { runPendingJobAction, type RunPendingJobState } from "./actions";
import { Button } from "@/components/ui/button";

const initialState: RunPendingJobState = {
  ok: true,
  message: "",
};

export default function AdminJobsPanel() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    runPendingJobAction,
    initialState
  );

  useEffect(() => {
    if (state.message) {
      router.refresh();
    }
  }, [state.message, router]);

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Daily Job</h2>
      <p className="text-sm text-muted-foreground">
        Applies pending transactions, syncs investment prices, and fetches portfolio exposure data (sector &amp; country breakdowns) from Yahoo Finance.
      </p>
      <form action={formAction}>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Running..." : "Run daily job"}
        </Button>
      </form>

      {state.message ? (
        <p className={`mt-3 text-sm ${state.ok ? "text-positive" : "text-destructive"}`}>
          {state.message}
          {state.ok
            ? ` (processed: ${state.processed ?? 0}, failed: ${state.failed ?? 0}, skipped: ${state.skipped ?? 0}, alreadyRun: ${String(state.alreadyRun ?? false)})`
            : ""}
        </p>
      ) : null}
    </section>
  );
}
