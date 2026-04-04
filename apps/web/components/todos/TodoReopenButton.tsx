'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Props = {
  todoId: number;
};

export default function TodoReopenButton({ todoId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReopen = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/todos/${todoId}/reopen`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Failed to move todo to pending");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-2">
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <Button size="xs" variant="outline" onClick={() => void handleReopen()} disabled={loading}>
        {loading ? "Reopening..." : "Reopen"}
      </Button>
    </div>
  );
}
