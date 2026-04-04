'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatYearMonth } from "@repo/utils";
import ErrorMessage from "../ErrorMessage";

type Props = {
  expense: {
    id: number;
    account_id: number;
    description: string | null;
    amount: string | number;
    analytics_amount: string | number | null;
    kind: "FIXED" | "VARIABLE";
    month: {
      year: number;
      month: number;
    };
  };
};

export default function EditExpenseForm({ expense }: Props) {
  const router = useRouter();
  const [description, setDescription] = useState(expense.description ?? "");
  const [amount, setAmount] = useState(String(expense.amount));
  const [adjustAnalytics, setAdjustAnalytics] = useState(
    expense.analytics_amount != null && String(expense.analytics_amount) !== String(expense.amount)
  );
  const [analyticsAmount, setAnalyticsAmount] = useState(
    String(expense.analytics_amount ?? expense.amount)
  );
  const [kind, setKind] = useState<"FIXED" | "VARIABLE">(expense.kind ?? "FIXED");
  const [year, setYear] = useState(expense.month.year);
  const [month, setMonth] = useState(expense.month.month);
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
      const response = await fetch(`/api/expenses/${expense.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          amount: parseFloat(amount),
          analytics_amount:
            adjustAnalytics && analyticsAmount && analyticsAmount !== amount
              ? parseFloat(analyticsAmount)
              : undefined,
          kind,
          year,
          month,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update expense");
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
        maxWidth: "56rem",
      }}
    >
      {error && <ErrorMessage message={error} />}
      <p style={{ fontWeight: "bold" }}>Edit expense:</p>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <span>Description</span>
          <input
            type="text"
            style={{ width: "20em" }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter expense description"
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
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <label style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
            <input
              type="checkbox"
              checked={adjustAnalytics}
              onChange={(e) => {
                const checked = e.target.checked;
                setAdjustAnalytics(checked);
                if (checked) setAnalyticsAmount(amount);
              }}
              disabled={saving}
            />
            Use a different amount for analytics
          </label>
          {adjustAnalytics ? (
            <input
              type="number"
              style={{ width: "10em" }}
              value={analyticsAmount}
              onChange={(e) => setAnalyticsAmount(e.target.value)}
              placeholder="Analytics amount"
              disabled={saving}
            />
          ) : null}
        </div>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <span>Type</span>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as "FIXED" | "VARIABLE")}
            disabled={saving}
          >
            <option value="FIXED">Fixed</option>
            <option value="VARIABLE">Variable</option>
          </select>
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
