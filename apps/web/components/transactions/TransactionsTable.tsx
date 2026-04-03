'use client';

import Link from "next/link";
import { formatYearMonth } from "@repo/utils";
import ErrorMessage from "../ErrorMessage";
import { useDebug } from "../debug/DebugContext";

type Props = {
  transactions: any[];
  loading?: boolean;
  error?: string | null;
  showMonth?: boolean;
  showAccount?: boolean;
  showFromAccount?: boolean;
  showToAccount?: boolean;
  onDeleted?: (id: number) => void;
};

export default function TransactionsTable({
  transactions,
  loading,
  error,
  showMonth = true,
  showAccount = false,
  showFromAccount,
  showToAccount,
  onDeleted,
}: Props) {
  const displayFrom = showFromAccount ?? showAccount;
  const displayTo = showToAccount ?? showAccount;
  const { debug } = useDebug();

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this transaction? The account balances will be reverted if it was already applied.")) return;
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete transaction");
      onDeleted?.(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete transaction");
    }
  };
  if (loading) return <p>Loading...</p>;
  if (error) return <ErrorMessage message={error} />;
  if (!transactions || transactions.length === 0) return <p>No transactions available.</p>;

  return (
    <table style={{ borderCollapse: "collapse", width: "100%" }}>
      <thead>
        <tr style={{ borderBottom: "2px solid #000" }}>
          {debug && <th style={{ textAlign: "left" }}>Id</th>}
          <th style={{ textAlign: "left" }}>Description</th>
          <th style={{ textAlign: "left" }}>Amount</th>
          {showMonth && <th style={{ textAlign: "left" }}>Month</th>}
          {displayFrom && <th style={{ textAlign: "left" }}>From</th>}
          {displayTo && <th style={{ textAlign: "left" }}>To</th>}
          <th style={{ textAlign: "left" }}>Status</th>
          {debug && <th style={{ textAlign: "left" }}>Created At</th>}
          <th style={{ textAlign: "left" }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {transactions.map((transaction) => (
          <tr key={transaction.id} style={{ borderBottom: "1px solid #ccc" }}>
            {debug && <td>{transaction.id}</td>}
            <td>
              <Link href={`/transactions/${transaction.id}`} style={{ color: "blue" }}>
                {transaction.description}
              </Link>
            </td>
            <td>{transaction.amount}</td>
            {showMonth && (
              <td>{transaction.month ? formatYearMonth(transaction.month.year, transaction.month.month) : "N/A"}</td>
            )}
            {displayFrom && (
              <td>
                <Link href={`/accounts/${transaction.from_account_id}`} style={{ color: "blue" }}>
                  {transaction.from_account?.name ?? transaction.from_account_id}
                </Link>
              </td>
            )}
            {displayTo && (
              <td>
                <Link href={`/accounts/${transaction.to_account_id}`} style={{ color: "blue" }}>
                  {transaction.to_account?.name ?? transaction.to_account_id}
                </Link>
              </td>
            )}
            <td>{transaction.status}</td>
            {debug && <td>{new Date(transaction.created_at).toLocaleString()}</td>}
            <td>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <Link href={`/transactions/${transaction.id}`} style={{ color: "blue" }}>
                  Edit
                </Link>
                {onDeleted && (
                  <button type="button" onClick={() => handleDelete(transaction.id)} style={{ color: "red", cursor: "pointer" }}>
                    Delete
                  </button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
