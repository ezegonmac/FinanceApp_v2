'use client';

import { useState, useEffect } from "react";
import type { Asset } from "@repo/db";
import { AssetSearch } from "./AssetSearch";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const COMPARISON_COLORS = [
  "#2563eb", // blue
  "#dc2626", // red
  "#16a34a", // green
  "#9333ea", // purple
  "#ea580c", // orange
];

type Props = {
  selectedAssets: Asset[];
  onAssetsChange: (assets: Asset[]) => void;
};

export function AssetSelector({ selectedAssets, onAssetsChange }: Props) {
  const [watchlistAssets, setWatchlistAssets] = useState<Asset[]>([]);
  const [watchlistLoading, setWatchlistLoading] = useState(true);

  // Fetch the user's tracked (favorited) assets on mount
  useEffect(() => {
    async function fetchWatchlist() {
      try {
        const res = await fetch("/api/financial-products/assets");
        if (res.ok) {
          const assets: Asset[] = await res.json();
          setWatchlistAssets(
            assets
              .filter((a) => a.is_favorite)
              .sort((a, b) => a.name.localeCompare(b.name)),
          );
        }
      } catch {
        // Silently fail — watchlist is a convenience, not critical
      } finally {
        setWatchlistLoading(false);
      }
    }
    void fetchWatchlist();
  }, []);

  const handleAssetAdded = (asset: Asset) => {
    if (selectedAssets.some((a) => a.id === asset.id)) {
      return;
    }
    if (selectedAssets.length >= 5) {
      return;
    }
    onAssetsChange([...selectedAssets, asset]);
  };

  const handleRemove = (assetId: number) => {
    onAssetsChange(selectedAssets.filter((a) => a.id !== assetId));
  };

  const handleWatchlistToggle = (asset: Asset) => {
    if (selectedAssets.some((a) => a.id === asset.id)) {
      handleRemove(asset.id);
    } else {
      handleAssetAdded(asset);
    }
  };

  return (
    <div className="space-y-3">
      {/* Watchlist quick-pick buttons */}
      {!watchlistLoading && watchlistAssets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {watchlistAssets.map((asset) => {
            const isSelected = selectedAssets.some((a) => a.id === asset.id);
            const selectedIndex = selectedAssets.findIndex((a) => a.id === asset.id);
            return (
              <button
                key={asset.id}
                type="button"
                onClick={() => handleWatchlistToggle(asset)}
                disabled={!isSelected && selectedAssets.length >= 5}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-sm transition-colors",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  isSelected
                    ? "border-transparent text-white font-medium"
                    : "border-border bg-background text-foreground hover:bg-muted",
                )}
                style={
                  isSelected
                    ? { backgroundColor: COMPARISON_COLORS[selectedIndex % COMPARISON_COLORS.length] }
                    : undefined
                }
              >
                {asset.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Search for assets not in watchlist */}
      <AssetSearch onAssetAdded={handleAssetAdded} />

      {/* Selected assets as colored chips */}
      {selectedAssets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedAssets.map((asset, index) => (
            <div
              key={asset.id}
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-sm text-white"
              style={{ backgroundColor: COMPARISON_COLORS[index % COMPARISON_COLORS.length] }}
            >
              <span className="font-medium">{asset.name}</span>
              <span className="text-white/70">{asset.ticker}</span>
              <Button
                variant="ghost"
                size="icon-xs"
                className="text-white/80 hover:text-white hover:bg-white/20"
                onClick={() => handleRemove(asset.id)}
                aria-label={`Remove ${asset.name}`}
              >
                <X className="size-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {selectedAssets.length < 2 && (
        <p className="text-sm text-muted-foreground">
          Select at least 2 assets to compare
        </p>
      )}
      {selectedAssets.length >= 5 && (
        <p className="text-sm text-muted-foreground">
          Maximum 5 assets reached
        </p>
      )}
    </div>
  );
}
