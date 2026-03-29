'use client';

import Link from "next/link";

type MonthSnapshot = {
  id: number;
  account_id: number;
  total_incomes: string;
  total_expenses: string;
  total_transactions_in: string;
  total_transactions_out: string;
  account: { id: number; name: string };
};

type Props = {
  snapshots: MonthSnapshot[];
  loading?: boolean;
};

const fmt = (val: string) =>
  Number(val).toLocaleString("es-ES", { style: "currency", currency: "EUR" });

export default function MonthSnapshotsTable({ snapshots, loading }: Props) {
  if (loading) return <p>Loading summary…</p>;
  if (!snapshots || snapshots.length === 0)
    return <p style={{ color: "#888" }}>No snapshot data yet for this month.</p>;

  return (
    <table style={{ borderCollapse: "collapse", width: "100%", marginBottom: "1rem" }}>
      <thead>
        <tr>
          {["Account", "Incomes", "Expenses", "Transfers In", "Transfers Out", "Net Change"].map((h) => (
            <th key={h} style={{ textAlign: "left", padding: "6px 10px", borderBottom: "1px solid #ccc" }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {snapshots.map((s) => {
          const net =
            Number(s.total_incomes) +
            Number(s.total_transactions_in) -
            Number(s.total_transactions_out) -
            Number(s.total_expenses);
          return (
            <tr key={s.id}>
              <td style={{ padding: "6px 10px" }}>
                <Link href={`/accounts/${s.account_id}`} style={{ color: "blue" }}>
                  {s.account.name}
                </Link>
              </td>
              <td style={{ padding: "6px 10px" }}>{fmt(s.total_incomes)}</td>
              <td style={{ padding: "6px 10px" }}>{fmt(s.total_expenses)}</td>
              <td style={{ padding: "6px 10px" }}>{fmt(s.total_transactions_in)}</td>
              <td style={{ padding: "6px 10px" }}>{fmt(s.total_transactions_out)}</td>
              <td style={{ padding: "6px 10px", color: net >= 0 ? "green" : "red" }}>
                {net >= 0 ? "+" : ""}
                {net.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
