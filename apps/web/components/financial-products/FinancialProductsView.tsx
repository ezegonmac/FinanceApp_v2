'use client';

import { useState, useEffect, useCallback } from "react";
import type { Asset } from "@repo/db";
import type { Timeframe } from "@/app/api/_lib/financialProducts/types";
import type { ContributionMarker } from "@/lib/groupMarkers";
import { WatchlistPanel } from "./WatchlistPanel";
import { AssetOverviewPanel } from "./AssetOverviewPanel";
import { AssetAnalyticsPanel } from "./AssetAnalyticsPanel";
import { TimeframeSelector } from "./TimeframeSelector";
import { PriceChart } from "./PriceChart";
import { ContributionToggle } from "./ContributionToggle";

type Props = {
  initialAssets: Asset[];
};

export function FinancialProductsView({ initialAssets }: Props) {
  const [allAssets, setAllAssets] = useState<Asset[]>(initialAssets);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe | "CUSTOM">("1M");
  const [customRange, setCustomRange] = useState<{ startDate: Date; endDate: Date } | null>(null);
  const [contributions, setContributions] = useState<ContributionMarker[] | null>(null);
  const [showMarkers, setShowMarkers] = useState(true);
  const [watchlistRefreshKey, setWatchlistRefreshKey] = useState(0);
  const [watchlistReady, setWatchlistReady] = useState(false);

  // Auto-select the first watchlist asset when there's no selection
  useEffect(() => {
    if (selectedAsset || !watchlistReady) return;

    const firstFavorite = allAssets
      .filter((a) => a.is_favorite)
      .sort((a, b) => a.name.localeCompare(b.name))[0];

    if (firstFavorite) {
      setSelectedAsset(firstFavorite);
    }
  }, [watchlistReady, allAssets, selectedAsset]);

  // Fetch contributions when selectedAsset or timeframe changes
  useEffect(() => {
    if (!selectedAsset) {
      setContributions(null);
      return;
    }

    if (timeframe === "CUSTOM" && !customRange) {
      return;
    }

    const controller = new AbortController();
    setContributions(null);

    async function fetchContributions() {
      try {
        let url: string;
        if (timeframe === "CUSTOM" && customRange) {
          url = `/api/financial-products/assets/${selectedAsset!.id}/investments?startDate=${customRange.startDate.toISOString()}&endDate=${customRange.endDate.toISOString()}`;
        } else {
          url = `/api/financial-products/assets/${selectedAsset!.id}/investments?timeframe=${timeframe}`;
        }

        const res = await fetch(url, { signal: controller.signal });

        if (!res.ok) {
          setContributions(null);
          return;
        }

        const data: { data: ContributionMarker[] } = await res.json();
        setContributions(data.data);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setContributions(null);
        }
      }
    }

    fetchContributions();

    return () => {
      controller.abort();
    };
  }, [selectedAsset?.id, timeframe, customRange]);

  function handleAssetAdded(asset: Asset) {
    setAllAssets((prev) => {
      const exists = prev.find((a) => a.id === asset.id);
      if (exists) return prev;
      return [...prev, asset];
    });
    setSelectedAsset(asset);
    setWatchlistRefreshKey((k) => k + 1);
  }

  function handleSelect(asset: Asset) {
    setSelectedAsset(asset);
  }

  function handleWatchlistLoaded() {
    setWatchlistReady(true);
  }

  const handleToggleWatchlist = useCallback(async () => {
    if (!selectedAsset) return;

    const res = await fetch(`/api/financial-products/assets/${selectedAsset.id}/favorite`, {
      method: "PATCH",
    });

    if (res.ok) {
      const isFav = allAssets.find((a) => a.id === selectedAsset.id)?.is_favorite ?? false;
      setAllAssets((prev) =>
        prev.map((a) => (a.id === selectedAsset.id ? { ...a, is_favorite: !isFav } : a)),
      );
      setWatchlistRefreshKey((k) => k + 1);
    }
  }, [selectedAsset, allAssets]);

  function handleTimeframeChange(tf: Timeframe) {
    setTimeframe(tf);
    setCustomRange(null);
  }

  function handleCustomRangeChange(startDate: Date, endDate: Date) {
    setCustomRange({ startDate, endDate });
    setTimeframe("CUSTOM");
  }

  const isFavorite = selectedAsset
    ? allAssets.find((a) => a.id === selectedAsset.id)?.is_favorite ?? false
    : false;

  return (
    <div className="space-y-6">
      {/*
        Row 1: Primary workspace — fits within the initial viewport.
        Height = viewport minus nav (h-14) minus main padding (py-6 = 48px) minus gap to row 2.
      */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[300px_1fr] h-[calc(100vh-6.5rem)]">
        {/* Left column: Search + persistent watchlist */}
        <aside className="flex flex-col min-h-0">
          <WatchlistPanel
            selectedAssetId={selectedAsset?.id ?? null}
            onSelect={handleSelect}
            onAssetAdded={handleAssetAdded}
            onLoaded={handleWatchlistLoaded}
            allAssets={allAssets}
            refreshKey={watchlistRefreshKey}
          />
        </aside>

        {/* Right column: Unified analysis canvas (overview + chart) */}
        {selectedAsset ? (
          <div className="flex flex-col min-h-0 rounded-lg border overflow-hidden">
            {/* Asset Overview — compact, ~1/3 of the canvas */}
            <div className="shrink-0 p-4 pb-3">
              <AssetOverviewPanel
                asset={selectedAsset}
                isFavorite={isFavorite}
                onToggleWatchlist={handleToggleWatchlist}
              />
            </div>

            {/* Subtle divider */}
            <div className="mx-4 border-t" />

            {/* Chart area — fills remaining ~2/3 */}
            <div className="flex-1 flex flex-col min-h-0 p-4 pt-3">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <TimeframeSelector
                  value={timeframe}
                  onChange={handleTimeframeChange}
                  onCustomRangeChange={handleCustomRangeChange}
                  customRange={customRange}
                />
                {contributions && contributions.length > 0 && (
                  <ContributionToggle checked={showMarkers} onChange={setShowMarkers} />
                )}
              </div>
              <div className="flex-1 min-h-0">
                <PriceChart
                  asset={selectedAsset}
                  timeframe={timeframe}
                  contributions={contributions ?? undefined}
                  showMarkers={showMarkers}
                  startDate={customRange?.startDate}
                  endDate={customRange?.endDate}
                  chartClassName="h-full w-full"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-lg border">
            <div className="text-center space-y-2 p-12">
              <p className="text-muted-foreground">
                Select an asset from the watchlist to view its overview
              </p>
              <p className="text-xs text-muted-foreground">
                Use the search bar to find and add assets to your watchlist.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Row 2: Full-width analytics (Exposure, Holdings, Dividends…) */}
      {selectedAsset && (
        <AssetAnalyticsPanel asset={selectedAsset} />
      )}
    </div>
  );
}
