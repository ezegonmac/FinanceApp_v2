'use client';

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";

type ExposureRow = {
  categoryName: string;
  percentage: number;
  value: number;
  assetCount?: number;
};

type ExposureTableProps = {
  data: ExposureRow[];
  type: "SECTOR" | "COUNTRY";
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const formatPercentage = (value: number) => `${value.toFixed(2)}%`;

const columns: ColumnDef<ExposureRow>[] = [
  {
    accessorKey: "categoryName",
    header: "Category",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.categoryName}</span>
    ),
  },
  {
    id: "bar",
    header: "Weight",
    cell: ({ row }) => (
      <div className="flex items-center gap-2 min-w-[120px]">
        <div className="h-2 flex-1 rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${Math.min(row.original.percentage, 100)}%` }}
          />
        </div>
      </div>
    ),
  },
  {
    accessorKey: "percentage",
    header: "Allocation",
    cell: ({ row }) => formatPercentage(row.original.percentage),
    meta: { numeric: true },
  },
];

export default function ExposureTable({ data, type }: ExposureTableProps) {
  const sorted = data.slice().sort((a, b) => b.percentage - a.percentage);

  return (
    <DataTable
      columns={columns}
      data={sorted}
      emptyMessage={`No ${type.toLowerCase()} exposure data available.`}
    />
  );
}
