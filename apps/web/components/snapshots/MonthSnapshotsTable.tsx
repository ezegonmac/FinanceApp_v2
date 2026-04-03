'use client';

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";

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
    return <p className="text-muted-foreground">No snapshot data yet for this month.</p>;

  const columns: ColumnDef<MonthSnapshot>[] = [
    {
      accessorKey: "account.name",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Account</span>,
      cell: ({ row }) => (
        <Link href={`/accounts/${row.original.account_id}`} className="font-medium text-primary underline-offset-4 hover:underline">
          {row.original.account.name}
        </Link>
      ),
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
      id: "transfers_in",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Transfers In</span>,
      cell: ({ row }) => fmt(row.original.total_transactions_in),
    },
    {
      id: "transfers_out",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Transfers Out</span>,
      cell: ({ row }) => fmt(row.original.total_transactions_out),
    },
    {
      id: "net_change",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Net Change</span>,
      cell: ({ row }) => {
        const net =
          Number(row.original.total_incomes) +
          Number(row.original.total_transactions_in) -
          Number(row.original.total_transactions_out) -
          Number(row.original.total_expenses);
        return (
          <span className={net >= 0 ? "text-green-600" : "text-red-600"}>
            {net >= 0 ? "+" : ""}
            {net.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
          </span>
        );
      },
    },
  ];

  return <DataTable columns={columns} data={snapshots} headerClassName="bg-muted/50" />;
}
