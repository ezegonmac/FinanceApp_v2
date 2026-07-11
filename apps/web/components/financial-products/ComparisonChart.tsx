'use client';

import { useRef, useEffect, useCallback } from "react";
import * as echarts from "echarts";

// ─── Types ────────────────────────────────────────────────────────────────────

type ComparisonSeries = {
  assetId: number;
  assetName: string;
  ticker: string;
  color: string;
  periodReturn: number;
  dataPoints: Array<{ timestamp: string; value: number }>;
};

type Props = {
  series: ComparisonSeries[] | null;
  loading: boolean;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ComparisonChart({ series, loading }: Props) {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  const buildChartOption = useCallback((): echarts.EChartsOption => {
    if (!series || series.length === 0) return {};

    const chartSeries: echarts.EChartsOption["series"] = series.map((s) => ({
      name: `${s.assetName} (${s.periodReturn >= 0 ? "+" : ""}${s.periodReturn.toFixed(2)}%)`,
      type: "line" as const,
      data: s.dataPoints.map((dp) => [dp.timestamp, dp.value]),
      lineStyle: { color: s.color },
      itemStyle: { color: s.color },
      showSymbol: false,
      smooth: false,
    }));

    return {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "cross" },
      },
      legend: {
        show: true,
        top: 0,
      },
      grid: { left: 60, right: 20, top: 60, bottom: 40 },
      xAxis: { type: "time" },
      yAxis: {
        type: "value",
        axisLabel: {
          formatter: (val: number) => val.toFixed(2) + "%",
        },
      },
      series: chartSeries,
    };
  }, [series]);

  // Initialize/update ECharts instance when series data changes
  useEffect(() => {
    if (!series || series.length === 0 || !chartRef.current) {
      // Dispose existing chart if data cleared
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
      return;
    }

    // Initialize or reuse chart instance
    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(chartRef.current);
    }

    chartInstanceRef.current.setOption(buildChartOption(), true);

    // ResizeObserver for responsive resize
    const observer = new ResizeObserver(() => {
      chartInstanceRef.current?.resize();
    });
    observer.observe(chartRef.current);

    return () => {
      observer.disconnect();
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
    };
  }, [series, buildChartOption]);

  // No data and not loading → placeholder
  if (!series && !loading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <p className="text-muted-foreground">
          Select assets and a timeframe to view comparison
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* Chart container */}
      <div ref={chartRef} className="h-[400px] w-full" />

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60">
          <div className="flex items-center gap-2 text-muted-foreground">
            <svg
              className="h-5 w-5 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span>Loading comparison…</span>
          </div>
        </div>
      )}
    </div>
  );
}
