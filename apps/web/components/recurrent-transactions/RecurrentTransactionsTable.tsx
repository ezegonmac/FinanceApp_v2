'use client';

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import ErrorMessage from "../ErrorMessage";
import { useDebug } from "../debug/DebugContext";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

type RecurrentTransaction = {
  id: number;
  from_account_id: number;
  to_account_id: number;
  amount: string;
  description: string | null;
  status: "ACTIVE" | "PAUSED" | "CANCELLED";
  start_month: string | null;
  end_month: string | null;
  next_run_year: number | null;
  next_run_month: number | null;
  last_applied_month_id: number | null;
  created_at: string;
  from_account_name?: string;
  to_account_name?: string;
};

type Props = {
  recurrentTransactions: RecurrentTransaction[];
  loading?: boolean;
  error?: string | null;
  onDelete?: (id: number) => void;
  deletingId?: number | null;
};

export default function RecurrentTransactionsTable({
  recurrentTransactions,
  loading,
  error,
  onDelete,
  deletingId,
}: Props) {
  const { debug } = useDebug();

  if (loading) return <p>Loading...</p>;
  if (error) return <ErrorMessage message={error} />;
  if (!recurrentTransactions || recurrentTransactions.length === 0) {
    return <p>No recurrent transactions configured.</p>;
  }

  const formatMonth = (value: string | null) => {
    if (!value) return "-";
    return new Date(value).toISOString().slice(0, 7);
  };

  const formatAmount = (value: string) => {
    const numericValue = Number(value);
    const hasDecimals = !Number.isInteger(numericValue);
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: hasDecimals ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(numericValue);
  };

  const getStatusVariant = (status: RecurrentTransaction["status"]) => {
    if (status === "ACTIVE") return "success" as const;
    if (status === "PAUSED") return "warning" as const;
    return "destructive" as const;
  };

  const columns: ColumnDef<RecurrentTransaction>[] = [];

  if (debug) {
    columns.push({
      accessorKey: "id",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Id</span>,
    });
  }

  columns.push(
    {
      id: "fromAccount",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">From Account</span>,
      cell: ({ row }) => (
        <Link href={`/accounts/${row.original.from_account_id}`} className="font-medium text-primary underline-offset-4 hover:underline">
          {row.original.from_account_name ?? row.original.from_account_id}
        </Link>
      ),
    },
    {
      id: "toAccount",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">To Account</span>,
      cell: ({ row }) => (
        <Link href={`/accounts/${row.original.to_account_id}`} className="font-medium text-primary underline-offset-4 hover:underline">
          {row.original.to_account_name ?? row.original.to_account_id}
        </Link>
      ),
    },
    {
      accessorKey: "description",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</span>,
      cell: ({ row }) => row.original.description ?? "-",
    },
    {
      accessorKey: "amount",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Amount</span>,
      cell: ({ row }) => formatAmount(row.original.amount),
    },
    {
      accessorKey: "status",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</span>,
      cell: ({ row }) => (
        <Badge variant={getStatusVariant(row.original.status)}>
          {row.original.status.charAt(0) + row.original.status.slice(1).toLowerCase()}
        </Badge>
      ),
    },
    {
      accessorKey: "start_month",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Start</span>,
      cell: ({ row }) => formatMonth(row.original.start_month),
    },
    {
      accessorKey: "end_month",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">End</span>,
      cell: ({ row }) => formatMonth(row.original.end_month),
    },
    {
      id: "nextRun",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Next Run</span>,
      cell: ({ row }) =>
        row.original.next_run_year && row.original.next_run_month
          ? `${row.original.next_run_year}-${String(row.original.next_run_month).padStart(2, "0")}`
          : "-",
    },
    {
      id: "lastApplied",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Last Applied</span>,
      cell: ({ row }) => row.original.last_applied_month_id ?? "-",
    }
  );

  if (debug) {
    columns.push({
      accessorKey: "created_at",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Created At</span>,
      cell: ({ row }) => new Date(row.original.created_at).toLocaleString(),
    });
  }

  columns.push({
    id: "actions",
    header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</span>,
    cell: ({ row }) => (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onDelete?.(row.original.id)}
        disabled={deletingId === row.original.id}
      >
        {deletingId === row.original.id ? "Deleting..." : "Delete"}
      </Button>
    ),
  });

  return (
    <DataTable columns={columns} data={recurrentTransactions} headerClassName="bg-muted/50" pageSize={10} enablePagination={true} />
  );
}
