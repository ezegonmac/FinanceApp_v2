import { CalendarDays, Coins, Repeat, Scale, Wallet } from "lucide-react";

type Props = {
  monthLabel: string;
  daysLeft: number;
  daysInMonth: number;
  avgExpensePerMonthDay: number;
  netPerMonthDay: number;
  expenseToIncomeRatio: number | null;
  scheduledRecurrentCount: number;
};

const formatCurrency = (value: number) => {
  const hasDecimals = !Number.isInteger(value);
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(value);
};

type InsightCardProps = {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
};

function InsightCard({ title, value, subtitle, icon }: InsightCardProps) {
  return (
    <article className="rounded-xl border border-border/70 bg-linear-to-b from-muted/40 to-transparent p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <p className="text-lg font-semibold tabular-nums text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
    </article>
  );
}

export default function AccountQuickInsightsStrip({
  monthLabel,
  daysLeft,
  daysInMonth,
  avgExpensePerMonthDay,
  netPerMonthDay,
  expenseToIncomeRatio,
  scheduledRecurrentCount,
}: Props) {
  const ratioText = expenseToIncomeRatio == null
    ? "N/A"
    : `${(expenseToIncomeRatio * 100).toFixed(0)}%`;

  return (
    <section className="space-y-3 rounded-md border bg-card p-5 text-card-foreground">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Quick Insights</h3>
        <p className="text-xs text-muted-foreground">{monthLabel}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <InsightCard
          title="Days Left"
          value={`${daysLeft}`}
          subtitle={`${daysInMonth} days in this month`}
          icon={<CalendarDays className="size-4" />}
        />
        <InsightCard
          title="Expense / Month Day"
          value={formatCurrency(avgExpensePerMonthDay)}
          subtitle="Monthly expenses spread across full month"
          icon={<Coins className="size-4" />}
        />
        <InsightCard
          title="Net / Month Day"
          value={formatCurrency(netPerMonthDay)}
          subtitle="(Income - Expense) across full month"
          icon={<Wallet className="size-4" />}
        />
        <InsightCard
          title="Expense/Income"
          value={ratioText}
          subtitle="Current month burn ratio"
          icon={<Scale className="size-4" />}
        />
        <InsightCard
          title="Recurrent Scheduled"
          value={`${scheduledRecurrentCount}`}
          subtitle="Active recurrent rules due this month"
          icon={<Repeat className="size-4" />}
        />
      </div>
    </section>
  );
}
