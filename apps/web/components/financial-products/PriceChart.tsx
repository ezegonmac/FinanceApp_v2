'use client';

import { useEffect, useRef, useState, useCallback } from "react";
import * as echarts from "echarts";
import type { Asset } from "@repo/db";
import type { Timeframe } from "@/app/api/_lib/financialProducts/types";
import {
  groupMarkers,
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
  chartClassName?: string;
};

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildSingleTooltip(marker: ContributionMarker, currency: string): string {
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  return [
    `<span style="color:var(${marker.type === "BUY" ? "--positive" : "--negative"});font-weight:600">${marker.type}</span>`,
    `${formatDateTime(marker.processed_at)}`,
    `Price: ${symbol}${marker.unit_price}`,
    `Total: ${symbol}${marker.total_amount}`,
  ].join("<br/>");
}

function buildGroupTooltip(group: Extract<MarkerOrGroup, { kind: "group" }>, currency: string): string {
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  return [
    `<span style="font-weight:600">${group.count} operations</span>`,
    `${group.buyCount} buy · ${group.sellCount} sell`,
    `Total: ${symbol}${group.totalAmount.toFixed(2)}`,
  ].join("<br/>");
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
        trigger: "item",
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
        trigger: "item",
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
        trigger: "item",
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
        trigger: "item",
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

export function PriceChart({ asset, timeframe, contributions, showMarkers, startDate, endDate, chartClassName }: Props) {
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
          formatter: (params: unknown) => {
            const items = Array.isArray(params) ? params : [params];
            const lineItems = (items as Array<{
              seriesType?: string;
              value?: [string, number];
              marker?: string;
            }>).filter((item) => item.seriesType === "line");

            if (lineItems.length === 0) return "";

            const value = lineItems[0]?.value;
            if (!value) return "";

            const [timestamp, price] = value;

            // Hide the line tooltip when a scatter marker is at this exact position
            const hasScatter = (items as Array<{ seriesType?: string }>).some(
              (item) => item.seriesType === "scatter"
            );
            if (hasScatter) return "";

            return [
              `<span style="font-weight:600">Price</span>`,
              `${formatDateTime(timestamp as string)}`,
              `${formatCurrency(price)}`,
            ].join("<br/>");
          },
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
    <div className={chartClassName ? "flex flex-col h-full" : "space-y-3"}>
      <div ref={chartRef} className={chartClassName ?? "h-96 w-full"} />
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
  const formatAmount = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const markers = detail.kind === "single" ? [detail.marker] : detail.markers;
  const totalAmount = detail.kind === "single"
    ? parseFloat(detail.marker.total_amount)
    : detail.totalAmount;
  const totalUnits = markers.reduce((sum, m) => sum + parseFloat(m.units), 0);
  const avgPrice = totalUnits > 0 ? totalAmount / totalUnits : 0;

  return (
    <div className="rounded-lg border bg-card p-4 text-card-foreground space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {detail.kind === "single" ? (
            <span
              className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                detail.marker.type === "BUY"
                  ? "bg-[var(--positive-subtle)] text-[var(--positive-subtle-foreground)]"
                  : "bg-[var(--negative-subtle)] text-[var(--negative-subtle-foreground)]"
              }`}
            >
              {detail.marker.type}
            </span>
          ) : (
            <span className="inline-flex items-center rounded-sm bg-muted px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {detail.count} ops
            </span>
          )}
          <span className="text-sm text-muted-foreground">
            {detail.kind === "single"
              ? formatDateTime(detail.marker.processed_at)
              : `${detail.buyCount} buy · ${detail.sellCount} sell`}
          </span>
        </div>
        <button
          onClick={onDismiss}
          className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Units</p>
          <p className="text-sm font-semibold font-mono tabular-nums">{totalUnits.toFixed(4)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {detail.kind === "single" ? "Unit Price" : "Avg Price"}
          </p>
          <p className="text-sm font-semibold font-mono tabular-nums">
            {detail.kind === "single"
              ? formatAmount(detail.marker.unit_price)
              : formatAmount(avgPrice)}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total</p>
          <p className="text-sm font-semibold font-mono tabular-nums">{formatAmount(totalAmount)}</p>
        </div>
      </div>

      {/* Description (single) or transaction table (group) */}
      {detail.kind === "single" && detail.marker.description && (
        <p className="border-t pt-3 text-xs text-muted-foreground">{detail.marker.description}</p>
      )}

      {detail.kind === "group" && (
        <div className="border-t pt-3">
          {/* Column headers */}
          <div className="grid grid-cols-[auto_1fr_minmax(5rem,auto)_minmax(6rem,auto)] items-center gap-x-3 px-1 pb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Type</span>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Date & Time</span>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground text-right">Units</span>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground text-right">Amount</span>
          </div>
          {/* Rows */}
          <div className="space-y-0.5">
            {detail.markers.map((m, i) => (
              <div
                key={i}
                className="grid grid-cols-[auto_1fr_minmax(5rem,auto)_minmax(6rem,auto)] items-center gap-x-3 rounded px-1 py-1.5 hover:bg-muted/30"
              >
                <span
                  className={`inline-flex shrink-0 items-center rounded-sm px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    m.type === "BUY"
                      ? "bg-[var(--positive-subtle)] text-[var(--positive-subtle-foreground)]"
                      : "bg-[var(--negative-subtle)] text-[var(--negative-subtle-foreground)]"
                  }`}
                >
                  {m.type}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {formatDateTime(m.processed_at)}
                </span>
                <span className="text-xs font-mono tabular-nums text-right">
                  {parseFloat(m.units).toFixed(4)}
                </span>
                <span className="text-xs font-mono tabular-nums font-medium text-right">
                  {formatAmount(m.total_amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
