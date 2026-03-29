'use client';

type ExpenseRow = {
  id: number;
  description?: string;
  amount: string | number;
  account_id?: number;
  account?: { name?: string | null } | null;
};

type Slice = {
  label: string;
  amount: number;
  pct: number;
  color: string;
};

type Props = {
  expenses: ExpenseRow[];
};

const donutHole: React.CSSProperties = {
  position: "absolute",
  inset: "24%",
  borderRadius: "50%",
  background: "white",
};

function colorFor(index: number, total: number) {
  const step = total > 0 ? 280 / total : 0;
  const hue = (220 + index * step) % 360;
  return `hsl(${hue}, 70%, 45%)`;
}

function buildConic(slices: Slice[]) {
  if (slices.length === 0) return "#f1f1f1";

  let start = 0;
  const parts = slices.map((slice) => {
    const end = Math.min(100, start + slice.pct);
    const piece = `${slice.color} ${start}% ${end}%`;
    start = end;
    return piece;
  });

  return `conic-gradient(from 0deg, ${parts.join(", ")})`;
}

export default function ExpensesCircularPlot({ expenses }: Props) {
  if (!expenses || expenses.length === 0) return null;

  const total = expenses.reduce((acc, expense) => acc + Number(expense.amount), 0);
  const slices: Slice[] = expenses
    .map((expense, index, arr) => ({
      label: expense.description?.trim() ? expense.description : `Expense #${expense.id}`,
      amount: Number(expense.amount),
      pct: total > 0 ? (Number(expense.amount) / total) * 100 : 0,
      color: colorFor(index, arr.length),
    }))
    .sort((a, b) => b.amount - a.amount)
    .map((slice, index, arr) => ({
      ...slice,
      color: colorFor(index, arr.length),
    }));

  const ringStyle: React.CSSProperties = {
    width: 120,
    height: 120,
    borderRadius: "50%",
    background: buildConic(slices),
    position: "relative",
    flexShrink: 0,
  };

  return (
    <div style={{ marginTop: "0.75rem", border: "1px solid #eee", borderRadius: 8, padding: "10px" }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Expenses Distribution by Individual Expense</div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div style={ringStyle}>
          <div style={donutHole} />
        </div>
        <div style={{ fontSize: 12 }}>
          {slices.map((slice) => (
            <div key={slice.label}>
              <span style={{ color: slice.color }}>■</span> {slice.label} {slice.pct === 0 ? "-" : `${slice.pct.toFixed(1)}%`}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
