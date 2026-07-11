"use client";

import { useEffect, useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ExposureTypeToggle } from "./ExposureTypeToggle";
import { CoverageIndicator } from "./CoverageIndicator";
import ExposurePieChart from "./ExposurePieChart";
import ExposureTable from "./ExposureTable";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

type ExposureType = "SECTOR" | "COUNTRY";

type ExposureCategory = {
  categoryId: number;
  categoryName: string;
  percentage: number;
  value: number;
  assetCount?: number;
};

type PositionBreakdown = {
  assetId: number;
  name: string;
  ticker: string;
  assetType: string;
  value: number;
  percentage: number;
  hasCoverage: boolean;
};

type ExposureResponse = {
  data: ExposureCategory[];
  coveragePercentage: number;
  uncoveredValue: number;
  totalPortfolioValue: number;
  period: string;
  type: ExposureType;
  positions: PositionBreakdown[];
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const positionColumns: ColumnDef<PositionBreakdown>[] = [
  {
    accessorKey: "name",
    header: "Asset",
    cell: ({ row }) => (
      <div>
        <span className="font-medium">{row.original.name}</span>
        <span className="ml-2 text-xs text-muted-foreground">{row.original.ticker}</span>
      </div>
    ),
  },
  {
    accessorKey: "assetType",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant="secondary">{row.original.assetType}</Badge>
    ),
  },
  {
    id: "bar",
    header: "Weight",
    cell: ({ row }) => (
      <div className="flex items-center gap-2 min-w-[100px]">
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
    cell: ({ row }) => `${row.original.percentage.toFixed(1)}%`,
    meta: { numeric: true },
  },
  {
    accessorKey: "value",
    header: "Value",
    cell: ({ row }) => formatCurrency(row.original.value),
    meta: { numeric: true },
  },
  {
    accessorKey: "hasCoverage",
    header: "Coverage",
    cell: ({ row }) => (
      <Badge variant={row.original.hasCoverage ? "success" : "warning"}>
        {row.original.hasCoverage ? "Yes" : "No"}
      </Badge>
    ),
  },
];

export default function ExposurePage() {
  const [type, setType] = useState<ExposureType>("SECTOR");
  const [data, setData] = useState<ExposureResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchExposure() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/investments/exposure?type=${type}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch exposure data (${response.status})`);
        }

        const json: ExposureResponse = await response.json();

        if (!cancelled) {
          setData(json);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "An unexpected error occurred"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchExposure();

    return () => {
      cancelled = true;
    };
  }, [type]);

  const exposureData = useMemo(() => {
    if (!data) return [];

    const categories = data.data.map((d) => ({
      categoryName: d.categoryName,
      percentage: d.percentage,
      value: d.value,
      assetCount: d.assetCount,
    }));

    const sum = categories.reduce((acc, c) => acc + c.percentage, 0);
    const coveredPortion = data.coveragePercentage;

    if (coveredPortion - sum > 0.01) {
      const otherPercentage = coveredPortion - sum;
      const otherValue =
        (otherPercentage / 100) * data.totalPortfolioValue;

      categories.push({
        categoryName: "Other / Unclassified",
        percentage: otherPercentage,
        value: otherValue,
      });
    }

    return categories;
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Portfolio Exposure</h1>
        <div className="mt-4 flex items-center justify-between">
          <ExposureTypeToggle value={type} onChange={setType} />
        </div>
        <p className="mt-8 text-center text-muted-foreground">
          No exposure data available for the selected type.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Portfolio Exposure</h1>

      {data.positions && data.positions.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold">Portfolio Composition</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Assets included in this analysis, weighted by current value.
          </p>
          <div className="mt-4">
            <DataTable
              columns={positionColumns}
              data={data.positions}
              emptyMessage="No positions found."
            />
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between">
        <ExposureTypeToggle value={type} onChange={setType} />
        <CoverageIndicator
          coveragePercentage={data.coveragePercentage}
          uncoveredValue={data.uncoveredValue}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ExposurePieChart data={exposureData} type={type} />
        <ExposureTable data={exposureData} type={type} />
      </div>
    </div>
  );
}
