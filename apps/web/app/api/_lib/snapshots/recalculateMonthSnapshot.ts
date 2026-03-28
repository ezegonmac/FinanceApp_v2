import { prisma } from "@repo/db";

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
  monthId: number
): Promise<void> {
  const [incomesAgg, txInAgg, txOutAgg] = await Promise.all([
    prisma.income.aggregate({
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
      total_transactions_in: totalIn,
      total_transactions_out: totalOut,
    },
    update: {
      total_incomes: totalIncomes,
      total_transactions_in: totalIn,
      total_transactions_out: totalOut,
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
  monthId: number
): Promise<void> {
  // Collect distinct account IDs with completed activity in this month
  const [incomeAccounts, txFromAccounts, txToAccounts] = await Promise.all([
    prisma.income.findMany({
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
    ...txFromAccounts.map((r) => r.from_account_id),
    ...txToAccounts.map((r) => r.to_account_id),
  ]);

  await Promise.all(
    [...accountIds].map((accountId) =>
      recalculateMonthSnapshot(accountId, monthId)
    )
  );
}
