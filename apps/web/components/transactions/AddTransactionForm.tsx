'use client';

import { useEffect, useState } from "react";
import { formatYearMonth } from "@repo/utils";
import ErrorMessage from "../ErrorMessage";

type Props = {
  accountId: number;
  onAdded: () => void;
};

type AccountOption = {
  id: number;
  name: string;
  active: boolean;
};

export default function AddTransactionForm({ accountId, onAdded }: Props) {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setAdding(false);
    }
  };

  return (
    <>
      {error && <ErrorMessage message={error} />}
      <p style={{ fontWeight: "bold" }}>Send Transaction to other Account:</p>
      <input
        type="text"
        style={{ width: "30em" }}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Enter Transaction description"
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
      <select
        style={{ width: "15em" }}
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
      &nbsp;
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
        {adding ? "Adding..." : "Add Transaction"}
      </button>
    </>
  );
}
