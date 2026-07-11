'use client';

import { useEffect, useRef, useState, useCallback } from "react";
import * as echarts from "echarts";
import type { Asset } from "@repo/db";
import type { Timeframe } from "@/app/api/_lib/financialProducts/types";
import {
  groupMarkers,
  findNearestPrice,
  type ContributionMarker,
  type MarkerOrGroup,
} from "@/lib/groupMarkers";

type PricePoint = {
  timestamp: string;
  price: number;
};

type Props = {
  asset: Asset | null;
  timeframe: Timeframe | "CUSTOM";
  contributions?: ContributionMarker[];
  showMarkers?: boolean;
  startDate?: Date;
  endDate?: Date;
};

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function buildSingleTooltip(marker: ContributionMarker, currency: string): string {
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  const lines = [
    `<strong>${marker.type}</strong>`,
    `Units: ${marker.units}`,
    `Unit Price: ${symbol}${marker.unit_price}`,
    `Total: ${symbol}${marker.total_amount}`,
    `Date: ${formatDate(marker.processed_at)}`,
  ];
  if (marker.description) {
    lines.push(`Description: ${marker.description}`);
  }
  return lines.join("<br/>");
}

function buildGroupTooltip(group: Extract<MarkerOrGroup, { kind: "group" }>, currency: string): string {
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  const lines = [
    `<strong>${group.count} transactions</strong>`,
    `Total: ${symbol}${group.totalAmount.toFixed(2)}`,
    `BUY: ${group.buyCount}`,
    `SELL: ${group.sellCount}`,
  ];
  return lines.join("<br/>");
}

function buildScatterSeries(
  grouped: MarkerOrGroup[],
  currency: string = "USD",
): echarts.EChartsOption["series"] {
  const buyData: [string, number, ContributionMarker][] = [];
  const sellData: [string, number, ContributionMarker][] = [];
  const neutralData: [string, number, ContributionMarker][] = [];
  const groupData: [string, number, Extract<MarkerOrGroup, { kind: "group" }>][] = [];

  for (const item of grouped) {
    if (item.kind === "single") {
      const { marker, position } = item;
      const dataPoint: [string, number, ContributionMarker] = [position.x, position.y, marker];

      if (marker.type === "BUY") {
        buyData.push(dataPoint);
      } else if (marker.type === "SELL") {
        sellData.push(dataPoint);
      } else {
        // Unrecognized type → neutral marker style
        neutralData.push(dataPoint);
      }
    } else {
      groupData.push([item.position.x, item.position.y, item]);
    }
  }

  const series: NonNullable<echarts.EChartsOption["series"]> = [];

  if (buyData.length > 0) {
    series.push({
      type: "scatter",
      name: "BUY",
      symbol: "triangle",
      symbolRotate: 0,
      symbolSize: 12,
      itemStyle: { color: "#10b981" }, // --positive
      data: buyData.map(([x, y]) => [x, y]),
      tooltip: {
        formatter: (params: unknown) => {
          const p = params as { dataIndex: number };
          const marker = buyData[p.dataIndex]![2];
          return buildSingleTooltip(marker, currency);
        },
      },
      z: 10,
    });
  }

  if (sellData.length > 0) {
    series.push({
      type: "scatter",
      name: "SELL",
      symbol: "triangle",
      symbolRotate: 180,
      symbolSize: 12,
      itemStyle: { color: "#ef4444" }, // --negative
      data: sellData.map(([x, y]) => [x, y]),
      tooltip: {
        formatter: (params: unknown) => {
          const p = params as { dataIndex: number };
          const marker = sellData[p.dataIndex]![2];
          return buildSingleTooltip(marker, currency);
        },
      },
      z: 10,
    });
  }

  if (neutralData.length > 0) {
    series.push({
      type: "scatter",
      name: "Other",
      symbol: "circle",
      symbolSize: 12,
      itemStyle: { color: "#565e74" }, // --secondary
      data: neutralData.map(([x, y]) => [x, y]),
      tooltip: {
        formatter: (params: unknown) => {
          const p = params as { dataIndex: number };
          const marker = neutralData[p.dataIndex]![2];
          return buildSingleTooltip(marker, currency);
        },
      },
      z: 10,
    });
  }

  if (groupData.length > 0) {
    series.push({
      type: "scatter",
      name: "Grouped",
      symbol: "circle",
      symbolSize: (value: unknown, params: { dataIndex: number }) => {
        const group = groupData[params.dataIndex]![2];
        // Scale size: base 10, +1 per additional transaction, max 18
        return Math.min(10 + (group.count - 2) * 1, 18);
      },
      itemStyle: { color: "#565e74" }, // --secondary
      data: groupData.map(([x, y]) => [x, y]),
      tooltip: {
        formatter: (params: unknown) => {
          const p = params as { dataIndex: number };
          const group = groupData[p.dataIndex]![2];
          return buildGroupTooltip(group, currency);
        },
      },
      z: 10,
    });
  }

  return series;
}

export function PriceChart({ asset, timeframe, contributions, showMarkers, startDate, endDate }: Props) {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  const groupedRef = useRef<MarkerOrGroup[]>([]);
  const [priceData, setPriceData] = useState<PricePoint[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<MarkerOrGroup | null>(null);

  // Fetch price data when asset or timeframe changes
  useEffect(() => {
    if (!asset) {
      setPriceData(null);
      setSelectedDetail(null);
      return;
    }

    // Don't fetch if timeframe is CUSTOM but no dates provided yet
    if (timeframe === "CUSTOM" && (!startDate || !endDate)) {
      return;
    }

    const controller = new AbortController();

    async function fetchPrices() {
      setLoading(true);
      setError(false);
      setPriceData(null);

      try {
        let url: string;
        if (timeframe === "CUSTOM" && startDate && endDate) {
          url = `/api/financial-products/prices?assetId=${asset!.id}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
        } else {
          url = `/api/financial-products/prices?assetId=${asset!.id}&timeframe=${timeframe}`;
        }

        const res = await fetch(url, { signal: controller.signal });

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
  }, [asset?.id, timeframe, startDate?.getTime(), endDate?.getTime()]);

  const buildChartOption = useCallback(
    (chartWidth: number): echarts.EChartsOption => {
      const currency = asset?.currency ?? "USD";

      const formatCurrency = (value: number) =>
        value.toLocaleString("en-US", {
          style: "currency",
          currency,
          minimumFractionDigits: 0,
        });

      const lineSeries: echarts.EChartsOption["series"] = [
        {
          type: "line",
          smooth: false,
          showSymbol: false,
          lineStyle: { width: 2 },
          data: priceData!.map((p) => [p.timestamp, p.price]),
        },
      ];

      let scatterSeries: echarts.EChartsOption["series"] = [];

      if (
        showMarkers &&
        contributions &&
        contributions.length > 0 &&
        priceData &&
        priceData.length > 0
      ) {
        const grouped = groupMarkers(contributions, priceData, chartWidth);
        groupedRef.current = grouped;
        scatterSeries = buildScatterSeries(grouped, currency);
      } else {
        groupedRef.current = [];
      }

      const allSeries = [
        ...(Array.isArray(lineSeries) ? lineSeries : [lineSeries]),
        ...(Array.isArray(scatterSeries) ? scatterSeries : []),
      ];

      return {
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "line" },
        },
        grid: { left: 20, right: 20, top: 32, bottom: 20, containLabel: true },
        xAxis: { type: "time" },
        yAxis: {
          type: "value",
          scale: true,
          axisLabel: { formatter: (value: number) => formatCurrency(value) },
        },
        series: allSeries as echarts.EChartsOption["series"],
      };
    },
    [priceData, contributions, showMarkers, asset?.currency],
  );

  // Render ECharts when priceData is available
  useEffect(() => {
    if (!priceData || priceData.length === 0 || !chartRef.current) return;

    const chartWidth = chartRef.current.clientWidth ?? 0;

    const instance = echarts.init(chartRef.current);
    chartInstanceRef.current = instance;
    instance.setOption(buildChartOption(chartWidth));

    // Click handler for scatter markers
    instance.on("click", (params: { seriesName?: string; dataIndex?: number }) => {
      const name = params.seriesName;
      if (!name || !["BUY", "SELL", "Other", "Grouped"].includes(name)) {
        setSelectedDetail(null);
        return;
      }
      const grouped = groupedRef.current;
      // Find the matching item by series name + dataIndex
      let index = 0;
      for (const item of grouped) {
        if (item.kind === "single") {
          const seriesName = item.marker.type === "BUY" ? "BUY" : item.marker.type === "SELL" ? "SELL" : "Other";
          if (seriesName === name) {
            if (index === params.dataIndex) {
              setSelectedDetail(item);
              return;
            }
            index++;
          }
        } else {
          if (name === "Grouped") {
            if (index === params.dataIndex) {
              setSelectedDetail(item);
              return;
            }
            index++;
          }
        }
      }
    });

    // Click on empty area dismisses the card
    instance.getZr().on("click", (e: { target?: unknown }) => {
      if (!e.target) {
        setSelectedDetail(null);
      }
    });

    const onResize = () => {
      instance.resize();
      // Recalculate grouping with new width
      if (chartRef.current) {
        const newWidth = chartRef.current.clientWidth;
        instance.setOption(buildChartOption(newWidth));
      }
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      instance.dispose();
      chartInstanceRef.current = null;
    };
  }, [priceData, asset?.currency, contributions, showMarkers, buildChartOption]);

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

  return (
    <div className="space-y-3">
      <div ref={chartRef} className="h-96 w-full" />
      {selectedDetail && (
        <MarkerDetailCard
          detail={selectedDetail}
          currency={asset?.currency ?? "USD"}
          onDismiss={() => setSelectedDetail(null)}
        />
      )}
    </div>
  );
}

function MarkerDetailCard({
  detail,
  currency,
  onDismiss,
}: {
  detail: MarkerOrGroup;
  currency: string;
  onDismiss: () => void;
}) {
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";

  if (detail.kind === "single") {
    const m = detail.marker;
    return (
      <div className="relative rounded-lg border bg-card p-3 text-sm text-card-foreground">
        <button
          onClick={onDismiss}
          className="absolute right-2 top-2 cursor-pointer text-muted-foreground hover:text-foreground"
          aria-label="Dismiss"
        >
          ✕
        </button>
        <div className="flex items-center gap-2 mb-2">
          <span className={`font-semibold ${m.type === "BUY" ? "text-positive" : "text-negative"}`}>
            {m.type}
          </span>
          <span className="text-muted-foreground">{formatDate(m.processed_at)}</span>
        </div>
        <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-xs">
          <div>
            <span className="text-muted-foreground">Units</span>
            <p className="font-medium tabular-nums">{parseFloat(m.units).toFixed(4)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Unit Price</span>
            <p className="font-medium tabular-nums">{symbol}{parseFloat(m.unit_price).toFixed(4)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Total</span>
            <p className="font-medium tabular-nums">{symbol}{parseFloat(m.total_amount).toFixed(2)}</p>
          </div>
        </div>
        {m.description && (
          <p className="mt-2 text-xs text-muted-foreground">{m.description}</p>
        )}
      </div>
    );
  }

  // Group
  return (
    <div className="relative rounded-lg border bg-card p-3 text-sm text-card-foreground">
      <button
        onClick={onDismiss}
        className="absolute right-2 top-2 cursor-pointer text-muted-foreground hover:text-foreground"
        aria-label="Dismiss"
      >
        ✕
      </button>
      <div className="flex items-center gap-2 mb-2">
        <span className="font-semibold">{detail.count} transactions</span>
        <span className="text-muted-foreground">{formatDate(detail.position.x)}</span>
      </div>
      <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-xs mb-2">
        <div>
          <span className="text-muted-foreground">Total</span>
          <p className="font-medium tabular-nums">{symbol}{detail.totalAmount.toFixed(2)}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Buys</span>
          <p className="font-medium tabular-nums">{detail.buyCount}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Sells</span>
          <p className="font-medium tabular-nums">{detail.sellCount}</p>
        </div>
      </div>
      <div className="space-y-1 border-t pt-2">
        {detail.markers.map((m, i) => (
          <div key={i} className="flex items-center gap-3 text-xs">
            <span className={`font-medium ${m.type === "BUY" ? "text-positive" : "text-negative"}`}>
              {m.type}
            </span>
            <span className="tabular-nums">{parseFloat(m.units).toFixed(4)} units</span>
            <span className="tabular-nums">{symbol}{parseFloat(m.total_amount).toFixed(2)}</span>
            {m.description && <span className="text-muted-foreground truncate">{m.description}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
