"use client";

import { Badge } from "@/components/ui/badge";

type CoverageIndicatorProps = {
  coveragePercentage: number;
  uncoveredValue: number;
};

const currencyFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

export function CoverageIndicator({
  coveragePercentage,
  uncoveredValue,
}: CoverageIndicatorProps) {
  const percentage = Math.min(Math.max(coveragePercentage, 0), 100);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          Coverage
        </span>
        <Badge variant={percentage >= 90 ? "success" : "warning"}>
          {percentage.toFixed(1)}%
        </Badge>
      </div>

      <div className="h-2 rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {uncoveredValue > 0 && (
        <p className="text-xs text-muted-foreground">
          {currencyFormatter.format(uncoveredValue)} without exposure data
        </p>
      )}
    </div>
  );
}
