"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

export default function MetricsAccountBalanceChart() {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);

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

  const chartOption = useMemo<echarts.EChartsOption | null>(() => {
    if (!data || data.months.length === 0 || data.accounts.length === 0) {
      return null;
    }

    const totalPerMonth = data.months.map((_, monthIndex) =>
      data.accounts.reduce((sum, account) => {
        const values = data.series[String(account.id)] ?? [];
        return sum + (values[monthIndex] ?? 0);
      }, 0)
    );

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
        type: "line",
        stack: "total-balance",
        smooth: false,
        showSymbol: true,
        symbol: "circle",
        symbolSize: 7,
        lineStyle: { width: 2 },
        areaStyle: { opacity: 0.12 },
        data: data.series[String(account.id)] ?? [],
      })).concat({
        name: "Total",
        type: "line",
        smooth: false,
        showSymbol: true,
        symbol: "diamond",
        symbolSize: 8,
        lineStyle: { width: 3 },
        z: 10,
        data: totalPerMonth,
      }),
    };
  }, [data]);

  useEffect(() => {
    if (!chartContainerRef.current || !chartOption) return;

    const instance = echarts.init(chartContainerRef.current);
    instance.setOption(chartOption);

    const onResize = () => {
      instance.resize();
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      instance.dispose();
    };
  }, [chartOption]);

  if (loading) return <p>Loading chart...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  if (!data || data.months.length === 0 || data.accounts.length === 0) {
    return <p className="text-muted-foreground">No monthly snapshot data available yet.</p>;
  }

  return <div ref={chartContainerRef} className="h-105 w-full" />;
}