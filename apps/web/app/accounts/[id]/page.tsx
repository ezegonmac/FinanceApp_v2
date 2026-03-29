import AccountIncomesView from "@/components/incomes/AccountIncomesView";
import AccountTransactionsView from "@/components/transactions/AccountTransactionsView";
import AccountExpensesView from "@/components/expenses/AccountExpensesView";
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
        <div>
            <h1>{account.name}</h1>
            <p><b>Balance:</b> {account.balance?.toString() ?? "N/A"}</p>
            <p><b>Created At:</b> {account.created_at.toISOString()}</p>
            <p><b>Active:</b> {account.active ? "✅" : "❌"}</p>
            <br />

            <h2>Incomes for this Account</h2>
            <AccountIncomesView accountId={accountId} />

            <br />
            <br />

            <h2>Transactions for this Account</h2>
            <AccountTransactionsView accountId={accountId} />

            <br />
            <br />

            <h2>Expenses for this Account</h2>
            <AccountExpensesView accountId={accountId} />
        </div>
    );
}