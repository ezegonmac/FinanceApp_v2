import AccountsTable from "@/components/AccountsTable";

export default function AccountsPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Accounts</h1>
      </header>

      <section className="rounded-md border bg-card p-6 text-card-foreground">
        <AccountsTable />
      </section>
    </section>
  );
}