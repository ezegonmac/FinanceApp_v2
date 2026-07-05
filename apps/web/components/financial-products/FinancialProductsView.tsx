'use client';

import { useState } from "react";
import type { Asset } from "@repo/db";
import type { Timeframe } from "@/app/api/_lib/financialProducts/types";
import { AssetSearch } from "./AssetSearch";
import { TrackedAssetList } from "./TrackedAssetList";
import { TimeframeSelector } from "./TimeframeSelector";
import { PriceChart } from "./PriceChart";

type Props = {
  initialAssets: Asset[];
};

export function FinancialProductsView({ initialAssets }: Props) {
  const [trackedAssets, setTrackedAssets] = useState<Asset[]>(initialAssets);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>("1M");

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
        <PriceChart asset={selectedAsset} timeframe={timeframe} />
      </main>
    </div>
  );
}
