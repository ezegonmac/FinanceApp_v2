'use client';

import { useState, useCallback } from "react";
import type { Asset } from "@repo/db";
import { cn } from "@/lib/utils";

type Props = {
  assets: Asset[];
  selectedAssetId: number | null;
  onSelect: (asset: Asset) => void;
};

export function TrackedAssetList({ assets, selectedAssetId, onSelect }: Props) {
  if (assets.length === 0) {
    return (
      <div className="rounded-md border p-4">
        <p className="text-sm text-muted-foreground">
          No assets in your watchlist. Search above to add some.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      {assets.map((asset) => (
        <div
          key={asset.id}
          role="button"
          tabIndex={0}
          onClick={() => onSelect(asset)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelect(asset);
            }
          }}
          className={cn(
            "flex cursor-pointer items-center px-3 py-2 transition-colors first:rounded-t-md last:rounded-b-md",
            asset.id === selectedAssetId
              ? "bg-accent"
              : "hover:bg-muted/50"
          )}
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{asset.name}</p>
            <p className="truncate text-xs text-muted-foreground">{asset.ticker}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
