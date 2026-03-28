'use client';

import { useState } from "react";
import { formatYearMonth } from "@repo/utils";
import ErrorMessage from "../ErrorMessage";

type Props = {
  accountId: number;
  onAdded: () => void;
};

export default function AddIncomeForm({ accountId, onAdded }: Props) {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setAdding(false);
    }
  };

  return (
    <>
      {error && <ErrorMessage message={error} />}
      <p style={{ fontWeight: "bold" }}>Add income:</p>
      <input
        type="text"
        style={{ width: "30em" }}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Enter Income description"
        disabled={adding}
      /> &nbsp;
      <input
        type="number"
        style={{ width: "15em" }}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount"
        disabled={adding}
      /> &nbsp;
      <input
        type="month"
        style={{ width: "20em" }}
        value={formatYearMonth(year, month)}
        onChange={(e) => {
          const [y, m] = e.target.value.split("-");
          setYear(Number(y));
          setMonth(Number(m));
        }}
        disabled={adding}
      /> &nbsp;
      <button onClick={handleAdd} disabled={adding}>
        {adding ? "Adding..." : "Add Income"}
      </button>
    </>
  );
}
