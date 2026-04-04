"use client";

import { useEffect, useRef, useState } from "react";
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

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  emptyMessage?: string;
  headerClassName?: string;
  pageSize?: number;
  enablePagination?: boolean;
  totalCount?: number;
  resetKey?: unknown;
  onPageChange?: (pageIndex: number) => void;
};

export function DataTable<TData, TValue>({
  columns,
  data,
  emptyMessage = "No results.",
  headerClassName,
  pageSize = 10,
  enablePagination = false,
  totalCount,
  resetKey,
  onPageChange,
}: DataTableProps<TData, TValue>) {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize,
  });

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageSize }));
  }, [pageSize]);

  // Reset to page 0 when the dataset identity changes (filter change, account change, refresh)
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  // Always call the latest version of onPageChange without re-running on identity changes
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
    state: {
      pagination,
    },
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
    <div className="rounded-md border">
      <Table>
        <TableHeader className={headerClassName}>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
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
            rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
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