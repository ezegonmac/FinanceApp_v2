'use client';

import { useState, useEffect } from "react";
import type { Asset } from "@repo/db";
import type { Timeframe } from "@/app/api/_lib/financialProducts/types";
import type { ContributionMarker } from "@/lib/groupMarkers";
import { AssetSearch } from "./AssetSearch";
import { TrackedAssetList } from "./TrackedAssetList";
import { TimeframeSelector } from "./TimeframeSelector";
import { PriceChart } from "./PriceChart";
import { ContributionToggle } from "./ContributionToggle";

type Props = {
  initialAssets: Asset[];
};

export function FinancialProductsView({ initialAssets }: Props) {
  const [trackedAssets, setTrackedAssets] = useState<Asset[]>(initialAssets);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>("1M");
  const [contributions, setContributions] = useState<ContributionMarker[] | null>(null);
  const [showMarkers, setShowMarkers] = useState(true);

  // Fetch contributions when selectedAsset or timeframe changes
  useEffect(() => {
    if (!selectedAsset) {
      setContributions(null);
      return;
    }

    const controller = new AbortController();
    setContributions(null);

    async function fetchContributions() {
      try {
        const res = await fetch(
          `/api/financial-products/assets/${selectedAsset!.id}/investments?timeframe=${timeframe}`,
          { signal: controller.signal }
        );

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
  }, [selectedAsset?.id, timeframe]);

  function handleAssetAdded(asset: Asset) {
    setTrackedAssets((prev) => [...prev, asset]);
    setSelectedAsset(asset);
  }

  function handleSelect(asset: Asset) {
    setSelectedAsset(asset);
  }

  function handleDeleted(assetId: number) {
    setTrackedAssets((prev) => prev.filter((a) => a.id !== assetId));
    setSelectedAsset((prev) => (prev?.id === assetId ? null : prev));
  }

  function handleTimeframeChange(tf: Timeframe) {
    setTimeframe(tf);
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="space-y-6">
        <AssetSearch onAssetAdded={handleAssetAdded} />
        <TrackedAssetList
          assets={trackedAssets}
          selectedAssetId={selectedAsset?.id ?? null}
          onSelect={handleSelect}
          onDeleted={handleDeleted}
        />
      </aside>
      <main className="space-y-4">
        <TimeframeSelector value={timeframe} onChange={handleTimeframeChange} />
        {contributions && contributions.length > 0 && (
          <ContributionToggle checked={showMarkers} onChange={setShowMarkers} />
        )}
        <PriceChart
          asset={selectedAsset}
          timeframe={timeframe}
          contributions={contributions ?? undefined}
          showMarkers={showMarkers}
        />
      </main>
    </div>
  );
}
