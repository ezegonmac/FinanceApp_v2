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
    <div className="flex h-full flex-col gap-3">
      <AssetSearch onAssetAdded={onAssetAdded} />

      {loading ? (
        <p className="text-sm text-muted-foreground px-1">Loading watchlist…</p>
      ) : watchlist.length === 0 ? (
        <div className="flex-1 flex items-center justify-center rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground text-center">
            No assets in your watchlist. Search above to add some.
          </p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto rounded-lg border bg-card">
          {watchlist.map((item, idx) => (
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
                "flex cursor-pointer items-center gap-3 px-3 py-2 transition-colors",
                idx === 0 && "rounded-t-lg",
                idx === watchlist.length - 1 && "rounded-b-lg",
                item.id === selectedAssetId
                  ? "bg-accent/40"
                  : "hover:bg-muted/50",
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  <span className="font-mono">{item.ticker}</span>
                  {" · "}
                  {item.asset_type}
                </p>
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
                          "text-[11px] font-mono tabular-nums",
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
                  <p className="text-[11px] text-muted-foreground">—</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
