import { prisma } from "@repo/db";

type RecalculateSnapshotOptions = {
  isFinal?: boolean;
};

type RecalculateAllOptions = {
  includeAllActiveAccounts?: boolean;
  isFinal?: boolean;
};

/**
 * Recalculates and upserts the MonthSnapshot for a given account and month.
 * Each snapshot is independent (no running balance), so editing one month
 * only requires recalculating that month — no cascade needed.
 *
 * @param accountId - The account to recalculate for
 * @param monthId   - The Month.id to recalculate
 */
export async function recalculateMonthSnapshot(
  accountId: number,
  monthId: number,
  options: RecalculateSnapshotOptions = {}
): Promise<void> {
  const [incomesAgg, expensesAgg, txInAgg, txOutAgg] = await Promise.all([
    prisma.income.aggregate({
      where: {
        account_id: accountId,
        month_id: monthId,
        status: "COMPLETED",
      },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: {
        account_id: accountId,
        month_id: monthId,
        status: "COMPLETED",
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        to_account_id: accountId,
        month_id: monthId,
        status: "COMPLETED",
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        from_account_id: accountId,
        month_id: monthId,
        status: "COMPLETED",
      },
      _sum: { amount: true },
    }),
  ]);

  const totalIncomes = incomesAgg._sum.amount ?? 0;
  const totalExpenses = expensesAgg._sum.amount ?? 0;
  const totalIn = txInAgg._sum.amount ?? 0;
  const totalOut = txOutAgg._sum.amount ?? 0;

  await prisma.monthSnapshot.upsert({
    where: {
      month_account: {
        month_id: monthId,
        account_id: accountId,
      },
    },
    create: {
      month_id: monthId,
      account_id: accountId,
      total_incomes: totalIncomes,
      total_expenses: totalExpenses,
      total_transactions_in: totalIn,
      total_transactions_out: totalOut,
      is_final: options.isFinal ?? false,
      closed_at: options.isFinal ? new Date() : null,
    },
    update: {
      total_incomes: totalIncomes,
      total_expenses: totalExpenses,
      total_transactions_in: totalIn,
      total_transactions_out: totalOut,
      is_final: options.isFinal ?? false,
      closed_at: options.isFinal ? new Date() : null,
    },
  });
}

/**
 * Recalculates snapshots for all accounts that have completed activity
 * in the given month. Useful after the scheduler runs.
 *
 * @param monthId - The Month.id to recalculate all snapshots for
 */
export async function recalculateAllSnapshotsForMonth(
  monthId: number,
  options: RecalculateAllOptions = {}
): Promise<void> {
  // Collect distinct account IDs with completed activity in this month
  const [incomeAccounts, expenseAccounts, txFromAccounts, txToAccounts] = await Promise.all([
    prisma.income.findMany({
      where: { month_id: monthId, status: "COMPLETED" },
      select: { account_id: true },
      distinct: ["account_id"],
    }),
    prisma.expense.findMany({
      where: { month_id: monthId, status: "COMPLETED" },
      select: { account_id: true },
      distinct: ["account_id"],
    }),
    prisma.transaction.findMany({
      where: { month_id: monthId, status: "COMPLETED" },
      select: { from_account_id: true },
      distinct: ["from_account_id"],
    }),
    prisma.transaction.findMany({
      where: { month_id: monthId, status: "COMPLETED" },
      select: { to_account_id: true },
      distinct: ["to_account_id"],
    }),
  ]);

  const accountIds = new Set<number>([
    ...incomeAccounts.map((r) => r.account_id),
    ...expenseAccounts.map((r) => r.account_id),
    ...txFromAccounts.map((r) => r.from_account_id),
    ...txToAccounts.map((r) => r.to_account_id),
  ]);

  if (options.includeAllActiveAccounts) {
    const activeAccounts = await prisma.account.findMany({
      where: { active: true },
      select: { id: true },
    });

    for (const activeAccount of activeAccounts) {
      accountIds.add(activeAccount.id);
    }
  }

  await Promise.all(
    [...accountIds].map((accountId) =>
      recalculateMonthSnapshot(accountId, monthId, {
        isFinal: options.isFinal,
      })
    )
  );
}

export async function finalizeMonthSnapshots(
  year: number,
  month: number
): Promise<void> {
  const monthRecord = await prisma.month.findUnique({
    where: {
      year_month: {
        year,
        month,
      },
    },
  });

  if (!monthRecord) {
    return;
  }

  await recalculateAllSnapshotsForMonth(monthRecord.id, {
    includeAllActiveAccounts: true,
    isFinal: true,
  });
}
