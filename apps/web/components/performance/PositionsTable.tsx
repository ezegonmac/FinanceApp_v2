"use client";

import { useState } from "react";
import {
  ColumnDef,
  SortingState,
  getSortedRowModel,
  getCoreRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import { AlertTriangle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// --- Types ---

type Position = {
  asset_id: number;
  asset: { ticker: string; name: string; asset_type: string; currency: string };
  total_units: string;
  total_invested: string;
  avg_cost: string;
  current_price: string;
  current_value: string;
  unrealized_pnl: string;
  unrealized_pct: string;
  weight: string;
  daily_change: string;
  daily_change_pct: string;
  price_updated_at: string | null;
};

type PositionsTableProps = {
  positions: Position[];
  selectedAssetId: number | null;
  onSelectAsset: (assetId: number | null) => void;
};

// --- Utilities ---

const currencyFormat = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

function formatCurrency(value: string): string {
  return currencyFormat.format(parseFloat(value));
}

function getPnlColor(value: string): string {
  const num = parseFloat(value);
  if (num > 0) return "text-positive";
  if (num < 0) return "text-negative";
  return "";
}

function isPriceStale(priceUpdatedAt: string | null): boolean {
  if (!priceUpdatedAt) return false;
  const updated = new Date(priceUpdatedAt);
  const now = new Date();
  return now.getTime() - updated.getTime() > 24 * 60 * 60 * 1000;
}

function isPriceUnavailable(position: Position): boolean {
  const price = parseFloat(position.current_price);
  const value = parseFloat(position.current_value);
  const units = parseFloat(position.total_units);
  return price === 0 || (value === 0 && units > 0);
}

function formatDailyChange(value: string): string {
  const num = parseFloat(value);
  const sign = num >= 0 ? "+" : "";
  return `${sign}${currencyFormat.format(num)}`;
}

// --- Column Definitions ---

const columns: ColumnDef<Position>[] = [
  {
    id: "asset_name",
    accessorFn: (row) => row.asset.name,
    header: "Asset",
    cell: ({ row }) => (
      <div>
        <span className="font-medium">{row.original.asset.name}</span>
        <span className="ml-2 text-xs text-muted-foreground">
          {row.original.asset.ticker}
        </span>
      </div>
    ),
  },
  {
    id: "asset_type",
    accessorFn: (row) => row.asset.asset_type,
    header: "Type",
    cell: ({ row }) => (
      <Badge variant="secondary">{row.original.asset.asset_type}</Badge>
    ),
  },
  {
    id: "total_units",
    accessorFn: (row) => parseFloat(row.total_units),
    header: "Units",
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">
        {parseFloat(row.original.total_units).toLocaleString("es-ES", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 6,
        })}
      </span>
    ),
    meta: { numeric: true },
  },
  {
    id: "avg_cost",
    accessorFn: (row) => parseFloat(row.avg_cost),
    header: "Avg Cost",
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">
        {formatCurrency(row.original.avg_cost)}
      </span>
    ),
    meta: { numeric: true },
  },
  {
    id: "current_price",
    accessorFn: (row) => parseFloat(row.current_price),
    header: "Price",
    cell: ({ row }) => {
      if (isPriceUnavailable(row.original)) {
        return (
          <span className="text-muted-foreground italic">Price unavailable</span>
        );
      }

      const stale = isPriceStale(row.original.price_updated_at);

      return (
        <div className="flex items-center gap-1">
          <span className="font-mono tabular-nums">
            {formatCurrency(row.original.current_price)}
          </span>
          {stale && (
            <span
              className="inline-flex items-center gap-0.5 text-muted-foreground"
              title={`Last updated: ${new Date(row.original.price_updated_at!).toLocaleString("es-ES")}`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="text-xs">
                {new Date(row.original.price_updated_at!).toLocaleDateString("es-ES")}
              </span>
            </span>
          )}
        </div>
      );
    },
    meta: { numeric: true },
  },
  {
    id: "current_value",
    accessorFn: (row) => parseFloat(row.current_value),
    header: "Value",
    cell: ({ row }) => {
      if (isPriceUnavailable(row.original)) {
        return <span className="text-muted-foreground">—</span>;
      }
      return (
        <span className="font-mono tabular-nums font-medium">
          {formatCurrency(row.original.current_value)}
        </span>
      );
    },
    meta: { numeric: true },
  },
  {
    id: "unrealized_pnl",
    accessorFn: (row) => parseFloat(row.unrealized_pnl),
    header: "P&L (€)",
    cell: ({ row }) => {
      if (isPriceUnavailable(row.original)) {
        return <span className="text-muted-foreground">—</span>;
      }
      return (
        <span
          className={cn(
            "font-mono tabular-nums",
            getPnlColor(row.original.unrealized_pnl)
          )}
        >
          {formatCurrency(row.original.unrealized_pnl)}
        </span>
      );
    },
    meta: { numeric: true },
  },
  {
    id: "unrealized_pct",
    accessorFn: (row) => parseFloat(row.unrealized_pct),
    header: "P&L (%)",
    cell: ({ row }) => {
      if (isPriceUnavailable(row.original)) {
        return <span className="text-muted-foreground">—</span>;
      }
      const value = parseFloat(row.original.unrealized_pct);
      const sign = value >= 0 ? "+" : "";
      return (
        <span
          className={cn(
            "font-mono tabular-nums",
            getPnlColor(row.original.unrealized_pct)
          )}
        >
          {sign}{value.toFixed(2)}%
        </span>
      );
    },
    meta: { numeric: true },
  },
  {
    id: "weight",
    accessorFn: (row) => parseFloat(row.weight),
    header: "Weight",
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">
        {parseFloat(row.original.weight).toFixed(2)}%
      </span>
    ),
    meta: { numeric: true },
  },
  {
    id: "daily_change",
    accessorFn: (row) => parseFloat(row.daily_change),
    header: "Daily",
    cell: ({ row }) => {
      if (isPriceUnavailable(row.original)) {
        return <span className="text-muted-foreground">—</span>;
      }
      return (
        <span
          className={cn(
            "font-mono tabular-nums",
            getPnlColor(row.original.daily_change)
          )}
        >
          {formatDailyChange(row.original.daily_change)}
        </span>
      );
    },
    meta: { numeric: true },
  },
];

// --- Component ---

export default function PositionsTable({
  positions,
  selectedAssetId,
  onSelectAsset,
}: PositionsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "current_value", desc: true },
  ]);

  const table = useReactTable({
    data: positions,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader className="bg-muted/50">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => {
                const meta = header.column.columnDef.meta as
                  | { numeric?: boolean }
                  | undefined;
                return (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "h-8 py-0",
                      meta?.numeric && "text-right"
                    )}
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button
                        onClick={header.column.getToggleSortingHandler()}
                        className="flex items-center gap-1 hover:text-foreground"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getIsSorted() === "asc"
                          ? " ↑"
                          : header.column.getIsSorted() === "desc"
                            ? " ↓"
                            : ""}
                      </button>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row, rowIndex) => {
              const isSelected = row.original.asset_id === selectedAssetId;
              return (
                <TableRow
                  key={row.id}
                  onClick={() =>
                    onSelectAsset(isSelected ? null : row.original.asset_id)
                  }
                  className={cn(
                    "[&>td]:py-1.5 cursor-pointer transition-colors",
                    isSelected
                      ? "bg-primary/10 hover:bg-primary/15"
                      : rowIndex % 2 === 1
                        ? "bg-muted/30 hover:bg-muted/50"
                        : "hover:bg-muted/30"
                  )}
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta as
                      | { numeric?: boolean }
                      | undefined;
                    return (
                      <TableCell
                        key={cell.id}
                        className={cn(meta?.numeric && "text-right")}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                No positions to display.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
