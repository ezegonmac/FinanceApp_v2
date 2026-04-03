'use client';

import Link from "next/link";
import { formatYearMonth } from "@repo/utils";
import ErrorMessage from "../ErrorMessage";
import { useDebug } from "../debug/DebugContext";

type Props = {
  incomes: any[];
  loading?: boolean;
  error?: string | null;
  showMonth?: boolean;
  showAccount?: boolean;
  onDeleted?: (id: number) => void;
};

export default function IncomesTable({
  incomes,
  loading,
  error,
  showMonth = true,
  showAccount = false,
  onDeleted,
}: Props) {
  const { debug } = useDebug();

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this income? The account balance will be reverted if it was already applied.")) return;
    try {
      const res = await fetch(`/api/incomes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete income");
      onDeleted?.(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete income");
    }
  };
  if (loading) return <p>Loading...</p>;
  if (error) return <ErrorMessage message={error} />;
  if (!incomes || incomes.length === 0) return <p>No incomes available.</p>;

  return (
    <table style={{ borderCollapse: "collapse", width: "100%" }}>
      <thead>
        <tr style={{ borderBottom: "2px solid #000" }}>
          {debug && <th style={{ textAlign: "left" }}>Id</th>}
          <th style={{ textAlign: "left" }}>Description</th>
          <th style={{ textAlign: "left" }}>Amount</th>
          {showMonth && <th style={{ textAlign: "left" }}>Month</th>}
          {showAccount && <th style={{ textAlign: "left" }}>Account</th>}
          <th style={{ textAlign: "left" }}>Status</th>
          {debug && <th style={{ textAlign: "left" }}>Created At</th>}
          {onDeleted && <th />}
        </tr>
      </thead>
      <tbody>
        {incomes.map((income) => (
          <tr key={income.id} style={{ borderBottom: "1px solid #ccc" }}>
            {debug && <td>{income.id}</td>}
            <td>
              <Link href={`/incomes/${income.id}`} style={{ color: "blue" }}>
                {income.description}
              </Link>
            </td>
            <td>{income.amount}</td>
            {showMonth && (
              <td>{income.month ? formatYearMonth(income.month.year, income.month.month) : "N/A"}</td>
            )}
            {showAccount && (
              <td>
                <Link href={`/accounts/${income.account_id}`} style={{ color: "blue" }}>
                  {income.account?.name ?? income.account_id}
                </Link>
              </td>
            )}
            <td>{income.status ?? "COMPLETED"}</td>
            {debug && <td>{new Date(income.created_at).toLocaleString()}</td>}
            {onDeleted && (
              <td>
                <button onClick={() => handleDelete(income.id)} style={{ color: "red", cursor: "pointer" }}>Delete</button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
