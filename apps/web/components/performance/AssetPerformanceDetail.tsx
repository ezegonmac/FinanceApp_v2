"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { AssetValueChart } from "@/components/performance/AssetValueChart";
import type { Timeframe } from "@/components/performance/TimeframeSelector";

type AssetPerformanceData = {
  asset: { id: number; ticker: string; name: string; asset_type: string };
  summary: {
    total_units: string;
    total_invested: string;
    avg_cost: string;
    current_price: string;
    current_value: string;
    unrealized_pnl: string;
    unrealized_pct: string;
    daily_change: string;
    daily_change_pct: string;
  };
  series: Array<{ date: string; position_value: string; cost_basis: string }>;
  operations: Array<{ date: string; type: "BUY" | "SELL"; units: string; total_amount: string }>;
  timeframe: string;
};

type AssetPerformanceDetailProps = {
  assetId: number;
};

const currencyFormat = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

function formatCurrency(value: string): string {
  return currencyFormat.format(parseFloat(value));
}

function formatPct(value: string): string {
  const n = parseFloat(value);
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function formatDailyChange(value: string): string {
  const n = parseFloat(value);
  return `${n >= 0 ? "+" : ""}${currencyFormat.format(n)}`;
}

function getPnlColor(value: string): string {
  const num = parseFloat(value);
  if (num > 0) return "text-positive";
  if (num < 0) return "text-negative";
  return "";
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-md border bg-card p-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-sm font-semibold font-mono tabular-nums", color)}>{value}</p>
    </div>
  );
}

function PeriodStats({ series }: { series: Array<{ date: string; position_value: string; cost_basis: string }> }) {
  const values = series.map((s) => parseFloat(s.position_value));
  const costBases = series.map((s) => parseFloat(s.cost_basis));

  const startValue = values[0] ?? 0;
  const endValue = values[values.length - 1] ?? 0;
  const startCost = costBases[0] ?? 0;
  const endCost = costBases[costBases.length - 1] ?? 0;

  const periodChange = endValue - startValue;
  const periodChangePct = startValue > 0 ? (periodChange / startValue) * 100 : 0;

  const periodGainLoss = endValue - endCost;
  const periodGainLossPct = endCost > 0 ? (periodGainLoss / endCost) * 100 : 0;

  const high = Math.max(...values);
  const low = Math.min(...values.filter((v) => v > 0));
  const highDate = series[values.indexOf(high)]?.date ?? "";
  const lowDate = series[values.indexOf(low)]?.date ?? "";

  const changeColor = periodChange >= 0 ? "text-positive" : "text-negative";
  const gainColor = periodGainLoss >= 0 ? "text-positive" : "text-negative";

  const stats = [
    { label: "Period Start", value: currencyFormat.format(startValue) },
    { label: "Period End", value: currencyFormat.format(endValue) },
    {
      label: "Period Change",
      value: `${periodChange >= 0 ? "+" : ""}${currencyFormat.format(periodChange)} (${periodChangePct >= 0 ? "+" : ""}${periodChangePct.toFixed(2)}%)`,
      color: changeColor,
    },
    {
      label: "Gain / Loss vs Cost",
      value: `${periodGainLoss >= 0 ? "+" : ""}${currencyFormat.format(periodGainLoss)} (${periodGainLossPct >= 0 ? "+" : ""}${periodGainLossPct.toFixed(2)}%)`,
      color: gainColor,
    },
    { label: `High (${highDate})`, value: currencyFormat.format(high) },
    { label: `Low (${lowDate})`, value: currencyFormat.format(low) },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-md border bg-muted/30 px-3 py-2">
          <p className="text-[11px] text-muted-foreground leading-tight">{stat.label}</p>
          <p className={cn("text-xs font-semibold font-mono tabular-nums mt-0.5", stat.color)}>
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function AssetPerformanceDetail({ assetId }: AssetPerformanceDetailProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>("1Y");
  const [data, setData] = useState<AssetPerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    fetch(`/api/investments/performance/asset/${assetId}?timeframe=${timeframe}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError(true);
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [assetId, timeframe]);

  if (loading) {
    return (
      <div className="py-4 text-center text-sm text-muted-foreground">
        Loading asset performance...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-4 text-center text-sm text-destructive">
        Failed to load asset performance data.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
        <StatCard label="Units" value={data.summary.total_units} />
        <StatCard label="Avg Cost" value={formatCurrency(data.summary.avg_cost)} />
        <StatCard label="Current Price" value={formatCurrency(data.summary.current_price)} />
        <StatCard
          label="P&L (€)"
          value={formatCurrency(data.summary.unrealized_pnl)}
          color={getPnlColor(data.summary.unrealized_pnl)}
        />
        <StatCard
          label="P&L (%)"
          value={formatPct(data.summary.unrealized_pct)}
          color={getPnlColor(data.summary.unrealized_pct)}
        />
        <StatCard
          label="Daily"
          value={formatDailyChange(data.summary.daily_change)}
          color={getPnlColor(data.summary.daily_change)}
        />
      </div>

      {/* Asset Value Chart */}
      <AssetValueChart
        series={data.series}
        operations={data.operations}
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
      />

      {/* Period stats below chart */}
      {data.series.length > 0 && <PeriodStats series={data.series} />}

      {/* Operations mini-table */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Operations</h3>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Date</th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Type</th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Units</th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.operations.map((op, i) => (
                <tr key={i} className="border-t">
                  <td className="px-3 py-2">{op.date}</td>
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-sm px-1.5 py-0.5 text-xs font-medium",
                        op.type === "BUY"
                          ? "bg-positive-subtle text-positive-subtle-foreground"
                          : "bg-negative-subtle text-negative-subtle-foreground"
                      )}
                    >
                      {op.type}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">{op.units}</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">
                    {formatCurrency(op.total_amount)}
                  </td>
                </tr>
              ))}
              {data.operations.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-center text-muted-foreground">
                    No operations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
