import MetricsBalances from "./metrics-balances";
import MetricsMonthlySummary from "./metrics-monthly-summary";

export default function MetricsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Metrics</h1>
      </div>

      <section className="rounded-md border bg-card p-6 text-card-foreground">
        <h2 className="mb-4 text-xl font-semibold tracking-tight">Account Balances</h2>
        <MetricsBalances />
      </section>

      <section className="rounded-md border bg-card p-6 text-card-foreground">
        <h2 className="mb-4 text-xl font-semibold tracking-tight">Monthly Summary</h2>
        <MetricsMonthlySummary />
      </section>
    </div>
  );
}
