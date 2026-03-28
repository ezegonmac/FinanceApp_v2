import MetricsBalances from "./metrics-balances";
import MetricsMonthlySummary from "./metrics-monthly-summary";

export default function MetricsPage() {
  return (
    <div style={{ padding: "1rem" }}>
      <h1>Metrics</h1>

      <h2>Account Balances</h2>
      <MetricsBalances />

      <h2>Monthly Summary</h2>
      <MetricsMonthlySummary />
    </div>
  );
}
