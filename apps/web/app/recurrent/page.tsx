import RecurrentExpensesView from "@/components/recurrent-expenses/RecurrentExpensesView";
import RecurrentIncomesView from "@/components/recurrent-incomes/RecurrentIncomesView";

export default function RecurrentPage() {
  return (
    <div style={{ padding: "1rem" }}>
      <h1>Recurrent Operations</h1>

      <h2>Recurrent Incomes</h2>
      <RecurrentIncomesView />

      <br />
      <br />

      <h2>Recurrent Expenses</h2>
      <RecurrentExpensesView />
    </div>
  );
}
