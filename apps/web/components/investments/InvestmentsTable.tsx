'use client';

import { MoreHorizontal } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { formatYearMonth } from "@repo/utils";
import ErrorMessage from "../ErrorMessage";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ListTable } from "@/components/ui/list-table";
import { Badge } from "@/components/ui/badge";

export type InvestmentRow = {
  id: number;
  type: "BUY" | "SELL";
  units: number | string;
  unit_price: number | string;
  total_amount: number | string;
  description: string | null;
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  created_at: string;
  asset: { id: number; ticker: string; name: string };
  month: { year: number; month: number };
};

type Props = {
  investments: InvestmentRow[];
  loading?: boolean;
  error?: string | null;
  pageSize?: number;
  totalCount?: number;
  resetKey?: unknown;
  onPageChange?: (pageIndex: number) => void;
  onCancel?: (id: number) => void;
};

const formatCurrency = (value: number | string) => {
  const numericValue = typeof value === "number" ? value : Number(value);
  const hasDecimals = !Number.isInteger(numericValue);
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(numericValue);
};

const formatPreciseCurrency = (value: number | string) => {
  const numericValue = typeof value === "number" ? value : Number(value);
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 4,
    maximumFractionDigits: 6,
  }).format(numericValue);
};

export default function InvestmentsTable({
  investments,
  loading,
  error,
  pageSize = 10,
  totalCount,
  resetKey,
  onPageChange,
  onCancel,
}: Props) {
  if (loading) return <p>Loading...</p>;
  if (error) return <ErrorMessage message={error} />;
  if (!investments || investments.length === 0) return <p>No investments available.</p>;

  const columns: ColumnDef<InvestmentRow>[] = [
    {
      id: "asset",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Asset</span>,
      cell: ({ row }) => <span className="font-medium">{row.original.asset.ticker}</span>,
    },
    {
      id: "type",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type</span>,
      cell: ({ row }) => (
        <Badge variant={row.original.type === "BUY" ? "info" : "warning"}>
          {row.original.type}
        </Badge>
      ),
    },
    {
      id: "units",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Units</span>,
      cell: ({ row }) => {
        const units = typeof row.original.units === "number" ? row.original.units : Number(row.original.units);
        const formatted = units % 1 === 0 ? units.toString() : units.toFixed(6).replace(/0+$/, "");
        return <span className="font-mono tabular-nums">{formatted}</span>;
      },
      meta: { numeric: true },
    },
    {
      id: "unitPrice",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Unit Price</span>,
      cell: ({ row }) => <span className="font-mono tabular-nums">{formatPreciseCurrency(row.original.unit_price)}</span>,
      meta: { numeric: true },
    },
    {
      id: "total",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total</span>,
      cell: ({ row }) => <span className="font-mono tabular-nums">{formatCurrency(row.original.total_amount)}</span>,
      meta: { numeric: true },
    },
    {
      id: "status",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</span>,
      cell: ({ row }) => {
        const status = row.original.status;
        const variant = status === "COMPLETED" ? "success" : "secondary";
        return (
          <Badge variant={variant}>
            {status.charAt(0) + status.slice(1).toLowerCase()}
          </Badge>
        );
      },
    },
    {
      id: "month",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Month</span>,
      cell: ({ row }) => {
        const m = row.original.month;
        return (
          <time dateTime={`${m.year}-${String(m.month).padStart(2, "0")}`}>
            {formatYearMonth(m.year, m.month)}
          </time>
        );
      },
    },
    {
      id: "description",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</span>,
      cell: ({ row }) => (
        <span className="max-w-[200px] truncate block">
          {row.original.description ?? "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</span>,
      cell: ({ row }) => {
        if (row.original.status === "CANCELLED") return null;
        return (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Open actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onCancel?.(row.original.id)}
              >
                Cancel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      meta: { isAction: true },
    },
  ];

  return (
    <ListTable
      columns={columns}
      data={investments}
      enablePagination
      pageSize={pageSize}
      totalCount={totalCount}
      resetKey={resetKey}
      onPageChange={onPageChange}
    />
  );
}
