'use client';

import { useEffect, useState } from "react";
import type { Asset } from "@repo/db";
import { cn } from "@/lib/utils";
import { AssetSearch } from "./AssetSearch";

type WatchlistAsset = {
  id: number;
  ticker: string;
  name: string;
  asset_type: string;
  currency: string;
  price_frequency: string;
  is_favorite: boolean;
  latestPrice: number | null;
  latestPriceAt: string | null;
  dailyChange: number | null;
  dailyChangePercent: number | null;
};

type Props = {
  selectedAssetId: number | null;
  onSelect: (asset: Asset) => void;
  onAssetAdded: (asset: Asset) => void;
  onLoaded?: () => void;
  allAssets: Asset[];
  refreshKey: number;
};

function formatPrice(value: number, currency: string): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function WatchlistPanel({
  selectedAssetId,
  onSelect,
  onAssetAdded,
  onLoaded,
  allAssets,
  refreshKey,
}: Props) {
  const [watchlist, setWatchlist] = useState<WatchlistAsset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchSummary() {
      setLoading(true);
      try {
        const res = await fetch("/api/financial-products/assets/summary");
        if (!res.ok) throw new Error();
        const json: { data: WatchlistAsset[] } = await res.json();
        if (!cancelled) {
          setWatchlist(json.data);
          onLoaded?.();
        }
      } catch {
        // Fall back to allAssets with no price info
        if (!cancelled) {
          setWatchlist(
            allAssets
              .filter((a) => a.is_favorite)
              .map((a) => ({
                id: a.id,
                ticker: a.ticker,
                name: a.name,
                asset_type: a.asset_type,
                currency: a.currency,
                price_frequency: a.price_frequency,
                is_favorite: true,
                latestPrice: null,
                latestPriceAt: null,
                dailyChange: null,
                dailyChangePercent: null,
              })),
          );
          onLoaded?.();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchSummary();
    return () => { cancelled = true; };
  }, [refreshKey, allAssets]);

  function handleSelect(item: WatchlistAsset) {
    const fullAsset = allAssets.find((a) => a.id === item.id);
    if (fullAsset) onSelect(fullAsset);
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <AssetSearch onAssetAdded={onAssetAdded} />

      {loading ? (
        <p className="text-sm text-muted-foreground px-1">Loading watchlist…</p>
      ) : watchlist.length === 0 ? (
        <div className="rounded-md border p-4">
          <p className="text-sm text-muted-foreground">
            No assets in your watchlist. Search above to add some.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto rounded-md border">
          {watchlist.map((item) => (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => handleSelect(item)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSelect(item);
                }
              }}
              className={cn(
                "flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors first:rounded-t-md last:rounded-b-md",
                item.id === selectedAssetId
                  ? "bg-accent"
                  : "hover:bg-muted/50",
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{item.name}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="font-mono">{item.ticker}</span>
                  <span>·</span>
                  <span>{item.asset_type}</span>
                </div>
              </div>

              <div className="shrink-0 text-right">
                {item.latestPrice != null ? (
                  <>
                    <p className="text-sm font-mono tabular-nums font-medium">
                      {formatPrice(item.latestPrice, item.currency)}
                    </p>
                    {item.dailyChangePercent != null && (
                      <p
                        className={cn(
                          "text-xs font-mono tabular-nums",
                          item.dailyChangePercent >= 0
                            ? "text-positive"
                            : "text-negative",
                        )}
                      >
                        {formatPercent(item.dailyChangePercent)}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">—</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
