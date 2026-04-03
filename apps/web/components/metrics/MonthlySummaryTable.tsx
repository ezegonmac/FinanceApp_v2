import { formatYearMonthLong } from "@repo/utils";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
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

export default function MonthlySummaryTable({ rows, totals, averages }: Props) {
  if (!rows || rows.length === 0)
    return <p className="text-muted-foreground">No monthly data yet.</p>;

  const columns: ColumnDef<MonthlySummaryRow>[] = [
    {
      id: "month",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Month</span>,
      cell: ({ row }) => formatYearMonthLong(row.original.year, row.original.month),
    },
    {
      id: "incomes",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Incomes</span>,
      cell: ({ row }) => fmt(row.original.total_incomes),
    },
    {
      id: "expenses",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Expenses</span>,
      cell: ({ row }) => fmt(row.original.total_expenses),
    },
    {
      id: "net",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Net Change</span>,
      cell: ({ row }) => {
        const net = row.original.net_change;
        return (
          <span className={net >= 0 ? "text-green-600" : "text-red-600"}>
            {net >= 0 ? "+" : ""}
            {fmt(net)}
          </span>
        );
      },
    },
    {
      id: "running",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Running Total</span>,
      cell: ({ row }) => fmt(row.original.running_total),
    },
  ];

  return (
    <div className="space-y-3">
      <DataTable columns={columns} data={rows} headerClassName="bg-muted/50" />

      <div className="rounded-md border bg-muted/30 px-4 py-3">
        <div className="mb-2 grid grid-cols-5 gap-4 text-sm italic text-muted-foreground">
          <span>Average</span>
          <span>{fmt(averages.total_incomes)}</span>
          <span>{fmt(averages.total_expenses)}</span>
          <span className={averages.net_change >= 0 ? "text-green-600" : "text-red-600"}>
            {averages.net_change >= 0 ? "+" : ""}
            {fmt(averages.net_change)}
          </span>
          <span>—</span>
        </div>

        <div className="grid grid-cols-5 gap-4 text-sm font-semibold">
          <span>Total</span>
          <span>{fmt(totals.total_incomes)}</span>
          <span>{fmt(totals.total_expenses)}</span>
          <span className={totals.net_change >= 0 ? "text-green-600" : "text-red-600"}>
            {totals.net_change >= 0 ? "+" : ""}
            {fmt(totals.net_change)}
          </span>
          <span>—</span>
        </div>
      </div>
    </div>
  );
}
