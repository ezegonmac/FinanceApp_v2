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

type Props = {
  onAdded: () => void;
  onCancel?: () => void;
};

export default function AddRecurrentExpenseForm({ onAdded, onCancel }: Props) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [analyticsAmount, setAnalyticsAmount] = useState("");
  const [adjustAnalytics, setAdjustAnalytics] = useState(false);
  const [kind, setKind] = useState<"FIXED" | "VARIABLE">("FIXED");
  const [automated, setAutomated] = useState(true);
  const [startMonth, setStartMonth] = useState("");
  const [endMonth, setEndMonth] = useState("");
  const [adding, setAdding] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAnalyticsAmount(amount);
  }, [amount]);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await fetch("/api/accounts");
        if (!response.ok) throw new Error("Failed to fetch accounts");
        const allAccounts: Account[] = await response.json();
        const activeAccounts = allAccounts.filter((a) => a.active);
        setAccounts(activeAccounts);
        if (activeAccounts.length > 0) {
          setAccountId(String(activeAccounts[0]!.id));
        }
      } catch {
        setError("Failed to load accounts");
      } finally {
        setLoadingAccounts(false);
      }
    };

    fetchAccounts();
  }, []);

  const handleAdd = async () => {
    setAdding(true);
    setError(null);

    if (!accountId) {
      setError("Please select an account");
      setAdding(false);
      return;
    }

    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError("Amount must be greater than zero");
      setAdding(false);
      return;
    }

    try {
      const response = await fetch(`/api/accounts/${accountId}/recurrent-expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim() || undefined,
          amount: parseFloat(amount),
          analytics_amount: adjustAnalytics && analyticsAmount && analyticsAmount !== amount ? parseFloat(analyticsAmount) : undefined,
          kind,
          automated,
          start_month: startMonth || undefined,
          end_month: endMonth || undefined,
        }),
      });

      if (!response.ok) throw new Error("Failed to add recurrent expense");

      setDescription("");
      setAmount("");
      setAnalyticsAmount("");
      setAdjustAnalytics(false);
      setStartMonth("");
      setEndMonth("");
      setKind("FIXED");
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
        <label htmlFor="recurrent-expense-account" className="text-sm font-medium">
          Account
        </label>
        <select
          id="recurrent-expense-account"
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          disabled={adding || loadingAccounts || accounts.length === 0}
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
        <label htmlFor="recurrent-expense-description" className="text-sm font-medium">
          Description
        </label>
        <Input
          id="recurrent-expense-description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          disabled={adding}
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="recurrent-expense-amount" className="text-sm font-medium">
          Amount (EUR)
        </label>
        <Input
          id="recurrent-expense-amount"
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          disabled={adding}
        />
      </div>

      <div className="grid gap-2">
        <label className="inline-flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={adjustAnalytics}
            onChange={(e) => {
              const checked = e.target.checked;
              setAdjustAnalytics(checked);
              if (checked) setAnalyticsAmount(amount);
            }}
            disabled={adding}
          />
          Use a different amount for analytics
        </label>
        {adjustAnalytics ? (
          <div className="grid gap-2 sm:max-w-xs">
            <label htmlFor="recurrent-expense-analytics" className="text-sm font-medium">
              Analytics amount (optional)
            </label>
            <Input
              id="recurrent-expense-analytics"
              type="number"
              inputMode="decimal"
              value={analyticsAmount}
              onChange={(e) => setAnalyticsAmount(e.target.value)}
              placeholder="Analytics amount"
              disabled={adding}
              title="Analytics amount (used for expense metrics, defaults to amount)"
            />
          </div>
        ) : null}
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium">
          Type
        </label>
        <div className="flex gap-2">
          {([
            { value: "FIXED", label: "Fixed" },
            { value: "VARIABLE", label: "Variable" },
          ] as const).map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setKind(value)}
              disabled={adding}
              className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                kind === value
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
                <li>Automatic: used when the movement happens automatically every month.</li>
                <li>Manual: used when the movement requires your action each month, then you mark it as done in Todos.</li>
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
        <label htmlFor="recurrent-expense-start-month" className="text-sm font-medium">
          Start month
        </label>
        <Input
          id="recurrent-expense-start-month"
          type="month"
          value={startMonth}
          onChange={(e) => setStartMonth(e.target.value)}
          disabled={adding}
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="recurrent-expense-end-month" className="text-sm font-medium">
          End month (optional)
        </label>
        <Input
          id="recurrent-expense-end-month"
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
        <Button type="submit" disabled={adding || loadingAccounts || accounts.length === 0}>
          {adding ? "Adding..." : "Add recurrent expense"}
        </Button>
      </div>
    </form>
  );
}
