import AccountsTable from "@/components/AccountsTable";
import AccountQuickInsightsStrip from "@/components/accounts/AccountQuickInsightsStrip";
import { HeaderKPI } from "@/components/ui/header-kpi";
import { prisma } from "@repo/db";
import { getEuropeMadridDateParts } from "@repo/utils";

export default async function AccountsPage() {
  const { year: currentYear, month: currentMonth, day: currentDay } = getEuropeMadridDateParts();

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

  // Fetch total balance
  const accountsBalanceAgg = await prisma.account.aggregate({
    where: { active: true },
    _sum: { balance: true },
  });
  const totalBalance = toNumber(accountsBalanceAgg._sum.balance);

  // Calculate delta vs last month using MonthSnapshot
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  const lastMonthSnapshots = await prisma.monthSnapshot.findMany({
    where: {
      month: {
        year: prevYear,
        month: prevMonth,
      },
      account: { active: true },
    },
    select: {
      total_incomes: true,
      total_expenses: true,
      total_transactions_in: true,
      total_transactions_out: true,
    },
  });

  // Delta = % change in total balance vs the start of this month.
  // Start-of-month balance = current balance minus this month's net movement
  // (sum of income + transfers in − expenses − transfers out across current-month snapshots).
  let balanceDelta: { value: string; direction: "up" | "down" | "neutral"; context: string } | undefined;

  if (lastMonthSnapshots.length > 0) {
    let thisMonthNet = 0;
    if (currentMonthRecord) {
      const currentSnapshots = await prisma.monthSnapshot.findMany({
        where: {
          month_id: currentMonthRecord.id,
          account: { active: true },
        },
        select: {
          total_incomes: true,
          total_expenses: true,
          total_transactions_in: true,
          total_transactions_out: true,
        },
      });
      thisMonthNet = currentSnapshots.reduce((sum, s) => {
        return sum
          + toNumber(s.total_incomes)
          + toNumber(s.total_transactions_in)
          - toNumber(s.total_expenses)
          - toNumber(s.total_transactions_out);
      }, 0);
    }

    const startOfMonthBalance = totalBalance - thisMonthNet;
    if (startOfMonthBalance !== 0) {
      const pctChange = ((totalBalance - startOfMonthBalance) / Math.abs(startOfMonthBalance)) * 100;
      const direction = pctChange > 0 ? "up" : pctChange < 0 ? "down" : "neutral";
      balanceDelta = {
        value: `${Math.abs(pctChange).toFixed(1)}%`,
        direction,
        context: "vs last month",
      };
    }
  }

  let totalIncome = 0;
  let totalExpenses = 0;

  if (currentMonthRecord) {
    const monthId = currentMonthRecord.id;

    const [incomeAgg, expensesAgg] = await Promise.all([
      prisma.income.aggregate({
        where: { month_id: monthId },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: { month_id: monthId },
        _sum: { amount: true },
      }),
    ]);

    totalIncome = toNumber(incomeAgg._sum.amount);
    totalExpenses = toNumber(expensesAgg._sum.amount);
  }

  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const daysLeft = Math.max(daysInMonth - currentDay, 0);
  const avgExpensePerMonthDay = totalExpenses / daysInMonth;
  const netPerMonthDay = (totalIncome - totalExpenses) / daysInMonth;
  const expenseToIncomeRatio = totalIncome > 0 ? totalExpenses / totalIncome : null;

  return (
    <section className="space-y-6">
      <header className="mb-7 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Accounts</h1>
          <p className="mt-1 text-sm text-muted-foreground">Overview of your balances and key financial insights.</p>
        </div>
        <HeaderKPI
          label="Total Balance"
          value={formatCurrency(totalBalance)}
          delta={balanceDelta}
          className="self-end"
        />
      </header>

      <AccountQuickInsightsStrip
        daysLeft={daysLeft}
        daysInMonth={daysInMonth}
        avgExpensePerMonthDay={avgExpensePerMonthDay}
        netPerMonthDay={netPerMonthDay}
        expenseToIncomeRatio={expenseToIncomeRatio}
      />

      <AccountsTable />
    </section>
  );
}
