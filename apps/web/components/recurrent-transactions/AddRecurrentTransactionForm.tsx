'use client';

import { useEffect, useState } from "react";
import ErrorMessage from "../ErrorMessage";

type Account = {
  id: number;
  name: string;
  active: boolean;
};

type Props = {
  onAdded: () => void;
};

export default function AddRecurrentTransactionForm({ onAdded }: Props) {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div
      style={{
        marginTop: "1rem",
        padding: "1rem",
        border: "1px solid #ccc",
        borderRadius: "5px",
        gap: "0.5rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
      }}
    >
      {error && <ErrorMessage message={error} />}
      <p style={{ fontWeight: "bold" }}>Add recurrent transaction:</p>

      <div>
        <label>
          From:&nbsp;
          <select
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
        </label>
        &nbsp;&nbsp;
        <label>
          To:&nbsp;
          <select
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
        </label>
        &nbsp;&nbsp;
        <input
          type="text"
          style={{ width: "20em" }}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          disabled={adding}
        />
        &nbsp;
        <input
          type="number"
          style={{ width: "10em" }}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          disabled={adding}
        />
      </div>

      <div>
        <label>
          Start month:&nbsp;
          <input
            type="month"
            value={startMonth}
            onChange={(e) => setStartMonth(e.target.value)}
            disabled={adding}
          />
        </label>
        &nbsp;&nbsp;
        <label>
          End month (leave blank for no end):&nbsp;
          <input
            type="month"
            value={endMonth}
            onChange={(e) => setEndMonth(e.target.value)}
            disabled={adding}
          />
        </label>
      </div>

      <button onClick={handleAdd} disabled={adding || loadingAccounts || accounts.length === 0}>
        {adding ? "Adding..." : "Add Recurrent Transaction"}
      </button>
    </div>
  );
}
