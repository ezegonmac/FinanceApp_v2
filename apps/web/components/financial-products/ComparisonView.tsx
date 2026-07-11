'use client';

import { useState, useEffect, useCallback, useRef } from "react";
import type { Asset } from "@repo/db";
import type { Timeframe } from "@/app/api/_lib/financialProducts/types";
import { AssetSelector } from "./AssetSelector";
import { TimeframeSelector } from "./TimeframeSelector";
import { ComparisonChart } from "./ComparisonChart";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

type ComparisonSeries = {
  assetId: number;
  assetName: string;
  ticker: string;
  color: string;
  periodReturn: number;
  dataPoints: Array<{ timestamp: string; value: number }>;
};

type ComparisonResponse = {
  series: ComparisonSeries[];
  effectiveStartDate: string;
  timeframe: string;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ComparisonView() {
  const [selectedAssets, setSelectedAssets] = useState<Asset[]>([]);
  const [timeframe, setTimeframe] = useState<Timeframe | "CUSTOM">("1Y");
  const [customRange, setCustomRange] = useState<{ startDate: Date; endDate: Date } | null>(null);
  const [series, setSeries] = useState<ComparisonSeries[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const canFetch =
    selectedAssets.length >= 2 &&
    (timeframe !== "CUSTOM" || customRange !== null);

  const fetchComparison = useCallback(async () => {
    if (!canFetch) return;

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const assetIds = selectedAssets.map((a) => a.id).join(",");
      let url: string;

      if (timeframe === "CUSTOM" && customRange) {
        url = `/api/financial-products/compare?assetIds=${assetIds}&startDate=${customRange.startDate.toISOString()}&endDate=${customRange.endDate.toISOString()}`;
      } else {
        url = `/api/financial-products/compare?assetIds=${assetIds}&timeframe=${timeframe}`;
      }

      const res = await fetch(url, { signal: controller.signal });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const message = body?.error || `Request failed with status ${res.status}`;
        setError(message);
        setSeries(null);
        return;
      }

      const data: ComparisonResponse = await res.json();
      setSeries(data.series);
      setError(null);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError("Network error. Please check your connection and try again.");
      setSeries(null);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [selectedAssets, timeframe, customRange, canFetch]);

  // Auto-fetch when assets or timeframe changes
  useEffect(() => {
    if (!canFetch) {
      setSeries(null);
      return;
    }

    fetchComparison();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchComparison, canFetch]);

  function handleTimeframeChange(tf: Timeframe) {
    setTimeframe(tf);
    setCustomRange(null);
  }

  function handleCustomRangeChange(startDate: Date, endDate: Date) {
    setCustomRange({ startDate, endDate });
    setTimeframe("CUSTOM");
  }

  return (
    <div className="space-y-4">
      <AssetSelector
        selectedAssets={selectedAssets}
        onAssetsChange={setSelectedAssets}
      />

      <TimeframeSelector
        value={timeframe}
        onChange={handleTimeframeChange}
        onCustomRangeChange={handleCustomRangeChange}
        customRange={customRange}
      />

      {error && (
        <div className="flex items-center gap-3 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3">
          <p className="flex-1 text-sm text-destructive">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchComparison}
          >
            Retry
          </Button>
        </div>
      )}

      <ComparisonChart series={series} loading={loading} />
    </div>
  );
}
