'use client';

import Link from "next/link";

type MonthSnapshot = {
  id: number;
  account_id: number;
  total_incomes: string;
  total_expenses: string;
  total_transactions_in: string;
  total_transactions_out: string;
};

type Account = {
  id: number;
  name: string;
};

type Expense = {
  id: number;
  account_id: number;
  description: string;
  amount: string | number;
};

type Transaction = {
  id: number;
  description: string;
  amount: string | number;
  from_account_id: number;
  to_account_id: number;
};

type Props = {
  snapshots: MonthSnapshot[];
  allAccounts: Account[];
  expenses: Expense[];
  transactions: Transaction[];
  loading?: boolean;
};

type OutMovement = {
  key: string;
  label: string;
  amount: number;
  pctOfOut: number;
  pctOfIn: number;
  color: string;
};

const fmt = (value: number) => {
  if (value === 0) return "-";
  return `€${value.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmtPct = (value: number) => (value === 0 ? "-" : `${value.toFixed(1)}%`);

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "6px 10px",
  borderBottom: "1px solid #ccc",
};

const thNum: React.CSSProperties = {
  ...th,
  textAlign: "right",
};

const td: React.CSSProperties = {
  padding: "6px 10px",
};

const tdNum: React.CSSProperties = {
  ...td,
  textAlign: "right",
};

const accountBlock: React.CSSProperties = {
  marginBottom: "1.5rem",
};

const donutCard: React.CSSProperties = {
  border: "1px solid #eee",
  borderRadius: 8,
  padding: "10px",
  marginTop: "0.6rem",
  display: "inline-flex",
  alignItems: "center",
  gap: 10,
};

const donutHole: React.CSSProperties = {
  position: "absolute",
  inset: "22%",
  borderRadius: "50%",
  background: "white",
};

function colorFor(index: number, total: number) {
  const step = total > 0 ? 280 / total : 0;
  const hue = (5 + index * step) % 360;
  return `hsl(${hue}, 70%, 45%)`;
}

function buildConic(stops: Array<{ pct: number; color: string }>) {
  if (stops.length === 0) return "#f1f1f1";

  let start = 0;
  const parts = stops.map((stop) => {
    const end = Math.min(100, start + stop.pct);
    const chunk = `${stop.color} ${start}% ${end}%`;
    start = end;
    return chunk;
  });

  return `conic-gradient(from 0deg, ${parts.join(", ")})`;
}

export default function AccountSpentLeftTable({
  snapshots,
  allAccounts,
  expenses,
  transactions,
  loading,
}: Props) {
  if (loading) return <p>Loading spent/left summary…</p>;
  if (!allAccounts || allAccounts.length === 0) return null;

  return (
    <div>
      {allAccounts.map((account) => {
        const snap = snapshots.find((row) => row.account_id === account.id);

        const totalIn = snap ? Number(snap.total_incomes) + Number(snap.total_transactions_in) : 0;
        const totalOut = snap ? Number(snap.total_expenses) + Number(snap.total_transactions_out) : 0;
        const leftAmount = totalIn - totalOut;
        const leftPct = totalIn > 0 ? Math.max(0, (leftAmount / totalIn) * 100) : 0;
        const spentPct = totalIn > 0 ? Math.max(0, (totalOut / totalIn) * 100) : 0;

        const outMovementsBase = [
          ...expenses
            .filter((item) => item.account_id === account.id)
            .map((item) => ({
              key: `exp-${item.id}`,
              label: item.description || `Expense #${item.id}`,
              amount: Number(item.amount),
            })),
          ...transactions
            .filter((item) => item.from_account_id === account.id)
            .map((item) => ({
              key: `tx-out-${item.id}`,
              label: `Transfer Out: ${item.description || `Transaction #${item.id}`}`,
              amount: Number(item.amount),
            })),
        ];

        const outMovements: OutMovement[] = outMovementsBase.map((movement, index) => ({
          ...movement,
          pctOfOut: totalOut > 0 ? (movement.amount / totalOut) * 100 : 0,
          pctOfIn: totalIn > 0 ? (movement.amount / totalIn) * 100 : 0,
          color: colorFor(index, outMovementsBase.length),
        }));

        const donutStops = [
          { pct: leftPct, color: "green" },
          ...outMovements.map((movement) => ({ pct: movement.pctOfIn, color: movement.color })),
        ];

        const donutRing: React.CSSProperties = {
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: buildConic(donutStops),
          position: "relative",
          flexShrink: 0,
        };

        return (
          <div key={account.id} style={accountBlock}>
            <h3 style={{ marginBottom: "0.5rem" }}>
              <Link href={`/accounts/${account.id}`} style={{ color: "blue" }}>
                {account.name}
              </Link>
            </h3>

            <table style={{ borderCollapse: "collapse", width: "100%" }}>
              <thead>
                <tr>
                  <th style={thNum}>Total In</th>
                  <th style={thNum}>Total Out</th>
                  <th style={thNum}>Spent %</th>
                  <th style={thNum}>Left %</th>
                  <th style={thNum}>Left Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid #eee" }}>
                  <td style={tdNum}>{fmt(totalIn)}</td>
                  <td style={tdNum}>{fmt(totalOut)}</td>
                  <td style={tdNum}>{fmtPct(spentPct)}</td>
                  <td style={tdNum}>{fmtPct(leftPct)}</td>
                  <td style={{ ...tdNum, color: leftAmount > 0 ? "green" : leftAmount < 0 ? "crimson" : undefined }}>
                    {leftAmount === 0 ? "-" : leftAmount > 0 ? `+${fmt(leftAmount)}` : fmt(leftAmount)}
                  </td>
                </tr>
              </tbody>
            </table>

            <table style={{ borderCollapse: "collapse", width: "100%", marginTop: "0.5rem" }}>
              <thead>
                <tr>
                  <th style={th}>Out Movement</th>
                  <th style={thNum}>Amount</th>
                  <th style={thNum}>% of Out</th>
                  <th style={thNum}>% of In</th>
                </tr>
              </thead>
              <tbody>
                {outMovements.length === 0 ? (
                  <tr>
                    <td style={td}>No out movements</td>
                    <td style={tdNum}>-</td>
                    <td style={tdNum}>-</td>
                    <td style={tdNum}>-</td>
                  </tr>
                ) : (
                  outMovements.map((movement) => (
                    <tr key={`${account.id}-${movement.key}`} style={{ borderBottom: "1px solid #f2f2f2" }}>
                      <td style={td}>{movement.label}</td>
                      <td style={tdNum}>{fmt(movement.amount)}</td>
                      <td style={tdNum}>{fmtPct(movement.pctOfOut)}</td>
                      <td style={tdNum}>{fmtPct(movement.pctOfIn)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div style={donutCard}>
              <div style={donutRing}>
                <div style={donutHole} />
              </div>
              <div style={{ fontSize: 12 }}>
                <div>
                  <span style={{ color: "green" }}>■</span> Left {fmtPct(leftPct)}
                </div>
                {outMovements.length === 0 ? (
                  <div>
                    <span style={{ color: "#999" }}>■</span> No out movements
                  </div>
                ) : (
                  outMovements.map((movement) => (
                    <div key={`legend-${account.id}-${movement.key}`}>
                      <span style={{ color: movement.color }}>■</span> {movement.label} {fmtPct(movement.pctOfIn)}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
