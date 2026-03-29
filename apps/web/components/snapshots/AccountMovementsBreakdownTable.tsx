'use client';

import Link from "next/link";

type Account = { id: number; name: string };

type Income = {
  id: number;
  account_id: number;
  description: string;
  amount: string | number;
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
  allAccounts: Account[];
  incomes: Income[];
  expenses: Expense[];
  transactions: Transaction[];
  loading?: boolean;
};

type MovementRow = {
  key: string;
  label: string;
  inAmount: number;
  outAmount: number;
};

type DonutSlice = {
  key: string;
  label: string;
  amount: number;
  pct: number;
  color: string;
};

const fmt = (value: number) => {
  if (value === 0) return "-";
  return `€${value.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const pct = (part: number, total: number) => {
  if (total === 0 || part === 0) return "-";
  return `${((part / total) * 100).toFixed(1)}%`;
};

const cell: React.CSSProperties = { padding: "6px 10px" };
const numCell: React.CSSProperties = { ...cell, textAlign: "right" };
const hCell: React.CSSProperties = {
  ...cell,
  borderBottom: "1px solid #ccc",
  fontWeight: 600,
  textAlign: "left",
};
const hNumCell: React.CSSProperties = { ...hCell, textAlign: "right" };

const donutWrap: React.CSSProperties = {
  marginTop: "0.75rem",
  display: "flex",
};

const donutCard: React.CSSProperties = {
  border: "1px solid #eee",
  borderRadius: 8,
  padding: "10px",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  minWidth: 260,
};

const donutTop: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const donutRing = (slices: DonutSlice[]): React.CSSProperties => ({
  width: 64,
  height: 64,
  borderRadius: "50%",
  background: slices.length === 0 ? "#f1f1f1" : `conic-gradient(from 0deg, ${buildConicStops(slices)})`,
  position: "relative",
  flexShrink: 0,
});

const donutHole: React.CSSProperties = {
  position: "absolute",
  inset: "22%",
  borderRadius: "50%",
  background: "white",
};

const donutPct = (value: number) => (value === 0 ? "-" : `${value.toFixed(1)}%`);

function colorFor(index: number, total: number, baseHue: number) {
  const step = total > 0 ? 260 / total : 0;
  const hue = (baseHue + index * step) % 360;
  return `hsl(${hue}, 70%, 45%)`;
}

function buildConicStops(slices: DonutSlice[]) {
  let start = 0;
  return slices
    .map((slice) => {
      const end = Math.min(100, start + slice.pct);
      const stop = `${slice.color} ${start}% ${end}%`;
      start = end;
      return stop;
    })
    .join(", ");
}

function buildSlices(
  movements: Array<{ key: string; label: string; amount: number }>,
  baseHue: number
): DonutSlice[] {
  const total = movements.reduce((acc, movement) => acc + movement.amount, 0);
  if (total === 0) return [];

  return movements.map((movement, index) => ({
    key: movement.key,
    label: movement.label,
    amount: movement.amount,
    pct: (movement.amount / total) * 100,
    color: colorFor(index, movements.length, baseHue),
  }));
}

function sumIn(rows: MovementRow[]) {
  return rows.reduce((acc, row) => acc + row.inAmount, 0);
}

function sumOut(rows: MovementRow[]) {
  return rows.reduce((acc, row) => acc + row.outAmount, 0);
}

function SectionRows({
  title,
  rows,
  totalIn,
  totalOut,
}: {
  title: string;
  rows: MovementRow[];
  totalIn: number;
  totalOut: number;
}) {
  const sectionIn = sumIn(rows);
  const sectionOut = sumOut(rows);

  return (
    <>
      <tr>
        <td colSpan={5} style={{ ...cell, fontWeight: 700, borderTop: "1px solid #ddd", background: "#fafafa" }}>
          {title}
        </td>
      </tr>

      {rows.length === 0 ? (
        <tr>
          <td style={cell}>No movements</td>
          <td style={numCell}>{fmt(0)}</td>
          <td style={numCell}>{fmt(0)}</td>
          <td style={numCell}>-</td>
          <td style={numCell}>-</td>
        </tr>
      ) : (
        rows.map((row) => (
          <tr key={row.key}>
            <td style={cell}>{row.label}</td>
            <td style={numCell}>{fmt(row.inAmount)}</td>
            <td style={numCell}>{fmt(row.outAmount)}</td>
            <td style={numCell}>{pct(row.inAmount, totalIn)}</td>
            <td style={numCell}>{pct(row.outAmount, totalOut)}</td>
          </tr>
        ))
      )}

      <tr>
        <td style={{ ...cell, fontWeight: 600 }}>Section Total</td>
        <td style={{ ...numCell, fontWeight: 600 }}>{fmt(sectionIn)}</td>
        <td style={{ ...numCell, fontWeight: 600 }}>{fmt(sectionOut)}</td>
        <td style={{ ...numCell, fontWeight: 600 }}>{pct(sectionIn, totalIn)}</td>
        <td style={{ ...numCell, fontWeight: 600 }}>{pct(sectionOut, totalOut)}</td>
      </tr>
    </>
  );
}

export default function AccountMovementsBreakdownTable({
  allAccounts,
  incomes,
  expenses,
  transactions,
  loading,
}: Props) {
  if (loading) return <p>Loading movement breakdown…</p>;
  if (!allAccounts || allAccounts.length === 0) return null;

  return (
    <div>
      {allAccounts.map((account) => {
        const accountIncomes: MovementRow[] = incomes
          .filter((i) => i.account_id === account.id)
          .map((i) => ({
            key: `inc-${i.id}`,
            label: i.description || `Income #${i.id}`,
            inAmount: Number(i.amount),
            outAmount: 0,
          }));

        const accountExpenses: MovementRow[] = expenses
          .filter((e) => e.account_id === account.id)
          .map((e) => ({
            key: `exp-${e.id}`,
            label: e.description || `Expense #${e.id}`,
            inAmount: 0,
            outAmount: Number(e.amount),
          }));

        const accountTransactions: MovementRow[] = transactions
          .filter((t) => t.from_account_id === account.id || t.to_account_id === account.id)
          .map((t) => {
            const isIncoming = t.to_account_id === account.id;
            return {
              key: `txn-${t.id}-${account.id}`,
              label: `${isIncoming ? "Transfer In" : "Transfer Out"}: ${t.description || `Transaction #${t.id}`}`,
              inAmount: isIncoming ? Number(t.amount) : 0,
              outAmount: isIncoming ? 0 : Number(t.amount),
            };
          });

        const totalIn = sumIn(accountIncomes) + sumIn(accountTransactions);
        const totalOut = sumOut(accountExpenses) + sumOut(accountTransactions);
        const net = totalIn - totalOut;

        const incomeIn = sumIn(accountIncomes);
        const transferIn = sumIn(accountTransactions);
        const expenseOut = sumOut(accountExpenses);
        const transferOut = sumOut(accountTransactions);

        const inMovements = [
          ...accountIncomes.map((movement) => ({
            key: movement.key,
            label: movement.label,
            amount: movement.inAmount,
          })),
          ...accountTransactions
            .filter((movement) => movement.inAmount > 0)
            .map((movement) => ({
              key: movement.key,
              label: movement.label,
              amount: movement.inAmount,
            })),
        ];

        const outMovements = [
          ...accountExpenses.map((movement) => ({
            key: movement.key,
            label: movement.label,
            amount: movement.outAmount,
          })),
          ...accountTransactions
            .filter((movement) => movement.outAmount > 0)
            .map((movement) => ({
              key: movement.key,
              label: movement.label,
              amount: movement.outAmount,
            })),
        ];

        const inSlices = buildSlices(inMovements, 200);
        const outSlices = buildSlices(outMovements, 0);

        return (
          <div key={account.id} style={{ marginBottom: "2rem" }}>
            <h3 style={{ marginBottom: "0.5rem" }}>
              <Link href={`/accounts/${account.id}`} style={{ color: "blue" }}>
                {account.name}
              </Link>
            </h3>

            <table style={{ borderCollapse: "collapse", width: "100%" }}>
              <thead>
                <tr>
                  <th style={hCell}>Movement</th>
                  <th style={hNumCell}>In</th>
                  <th style={hNumCell}>Out</th>
                  <th style={hNumCell}>% In</th>
                  <th style={hNumCell}>% Out</th>
                </tr>
              </thead>
              <tbody>
                <SectionRows title="Incomes" rows={accountIncomes} totalIn={totalIn} totalOut={totalOut} />
                <SectionRows title="Expenses" rows={accountExpenses} totalIn={totalIn} totalOut={totalOut} />
                <SectionRows
                  title="Transactions"
                  rows={accountTransactions}
                  totalIn={totalIn}
                  totalOut={totalOut}
                />

                <tr>
                  <td colSpan={5} style={{ borderTop: "1px solid #bbb", padding: 0 }} />
                </tr>
                <tr>
                  <td style={{ ...cell, fontWeight: 700 }}>TOTAL</td>
                  <td style={{ ...numCell, fontWeight: 700 }}>{fmt(totalIn)}</td>
                  <td style={{ ...numCell, fontWeight: 700 }}>{fmt(totalOut)}</td>
                  <td style={{ ...numCell, fontWeight: 700 }}>{pct(totalIn, totalIn)}</td>
                  <td style={{ ...numCell, fontWeight: 700 }}>{pct(totalOut, totalOut)}</td>
                </tr>
                <tr>
                  <td style={{ ...cell, fontWeight: 700 }}>NET</td>
                  <td
                    colSpan={2}
                    style={{
                      ...numCell,
                      fontWeight: 700,
                      color: net >= 0 ? "green" : "crimson",
                    }}
                  >
                    {net === 0 ? "-" : `${net >= 0 ? "+" : ""}${fmt(net)}`}
                  </td>
                  <td style={numCell}></td>
                  <td style={numCell}></td>
                </tr>
              </tbody>
            </table>

            <div style={donutWrap}>
              <div style={donutCard}>
                <div style={donutTop}>
                  <div style={donutRing(inSlices)}>
                    <div style={donutHole} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>In movements</div>
                </div>
                <div style={{ marginTop: 8, fontSize: 12 }}>
                  {inSlices.length === 0 ? (
                    <div>-</div>
                  ) : (
                    inSlices.map((slice) => (
                      <div key={`in-legend-${slice.key}`}>
                        <span style={{ color: slice.color }}>■</span> {slice.label} {donutPct(slice.pct)}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div style={donutCard}>
                <div style={donutTop}>
                  <div style={donutRing(outSlices)}>
                    <div style={donutHole} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>Out movements</div>
                </div>
                <div style={{ marginTop: 8, fontSize: 12 }}>
                  {outSlices.length === 0 ? (
                    <div>-</div>
                  ) : (
                    outSlices.map((slice) => (
                      <div key={`out-legend-${slice.key}`}>
                        <span style={{ color: slice.color }}>■</span> {slice.label} {donutPct(slice.pct)}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
