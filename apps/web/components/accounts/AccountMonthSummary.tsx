import { ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react";

type Props = {
  monthLabel: string;
  totalIncome: number;
  totalExpenses: number;
  totalIn: number;
  totalOut: number;
  net: number;
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

type MetricCardProps = {
  label: string;
  value: string;
  tone: "neutral" | "positive" | "negative";
  icon?: React.ReactNode;
};

function MetricCard({ label, value, tone, icon }: MetricCardProps) {
  const toneClass =
    tone === "positive"
      ? "border-emerald-200/70 bg-emerald-50/80 text-emerald-700"
      : tone === "negative"
        ? "border-rose-200/70 bg-rose-50/80 text-rose-700"
        : "border-border bg-muted/30 text-foreground";

  return (
    <article className={`rounded-lg border p-4 ${toneClass}`}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
        {icon}
      </div>
      <p className="text-xl font-semibold tabular-nums">{value}</p>
    </article>
  );
}

export default function AccountMonthSummary({
  monthLabel,
  totalIncome,
  totalExpenses,
  totalIn,
  totalOut,
  net,
}: Props) {
  return (
    <section className="space-y-4 rounded-md border bg-card p-6 text-card-foreground">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">This Month Summary</h2>
          <p className="text-sm text-muted-foreground">{monthLabel}</p>
        </div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Live account totals</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Income"
          value={formatCurrency(totalIncome)}
          tone="positive"
          icon={<ArrowDownRight className="size-4 opacity-80" />}
        />
        <MetricCard
          label="Expenses"
          value={formatCurrency(totalExpenses)}
          tone="negative"
          icon={<ArrowUpRight className="size-4 opacity-80" />}
        />
        <MetricCard
          label="Transfers In"
          value={formatCurrency(totalIn)}
          tone="positive"
          icon={<ArrowDownRight className="size-4 opacity-80" />}
        />
        <MetricCard
          label="Transfers Out"
          value={formatCurrency(totalOut)}
          tone="negative"
          icon={<ArrowUpRight className="size-4 opacity-80" />}
        />
        <MetricCard
          label="Net"
          value={formatCurrency(net)}
          tone={net >= 0 ? "positive" : "negative"}
          icon={<Wallet className="size-4 opacity-80" />}
        />
      </div>
    </section>
  );
}
