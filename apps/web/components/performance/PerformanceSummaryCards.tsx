"use client";

import { cn } from "@/lib/utils";

type PerformanceSummaryCardsProps = {
  summary: {
    total_invested: string;
    total_current_value: string;
    total_pnl: string;
    total_pnl_pct: string;
    twr: string;
    daily_change: string | null;
    daily_change_pct: string | null;
    previous_value: string;
  };
};

const currencyFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatCurrency(value: string): string {
  return currencyFormatter.format(parseFloat(value));
}

function formatPercentage(value: string): string {
  const num = parseFloat(value);
  return `${num >= 0 ? "+" : ""}${num.toFixed(2)}%`;
}

function getPnlColor(value: string): string {
  const num = parseFloat(value);
  if (num > 0) return "text-green-600";
  if (num < 0) return "text-red-600";
  return "";
}

function isDailyChangeNull(
  dailyChange: string | null,
  dailyChangePct: string | null,
): boolean {
  if (dailyChange === null || dailyChangePct === null) return true;
  if (dailyChange === "0.00" && dailyChangePct === "0.00") return true;
  return false;
}

function formatDailyChange(
  dailyChange: string | null,
  dailyChangePct: string | null,
): string {
  if (isDailyChangeNull(dailyChange, dailyChangePct)) return "—";

  const changeNum = parseFloat(dailyChange!);
  const sign = changeNum >= 0 ? "+" : "";
  const formattedAmount = `${sign}${currencyFormatter.format(changeNum)}`;
  const formattedPct = `${sign}${parseFloat(dailyChangePct!).toFixed(2)}%`;

  return `${formattedAmount} (${formattedPct}) today`;
}

function getDailyChangeColor(
  dailyChange: string | null,
  dailyChangePct: string | null,
): string {
  if (isDailyChangeNull(dailyChange, dailyChangePct)) return "";
  const num = parseFloat(dailyChange!);
  if (num > 0) return "text-green-600";
  if (num < 0) return "text-red-600";
  return "";
}

export default function PerformanceSummaryCards({
  summary,
}: PerformanceSummaryCardsProps) {
  const cards = [
    {
      label: "Total Invested",
      value: formatCurrency(summary.total_invested),
    },
    {
      label: "Current Value",
      value: formatCurrency(summary.total_current_value),
    },
    {
      label: "P&L (€)",
      value: formatCurrency(summary.total_pnl),
      colorClass: getPnlColor(summary.total_pnl),
    },
    {
      label: "P&L (%)",
      value: formatPercentage(summary.total_pnl_pct),
      colorClass: getPnlColor(summary.total_pnl_pct),
    },
    {
      label: "TWR",
      value: formatPercentage(summary.twr),
      colorClass: getPnlColor(summary.twr),
    },
    {
      label: "Daily Change",
      value: formatDailyChange(summary.daily_change, summary.daily_change_pct),
      colorClass: getDailyChangeColor(
        summary.daily_change,
        summary.daily_change_pct,
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-lg border bg-card p-4"
        >
          <p className="text-sm text-muted-foreground">{card.label}</p>
          <p
            className={cn("mt-1 text-lg font-semibold", card.colorClass)}
          >
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
