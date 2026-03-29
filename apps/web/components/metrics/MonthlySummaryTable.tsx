import { formatYearMonthLong } from "@repo/utils";
import type { MonthlySummaryRow } from "@/app/api/metrics/monthly-summary/route";

type Aggregation = {
  total_incomes: number;
  total_expenses: number;
  net_change: number;
};

type Props = {
  rows: MonthlySummaryRow[];
  totals: Aggregation;
  averages: Aggregation;
};

const fmt = (val: number) =>
  val.toLocaleString("es-ES", { style: "currency", currency: "EUR" });

const netStyle = (val: number): React.CSSProperties => ({
  padding: "6px 10px",
  color: val >= 0 ? "green" : "red",
});

export default function MonthlySummaryTable({ rows, totals, averages }: Props) {
  if (!rows || rows.length === 0)
    return <p style={{ color: "#888" }}>No monthly data yet.</p>;

  const headers = ["Month", "Incomes", "Expenses", "Net Change", "Running Total"];

  return (
    <table style={{ borderCollapse: "collapse", width: "100%", marginBottom: "1rem" }}>
      <thead>
        <tr>
          {headers.map((h) => (
            <th key={h} style={{ textAlign: "left", padding: "6px 10px", borderBottom: "1px solid #ccc" }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const net = r.net_change;
          return (
            <tr key={`${r.year}-${r.month}`} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "6px 10px" }}>{formatYearMonthLong(r.year, r.month)}</td>
              <td style={{ padding: "6px 10px" }}>{fmt(r.total_incomes)}</td>
              <td style={{ padding: "6px 10px" }}>{fmt(r.total_expenses)}</td>
              <td style={netStyle(net)}>
                {net >= 0 ? "+" : ""}{fmt(net)}
              </td>
              <td style={{ padding: "6px 10px" }}>{fmt(r.running_total)}</td>
            </tr>
          );
        })}

        {/* Average row */}
        <tr style={{ borderTop: "2px solid #ccc", fontStyle: "italic", color: "#555" }}>
          <td style={{ padding: "6px 10px" }}>Average</td>
          <td style={{ padding: "6px 10px" }}>{fmt(averages.total_incomes)}</td>
          <td style={{ padding: "6px 10px" }}>{fmt(averages.total_expenses)}</td>
          <td style={netStyle(averages.net_change)}>
            {averages.net_change >= 0 ? "+" : ""}{fmt(averages.net_change)}
          </td>
          <td style={{ padding: "6px 10px" }}>—</td>
        </tr>

        {/* Total row */}
        <tr style={{ borderTop: "1px solid #ccc", fontWeight: "bold" }}>
          <td style={{ padding: "6px 10px" }}>Total</td>
          <td style={{ padding: "6px 10px" }}>{fmt(totals.total_incomes)}</td>
          <td style={{ padding: "6px 10px" }}>{fmt(totals.total_expenses)}</td>
          <td style={netStyle(totals.net_change)}>
            {totals.net_change >= 0 ? "+" : ""}{fmt(totals.net_change)}
          </td>
          <td style={{ padding: "6px 10px" }}>—</td>
        </tr>
      </tbody>
    </table>
  );
}
