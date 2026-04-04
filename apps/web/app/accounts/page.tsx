import AccountsTable from "@/components/AccountsTable";
import AccountQuickInsightsStrip from "@/components/accounts/AccountQuickInsightsStrip";
import { prisma } from "@repo/db";
import { formatYearMonth, getEuropeMadridDateParts } from "@repo/utils";

export default async function AccountsPage() {
  const { year: currentYear, month: currentMonth, day: currentDay } = getEuropeMadridDateParts();
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
  const formatCurrency = (value: number) => {
    const hasDecimals = !Number.isInteger(value);
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: hasDecimals ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const accountsBalanceAgg = await prisma.account.aggregate({
    where: { active: true },
    _sum: { balance: true },
  });
  const totalBalance = toNumber(accountsBalanceAgg._sum.balance);

  let totalIncome = 0;
  let totalExpenses = 0;
  let recurrentIncomeCount = 0;
  let recurrentExpenseCount = 0;
  let recurrentTransactionCount = 0;

  if (currentMonthRecord) {
    const monthId = currentMonthRecord.id;

    const [incomeAgg, expensesAgg, recurrentIncomes, recurrentExpenses, recurrentTransactions] = await Promise.all([
      prisma.income.aggregate({
        where: { month_id: monthId },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: { month_id: monthId },
        _sum: { amount: true },
      }),
      prisma.recurrentIncome.count({
        where: {
          status: "ACTIVE",
          next_run_year: currentYear,
          next_run_month: currentMonth,
        },
      }),
      prisma.recurrentExpense.count({
        where: {
          status: "ACTIVE",
          next_run_year: currentYear,
          next_run_month: currentMonth,
        },
      }),
      prisma.recurrentTransaction.count({
        where: {
          status: "ACTIVE",
          next_run_year: currentYear,
          next_run_month: currentMonth,
        },
      }),
    ]);

    totalIncome = toNumber(incomeAgg._sum.amount);
    totalExpenses = toNumber(expensesAgg._sum.amount);
    recurrentIncomeCount = recurrentIncomes;
    recurrentExpenseCount = recurrentExpenses;
    recurrentTransactionCount = recurrentTransactions;
  }

  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const daysLeft = Math.max(daysInMonth - currentDay, 0);
  const avgExpensePerMonthDay = totalExpenses / daysInMonth;
  const netPerMonthDay = (totalIncome - totalExpenses) / daysInMonth;
  const expenseToIncomeRatio = totalIncome > 0 ? totalExpenses / totalIncome : null;
  const scheduledRecurrentCount = recurrentIncomeCount + recurrentExpenseCount + recurrentTransactionCount;

  return (
    <section className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Accounts</h1>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total balance</p>
          <p className="text-2xl font-semibold tabular-nums text-foreground">{formatCurrency(totalBalance)}</p>
        </div>
      </header>

      <AccountQuickInsightsStrip
        monthLabel={currentMonthLabel}
        daysLeft={daysLeft}
        daysInMonth={daysInMonth}
        avgExpensePerMonthDay={avgExpensePerMonthDay}
        netPerMonthDay={netPerMonthDay}
        expenseToIncomeRatio={expenseToIncomeRatio}
        scheduledRecurrentCount={scheduledRecurrentCount}
      />

      <section className="rounded-md border bg-card p-6 text-card-foreground">
        <AccountsTable />
      </section>
    </section>
  );
}