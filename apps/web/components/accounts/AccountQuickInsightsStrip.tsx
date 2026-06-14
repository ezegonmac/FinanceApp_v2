import { CalendarDays, Coins, TrendingUp, Flame } from "lucide-react";

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
  icon: React.ReactNode;
  iconBg: string;
};

function KpiCard({ label, value, subtitle, icon, iconBg }: KpiCardProps) {
  return (
    <article className="flex items-start gap-4 rounded-lg border bg-card p-5">
      <div className={`flex size-9 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">{value}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
      </div>
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
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="Days Left"
        value={`${daysLeft}`}
        subtitle={`${daysInMonth} days in this month`}
        icon={<CalendarDays className="size-4.5 text-primary" />}
        iconBg="bg-accent"
      />
      <KpiCard
        label="Daily Budget"
        value={formatCurrency(netPerMonthDay)}
        subtitle="(Income − Expense) per day"
        icon={<TrendingUp className="size-5 text-primary" />}
        iconBg="bg-accent"
      />
      <KpiCard
        label="Expenses"
        value={`${formatCurrency(avgExpensePerMonthDay)} / day`}
        subtitle="Monthly expenses spread"
        icon={<Coins className="size-5 text-primary" />}
        iconBg="bg-accent"
      />
      <KpiCard
        label="Burn Rate"
        value={ratioText}
        subtitle="Current month burn ratio"
        icon={<Flame className="size-5 text-primary" />}
        iconBg="bg-accent"
      />
    </div>
  );
}
