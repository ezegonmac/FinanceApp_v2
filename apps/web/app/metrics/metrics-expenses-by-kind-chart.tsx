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

export default function MetricsExpensesByKindChart() {
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

    return {
      tooltip: {
        trigger: "axis",
        valueFormatter: (value) => formatEur(Number(value)),
      },
      legend: {
        top: 0,
        data: ["Fixed", "Variable", "Budget"],
      },
      grid: {
        left: 20,
        right: 20,
        top: 48,
        bottom: 20,
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
          name: "Fixed",
          type: "bar",
          stack: "expenses",
          emphasis: { focus: "series" as const },
          data: data.fixed,
        },
        {
          name: "Variable",
          type: "bar",
          stack: "expenses",
          emphasis: { focus: "series" as const },
          data: data.variable,
        },
        {
          name: "Budget",
          type: "line",
          step: "middle",
          smooth: false,
          showSymbol: true,
          symbol: "diamond",
          symbolSize: 7,
          lineStyle: { width: 2, type: "dashed" },
          itemStyle: { color: "#ef4444" }, // --negative / --chart-8
          data: (data.budgets ?? []).map((b) => b ?? null),
          connectNulls: false,
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
    return <p className="text-muted-foreground">No expense data available yet.</p>;
  }

  return <div ref={chartContainerRef} className="h-96 w-full" />;
}
