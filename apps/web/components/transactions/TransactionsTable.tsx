'use client';

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { formatYearMonth } from "@repo/utils";
import ErrorMessage from "../ErrorMessage";
import { useDebug } from "../debug/DebugContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

type TransactionRow = {
  id: number;
  description: string;
  amount: number | string;
  month?: { year: number; month: number } | null;
  from_account_id: number;
  to_account_id: number;
  from_account?: { name?: string | null } | null;
  to_account?: { name?: string | null } | null;
  status?: string | null;
  created_at: string;
};

type Props = {
  transactions: TransactionRow[];
  loading?: boolean;
  error?: string | null;
  showMonth?: boolean;
  showAccount?: boolean;
  showFromAccount?: boolean;
  showToAccount?: boolean;
  onDeleted?: (id: number) => void;
};

export default function TransactionsTable({
  transactions,
  loading,
  error,
  showMonth = true,
  showAccount = false,
  showFromAccount,
  showToAccount,
  onDeleted,
}: Props) {
  const displayFrom = showFromAccount ?? showAccount;
  const displayTo = showToAccount ?? showAccount;
  const { debug } = useDebug();

  const formatBalance = (value: number | string) => {
    const numericValue = typeof value === "number" ? value : Number(value);
    const hasDecimals = !Number.isInteger(numericValue);

    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: hasDecimals ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(numericValue);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this transaction? The account balances will be reverted if it was already applied.")) return;
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete transaction");
      onDeleted?.(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete transaction");
    }
  };
  if (loading) return <p>Loading...</p>;
  if (error) return <ErrorMessage message={error} />;
  if (!transactions || transactions.length === 0) return <p>No transactions available.</p>;

  const columns: ColumnDef<TransactionRow>[] = [];

  if (debug) {
    columns.push({
      accessorKey: "id",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Id</span>,
    });
  }

  columns.push(
    {
      accessorKey: "description",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</span>,
      cell: ({ row }) => (
        <Link href={`/transactions/${row.original.id}`} className="font-medium text-primary underline-offset-4 hover:underline">
          {row.original.description}
        </Link>
      ),
    },
    {
      accessorKey: "amount",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Amount</span>,
      cell: ({ row }) => formatBalance(row.original.amount),
    }
  );

  if (showMonth) {
    columns.push({
      id: "month",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Month</span>,
      cell: ({ row }) => {
        const m = row.original.month;
        if (!m) return "N/A";
        return (
          <time dateTime={`${m.year}-${String(m.month).padStart(2, "0")}`}>
            {formatYearMonth(m.year, m.month)}
          </time>
        );
      },
    });
  }

  if (displayFrom) {
    columns.push({
      id: "from",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">From</span>,
      cell: ({ row }) => (
        <Link href={`/accounts/${row.original.from_account_id}`} className="font-medium text-primary underline-offset-4 hover:underline">
          {row.original.from_account?.name ?? row.original.from_account_id}
        </Link>
      ),
    });
  }

  if (displayTo) {
    columns.push({
      id: "to",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">To</span>,
      cell: ({ row }) => (
        <Link href={`/accounts/${row.original.to_account_id}`} className="font-medium text-primary underline-offset-4 hover:underline">
          {row.original.to_account?.name ?? row.original.to_account_id}
        </Link>
      ),
    });
  }

  columns.push({
    id: "status",
    header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</span>,
    cell: ({ row }) => {
      const status = row.original.status ?? "COMPLETED";
      return (
        <Badge variant={status === "COMPLETED" ? "success" : "warning"}>
          {status.charAt(0) + status.slice(1).toLowerCase()}
        </Badge>
      );
    },
  });

  if (debug) {
    columns.push({
      id: "created_at",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Created At</span>,
      cell: ({ row }) => new Date(row.original.created_at).toLocaleString(),
    });
  }

  columns.push({
    id: "actions",
    header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</span>,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Open actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/transactions/${row.original.id}`}>Edit</Link>
            </DropdownMenuItem>
            {onDeleted ? (
              <DropdownMenuItem variant="destructive" onClick={() => handleDelete(row.original.id)}>
                Delete
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
  });

  return (
    <DataTable columns={columns} data={transactions} headerClassName="bg-muted/50" />
  );
}
