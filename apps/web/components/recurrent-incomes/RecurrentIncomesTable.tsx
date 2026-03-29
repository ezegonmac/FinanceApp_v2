'use client';

import Link from "next/link";
import ErrorMessage from "../ErrorMessage";

type RecurrentIncome = {
  id: number;
  account_id: number;
  amount: string;
  description: string | null;
  status: "ACTIVE" | "PAUSED" | "CANCELLED";
  start_month: string | null;
  end_month: string | null;
  next_run_year: number | null;
  next_run_month: number | null;
  last_applied_month_id: number | null;
  created_at: string;
  account_name?: string;
};

type Props = {
  recurrentIncomes: RecurrentIncome[];
  loading?: boolean;
  error?: string | null;
  onDelete?: (id: number) => void;
  deletingId?: number | null;
};

export default function RecurrentIncomesTable({
  recurrentIncomes,
  loading,
  error,
  onDelete,
  deletingId,
}: Props) {
  if (loading) return <p>Loading...</p>;
  if (error) return <ErrorMessage message={error} />;
  if (!recurrentIncomes || recurrentIncomes.length === 0) {
    return <p>No recurrent incomes configured.</p>;
  }

  return (
    <table style={{ borderCollapse: "collapse", width: "100%" }}>
      <thead>
        <tr style={{ borderBottom: "2px solid #000" }}>
          <th style={{ textAlign: "left" }}>Id</th>
          <th style={{ textAlign: "left" }}>Account</th>
          <th style={{ textAlign: "left" }}>Description</th>
          <th style={{ textAlign: "left" }}>Amount</th>
          <th style={{ textAlign: "left" }}>Status</th>
          <th style={{ textAlign: "left" }}>Start</th>
          <th style={{ textAlign: "left" }}>End</th>
          <th style={{ textAlign: "left" }}>Next Run</th>
          <th style={{ textAlign: "left" }}>Last Applied Month Id</th>
          <th style={{ textAlign: "left" }}>Created At</th>
          <th style={{ textAlign: "left" }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {recurrentIncomes.map((item) => (
          <tr key={item.id} style={{ borderBottom: "1px solid #ccc" }}>
            <td>{item.id}</td>
            <td>
              <Link href={`/accounts/${item.account_id}`} style={{ color: "blue" }}>
                {item.account_name ?? item.account_id}
              </Link>
            </td>
            <td>{item.description ?? "-"}</td>
            <td>{item.amount}</td>
            <td>{item.status}</td>
            <td>{item.start_month ? new Date(item.start_month).toISOString().slice(0, 7) : "-"}</td>
            <td>{item.end_month ? new Date(item.end_month).toISOString().slice(0, 7) : "-"}</td>
            <td>
              {item.next_run_year && item.next_run_month
                ? `${item.next_run_year}-${String(item.next_run_month).padStart(2, "0")}`
                : "-"}
            </td>
            <td>{item.last_applied_month_id ?? "-"}</td>
            <td>{new Date(item.created_at).toLocaleString()}</td>
            <td>
              <button
                onClick={() => onDelete?.(item.id)}
                disabled={deletingId === item.id}
              >
                {deletingId === item.id ? "Deleting..." : "Delete"}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
