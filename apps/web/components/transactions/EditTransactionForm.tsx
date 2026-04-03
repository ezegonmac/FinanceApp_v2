'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatYearMonth } from "@repo/utils";
import ErrorMessage from "../ErrorMessage";

type AccountOption = {
  id: number;
  name: string;
  active: boolean;
};

type Props = {
  transaction: {
    id: number;
    description: string | null;
    amount: string | number;
    from_account_id: number;
    to_account_id: number;
    month: {
      year: number;
      month: number;
    };
  };
  accounts: AccountOption[];
};

export default function EditTransactionForm({ transaction, accounts }: Props) {
  const router = useRouter();
  const [description, setDescription] = useState(transaction.description ?? "");
  const [amount, setAmount] = useState(String(transaction.amount));
  const [fromAccountId, setFromAccountId] = useState(String(transaction.from_account_id));
  const [toAccountId, setToAccountId] = useState(String(transaction.to_account_id));
  const [year, setYear] = useState(transaction.month.year);
  const [month, setMonth] = useState(transaction.month.month);
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

    if (!fromAccountId || !toAccountId) {
      setError("Please select both accounts");
      setSaving(false);
      return;
    }

    if (fromAccountId === toAccountId) {
      setError("Source and destination accounts must be different");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch(`/api/transactions/${transaction.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          amount: parseFloat(amount),
          from_account_id: Number(fromAccountId),
          to_account_id: Number(toAccountId),
          year,
          month,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update transaction");
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
        maxWidth: "64rem",
      }}
    >
      {error && <ErrorMessage message={error} />}
      <p style={{ fontWeight: "bold" }}>Edit transaction:</p>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <span>Description</span>
          <input
            type="text"
            style={{ width: "20em" }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter transaction description"
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
          <span>From Account</span>
          <select
            style={{ width: "14em" }}
            value={fromAccountId}
            onChange={(e) => setFromAccountId(e.target.value)}
            disabled={saving}
          >
            {accounts.map((account) => (
              <option key={account.id} value={String(account.id)}>
                {account.name}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <span>To Account</span>
          <select
            style={{ width: "14em" }}
            value={toAccountId}
            onChange={(e) => setToAccountId(e.target.value)}
            disabled={saving}
          >
            {accounts.map((account) => (
              <option key={account.id} value={String(account.id)}>
                {account.name}
              </option>
            ))}
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
