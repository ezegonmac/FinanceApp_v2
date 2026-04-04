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
  const [kind, setKind] = useState<"FIXED" | "VARIABLE">("FIXED");
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
          analytics_amount: analyticsAmount && analyticsAmount !== amount ? parseFloat(analyticsAmount) : undefined,
          kind,
          start_month: startMonth || undefined,
          end_month: endMonth || undefined,
        }),
      });

      if (!response.ok) throw new Error("Failed to add recurrent expense");

      setDescription("");
      setAmount("");
      setAnalyticsAmount("");
      setStartMonth("");
      setEndMonth("");
      setKind("FIXED");
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
        <label htmlFor="recurrent-expense-analytics" className="text-sm font-medium">
          Analytics amount (optional)
        </label>
        <Input
          id="recurrent-expense-analytics"
          type="number"
          inputMode="decimal"
          value={analyticsAmount}
          onChange={(e) => setAnalyticsAmount(e.target.value)}
          placeholder="Analytics Amt"
          disabled={adding}
          title="Analytics amount (used for expense metrics, defaults to amount)"
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="recurrent-expense-kind" className="text-sm font-medium">
          Type
        </label>
        <select
          id="recurrent-expense-kind"
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          value={kind}
          onChange={(e) => setKind(e.target.value as "FIXED" | "VARIABLE")}
          disabled={adding}
        >
          <option value="FIXED">Fixed</option>
          <option value="VARIABLE">Variable</option>
        </select>
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
