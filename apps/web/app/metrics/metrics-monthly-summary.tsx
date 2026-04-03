"use client";

import { useEffect, useState } from "react";
import MonthlySummaryTable from "@/components/metrics/MonthlySummaryTable";
import type { MonthlySummaryResponse } from "@/app/api/metrics/monthly-summary/route";

export default function MetricsMonthlySummary() {
  const [data, setData] = useState<MonthlySummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/metrics/monthly-summary")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError("Failed to load monthly summary."); setLoading(false); });
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return null;

  return (
    <MonthlySummaryTable
      rows={data.rows}
      totals={data.totals}
      averages={data.averages}
    />
  );
}
