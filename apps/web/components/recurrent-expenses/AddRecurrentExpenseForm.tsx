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

export default function AddRecurrentExpenseForm({ onAdded }: Props) {
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
      <p style={{ fontWeight: "bold" }}>Add recurrent expense:</p>

      <div>
        <select
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
        &nbsp;
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
        &nbsp;
        <input
          type="number"
          style={{ width: "10em" }}
          value={analyticsAmount}
          onChange={(e) => setAnalyticsAmount(e.target.value)}
          placeholder="Analytics Amt"
          disabled={adding}
          title="Analytics amount (used for expense metrics, defaults to amount)"
        />
      </div>

      <div>
        <label>
          Type:&nbsp;
          <select value={kind} onChange={(e) => setKind(e.target.value as "FIXED" | "VARIABLE")} disabled={adding}>
            <option value="FIXED">Fixed</option>
            <option value="VARIABLE">Variable</option>
          </select>
        </label>
        &nbsp;&nbsp;
        <label>
          Start month:&nbsp;
          <input type="month" value={startMonth} onChange={(e) => setStartMonth(e.target.value)} disabled={adding} />
        </label>
        &nbsp;&nbsp;
        <label>
          End month:&nbsp;
          <input type="month" value={endMonth} onChange={(e) => setEndMonth(e.target.value)} disabled={adding} />
        </label>
      </div>

      <button onClick={handleAdd} disabled={adding || loadingAccounts || accounts.length === 0}>
        {adding ? "Adding..." : "Add Recurrent Expense"}
      </button>
    </div>
  );
}
