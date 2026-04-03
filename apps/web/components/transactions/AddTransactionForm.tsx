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
