import { CalendarDays, Coins, TrendingUp, Flame, type LucideIcon } from "lucide-react";

type Props = {
  daysLeft: number;
  daysInMonth: number;
  avgExpensePerMonthDay: number;
  netPerMonthDay: number;
  expenseToIncomeRatio: number | null;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

type KpiCardProps = {
  label: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
};

function KpiCard({ label, value, subtitle, icon: Icon }: KpiCardProps) {
  return (
    <article className="relative px-12 py-4">
      {/* Decorative watermark — texture, not content. Never affects layout. */}
      <Icon
        className="pointer-events-none absolute right-12 top-4 size-9 text-foreground opacity-[0.06]"
        strokeWidth={1.5}
        aria-hidden="true"
      />
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground/60">{subtitle}</p>
    </article>
  );
}

export default function AccountQuickInsightsStrip({
  daysLeft,
  daysInMonth,
  avgExpensePerMonthDay,
  netPerMonthDay,
  expenseToIncomeRatio,
}: Props) {
  const ratioText = expenseToIncomeRatio == null
    ? "N/A"
    : `${(expenseToIncomeRatio * 100).toFixed(0)}%`;

  return (
    <div className="kpi-stripe grid grid-cols-1 rounded-lg border bg-card md:grid-cols-4">
      <KpiCard
        label="Days Remaining"
        value={`${daysLeft}`}
        subtitle={`${daysInMonth} days in this month`}
        icon={CalendarDays}
      />
      <KpiCard
        label="Daily Budget"
        value={formatCurrency(netPerMonthDay)}
        subtitle="Income − Expense per day"
        icon={TrendingUp}
      />
      <KpiCard
        label="Daily Expenses"
        value={formatCurrency(avgExpensePerMonthDay)}
        subtitle="Monthly expenses spread"
        icon={Coins}
      />
      <KpiCard
        label="Burn Rate"
        value={ratioText}
        subtitle="Current month burn ratio"
        icon={Flame}
      />
    </div>
  );
}
