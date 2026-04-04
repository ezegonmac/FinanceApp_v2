'use client';

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import ErrorMessage from "../ErrorMessage";

type Props = {
  accountId: number;
  onAdded: () => void;
  onCancel?: () => void;
};

export default function AddExpenseForm({ accountId, onAdded, onCancel }: Props) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [analyticsAmount, setAnalyticsAmount] = useState("");
  const [adjustAnalytics, setAdjustAnalytics] = useState(false);
  const [kind, setKind] = useState<"FIXED" | "VARIABLE">("FIXED");
  const [automated, setAutomated] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAnalyticsAmount(amount);
  }, [amount]);

  const handleAdd = async () => {
    setAdding(true);
    setError(null);

    if (!description.trim()) {
      setError("Description cannot be empty");
      setAdding(false);
      return;
    }

    if (!amount.trim() || isNaN(Number(amount))) {
      setError("Amount must be a valid number");
      setAdding(false);
      return;
    }

    if (Number(amount) <= 0) {
      setError("Amount must be greater than zero");
      setAdding(false);
      return;
    }

    try {
      const response = await fetch(`/api/accounts/${accountId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          amount: parseFloat(amount),
          analytics_amount: adjustAnalytics && analyticsAmount && analyticsAmount !== amount ? parseFloat(analyticsAmount) : undefined,
          kind,
          automated,
          year,
          month,
        }),
      });

      if (!response.ok) throw new Error("Failed to add expense");

      setDescription("");
      setAmount("");
      setAnalyticsAmount("");
      setAdjustAnalytics(false);
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
        <label htmlFor="expense-description" className="text-sm font-medium">
          Description
        </label>
        <Input
          id="expense-description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Rent, groceries, transport..."
          disabled={adding}
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="expense-amount" className="text-sm font-medium">
            Amount (EUR)
          </label>
          <Input
            id="expense-amount"
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0 EUR"
            disabled={adding}
          />
        </div>
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
            <label htmlFor="expense-analytics-amount" className="text-sm font-medium">
              Analytics amount (EUR)
            </label>
            <Input
              id="expense-analytics-amount"
              type="number"
              inputMode="decimal"
              value={analyticsAmount}
              onChange={(e) => setAnalyticsAmount(e.target.value)}
              placeholder="Optional"
              disabled={adding}
              title="Analytics amount (used for expense metrics, defaults to amount)"
            />
          </div>
        ) : null}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
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
          <label htmlFor="expense-month" className="text-sm font-medium">
            Month
          </label>
          <Input
            id="expense-month"
            type="month"
            value={`${year}-${String(month).padStart(2, "0")}`}
            onChange={(e) => {
              const [y, m] = e.target.value.split("-");
              setYear(Number(y));
              setMonth(Number(m));
            }}
            disabled={adding}
          />
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

      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={adding}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={adding}>
          {adding ? "Adding..." : "Add expense"}
        </Button>
      </div>
    </form>
  );
}
