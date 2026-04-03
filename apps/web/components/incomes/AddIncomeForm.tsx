'use client';

import { useState } from "react";
import ErrorMessage from "../ErrorMessage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  accountId: number;
  onAdded: () => void;
  onCancel?: () => void;
};

export default function AddIncomeForm({ accountId, onAdded, onCancel }: Props) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const response = await fetch(`/api/accounts/${accountId}/incomes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, amount: parseFloat(amount), year, month }),
      });
      if (!response.ok) throw new Error("Failed to add income");
      setDescription("");
      setAmount("");
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
        <label htmlFor="income-description" className="text-sm font-medium">
          Description
        </label>
        <Input
          id="income-description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Salary, bonus, interest..."
          disabled={adding}
        />
      </div>
      <div className="grid gap-2">
        <label htmlFor="income-amount" className="text-sm font-medium">
          Amount (EUR)
        </label>
        <Input
          id="income-amount"
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0 EUR"
          disabled={adding}
        />
      </div>
      <div className="grid gap-2">
        <label htmlFor="income-month" className="text-sm font-medium">
          Month
        </label>
        <Input
          id="income-month"
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
      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={adding}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={adding}>
          {adding ? "Adding..." : "Add income"}
        </Button>
      </div>
    </form>
  );
}
