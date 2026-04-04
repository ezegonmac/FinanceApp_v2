import RecurrentExpensesView from "@/components/recurrent-expenses/RecurrentExpensesView";
import RecurrentIncomesView from "@/components/recurrent-incomes/RecurrentIncomesView";
import RecurrentTransactionsView from "@/components/recurrent-transactions/RecurrentTransactionsView";

export default function RecurrentPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Recurrent Operations</h1>
      </header>

      <section className="rounded-md border bg-card p-6 text-card-foreground">
        <RecurrentIncomesView />
      </section>

      <section className="rounded-md border bg-card p-6 text-card-foreground">
        <RecurrentExpensesView />
      </section>

      <section className="rounded-md border bg-card p-6 text-card-foreground">
        <RecurrentTransactionsView />
      </section>
    </section>
  );
}
