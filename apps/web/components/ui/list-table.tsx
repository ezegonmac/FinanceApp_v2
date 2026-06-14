"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

/**
 * ListTable — for entity browsing / listing pages.
 *
 * Design characteristics:
 * - All columns uniformly left-aligned — consistent scan direction across the row
 * - Comfortable rows (py-3), generous padding
 * - Optional `getRowHref`: entire row becomes a click target (router.push)
 * - Cells with `meta: { isAction: true }` stop propagation so dropdowns don't navigate
 * - Cells with `meta: { numeric: true }` get font-mono + tabular-nums (but stay left-aligned)
 * - Subtle accent hover on clickable rows
 */

export type ListTableMeta = {
  /** Stop row-click navigation on this cell (use for action dropdowns / buttons) */
  isAction?: boolean;
  /** Apply font-mono tabular-nums for financial figures — alignment stays left */
  numeric?: boolean;
};

type ListTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  /** Return a URL to navigate to when the row is clicked. Omit or return falsy to disable. */
  getRowHref?: (row: TData) => string | null | undefined;
  emptyMessage?: string;
  pageSize?: number;
  enablePagination?: boolean;
  totalCount?: number;
  resetKey?: unknown;
  onPageChange?: (pageIndex: number) => void;
  /** When true, skips the outer `rounded-lg border bg-card` wrapper — use when the table is already inside a card container. */
  bare?: boolean;
};

export function ListTable<TData, TValue>({
  columns,
  data,
  getRowHref,
  emptyMessage = "No results.",
  pageSize = 10,
  enablePagination = false,
  totalCount,
  resetKey,
  onPageChange,
  bare = false,
}: ListTableProps<TData, TValue>) {
  const router = useRouter();
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize });

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageSize }));
  }, [pageSize]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const onPageChangeRef = useRef(onPageChange);
  useEffect(() => { onPageChangeRef.current = onPageChange; });
  useEffect(() => {
    onPageChangeRef.current?.(pagination.pageIndex);
  }, [pagination.pageIndex]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    state: { pagination },
  });

  const rows = enablePagination
    ? table.getRowModel().rows
    : table.getPrePaginationRowModel().rows;

  const totalRows = table.getPrePaginationRowModel().rows.length;
  const displayTotalPages = totalCount
    ? Math.max(table.getPageCount(), Math.ceil(totalCount / pagination.pageSize))
    : Math.max(1, table.getPageCount());
  const shouldShowPagination = enablePagination && totalRows > pagination.pageSize;

  return (
    <div className={bare ? "border-t" : "rounded-lg border bg-card"}>
      <Table>
        {/* Headers — always left-aligned to match cells */}
        <TableHeader className="bg-muted/50">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {rows.length ? (
            rows.map((row) => {
              const href = getRowHref?.(row.original);
              const isClickable = !!href;

              return (
                <TableRow
                  key={row.id}
                  onClick={isClickable ? () => router.push(href!) : undefined}
                  className={cn(
                    // 40px default row height per design system (py-2.5 = 10px + 20px line + 10px)
                    "[&>td]:py-2.5",
                    isClickable && "cursor-pointer transition-colors hover:bg-accent/40"
                  )}
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta as ListTableMeta | undefined;
                    return (
                      <TableCell
                        key={cell.id}
                        onClick={meta?.isAction ? (e) => e.stopPropagation() : undefined}
                        className={cn(meta?.numeric && "font-mono tabular-nums")}
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
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {shouldShowPagination ? (
        <div className="flex items-center justify-between border-t px-3 py-2">
          <p className="text-xs text-muted-foreground">
            Page {pagination.pageIndex + 1} of {displayTotalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
