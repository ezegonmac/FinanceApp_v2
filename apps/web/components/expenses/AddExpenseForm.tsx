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
  const [kind, setKind] = useState<"FIXED" | "VARIABLE">("FIXED");
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
          analytics_amount: analyticsAmount && analyticsAmount !== amount ? parseFloat(analyticsAmount) : undefined,
          kind,
          year,
          month,
        }),
      });

      if (!response.ok) throw new Error("Failed to add expense");

      setDescription("");
      setAmount("");
      setAnalyticsAmount("");
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

        <div className="grid gap-2">
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
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="expense-kind" className="text-sm font-medium">
            Type
          </label>
          <select
            id="expense-kind"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            value={kind}
            onChange={(e) => setKind(e.target.value as "FIXED" | "VARIABLE")}
            disabled={adding}
          >
            <option value="FIXED">Fixed</option>
            <option value="VARIABLE">Variable</option>
          </select>
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
