'use client';

import { useState, useEffect, useMemo } from "react";
import type { Asset } from "@repo/db";
import type { Timeframe } from "@/app/api/_lib/financialProducts/types";
import type { ContributionMarker } from "@/lib/groupMarkers";
import { AssetSearch } from "./AssetSearch";
import { TrackedAssetList } from "./TrackedAssetList";
import { TimeframeSelector } from "./TimeframeSelector";
import { PriceChart } from "./PriceChart";
import { ContributionToggle } from "./ContributionToggle";
import { AssetDetailPanel } from "./AssetDetailPanel";

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

  // Only show favorited assets in the watchlist
  const watchlistAssets = useMemo(
    () => allAssets.filter((a) => a.is_favorite).sort((a, b) => a.name.localeCompare(b.name)),
    [allAssets],
  );

  // Fetch contributions when selectedAsset or timeframe changes
  useEffect(() => {
    if (!selectedAsset) {
      setContributions(null);
      return;
    }

    // Don't fetch if timeframe is CUSTOM but no dates provided yet
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
    // Add to known assets list (for chart/detail viewing) but don't auto-watchlist
    setAllAssets((prev) => {
      const exists = prev.find((a) => a.id === asset.id);
      if (exists) return prev;
      return [...prev, asset];
    });
    setSelectedAsset(asset);
  }

  function handleSelect(asset: Asset) {
    setSelectedAsset(asset);
  }

  async function handleToggleWatchlist() {
    if (!selectedAsset) return;

    const res = await fetch(`/api/financial-products/assets/${selectedAsset.id}/favorite`, {
      method: "PATCH",
    });

    if (res.ok) {
      const isFav = allAssets.find((a) => a.id === selectedAsset.id)?.is_favorite ?? false;
      setAllAssets((prev) =>
        prev.map((a) => (a.id === selectedAsset.id ? { ...a, is_favorite: !isFav } : a)),
      );
    }
  }

  function handleTimeframeChange(tf: Timeframe) {
    setTimeframe(tf);
    setCustomRange(null);
  }

  function handleCustomRangeChange(startDate: Date, endDate: Date) {
    setCustomRange({ startDate, endDate });
    setTimeframe("CUSTOM");
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="space-y-6">
        <AssetSearch onAssetAdded={handleAssetAdded} />
        <TrackedAssetList
          assets={watchlistAssets}
          selectedAssetId={selectedAsset?.id ?? null}
          onSelect={handleSelect}
        />
      </aside>
      <main className="space-y-4">
        <TimeframeSelector
          value={timeframe}
          onChange={handleTimeframeChange}
          onCustomRangeChange={handleCustomRangeChange}
          customRange={customRange}
        />
        {contributions && contributions.length > 0 && (
          <ContributionToggle checked={showMarkers} onChange={setShowMarkers} />
        )}
        <PriceChart
          asset={selectedAsset}
          timeframe={timeframe}
          contributions={contributions ?? undefined}
          showMarkers={showMarkers}
          startDate={customRange?.startDate}
          endDate={customRange?.endDate}
        />
        <AssetDetailPanel
          asset={selectedAsset}
          isFavorite={selectedAsset ? allAssets.find((a) => a.id === selectedAsset.id)?.is_favorite ?? false : false}
          onToggleWatchlist={handleToggleWatchlist}
        />
      </main>
    </div>
  );
}
