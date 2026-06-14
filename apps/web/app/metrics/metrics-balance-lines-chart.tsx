"use client";

import { useEffect, useMemo, useRef } from "react";
import * as echarts from "echarts";

type AccountBalanceSeriesResponse = {
  months: string[];
  accounts: { id: number; name: string }[];
  series: Record<string, number[]>;
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

type Props = {
  data: AccountBalanceSeriesResponse;
};

export default function MetricsBalanceLinesChart({ data }: Props) {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);

  const chartOption = useMemo<echarts.EChartsOption | null>(() => {
    if (!data || data.months.length === 0 || data.accounts.length === 0) {
      return null;
    }

    return {
      tooltip: {
        trigger: "axis",
        valueFormatter: (value) => formatEur(Number(value)),
      },
      legend: {
        type: "scroll",
        top: 0,
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
        boundaryGap: false,
      },
      yAxis: {
        type: "value",
        axisLabel: {
          formatter: (value: number) => formatCompactEur(value),
        },
      },
      series: data.accounts.map((account) => ({
        name: account.name,
        type: "line" as const,
        smooth: false,
        showSymbol: true,
        symbol: "circle",
        symbolSize: 6,
        lineStyle: { width: 2 },
        data: data.series[String(account.id)] ?? [],
      })),
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

  if (!data || data.months.length === 0 || data.accounts.length === 0) {
    return <p className="text-muted-foreground">No monthly snapshot data available yet.</p>;
  }

  return <div ref={chartContainerRef} className="h-96 w-full" />;
}
