'use client';

import { useEffect, useState } from "react";

import { formatYearMonth } from "@repo/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import ErrorMessage from "../ErrorMessage";

type Props = {
  accountId: number;
  onAdded: () => void;
  onCancel?: () => void;
};

type AccountOption = {
  id: number;
  name: string;
  active: boolean;
};

export default function AddTransactionForm({ accountId, onAdded, onCancel }: Props) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [automated, setAutomated] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);

  useEffect(() => {
    void fetchAccounts();
  }, [accountId]);

  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/accounts");
      if (!response.ok) throw new Error("Failed to fetch accounts");
      const data = (await response.json()) as AccountOption[];
      const activeAccounts = data.filter((account) => account.active);
      setAccounts(activeAccounts);

      const firstDestination = activeAccounts.find((account) => account.id !== accountId);
      if (firstDestination) {
        setToAccountId(String(firstDestination.id));
      }
    } catch {
      setError("Failed to fetch accounts");
    }
  };

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
    if (!toAccountId.trim() || isNaN(Number(toAccountId))) {
      setError("Please select a destination account");
      setAdding(false);
      return;
    }
    if (Number(toAccountId) === accountId) {
      setError("To Account Id cannot be the same as the source account");
      setAdding(false);
      return;
    }

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          amount: parseFloat(amount),
          automated,
          year,
          month,
          from_account_id: accountId,
          to_account_id: parseInt(toAccountId),
        }),
      });
      if (!response.ok) throw new Error("Failed to add transaction");
      setDescription("");
      setAmount("");
      setToAccountId("");
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
        <label htmlFor="transaction-description" className="text-sm font-medium">
          Description
        </label>
        <Input
          id="transaction-description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Transfer to savings, move to broker..."
          disabled={adding}
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="transaction-amount" className="text-sm font-medium">
            Amount (EUR)
          </label>
          <Input
            id="transaction-amount"
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0 EUR"
            disabled={adding}
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="transaction-to-account" className="text-sm font-medium">
            Destination account
          </label>
          <select
            id="transaction-to-account"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            value={toAccountId}
            onChange={(e) => setToAccountId(e.target.value)}
            disabled={adding || accounts.length === 0}
          >
            <option value="">Select destination account</option>
            {accounts
              .filter((account) => account.id !== accountId)
              .map((account) => (
                <option key={account.id} value={String(account.id)}>
                  {account.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      <div className="grid gap-2">
        <label htmlFor="transaction-month" className="text-sm font-medium">
          Month
        </label>
        <Input
          id="transaction-month"
          type="month"
          value={formatYearMonth(year, month)}
          onChange={(e) => {
            const [y, m] = e.target.value.split("-");
            setYear(Number(y));
            setMonth(Number(m));
          }}
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

      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={adding}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={adding}>
          {adding ? "Adding..." : "Add transaction"}
        </Button>
      </div>
    </form>
  );
}
