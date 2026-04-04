'use client';

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { formatYearMonth } from "@repo/utils";
import ErrorMessage from "../ErrorMessage";
import ExpensesCircularPlot from "./ExpensesCircularPlot";
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

type ExpenseRow = {
  id: number;
  description: string;
  amount: number | string;
  analytics_amount?: number | string | null;
  kind?: string | null;
  month?: { year: number; month: number } | null;
  account_id: number;
  account?: { name?: string | null } | null;
  status?: string | null;
  created_at: string;
};

type Props = {
  expenses: ExpenseRow[];
  loading?: boolean;
  error?: string | null;
  showMonth?: boolean;
  showAccount?: boolean;
  showCircularPlot?: boolean;
  showAnalytics?: boolean;
  pageSize?: number;
  onDeleted?: (id: number) => void;
  totalCount?: number;
  resetKey?: unknown;
  onPageChange?: (pageIndex: number) => void;
};

export default function ExpensesTable({
  expenses,
  loading,
  error,
  showMonth = true,
  showAccount = false,
  showCircularPlot = false,
  showAnalytics = false,
  pageSize,
  onDeleted,
  totalCount,
  resetKey,
  onPageChange,
}: Props) {
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
    if (!confirm("Delete this expense? The account balance will be reverted if it was already applied.")) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete expense");
      onDeleted?.(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete expense");
    }
  };
  if (loading) return <p>Loading...</p>;
  if (error) return <ErrorMessage message={error} />;
  if (!expenses || expenses.length === 0) return <p>No expenses available.</p>;

  const columns: ColumnDef<ExpenseRow>[] = [];

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
        <Link href={`/expenses/${row.original.id}`} className="font-medium text-primary underline-offset-4 hover:underline">
          {row.original.description}
        </Link>
      ),
    },
    {
      id: "amount",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Amount</span>,
      cell: ({ row }) => formatBalance(showAnalytics ? row.original.analytics_amount ?? row.original.amount : row.original.amount),
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

  columns.push({
    id: "type",
    header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type</span>,
    cell: ({ row }) => {
      const kind = row.original.kind ?? "FIXED";
      return (
        <Badge variant={kind === "FIXED" ? "info" : "warning"}>
          {kind.charAt(0) + kind.slice(1).toLowerCase()}
        </Badge>
      );
    },
  });

  if (showAccount) {
    columns.push({
      id: "account",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Account</span>,
      cell: ({ row }) => (
        <Link href={`/accounts/${row.original.account_id}`} className="font-medium text-primary underline-offset-4 hover:underline">
          {row.original.account?.name ?? row.original.account_id}
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
              <Link href={`/expenses/${row.original.id}`}>Edit</Link>
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
    <>
      <DataTable
        columns={columns}
        data={expenses}
        headerClassName="bg-muted/50"
        enablePagination={typeof pageSize === "number"}
        pageSize={pageSize}
        totalCount={totalCount}
        resetKey={resetKey}
        onPageChange={onPageChange}
      />

      {showCircularPlot && <ExpensesCircularPlot expenses={expenses} />}
    </>
  );
}
