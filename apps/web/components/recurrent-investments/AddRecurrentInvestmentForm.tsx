'use client';

import { useEffect, useState } from "react";
import ErrorMessage from "../ErrorMessage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Account = {
  id: number;
  name: string;
  active: boolean;
};

type Asset = {
  id: number;
  name: string;
  ticker: string;
};

type Props = {
  onAdded: () => void;
  onCancel?: () => void;
};

export default function AddRecurrentInvestmentForm({ onAdded, onCancel }: Props) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [accountId, setAccountId] = useState("");
  const [assetId, setAssetId] = useState("");
  const [type, setType] = useState<"BUY" | "SELL">("BUY");
  const [totalAmount, setTotalAmount] = useState("");
  const [description, setDescription] = useState("");
  const [automated, setAutomated] = useState(true);
  const [startMonth, setStartMonth] = useState("");
  const [endMonth, setEndMonth] = useState("");
  const [adding, setAdding] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accountsRes, assetsRes] = await Promise.all([
          fetch("/api/accounts"),
          fetch("/api/financial-products/assets"),
        ]);

        if (!accountsRes.ok) throw new Error("Failed to fetch accounts");
        if (!assetsRes.ok) throw new Error("Failed to fetch assets");

        const allAccounts: Account[] = await accountsRes.json();
        const activeAccounts = allAccounts.filter((a) => a.active);
        setAccounts(activeAccounts);
        if (activeAccounts.length > 0) {
          setAccountId(String(activeAccounts[0]!.id));
        }

        const allAssets: Asset[] = await assetsRes.json();
        setAssets(allAssets);
        if (allAssets.length > 0) {
          setAssetId(String(allAssets[0]!.id));
        }
      } catch {
        setError("Failed to load data");
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  const handleAdd = async () => {
    setAdding(true);
    setError(null);

    if (!accountId) {
      setError("Please select an account");
      setAdding(false);
      return;
    }

    if (!assetId) {
      setError("Please select an asset");
      setAdding(false);
      return;
    }

    if (!totalAmount.trim() || isNaN(Number(totalAmount)) || Number(totalAmount) <= 0) {
      setError("Amount must be greater than zero");
      setAdding(false);
      return;
    }

    try {
      const response = await fetch(`/api/accounts/${accountId}/recurrent-investments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset_id: parseInt(assetId, 10),
          type,
          total_amount: parseFloat(totalAmount),
          description: description.trim() || undefined,
          automated,
          start_month: startMonth || undefined,
          end_month: endMonth || undefined,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to add recurrent investment");
      }

      setDescription("");
      setTotalAmount("");
      setStartMonth("");
      setEndMonth("");
      setType("BUY");
      setAutomated(true);
      onAdded();
      onCancel?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setAdding(false);
    }
  };

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void handleAdd();
      }}
    >
      {error && <ErrorMessage message={error} />}

      <div className="grid gap-2">
        <label htmlFor="recurrent-investment-account" className="text-sm font-medium">
          Account
        </label>
        <select
          id="recurrent-investment-account"
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          disabled={adding || loadingData || accounts.length === 0}
        >
          {accounts.length === 0 ? (
            <option value="">No active accounts</option>
          ) : (
            accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))
          )}
        </select>
      </div>

      <div className="grid gap-2">
        <label htmlFor="recurrent-investment-asset" className="text-sm font-medium">
          Asset
        </label>
        <select
          id="recurrent-investment-asset"
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          value={assetId}
          onChange={(e) => setAssetId(e.target.value)}
          disabled={adding || loadingData || assets.length === 0}
        >
          {assets.length === 0 ? (
            <option value="">No assets available</option>
          ) : (
            assets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.ticker} — {asset.name}
              </option>
            ))
          )}
        </select>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium">Operation type</label>
        <div className="flex gap-2">
          {([
            { value: "BUY", label: "Buy" },
            { value: "SELL", label: "Sell" },
          ] as const).map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setType(value)}
              disabled={adding}
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
        <label htmlFor="recurrent-investment-amount" className="text-sm font-medium">
          Monthly amount (EUR)
        </label>
        <Input
          id="recurrent-investment-amount"
          type="number"
          inputMode="decimal"
          value={totalAmount}
          onChange={(e) => setTotalAmount(e.target.value)}
          placeholder="Amount to invest each month"
          disabled={adding}
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="recurrent-investment-description" className="text-sm font-medium">
          Description
        </label>
        <Input
          id="recurrent-investment-description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          disabled={adding}
        />
      </div>

      <div className="grid gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium">Mode</span>
          <span className="group relative inline-flex items-center">
            <button
              type="button"
              aria-label="Mode info"
              className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-muted-foreground/40 text-[10px] font-semibold text-muted-foreground"
            >
              i
            </button>
            <span className="pointer-events-none absolute left-1/2 top-6 z-20 w-72 -translate-x-1/2 rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              <p className="font-medium">How to choose:</p>
              <ul className="mt-1 list-disc pl-4 text-[11px] leading-relaxed">
                <li>Automatic: the investment is applied by the daily job each month.</li>
                <li>Manual: shows in Todos for you to confirm each month.</li>
              </ul>
            </span>
          </span>
        </div>
        <div className="flex gap-2">
          {([{ value: true, label: "Automatic" }, { value: false, label: "Manual" }] as const).map(({ value, label }) => (
            <button
              key={label}
              type="button"
              onClick={() => setAutomated(value)}
              disabled={adding}
              className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                automated === value
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
        <label htmlFor="recurrent-investment-start-month" className="text-sm font-medium">
          Start month
        </label>
        <Input
          id="recurrent-investment-start-month"
          type="month"
          value={startMonth}
          onChange={(e) => setStartMonth(e.target.value)}
          disabled={adding}
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="recurrent-investment-end-month" className="text-sm font-medium">
          End month (optional)
        </label>
        <Input
          id="recurrent-investment-end-month"
          type="month"
          value={endMonth}
          onChange={(e) => setEndMonth(e.target.value)}
          disabled={adding}
        />
      </div>

      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={adding}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={adding || loadingData || accounts.length === 0 || assets.length === 0}>
          {adding ? "Adding..." : "Add recurrent investment"}
        </Button>
      </div>
    </form>
  );
}
