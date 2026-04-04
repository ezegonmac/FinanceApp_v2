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

export default function AddRecurrentTransactionForm({ onAdded, onCancel }: Props) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [automated, setAutomated] = useState(true);
  const [startMonth, setStartMonth] = useState("");
  const [endMonth, setEndMonth] = useState("");
  const [adding, setAdding] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await fetch("/api/accounts");
        if (!response.ok) throw new Error("Failed to fetch accounts");
        const allAccounts: Account[] = await response.json();
        const activeAccounts = allAccounts.filter((a) => a.active);
        setAccounts(activeAccounts);
        if (activeAccounts.length > 0) {
          setFromAccountId(String(activeAccounts[0]!.id));
          setToAccountId(String(activeAccounts.length > 1 ? activeAccounts[1]!.id : activeAccounts[0]!.id));
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

    if (!fromAccountId || !toAccountId) {
      setError("Please select both accounts");
      setAdding(false);
      return;
    }

    if (fromAccountId === toAccountId) {
      setError("From and To accounts must be different");
      setAdding(false);
      return;
    }

    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError("Amount must be greater than zero");
      setAdding(false);
      return;
    }

    try {
      const response = await fetch(`/api/accounts/${fromAccountId}/recurrent-transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to_account_id: parseInt(toAccountId),
          description: description.trim() || undefined,
          amount: parseFloat(amount),
          automated,
          start_month: startMonth || undefined,
          end_month: endMonth || undefined,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const details = payload?.details || payload?.error || "Failed to add recurrent transaction";
        throw new Error(details);
      }

      setDescription("");
      setAmount("");
      setStartMonth("");
      setEndMonth("");
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
        <label htmlFor="recurrent-transaction-from" className="text-sm font-medium">
          From account
        </label>
        <select
          id="recurrent-transaction-from"
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          value={fromAccountId}
          onChange={(e) => setFromAccountId(e.target.value)}
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
        <label htmlFor="recurrent-transaction-to" className="text-sm font-medium">
          To account
        </label>
        <select
          id="recurrent-transaction-to"
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          value={toAccountId}
          onChange={(e) => setToAccountId(e.target.value)}
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
        <label htmlFor="recurrent-transaction-description" className="text-sm font-medium">
          Description
        </label>
        <Input
          id="recurrent-transaction-description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          disabled={adding}
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="recurrent-transaction-amount" className="text-sm font-medium">
          Amount (EUR)
        </label>
        <Input
          id="recurrent-transaction-amount"
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
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
        <label htmlFor="recurrent-transaction-start-month" className="text-sm font-medium">
          Start month
        </label>
        <Input
          id="recurrent-transaction-start-month"
          type="month"
          value={startMonth}
          onChange={(e) => setStartMonth(e.target.value)}
          disabled={adding}
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="recurrent-transaction-end-month" className="text-sm font-medium">
          End month (optional)
        </label>
        <Input
          id="recurrent-transaction-end-month"
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
          {adding ? "Adding..." : "Add recurrent transaction"}
        </Button>
      </div>
    </form>
  );
}
