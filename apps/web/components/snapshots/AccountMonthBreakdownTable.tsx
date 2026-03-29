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
  allAccounts: { id: number; name: string }[];
  loading?: boolean;
};

const fmt = (n: number) => {
  if (n === 0) return "-";
  return `€${n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const cell: React.CSSProperties = { padding: "6px 10px" };
const hCell: React.CSSProperties = {
  ...cell,
  textAlign: "left",
  borderBottom: "1px solid #ccc",
  fontWeight: 600,
};
const numCell: React.CSSProperties = { ...cell, textAlign: "right" };
const numHCell: React.CSSProperties = { ...hCell, textAlign: "right" };

export default function AccountMonthBreakdownTable({
  snapshots,
  allAccounts,
  loading,
}: Props) {
  if (loading) return <p>Loading breakdown…</p>;
  if (!allAccounts || allAccounts.length === 0) return null;

  return (
    <table style={{ borderCollapse: "collapse", width: "100%", marginBottom: "1rem" }}>
      <thead>
        <tr>
          <th style={hCell}>Account</th>
          <th style={numHCell}>In</th>
          <th style={numHCell}>Out</th>
          <th style={numHCell}>Net</th>
        </tr>
      </thead>
      <tbody>
        {allAccounts.map((account) => {
          const snap = snapshots.find((s) => s.account_id === account.id);
          const totalIn = snap ? Number(snap.total_incomes) + Number(snap.total_transactions_in) : 0;
          const totalOut = snap ? Number(snap.total_transactions_out) + Number(snap.total_expenses) : 0;
          const net = totalIn - totalOut;

          return (
            <tr key={account.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={cell}>
                <Link href={`/accounts/${account.id}`} style={{ color: "blue" }}>
                  {account.name}
                </Link>
              </td>
              <td style={numCell}>{fmt(totalIn)}</td>
              <td style={numCell}>{fmt(totalOut)}</td>
              <td style={{ ...numCell, fontWeight: 700, color: net >= 0 ? "green" : "crimson" }}>
                {net === 0 ? "-" : `${net >= 0 ? "+" : ""}${fmt(net)}`}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
