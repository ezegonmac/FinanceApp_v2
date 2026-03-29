import { prisma } from "@repo/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export type MonthlySummaryRow = {
  year: number;
  month: number;
  total_incomes: number;
  total_expenses: number;
  net_change: number;
  running_total: number;
};

export type MonthlySummaryResponse = {
  rows: MonthlySummaryRow[];
  totals: { total_incomes: number; total_expenses: number; net_change: number };
  averages: { total_incomes: number; total_expenses: number; net_change: number };
};

// GET /api/metrics/monthly-summary
export async function GET() {
  try {
    // Get all months that have snapshots, ordered oldest first for running total calc
    const months = await prisma.month.findMany({
      where: { monthSnapshots: { some: {} } },
      include: { monthSnapshots: true },
      orderBy: [{ year: "asc" }, { month: "asc" }],
    });

    // Aggregate snapshots per month across all accounts
    const rowsAsc: Omit<MonthlySummaryRow, "running_total">[] = months.map((m) => {
      const total_incomes = m.monthSnapshots.reduce(
        (sum, s) => sum + Number(s.total_incomes),
        0
      );
      const total_expenses = m.monthSnapshots.reduce(
        (sum, s) => sum + Number(s.total_expenses),
        0
      );
      const net_change = total_incomes - total_expenses;
      return { year: m.year, month: m.month, total_incomes, total_expenses, net_change };
    });

    // Compute running total anchored to sum of current account balances
    const currentTotalBalance = (
      await prisma.account.aggregate({ where: { active: true }, _sum: { balance: true } })
    )._sum.balance ?? 0;

    // Build running totals from newest→oldest by working backwards from current balance
    const runningTotals: number[] = new Array(rowsAsc.length);
    let running = Number(currentTotalBalance);
    for (let i = rowsAsc.length - 1; i >= 0; i--) {
      runningTotals[i] = running;
      running -= rowsAsc[i]!.net_change;
    }

    // Combine and reverse to newest-first for display
    const rows: MonthlySummaryRow[] = rowsAsc
      .map((r, i) => ({ ...r, running_total: runningTotals[i]! }))
      .reverse();

    // Aggregations (exclude running_total from avg/total)
    const count = rows.length;
    const totals = rows.reduce(
      (acc, r) => ({
        total_incomes: acc.total_incomes + r.total_incomes,
        total_expenses: acc.total_expenses + r.total_expenses,
        net_change: acc.net_change + r.net_change,
      }),
      { total_incomes: 0, total_expenses: 0, net_change: 0 }
    );
    const averages = {
      total_incomes: count > 0 ? totals.total_incomes / count : 0,
      total_expenses: count > 0 ? totals.total_expenses / count : 0,
      net_change: count > 0 ? totals.net_change / count : 0,
    };

    return NextResponse.json({ rows, totals, averages } satisfies MonthlySummaryResponse, {
      status: 200,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch monthly summary" }, { status: 500 });
  }
}
