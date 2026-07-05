'use client';

import { useEffect, useRef, useState } from "react";
import * as echarts from "echarts";
import type { Asset } from "@repo/db";
import type { Timeframe } from "@/app/api/_lib/financialProducts/types";

type PricePoint = {
  timestamp: string;
  price: number;
};

type Props = {
  asset: Asset | null;
  timeframe: Timeframe;
};

export function PriceChart({ asset, timeframe }: Props) {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const [priceData, setPriceData] = useState<PricePoint[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Fetch price data when asset or timeframe changes
  useEffect(() => {
    if (!asset) {
      setPriceData(null);
      return;
    }

    const controller = new AbortController();

    async function fetchPrices() {
      setLoading(true);
      setError(false);
      setPriceData(null);

      try {
        const res = await fetch(
          `/api/financial-products/prices?assetId=${asset!.id}&timeframe=${timeframe}`,
          { signal: controller.signal }
        );

        if (!res.ok) {
          setError(true);
          return;
        }

        const data: PricePoint[] = await res.json();
        setPriceData(data);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError(true);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchPrices();

    return () => {
      controller.abort();
    };
  }, [asset?.id, timeframe]);

  // Render ECharts when priceData is available
  useEffect(() => {
    if (!priceData || priceData.length === 0 || !chartRef.current) return;

    const currency = asset?.currency ?? "USD";

    const formatCurrency = (value: number) =>
      value.toLocaleString("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
      });

    const instance = echarts.init(chartRef.current);
    instance.setOption({
      tooltip: { trigger: "axis" },
      grid: { left: 20, right: 20, top: 32, bottom: 20, containLabel: true },
      xAxis: { type: "time" },
      yAxis: {
        type: "value",
        scale: true,
        axisLabel: { formatter: (value: number) => formatCurrency(value) },
      },
      series: [
        {
          type: "line",
          smooth: false,
          showSymbol: false,
          lineStyle: { width: 2 },
          data: priceData.map((p) => [p.timestamp, p.price]),
        },
      ],
    });

    const onResize = () => instance.resize();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      instance.dispose();
    };
  }, [priceData, asset?.currency]);

  // Render logic in priority order
  if (!asset) {
    return (
      <p className="text-muted-foreground">
        Select an asset to view its price chart
      </p>
    );
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  if (error) {
    return <p className="text-destructive">Failed to load price data.</p>;
  }

  if (priceData && priceData.length === 0) {
    return <p className="text-muted-foreground">No price data available</p>;
  }

  return <div ref={chartRef} className="h-96 w-full" />;
}
