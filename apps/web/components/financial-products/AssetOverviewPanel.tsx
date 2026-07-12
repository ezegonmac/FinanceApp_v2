'use client';

import { useEffect, useState } from "react";
import type { Asset } from "@repo/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type PositionSummary = {
  total_units: string;
  total_invested: string;
  current_value: string | null;
  latest_price: string | null;
  latest_price_at: string | null;
};

type Props = {
  asset: Asset | null;
  isFavorite: boolean;
  onToggleWatchlist: () => void;
};

function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatUnits(value: string): string {
  const num = parseFloat(value);
  if (num % 1 === 0) return num.toString();
  return num.toFixed(6).replace(/0+$/, "");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function AssetOverviewPanel({ asset, isFavorite, onToggleWatchlist }: Props) {
  const [position, setPosition] = useState<PositionSummary | null>(null);
  const [loadingPosition, setLoadingPosition] = useState(false);

  useEffect(() => {
    if (!asset) {
      setPosition(null);
      return;
    }

    const controller = new AbortController();
    setLoadingPosition(true);

    async function fetchPosition() {
      try {
        const res = await fetch(
          `/api/financial-products/assets/${asset!.id}/position`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error();
        const json: PositionSummary = await res.json();
        setPosition(json);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setPosition(null);
      } finally {
        setLoadingPosition(false);
      }
    }

    fetchPosition();
    return () => { controller.abort(); };
  }, [asset?.id]);

  if (!asset) return null;

  const currentPrice = position?.latest_price ? parseFloat(position.latest_price) : null;
  const totalInvested = position ? parseFloat(position.total_invested) : null;
  const currentValue = position?.current_value ? parseFloat(position.current_value) : null;
  const totalUnits = position ? parseFloat(position.total_units) : 0;

  let pnl: number | null = null;
  let pnlPercent: number | null = null;
  if (currentValue != null && totalInvested != null && totalInvested > 0) {
    pnl = currentValue - totalInvested;
    pnlPercent = (pnl / totalInvested) * 100;
  }

  return (
    <div className="space-y-3">
      {/* Row 1: Identity + Price + Watchlist action */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold truncate">{asset.name}</h3>
            <Badge variant="secondary" className="text-[10px] shrink-0">{asset.asset_type}</Badge>
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
            <span className="font-mono">{asset.ticker}</span>
            <span>·</span>
            <span>{asset.currency}</span>
            <span>·</span>
            <span>{asset.price_frequency === "DAILY" ? "Daily" : "Intraday"}</span>
            {asset.isin && (
              <>
                <span>·</span>
                <span className="font-mono">{asset.isin}</span>
              </>
            )}
          </div>
        </div>

        {/* Price block */}
        {!loadingPosition && currentPrice != null && (
          <div className="text-right shrink-0">
            <p className="text-lg font-semibold tabular-nums">
              {formatCurrency(currentPrice, asset.currency)}
            </p>
            {position?.latest_price_at && (
              <p className="text-[11px] text-muted-foreground">
                {formatDate(position.latest_price_at)}
              </p>
            )}
          </div>
        )}

        <Button
          variant={isFavorite ? "outline" : "default"}
          size="sm"
          onClick={onToggleWatchlist}
          className="shrink-0"
        >
          {isFavorite ? "Remove" : "Watchlist"}
        </Button>
      </div>

      {/* Row 2: Position metrics (inline, compact) */}
      {!loadingPosition && position && totalUnits > 0 && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
          <Metric label="Units" value={formatUnits(position.total_units)} />
          <Metric
            label="Invested"
            value={totalInvested != null ? formatCurrency(totalInvested, asset.currency) : "—"}
          />
          <Metric
            label="Value"
            value={currentValue != null ? formatCurrency(currentValue, asset.currency) : "—"}
          />
          {pnl != null && pnlPercent != null && (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">P&L</span>
              <span
                className={`font-mono tabular-nums font-medium ${
                  pnl >= 0 ? "text-positive" : "text-negative"
                }`}
              >
                {pnl >= 0 ? "+" : ""}
                {formatCurrency(pnl, asset.currency)} ({pnlPercent >= 0 ? "+" : ""}{pnlPercent.toFixed(1)}%)
              </span>
            </div>
          )}
        </div>
      )}

      {loadingPosition && (
        <p className="text-[11px] text-muted-foreground">Loading…</p>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono tabular-nums font-medium">{value}</span>
    </div>
  );
}
