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
