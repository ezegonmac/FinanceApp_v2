'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  todoId: number;
};

export default function TodoActions({ todoId }: Props) {
  const router = useRouter();
  const [completing, setCompleting] = useState(false);
  const [skipOpen, setSkipOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [skipping, setSkipping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleComplete = async () => {
    setCompleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/todos/${todoId}/complete`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Failed to complete todo");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setCompleting(false);
    }
  };

  const handleSkip = async () => {
    if (reason.trim().length < 3) return;
    setSkipping(true);
    setError(null);
    try {
      const res = await fetch(`/api/todos/${todoId}/skip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Failed to skip todo");
      }
      setSkipOpen(false);
      setReason("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setSkipping(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button
          size="xs"
          variant="outline"
          onClick={() => { setSkipOpen(true); setError(null); }}
          disabled={completing || skipping}
        >
          Skip
        </Button>
        <Button
          size="xs"
          onClick={() => void handleComplete()}
          disabled={completing || skipping}
        >
          {completing ? "Marking..." : "Mark as done"}
        </Button>
      </div>

      <Dialog open={skipOpen} onOpenChange={(open) => { setSkipOpen(open); if (!open) { setReason(""); setError(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Skip todo</DialogTitle>
            <DialogDescription>Provide a reason for skipping this action (required).</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Input
              placeholder="Reason for skipping..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void handleSkip(); }}
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setSkipOpen(false); setReason(""); setError(null); }} disabled={skipping}>
                Cancel
              </Button>
              <Button
                onClick={() => void handleSkip()}
                disabled={reason.trim().length < 3 || skipping}
              >
                {skipping ? "Skipping..." : "Confirm skip"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
