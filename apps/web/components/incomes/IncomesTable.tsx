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

type IncomeRow = {
  id: number;
  description: string;
  amount: number | string;
  month?: { year: number; month: number } | null;
  account_id: number;
  account?: { name?: string | null } | null;
  status?: string | null;
  created_at: string;
};

type Props = {
  incomes: IncomeRow[];
  loading?: boolean;
  error?: string | null;
  showMonth?: boolean;
  showAccount?: boolean;
  onDeleted?: (id: number) => void;
};

export default function IncomesTable({
  incomes,
  loading,
  error,
  showMonth = true,
  showAccount = false,
  onDeleted,
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
    if (!confirm("Delete this income? The account balance will be reverted if it was already applied.")) return;
    try {
      const res = await fetch(`/api/incomes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete income");
      onDeleted?.(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete income");
    }
  };
  if (loading) return <p>Loading...</p>;
  if (error) return <ErrorMessage message={error} />;
  if (!incomes || incomes.length === 0) return <p>No incomes available.</p>;

  const columns: ColumnDef<IncomeRow>[] = [];

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
        <Link href={`/incomes/${row.original.id}`} className="font-medium text-primary underline-offset-4 hover:underline">
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
              <Link href={`/incomes/${row.original.id}`}>Edit</Link>
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
    <DataTable columns={columns} data={incomes} headerClassName="bg-muted/50" />
  );
}
