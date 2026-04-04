import AccountIncomesView from "@/components/incomes/AccountIncomesView";
import AccountTransactionsView from "@/components/transactions/AccountTransactionsView";
import AccountExpensesView from "@/components/expenses/AccountExpensesView";
import AccountSummary from "@/components/accounts/AccountSummary";
import { prisma } from "@repo/db";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!id) return <p>Invalid ID</p>;
  const accountId = Number(id);
  if (Number.isNaN(accountId)) return <p>ID must be a number</p>;

  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) return <p>Account not found</p>;

  return (
    <div className="space-y-4">
      <section className="px-2 py-4 text-card-foreground">
        <AccountSummary
          name={account.name}
          balance={account.balance?.toString() ?? "N/A"}
          createdAtIso={account.created_at.toISOString()}
          active={account.active}
        />
      </section>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <section className="rounded-md border bg-card p-6 text-card-foreground">
          <AccountIncomesView accountId={accountId} />
        </section>
        <section className="rounded-md border bg-card p-6 text-card-foreground">
          <AccountExpensesView accountId={accountId} />
        </section>
      </div>

      <section className="rounded-md border bg-card p-6 text-card-foreground">
        <AccountTransactionsView accountId={accountId} />
      </section>
    </div>
  );
}