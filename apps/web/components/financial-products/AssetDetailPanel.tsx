'use client';

import { useEffect, useState } from "react";
import type { Asset } from "@repo/db";
import { Button } from "@/components/ui/button";

type ExposureEntry = {
  categoryName: string;
  percentage: number;
};

type ExposureData = {
  sectors: ExposureEntry[];
  countries: ExposureEntry[];
};

type Props = {
  asset: Asset | null;
  isFavorite: boolean;
  onToggleWatchlist: () => void;
};

export function AssetDetailPanel({ asset, isFavorite, onToggleWatchlist }: Props) {
  const [data, setData] = useState<ExposureData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!asset) {
      setData(null);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    async function fetchExposure() {
      try {
        const res = await fetch(
          `/api/financial-products/assets/${asset!.id}/exposure`,
          { signal: controller.signal }
        );

        if (!res.ok) {
          throw new Error("Failed to fetch exposure data");
        }

        const json: ExposureData = await res.json();
        setData(json);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError("Failed to load exposure data.");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchExposure();

    return () => {
      controller.abort();
    };
  }, [asset?.id]);

  if (!asset) return null;

  return (
    <div className="rounded-md border p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{asset.name}</h3>
          <p className="text-sm text-muted-foreground">
            {asset.ticker} · {asset.asset_type} · {asset.currency}
          </p>
        </div>
        <Button
          variant={isFavorite ? "outline" : "default"}
          size="sm"
          onClick={onToggleWatchlist}
        >
          {isFavorite ? "Remove from watchlist" : "Add to watchlist"}
        </Button>
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground">Loading exposure…</p>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {!loading && !error && data && (
        <>
          {data.sectors.length === 0 && data.countries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No exposure data available yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {data.sectors.length > 0 && (
                <ExposureBreakdown title="Sector" entries={data.sectors} />
              )}
              {data.countries.length > 0 && (
                <ExposureBreakdown title="Country" entries={data.countries} />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ExposureBreakdown({
  title,
  entries,
}: {
  title: string;
  entries: ExposureEntry[];
}) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
      <div className="space-y-1.5">
        {entries.map((entry) => (
          <div key={entry.categoryName} className="space-y-0.5">
            <div className="flex items-center justify-between text-xs">
              <span className="truncate">{entry.categoryName}</span>
              <span className="shrink-0 ml-2 tabular-nums">
                {entry.percentage.toFixed(1)}%
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(entry.percentage, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
