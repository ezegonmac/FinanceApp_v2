"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { runPendingJobAction, type RunPendingJobState } from "./actions";

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
    <section>
      <h2>Jobs</h2>
      <form action={formAction}>
        <button type="submit" disabled={isPending}>
          {isPending ? "Running..." : "Run pending transactions job"}
        </button>
      </form>

      {state.message ? (
        <p style={{ marginTop: "0.75rem", color: state.ok ? "green" : "red" }}>
          {state.message}
          {state.ok
            ? ` (processed: ${state.processed ?? 0}, failed: ${state.failed ?? 0}, skipped: ${state.skipped ?? 0}, alreadyRun: ${String(state.alreadyRun ?? false)})`
            : ""}
        </p>
      ) : null}
    </section>
  );
}
