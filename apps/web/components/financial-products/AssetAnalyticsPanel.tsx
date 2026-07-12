'use client';

import { useEffect, useState } from "react";
import type { Asset } from "@repo/db";

type ExposureEntry = {
  categoryName: string;
  percentage: number;
};

type ExposureData = {
  sectors: ExposureEntry[];
  countries: ExposureEntry[];
};

type Props = {
  asset: Asset;
};

/**
 * Dedicated analytics section below the chart.
 * Currently displays sector/country exposure.
 * Designed to scale with additional panels (holdings, dividends, etc.)
 */
export function AssetAnalyticsPanel({ asset }: Props) {
  const [exposure, setExposure] = useState<ExposureData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setExposure(null);

    async function fetchExposure() {
      try {
        const res = await fetch(
          `/api/financial-products/assets/${asset.id}/exposure`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error();
        const json: ExposureData = await res.json();
        setExposure(json);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setExposure(null);
      } finally {
        setLoading(false);
      }
    }

    fetchExposure();
    return () => { controller.abort(); };
  }, [asset.id]);

  const hasExposure = exposure && (exposure.sectors.length > 0 || exposure.countries.length > 0);

  if (loading) {
    return (
      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">Loading analytics…</p>
      </div>
    );
  }

  if (!hasExposure) {
    return null;
  }

  return (
    <div className="rounded-lg border p-5 space-y-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Analytics
      </h3>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {exposure.sectors.length > 0 && (
          <ExposureSection title="Sector Exposure" entries={exposure.sectors} />
        )}
        {exposure.countries.length > 0 && (
          <ExposureSection title="Country Allocation" entries={exposure.countries} />
        )}
      </div>
    </div>
  );
}

function ExposureSection({
  title,
  entries,
}: {
  title: string;
  entries: ExposureEntry[];
}) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-medium text-muted-foreground">{title}</h4>
      <div className="space-y-2">
        {entries.map((entry) => (
          <div key={entry.categoryName} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="truncate">{entry.categoryName}</span>
              <span className="shrink-0 ml-2 font-mono tabular-nums">
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
