import AccountIncomesView from "@/components/incomes/AccountIncomesView";
import AccountTransactionsView from "@/components/transactions/AccountTransactionsView";
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
            <h1>Account: {account.name}</h1>
            <p>Balance: {account.balance?.toString() ?? "N/A"}</p>
            <p>Created At: {account.created_at.toISOString()}</p>
            <p>Active: {account.active ? "✅" : "❌"}</p>
            <br />

            <h2>Incomes for this Account</h2>
            <AccountIncomesView accountId={accountId} />

            <br />
            <br />

            <h2>Transactions for this Account</h2>
            <AccountTransactionsView accountId={accountId} />
        </div>
    );
}