"use client";

import { useEffect, useMemo, useRef } from "react";
import * as echarts from "echarts";

type ExposurePieChartProps = {
  data: Array<{ categoryName: string; percentage: number; value: number }>;
  type: "SECTOR" | "COUNTRY";
};

const formatEur = (value: number) =>
  value.toLocaleString("es-ES", { style: "currency", currency: "EUR" });

export default function ExposurePieChart({ data, type }: ExposurePieChartProps) {
  const chartRef = useRef<HTMLDivElement | null>(null);

  const chartOption = useMemo<echarts.EChartsOption | null>(() => {
    if (!data || data.length === 0) {
      return null;
    }

    return {
      tooltip: {
        trigger: "item",
        formatter: (params: unknown) => {
          const p = params as { name: string; value: number; data: { rawValue: number } };
          return `${p.name}: ${p.value.toFixed(2)}% (${formatEur(p.data.rawValue)})`;
        },
      },
      series: [
        {
          type: "pie",
          radius: ["40%", "70%"],
          data: data.map((d) => ({
            name: d.categoryName,
            value: d.percentage,
            rawValue: d.value,
          })),
          label: {
            show: true,
            formatter: "{b}: {d}%",
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: "rgba(0, 0, 0, 0.2)",
            },
          },
        },
      ],
    };
  }, [data]);

  useEffect(() => {
    if (!chartRef.current || !chartOption) return;

    const instance = echarts.init(chartRef.current);
    instance.setOption(chartOption);

    const onResize = () => instance.resize();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      instance.dispose();
    };
  }, [chartOption]);

  if (!data || data.length === 0) {
    return (
      <p className="text-muted-foreground">
        No {type === "SECTOR" ? "sector" : "country"} exposure data available.
      </p>
    );
  }

  return <div ref={chartRef} className="h-80 w-full" />;
}
