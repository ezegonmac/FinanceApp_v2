'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatYearMonth } from "@repo/utils";
import ErrorMessage from "../ErrorMessage";

type Props = {
  income: {
    id: number;
    account_id: number;
    description: string | null;
    amount: string | number;
    month: {
      year: number;
      month: number;
    };
  };
};

export default function EditIncomeForm({ income }: Props) {
  const router = useRouter();
  const [description, setDescription] = useState(income.description ?? "");
  const [amount, setAmount] = useState(String(income.amount));
  const [year, setYear] = useState(income.month.year);
  const [month, setMonth] = useState(income.month.month);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    if (!description.trim()) {
      setError("Description cannot be empty");
      setSaving(false);
      return;
    }

    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError("Amount must be greater than zero");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch(`/api/incomes/${income.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          amount: parseFloat(amount),
          year,
          month,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update income");
      }

      router.back();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        marginTop: "1rem",
        padding: "1rem",
        border: "1px solid #ccc",
        borderRadius: "5px",
        gap: "0.75rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        maxWidth: "48rem",
      }}
    >
      {error && <ErrorMessage message={error} />}
      <p style={{ fontWeight: "bold" }}>Edit income:</p>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <span>Description</span>
          <input
            type="text"
            style={{ width: "20em" }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter income description"
            disabled={saving}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <span>Amount</span>
          <input
            type="number"
            style={{ width: "10em" }}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            disabled={saving}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <span>Month</span>
          <input
            type="month"
            style={{ width: "10em" }}
            value={formatYearMonth(year, month)}
            onChange={(e) => {
              const [nextYear, nextMonth] = e.target.value.split("-");
              setYear(Number(nextYear));
              setMonth(Number(nextMonth));
            }}
            disabled={saving}
          />
        </label>
      </div>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button type="button" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
        <button type="button" onClick={() => router.back()} disabled={saving}>
          Cancel
        </button>
      </div>
    </div>
  );
}
