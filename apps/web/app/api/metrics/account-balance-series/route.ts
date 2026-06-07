import { prisma } from "@repo/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type AccountBalanceSeriesResponse = {
  months: string[];
  accounts: { id: number; name: string }[];
  series: Record<string, number[]>;
};

const toMonthLabel = (year: number, month: number) =>
  `${year}-${String(month).padStart(2, "0")}`;

export async function GET() {
  try {
    const months = await prisma.month.findMany({
      where: { monthSnapshots: { some: {} } },
      include: {
        monthSnapshots: {
          include: {
            account: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: [{ year: "asc" }, { month: "asc" }],
    });

    if (months.length === 0) {
      return NextResponse.json(
        { months: [], accounts: [], series: {} } satisfies AccountBalanceSeriesResponse,
        { status: 200 }
      );
    }

    const monthLabels = months.map((m) => toMonthLabel(m.year, m.month));

    const accountNameById = new Map<number, string>();
    for (const month of months) {
      for (const snapshot of month.monthSnapshots) {
        accountNameById.set(snapshot.account_id, snapshot.account.name);
      }
    }

    const accountIds = [...accountNameById.keys()];

    const currentAccounts = await prisma.account.findMany({
      where: { id: { in: accountIds } },
      select: { id: true, balance: true },
    });

    const currentBalanceById = new Map<number, number>(
      currentAccounts.map((account) => [account.id, Number(account.balance)])
    );

    const monthNetByAccount: Array<Map<number, number>> = months.map((month) => {
      const netByAccount = new Map<number, number>();

      for (const snapshot of month.monthSnapshots) {
        const net =
          Number(snapshot.total_incomes) +
          Number(snapshot.total_transactions_in) -
          Number(snapshot.total_transactions_out) -
          Number(snapshot.total_expenses);

        netByAccount.set(snapshot.account_id, net);
      }

      return netByAccount;
    });

    const accounts = [...accountNameById.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "en"));

    const series: Record<string, number[]> = {};

    for (const account of accounts) {
      const values = new Array<number>(monthLabels.length);
      let runningBalance = currentBalanceById.get(account.id) ?? 0;

      for (let i = monthLabels.length - 1; i >= 0; i -= 1) {
        values[i] = runningBalance;
        runningBalance -= monthNetByAccount[i]?.get(account.id) ?? 0;
      }

      series[String(account.id)] = values;
    }

    return NextResponse.json(
      {
        months: monthLabels,
        accounts,
        series,
      } satisfies AccountBalanceSeriesResponse,
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch account balance series" },
      { status: 500 }
    );
  }
}