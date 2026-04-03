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

type Account = {
  id: number;
  name: string;
};

type BreakdownRow = {
  account: Account;
  totalIn: number;
  totalOut: number;
  net: number;
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

export default function AccountMonthBreakdownTable({
  snapshots,
  allAccounts,
  loading,
}: Props) {
  if (loading) return <p>Loading breakdown…</p>;
  if (!allAccounts || allAccounts.length === 0) return null;

  const data: BreakdownRow[] = allAccounts.map((account) => {
    const snap = snapshots.find((s) => s.account_id === account.id);
    const totalIn = snap ? Number(snap.total_incomes) + Number(snap.total_transactions_in) : 0;
    const totalOut = snap ? Number(snap.total_transactions_out) + Number(snap.total_expenses) : 0;
    const net = totalIn - totalOut;

    return { account, totalIn, totalOut, net };
  });

  const columns: ColumnDef<BreakdownRow>[] = [
    {
      id: "account",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Account</span>,
      cell: ({ row }) => (
        <Link href={`/accounts/${row.original.account.id}`} className="font-medium text-primary underline-offset-4 hover:underline">
          {row.original.account.name}
        </Link>
      ),
    },
    {
      id: "totalIn",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">In</span>,
      cell: ({ row }) => <span className="text-right">{fmt(row.original.totalIn)}</span>,
    },
    {
      id: "totalOut",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Out</span>,
      cell: ({ row }) => <span className="text-right">{fmt(row.original.totalOut)}</span>,
    },
    {
      id: "net",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Net</span>,
      cell: ({ row }) => (
        <span className={`font-bold text-right ${row.original.net >= 0 ? "text-green-600" : "text-red-600"}`}>
          {row.original.net === 0 ? "-" : `${row.original.net >= 0 ? "+" : ""}${fmt(row.original.net)}`}
        </span>
      ),
    },
  ];

  return <DataTable columns={columns} data={data} headerClassName="bg-muted/50" />;
}
