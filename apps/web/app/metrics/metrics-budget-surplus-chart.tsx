"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as echarts from "echarts";

type ExpensesByKindResponse = {
  months: string[];
  fixed: number[];
  variable: number[];
  budgets: (number | null)[];
};

const formatEur = (value: number) =>
  value.toLocaleString("es-ES", { style: "currency", currency: "EUR" });

const formatCompactEur = (value: number) => {
  const abs = Math.abs(value);

  if (abs >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M €`;
  }

  if (abs >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K €`;
  }

  return `${Math.round(value)} €`;
};

export default function MetricsBudgetSurplusChart() {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);

  const [data, setData] = useState<ExpensesByKindResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/metrics/expenses-by-kind")
      .then((response) => {
        if (!response.ok) throw new Error("API error");
        return response.json();
      })
      .then((payload: ExpensesByKindResponse) => {
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

  const chartOption = useMemo<echarts.EChartsOption | null>(() => {
    if (!data || data.months.length === 0) {
      return null;
    }

    const budgets = data.budgets ?? [];

    // Calculate difference: budget - expenses
    // Positive = surplus/saved (green, above 0), Negative = deficit/overspent (red, below 0)
    const diffData = data.months.map((_, i) => {
      const budget = budgets[i];
      if (budget == null) return null;
      const totalExpenses = (data.fixed[i] ?? 0) + (data.variable[i] ?? 0);
      return budget - totalExpenses;
    });

    // Check if there's any data to show
    if (diffData.every((d) => d === null)) return null;

    // Split into two series: surplus (positive, green) and deficit (negative, red)
    const surplusData = diffData.map((d) => (d != null && d >= 0 ? d : "-"));
    const deficitData = diffData.map((d) => (d != null && d < 0 ? d : "-"));

    return {
      tooltip: {
        trigger: "axis",
        formatter: (params: unknown) => {
          const items = params as Array<{
            axisValueLabel: string;
            value: number | string;
            dataIndex: number;
            seriesName: string;
          }>;

          if (!items || items.length === 0) return "";

          const monthLabel = items[0]!.axisValueLabel;
          const idx = items[0]!.dataIndex;
          const diff = diffData[idx];

          if (diff == null) return `<strong>${monthLabel}</strong><br/>No budget set`;

          const label = diff > 0
            ? `<span style="color:#10b981">Surplus: ${formatEur(diff)}</span>`
            : diff < 0
              ? `<span style="color:#ef4444">Deficit: ${formatEur(Math.abs(diff))}</span>`
              : `<span>On budget</span>`;

          return `<strong>${monthLabel}</strong><br/>${label}`;
        },
      },
      legend: { show: false },
      grid: {
        left: 20,
        right: 20,
        top: 30,
        bottom: 50,
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: data.months,
      },
      yAxis: {
        type: "value",
        axisLabel: {
          formatter: (value: number) => formatCompactEur(value),
        },
      },
      series: [
        {
          name: "Surplus",
          type: "bar",
          stack: "diff",
          itemStyle: { color: "#10b981" },
          data: surplusData,
          label: {
            show: true,
            position: "top" as const,
            formatter: (params: { dataIndex: number }) => {
              const val = diffData[params.dataIndex];
              if (val == null || val <= 0) return "";
              return `+${formatCompactEur(val)}`;
            },
            fontSize: 11,
            color: "#10b981",
          },
        },
        {
          name: "Deficit",
          type: "bar",
          stack: "diff",
          itemStyle: { color: "#ef4444" },
          data: deficitData,
          label: {
            show: true,
            position: "bottom" as const,
            distance: 12,
            formatter: (params: { dataIndex: number }) => {
              const val = diffData[params.dataIndex];
              if (val == null || val >= 0) return "";
              return formatCompactEur(val);
            },
            fontSize: 11,
            color: "#ef4444",
          },
        },
      ],
    };
  }, [data]);

  useEffect(() => {
    if (!chartContainerRef.current || !chartOption) return;

    const instance = echarts.init(chartContainerRef.current);
    instance.setOption(chartOption);

    const onResize = () => instance.resize();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      instance.dispose();
    };
  }, [chartOption]);

  if (loading) return <p>Loading chart...</p>;
  if (error) return <p className="text-destructive">{error}</p>;

  if (!data || data.months.length === 0) {
    return <p className="text-muted-foreground">No data available yet.</p>;
  }

  // Check if any budgets exist
  const hasBudgets = (data.budgets ?? []).some((b) => b != null);
  if (!hasBudgets) {
    return <p className="text-muted-foreground">No monthly budgets set yet. Set a budget on a month page to see this chart.</p>;
  }

  return <div ref={chartContainerRef} className="h-96 w-full" />;
}
