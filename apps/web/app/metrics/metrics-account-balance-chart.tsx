"use client";

import { useEffect, useState } from "react";
import MetricsBalanceStackedBarChart from "./metrics-balance-stacked-bar-chart";
import MetricsBalanceLinesChart from "./metrics-balance-lines-chart";

type AccountBalanceSeriesResponse = {
  months: string[];
  accounts: { id: number; name: string }[];
  series: Record<string, number[]>;
};

export default function MetricsAccountBalanceChart() {
  const [data, setData] = useState<AccountBalanceSeriesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/metrics/account-balance-series")
      .then((response) => response.json())
      .then((payload: AccountBalanceSeriesResponse) => {
        if (cancelled) return;
        setData(payload);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Failed to load chart data.");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <p>Loading chart...</p>;
  if (error) return <p className="text-destructive">{error}</p>;

  if (!data || data.months.length === 0 || data.accounts.length === 0) {
    return <p className="text-muted-foreground">No monthly snapshot data available yet.</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="mb-3 text-lg font-medium">Composition (Stacked)</h3>
        <MetricsBalanceStackedBarChart data={data} />
      </div>
      <div>
        <h3 className="mb-3 text-lg font-medium">Individual Balances</h3>
        <MetricsBalanceLinesChart data={data} />
      </div>
    </div>
  );
}
