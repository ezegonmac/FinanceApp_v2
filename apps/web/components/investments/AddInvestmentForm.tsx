'use client';

import { useEffect, useState, useCallback } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import ErrorMessage from "../ErrorMessage";

type Asset = {
  id: number;
  ticker: string;
  name: string;
  asset_type: string;
  currency: string;
  price_frequency: "DAILY" | "INTRADAY";
};

type InputMode = "manual" | "amount";

type Props = {
  accountId: number;
  onAdded: () => void;
  onCancel?: () => void;
};

export default function AddInvestmentForm({ accountId, onAdded, onCancel }: Props) {
  const [assetId, setAssetId] = useState<number | null>(null);
  const [type, setType] = useState<"BUY" | "SELL">("BUY");
  const [inputMode, setInputMode] = useState<InputMode>("amount");
  // Manual mode fields
  const [units, setUnits] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  // Amount mode field
  const [totalAmount, setTotalAmount] = useState("");
  // Shared fields
  const [executedAt, setExecutedAt] = useState(() => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  });
  const [description, setDescription] = useState("");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(true);
  const [assetsError, setAssetsError] = useState<string | null>(null);

  // Derive whether selected asset uses intraday pricing
  const selectedAsset = assets.find((a) => a.id === assetId) ?? null;
  const isIntraday = selectedAsset?.price_frequency === "INTRADAY";

  // Price preview for amount mode
  const [previewPrice, setPreviewPrice] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // When the user switches asset, convert executedAt between date ↔ datetime format
  useEffect(() => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    if (isIntraday && !executedAt.includes("T")) {
      // Upgrade date-only → datetime-local (append current time)
      const now = new Date();
      setExecutedAt(`${executedAt}T${pad(now.getHours())}:${pad(now.getMinutes())}`);
    } else if (!isIntraday && executedAt.includes("T")) {
      // Downgrade datetime → date-only (strip time part)
      setExecutedAt(executedAt.split("T")[0]!);
    }
  }, [isIntraday]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const fetchAssets = async () => {
      setAssetsLoading(true);
      setAssetsError(null);
      try {
        const response = await fetch("/api/financial-products/assets");
        if (!response.ok) throw new Error("Failed to load assets");
        const data = await response.json();
        setAssets(data);
      } catch (err) {
        setAssetsError(err instanceof Error ? err.message : "Could not load assets");
      } finally {
        setAssetsLoading(false);
      }
    };
    void fetchAssets();
  }, []);

  // Fetch price preview when asset, date, or input mode changes
  const fetchPricePreview = useCallback(async () => {
    if (inputMode !== "amount" || !assetId || !executedAt) {
      setPreviewPrice(null);
      return;
    }
    setPreviewLoading(true);
    try {
      const response = await fetch(
        `/api/accounts/${accountId}/investments/price-check?asset_id=${assetId}&date=${executedAt}`
      );
      if (response.ok) {
        const data = await response.json();
        setPreviewPrice(data.price);
      } else {
        setPreviewPrice(null);
      }
    } catch {
      setPreviewPrice(null);
    } finally {
      setPreviewLoading(false);
    }
  }, [inputMode, assetId, executedAt, accountId]);

  useEffect(() => {
    void fetchPricePreview();
  }, [fetchPricePreview]);

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);

    if (assetId === null) {
      setError("Please select an asset");
      setSubmitting(false);
      return;
    }

    if (!executedAt) {
      setError("Please select a date for the operation");
      setSubmitting(false);
      return;
    }

    if (inputMode === "manual") {
      const parsedUnits = parseFloat(units);
      if (!units.trim() || isNaN(parsedUnits) || parsedUnits <= 0) {
        setError("Units must be a positive number");
        setSubmitting(false);
        return;
      }

      const parsedUnitPrice = parseFloat(unitPrice);
      if (!unitPrice.trim() || isNaN(parsedUnitPrice) || parsedUnitPrice <= 0) {
        setError("Unit price must be a positive number");
        setSubmitting(false);
        return;
      }
    } else {
      const parsedAmount = parseFloat(totalAmount);
      if (!totalAmount.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
        setError("Amount must be a positive number");
        setSubmitting(false);
        return;
      }
    }

    try {
      // For intraday assets, convert datetime-local to full ISO string.
      // For daily assets, send date-only string (API normalizes to midnight UTC).
      const executedAtValue = isIntraday && executedAt.includes("T")
        ? new Date(executedAt).toISOString()
        : executedAt;

      const payload: Record<string, unknown> = {
        asset_id: assetId,
        type,
        executed_at: executedAtValue,
        description: description.trim() || undefined,
        year,
        month,
      };

      if (inputMode === "manual") {
        payload.units = parseFloat(units);
        payload.unit_price = parseFloat(unitPrice);
      } else {
        payload.total_amount = parseFloat(totalAmount);
      }

      const response = await fetch(`/api/accounts/${accountId}/investments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.status === 201) {
        setAssetId(null);
        setType("BUY");
        setInputMode("amount");
        setUnits("");
        setUnitPrice("");
        setTotalAmount("");
        setExecutedAt(() => {
          const now = new Date();
          const pad = (n: number) => n.toString().padStart(2, "0");
          return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
        });
        setDescription("");
        setMonth(new Date().getMonth() + 1);
        setYear(new Date().getFullYear());
        setError(null);
        onAdded();
        onCancel?.();
      } else {
        const body = await response.json().catch(() => null);
        const message = body?.error || body?.message || "Failed to create investment";
        setError(message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit();
      }}
    >
      {error && <ErrorMessage message={error} />}

      <div className="grid gap-2">
        <label htmlFor="investment-asset" className="text-sm font-medium">
          Asset
        </label>
        {assetsLoading ? (
          <p className="text-sm text-muted-foreground">Loading assets...</p>
        ) : assetsError ? (
          <p className="text-sm text-destructive">Could not load assets</p>
        ) : (
          <select
            id="investment-asset"
            value={assetId ?? ""}
            onChange={(e) => setAssetId(e.target.value ? Number(e.target.value) : null)}
            disabled={submitting}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Select an asset...</option>
            {assets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.ticker} — {asset.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium">Type</label>
        <div className="flex gap-2">
          {([
            { value: "BUY", label: "Buy" },
            { value: "SELL", label: "Sell" },
          ] as const).map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setType(value)}
              disabled={submitting}
              className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                type === value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background text-foreground hover:bg-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-2">
        <label htmlFor="investment-date" className="text-sm font-medium">
          {isIntraday ? "Date & Time" : "Date"}
        </label>
        <Input
          id="investment-date"
          type={isIntraday ? "datetime-local" : "date"}
          value={executedAt}
          onChange={(e) => {
            setExecutedAt(e.target.value);
            // Auto-sync month/year from the date
            if (e.target.value) {
              const [y, m] = e.target.value.split("-");
              if (y && m) {
                setYear(Number(y));
                setMonth(Number(m));
              }
            }
          }}
          disabled={submitting}
        />
        {selectedAsset && (
          <p className="text-xs text-muted-foreground">
            {isIntraday
              ? "This asset trades throughout the day — the time determines where the marker appears on the chart."
              : "This asset prices once per day — only the date is needed."}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium">Input mode</label>
        <div className="flex gap-2">
          {([
            { value: "amount", label: "Amount invested" },
            { value: "manual", label: "Units + Price" },
          ] as const).map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setInputMode(value)}
              disabled={submitting}
              className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                inputMode === value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background text-foreground hover:bg-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {inputMode === "manual" ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="grid gap-2">
            <label htmlFor="investment-units" className="text-sm font-medium">
              Units
            </label>
            <Input
              id="investment-units"
              type="number"
              inputMode="decimal"
              step="any"
              value={units}
              onChange={(e) => setUnits(e.target.value)}
              placeholder="0"
              disabled={submitting}
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="investment-unit-price" className="text-sm font-medium">
              Unit Price
            </label>
            <Input
              id="investment-unit-price"
              type="number"
              inputMode="decimal"
              step="any"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              placeholder="0.00"
              disabled={submitting}
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-2">
          <label htmlFor="investment-total-amount" className="text-sm font-medium">
            Amount invested
          </label>
          <Input
            id="investment-total-amount"
            type="number"
            inputMode="decimal"
            step="any"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            placeholder="0.00"
            disabled={submitting}
          />
          {previewLoading ? (
            <p className="text-xs text-muted-foreground">Looking up price...</p>
          ) : previewPrice != null ? (
            <p className="text-xs text-muted-foreground">
              Price on {executedAt}: <span className="font-medium tabular-nums">{previewPrice.toFixed(6)} €</span>
              {totalAmount && parseFloat(totalAmount) > 0 ? (
                <span> → <span className="font-medium tabular-nums">{(parseFloat(totalAmount) / previewPrice).toFixed(6)}</span> units</span>
              ) : null}
            </p>
          ) : assetId && executedAt ? (
            <p className="text-xs text-muted-foreground">No price available for this date.</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Select an asset and date to see the price.
            </p>
          )}
        </div>
      )}

      <div className="grid gap-2">
        <label htmlFor="investment-description" className="text-sm font-medium">
          Description (optional)
        </label>
        <Input
          id="investment-description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Additional notes..."
          disabled={submitting}
        />
      </div>

      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Adding..." : "Add investment"}
        </Button>
      </div>
    </form>
  );
}
