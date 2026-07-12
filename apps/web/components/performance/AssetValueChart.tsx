"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import {
  TimeframeSelector,
  type Timeframe,
} from "@/components/performance/TimeframeSelector";

type SeriesPoint = {
  date: string;
  position_value: string;
  cost_basis: string;
};

type Operation = {
  date: string;
  type: "BUY" | "SELL";
  units: string;
  total_amount: string;
};

type AssetValueChartProps = {
  series: SeriesPoint[];
  operations: Operation[];
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

export function AssetValueChart({
  series,
  operations,
  timeframe,
  onTimeframeChange,
}: AssetValueChartProps) {
  const chartRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!series || series.length === 0 || !chartRef.current) return;

    const instance = echarts.init(chartRef.current);

    const dates = series.map((s) => s.date);
    const positionValues = series.map((s) => parseFloat(s.position_value));
    const costBasisValues = series.map((s) => parseFloat(s.cost_basis));

    // Determine overall profit/loss for area color
    const lastValue = positionValues[positionValues.length - 1] ?? 0;
    const lastCost = costBasisValues[costBasisValues.length - 1] ?? 0;
    const overallProfit = lastValue >= lastCost;

    // BUY markers
    const buyData = operations
      .filter((op) => op.type === "BUY")
      .map((op) => {
        const idx = series.findIndex((s) => s.date === op.date);
        return idx >= 0 ? [op.date, positionValues[idx]] : null;
      })
      .filter(Boolean);

    // SELL markers
    const sellData = operations
      .filter((op) => op.type === "SELL")
      .map((op) => {
        const idx = series.findIndex((s) => s.date === op.date);
        return idx >= 0 ? [op.date, positionValues[idx]] : null;
      })
      .filter(Boolean);

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "cross" },
        formatter: (params: unknown) => {
          const items = Array.isArray(params) ? params : [params];
          if (items.length === 0) return "";

          const first = items[0] as {
            axisValueLabel?: string;
          };
          const date = first.axisValueLabel ?? "";

          const lines = [`<strong>${date}</strong>`];
          for (const item of items as Array<{
            seriesName?: string;
            data?: number | Array<unknown>;
            color?: string;
            seriesType?: string;
          }>) {
            // Skip scatter series in tooltip formatting (handled separately)
            if (item.seriesType === "scatter") {
              const op = operations.find(
                (o) =>
                  o.date === date &&
                  ((item.seriesName === "BUY" && o.type === "BUY") ||
                    (item.seriesName === "SELL" && o.type === "SELL"))
              );
              if (op) {
                lines.push(
                  `<span style="display:inline-block;width:10px;height:10px;background:${item.color};margin-right:6px;"></span>${item.seriesName}: ${parseFloat(op.units)} units @ ${formatCurrency(parseFloat(op.total_amount))}`
                );
              }
              continue;
            }

            const value =
              typeof item.data === "number" ? item.data : 0;
            const color = item.color ?? "#000";
            lines.push(
              `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};margin-right:6px;"></span>${item.seriesName}: ${formatCurrency(value)}`
            );
          }
          return lines.join("<br/>");
        },
      },
      legend: {
        data: ["Position Value", "Cost Basis", "BUY", "SELL"],
        top: 0,
        textStyle: { fontSize: 11 },
      },
      grid: { left: 20, right: 20, top: 40, bottom: 20, containLabel: true },
      xAxis: {
        type: "category",
        data: dates,
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
          name: "Position Value",
          type: "line",
          data: positionValues,
          smooth: false,
          showSymbol: false,
          lineStyle: { width: 2 },
          areaStyle: {
            opacity: 0.15,
            color: overallProfit ? "#10b981" : "#ef4444",
          },
        },
        {
          name: "Cost Basis",
          type: "line",
          data: costBasisValues,
          smooth: false,
          showSymbol: false,
          lineStyle: { width: 1.5, opacity: 0.5 },
          itemStyle: { color: "#64748b" },
          emphasis: { disabled: true },
        },
        {
          type: "scatter",
          name: "BUY",
          data: buyData,
          symbol: "triangle",
          symbolSize: 10,
          itemStyle: { color: "#10b981" },
        },
        {
          type: "scatter",
          name: "SELL",
          data: sellData,
          symbol: "triangle",
          symbolRotate: 180,
          symbolSize: 10,
          itemStyle: { color: "#ef4444" },
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
  }, [series, operations]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <TimeframeSelector value={timeframe} onChange={onTimeframeChange} />
      </div>
      {series.length > 0 ? (
        <div ref={chartRef} className="h-64 w-full" />
      ) : (
        <p className="text-muted-foreground text-center py-8">
          No data available.
        </p>
      )}
    </div>
  );
}
