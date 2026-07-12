"use client";

import { useEffect, useRef, useState } from "react";
import * as echarts from "echarts";
import { cn } from "@/lib/utils";
import {
  TimeframeSelector,
  type Timeframe,
} from "@/components/performance/TimeframeSelector";

type HistoryPoint = {
  date: string;
  portfolio_value: string;
  total_invested: string;
};

type PortfolioValueChartProps = {
  initialTimeframe?: Timeframe;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

export function PortfolioValueChart({
  initialTimeframe = "1Y",
}: PortfolioValueChartProps) {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>(initialTimeframe);
  const [data, setData] = useState<HistoryPoint[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Fetch history data when timeframe changes
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);

    fetch(`/api/investments/performance/history?timeframe=${timeframe}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((json) => {
        setData(json.series);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError(true);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [timeframe]);

  // Render ECharts when data is available
  useEffect(() => {
    if (!data || data.length === 0 || !chartRef.current) return;

    const instance = echarts.init(chartRef.current);

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "cross" },
        formatter: (params: unknown) => {
          const items = Array.isArray(params) ? params : [params];
          if (items.length === 0) return "";

          const first = items[0] as {
            axisValueLabel?: string;
            data?: number;
            seriesName?: string;
          };
          const date = first.axisValueLabel ?? "";

          const lines = [`<strong>${date}</strong>`];
          for (const item of items as Array<{
            seriesName?: string;
            data?: number;
            color?: string;
          }>) {
            const value = item.data ?? 0;
            const color = item.color ?? "#000";
            lines.push(
              `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};margin-right:6px;"></span>${item.seriesName}: ${formatCurrency(value)}`
            );
          }
          return lines.join("<br/>");
        },
      },
      grid: { left: 20, right: 20, top: 32, bottom: 20, containLabel: true },
      xAxis: {
        type: "category",
        data: data.map((s) => s.date),
        axisLabel: { fontSize: 11 },
      },
      yAxis: {
        type: "value",
        scale: true,
        axisLabel: {
          formatter: (value: number) => `€${value.toLocaleString()}`,
        },
      },
      series: [
        {
          name: "Portfolio Value",
          type: "line",
          data: data.map((s) => parseFloat(s.portfolio_value)),
          smooth: false,
          showSymbol: false,
          areaStyle: { opacity: 0.1 },
          lineStyle: { width: 2 },
        },
        {
          name: "Total Invested",
          type: "line",
          data: data.map((s) => parseFloat(s.total_invested)),
          smooth: false,
          showSymbol: false,
          lineStyle: { width: 1.5, opacity: 0.5 },
          itemStyle: { color: "#64748b" },
          emphasis: { disabled: true },
        },
      ],
    };

    instance.setOption(option);

    const onResize = () => instance.resize();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      instance.dispose();
    };
  }, [data]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Portfolio Value</h2>
        <TimeframeSelector value={timeframe} onChange={setTimeframe} />
      </div>
      {loading && <p className="text-muted-foreground">Loading...</p>}
      {error && <p className="text-destructive">Failed to load chart data.</p>}
      {!loading && !error && data && data.length > 0 && (
        <>
          <div ref={chartRef} className="h-80 w-full" />
          <PortfolioPeriodStats data={data} />
        </>
      )}
      {!loading && !error && data && data.length === 0 && (
        <p className="text-muted-foreground text-center py-8">
          No history data available for this timeframe.
        </p>
      )}
    </div>
  );
}

function PortfolioPeriodStats({ data }: { data: HistoryPoint[] }) {
  const values = data.map((d) => parseFloat(d.portfolio_value));
  const invested = data.map((d) => parseFloat(d.total_invested));

  const startValue = values[0] ?? 0;
  const endValue = values[values.length - 1] ?? 0;
  const endInvested = invested[invested.length - 1] ?? 0;

  const periodReturn = endValue - startValue;
  const periodReturnPct = startValue > 0 ? (periodReturn / startValue) * 100 : 0;

  const totalGain = endValue - endInvested;
  const totalGainPct = endInvested > 0 ? (totalGain / endInvested) * 100 : 0;

  const high = Math.max(...values);
  const low = Math.min(...values.filter((v) => v > 0));

  const returnColor = periodReturn >= 0 ? "text-positive" : "text-negative";
  const gainColor = totalGain >= 0 ? "text-positive" : "text-negative";

  const fmt = (v: number) => formatCurrency(v);

  const stats = [
    { label: "Period Start", value: fmt(startValue) },
    { label: "Period End", value: fmt(endValue) },
    {
      label: "Period Return",
      value: `${periodReturn >= 0 ? "+" : ""}${fmt(periodReturn)} (${periodReturnPct >= 0 ? "+" : ""}${periodReturnPct.toFixed(2)}%)`,
      color: returnColor,
    },
    {
      label: "Total Gain / Loss",
      value: `${totalGain >= 0 ? "+" : ""}${fmt(totalGain)} (${totalGainPct >= 0 ? "+" : ""}${totalGainPct.toFixed(2)}%)`,
      color: gainColor,
    },
    { label: "High", value: fmt(high) },
    { label: "Low", value: fmt(low) },
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
