'use client';

import { useEffect, useState } from "react";
import type { Asset } from "@repo/db";
import { cn } from "@/lib/utils";
import { AssetSearch } from "./AssetSearch";
import { Sparkline } from "./Sparkline";
import type { SparklineData } from "@/app/api/financial-products/assets/sparklines/route";

type SparklinePoint = {
  timestamp: string;
  percentChange: number;
};

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
  const [sparklines, setSparklines] = useState<Map<number, SparklinePoint[]>>(new Map());

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

  // Lazy-load sparklines after the watchlist is rendered
  useEffect(() => {
    if (watchlist.length === 0) return;

    let cancelled = false;
    const assetIds = watchlist.map((a) => a.id).join(",");

    async function fetchSparklines() {
      try {
        const res = await fetch(`/api/financial-products/assets/sparklines?assetIds=${assetIds}`);
        if (!res.ok) return;
        const json: { data: SparklineData[] } = await res.json();
        if (!cancelled) {
          const map = new Map<number, SparklinePoint[]>();
          for (const item of json.data) {
            map.set(item.assetId, item.points);
          }
          setSparklines(map);
        }
      } catch {
        // Sparkline fetch failure is non-critical — flat lines will show
      }
    }

    fetchSparklines();
    return () => { cancelled = true; };
  }, [watchlist]);

  function handleSelect(item: WatchlistAsset) {
    const fullAsset = allAssets.find((a) => a.id === item.id);
    if (fullAsset) onSelect(fullAsset);
  }

  /** Derives 1-month % change from sparkline points (last point's percentChange). */
  function getMonthlyChange(assetId: number): number | null {
    const pts = sparklines.get(assetId);
    if (!pts || pts.length < 2) return null;
    return pts[pts.length - 1]!.percentChange;
  }

  return (
    <div className="flex h-full flex-col rounded-lg border bg-card">
      {/* Panel header: Search */}
      <div className="shrink-0 px-3 pt-3 pb-2">
        <AssetSearch onAssetAdded={onAssetAdded} />
      </div>

      {/* Section label */}
      <div className="shrink-0 flex items-center justify-between px-4 py-1.5">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/60">
          Watchlist
        </span>
        {!loading && watchlist.length > 0 && (
          <span className="text-[11px] tabular-nums text-muted-foreground/50">
            {watchlist.length}
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="mx-3 border-t" />

      {/* Asset list */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-muted-foreground">Loading watchlist…</p>
        </div>
      ) : watchlist.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-muted-foreground text-center">
            No assets in your watchlist. Search above to add some.
          </p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto">
          {watchlist.map((item, idx) => {
            const monthlyChange = getMonthlyChange(item.id);

            return (
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
                  "relative grid cursor-pointer items-center pl-4 pr-3 py-2.5 transition-colors duration-150",
                  "grid-cols-[1fr_80px_105px]",
                  "gap-x-2",
                  idx === watchlist.length - 1 && "rounded-b-lg",
                  item.id === selectedAssetId
                    ? "bg-accent/15"
                    : "hover:bg-muted/50",
                )}
              >
                {/* Selection accent indicator */}
                {item.id === selectedAssetId && (
                  <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-primary" />
                )}

                {/* Column 1: Asset Identity */}
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold leading-tight">
                    {item.name}
                  </p>
                  <p className="mt-1 truncate text-[11px] text-muted-foreground/70 leading-tight">
                    <span className="font-mono">{item.ticker}</span>
                    {" · "}
                    {item.asset_type}
                  </p>
                </div>

                {/* Column 2: Sparkline (fixed 80px × 28px) */}
                <div className="flex items-center justify-center opacity-80">
                  <Sparkline
                    points={sparklines.get(item.id) ?? []}
                    width={80}
                    height={28}
                  />
                </div>

                {/* Column 3: Market Information */}
                <div className="text-right">
                  {item.latestPrice != null ? (
                    <>
                      <p className="text-[13px] font-mono tabular-nums font-semibold leading-tight">
                        {formatPrice(item.latestPrice, item.currency)}
                      </p>
                      {monthlyChange != null ? (
                        <p
                          className={cn(
                            "mt-1 text-[11px] font-mono tabular-nums leading-tight",
                            monthlyChange >= 0
                              ? "text-positive/80"
                              : "text-negative/80",
                          )}
                        >
                          {formatPercent(monthlyChange)}
                        </p>
                      ) : item.dailyChangePercent != null ? (
                        <p
                          className={cn(
                            "mt-1 text-[11px] font-mono tabular-nums leading-tight",
                            item.dailyChangePercent >= 0
                              ? "text-positive/80"
                              : "text-negative/80",
                          )}
                        >
                          {formatPercent(item.dailyChangePercent)}
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">—</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
