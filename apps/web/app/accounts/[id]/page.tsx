import AccountIncomesView from "@/components/incomes/AccountIncomesView";
import AccountTransactionsView from "@/components/transactions/AccountTransactionsView";
import AccountExpensesView from "@/components/expenses/AccountExpensesView";
import AccountSummary from "@/components/accounts/AccountSummary";
import AccountMonthSummary from "@/components/accounts/AccountMonthSummary";
import { prisma } from "@repo/db";
import { formatYearMonth, getEuropeMadridDateParts } from "@repo/utils";

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

  const { year: currentYear, month: currentMonth } = getEuropeMadridDateParts();
  const currentMonthLabel = formatYearMonth(currentYear, currentMonth);

  const currentMonthRecord = await prisma.month.findUnique({
    where: {
      year_month: {
        year: currentYear,
        month: currentMonth,
      },
    },
    select: { id: true },
  });

  const toNumber = (value: unknown) => (value == null ? 0 : Number(value));

  let totalIncome = 0;
  let totalExpenses = 0;
  let totalTransfersIn = 0;
  let totalTransfersOut = 0;

  if (currentMonthRecord) {
    const monthId = currentMonthRecord.id;

    const [incomeAgg, expensesAgg, transfersInAgg, transfersOutAgg] = await Promise.all([
      prisma.income.aggregate({
        where: { account_id: accountId, month_id: monthId },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: { account_id: accountId, month_id: monthId },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { to_account_id: accountId, month_id: monthId },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { from_account_id: accountId, month_id: monthId },
        _sum: { amount: true },
      }),
    ]);

    totalIncome = toNumber(incomeAgg._sum.amount);
    totalExpenses = toNumber(expensesAgg._sum.amount);
    totalTransfersIn = toNumber(transfersInAgg._sum.amount);
    totalTransfersOut = toNumber(transfersOutAgg._sum.amount);
  }

  const monthNet = totalIncome + totalTransfersIn - totalExpenses - totalTransfersOut;

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

      <AccountMonthSummary
        monthLabel={currentMonthLabel}
        totalIncome={totalIncome}
        totalExpenses={totalExpenses}
        totalIn={totalTransfersIn}
        totalOut={totalTransfersOut}
        net={monthNet}
      />

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