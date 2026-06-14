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

export default function MetricsBalanceStackedBarChart({ data }: Props) {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);

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
        axisPointer: { type: "line", lineStyle: { type: "dashed", opacity: 0.5 } },
        formatter: (params: unknown) => {
          const items = params as Array<{
            seriesName: string;
            value: number;
            color: string;
            axisValueLabel: string;
          }>;

          if (!items || items.length === 0) return "";

          const monthLabel = items[0]!.axisValueLabel;
          const monthIndex = data.months.indexOf(monthLabel);
          const total = totalPerMonth[monthIndex] ?? 0;

          let html = `<strong>${monthLabel}</strong><br/>`;

          for (const item of items) {
            const pct = total !== 0 ? ((item.value / total) * 100).toFixed(1) : "0.0";
            html += `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${item.color};margin-right:6px;"></span>`;
            html += `${item.seriesName}: ${formatEur(item.value)} (${pct}%)<br/>`;
          }

          html += `<br/><strong>Total: ${formatEur(total)}</strong>`;
          return html;
        },
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
      },
      yAxis: {
        type: "value",
        axisLabel: {
          formatter: (value: number) => formatCompactEur(value),
        },
      },
      series: data.accounts.map((account, index) => ({
        name: account.name,
        type: "bar" as const,
        stack: "balance",
        emphasis: { focus: "series" as const },
        data: data.series[String(account.id)] ?? [],
        ...(index === data.accounts.length - 1 && {
          label: {
            show: true,
            position: "top" as const,
            formatter: (params: { dataIndex: number }) =>
              formatCompactEur(totalPerMonth[params.dataIndex] ?? 0),
            fontSize: 11,
            color: "#444653", // --muted-foreground
          },
        }),
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
