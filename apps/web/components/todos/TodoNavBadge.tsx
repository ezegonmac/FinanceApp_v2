'use client';

import { useEffect, useState } from "react";

type TodosResponse = {
  total: number;
};

export default function TodoNavBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const fetchCount = async () => {
      try {
        const res = await fetch("/api/todos?status=OPEN&limit=1", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as TodosResponse;
        if (!cancelled) setCount(data.total ?? 0);
      } catch {
        // Silently ignore badge errors; nav should remain usable.
      }
    };

    void fetchCount();

    return () => {
      cancelled = true;
    };
  }, []);

  if (count <= 0) return null;

  return (
    <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-amber-800 ring-1 ring-amber-200">
      {count > 99 ? "99+" : count}
    </span>
  );
}
