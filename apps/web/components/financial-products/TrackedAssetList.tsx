'use client';

import { useState, useEffect, useCallback } from "react";
import type { Asset } from "@repo/db";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  assets: Asset[];
  selectedAssetId: number | null;
  onSelect: (asset: Asset) => void;
  onDeleted: (assetId: number) => void;
};

export function TrackedAssetList({ assets, selectedAssetId, onSelect, onDeleted }: Props) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 3000);
    return () => clearTimeout(timer);
  }, [error]);

  const handleDelete = useCallback(async (e: React.MouseEvent, assetId: number) => {
    e.stopPropagation();
    setDeletingId(assetId);
    setError(null);

    try {
      const res = await fetch(`/api/financial-products/assets/${assetId}`, {
        method: "DELETE",
      });

      if (res.status === 204 || res.ok) {
        onDeleted(assetId);
      } else {
        setError("Failed to delete asset. Please try again.");
      }
    } catch {
      setError("Failed to delete asset. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }, [onDeleted]);

  if (assets.length === 0) {
    return (
      <div className="rounded-md border p-4">
        <p className="text-sm text-muted-foreground">No tracked assets yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-2 shrink-0 text-destructive hover:text-destructive/80"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

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
            className={`flex cursor-pointer items-center justify-between px-3 py-2 transition-colors first:rounded-t-md last:rounded-b-md ${
              asset.id === selectedAssetId
                ? "bg-accent"
                : "hover:bg-muted/50"
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{asset.name}</p>
              <p className="truncate text-xs text-muted-foreground">{asset.ticker}</p>
            </div>

            <Button
              variant="ghost"
              size="icon-xs"
              disabled={deletingId === asset.id}
              onClick={(e) => handleDelete(e, asset.id)}
              aria-label={`Delete ${asset.name}`}
            >
              <Trash2 />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
