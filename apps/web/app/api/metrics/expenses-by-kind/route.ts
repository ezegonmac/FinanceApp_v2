import { prisma } from "@repo/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type ExpensesByKindResponse = {
  months: string[];
  fixed: number[];
  variable: number[];
  budgets: (number | null)[];
};

const toMonthLabel = (year: number, month: number) =>
  `${year}-${String(month).padStart(2, "0")}`;

export async function GET() {
  try {
    const months = await prisma.month.findMany({
      include: {
        expenses: {
          where: { status: "COMPLETED" },
          select: { kind: true, analytics_amount: true, amount: true },
        },
        budget: { select: { amount: true } },
      },
      orderBy: [{ year: "asc" }, { month: "asc" }],
    });

    if (months.length === 0) {
      return NextResponse.json(
        { months: [], fixed: [], variable: [], budgets: [] } satisfies ExpensesByKindResponse,
        { status: 200 }
      );
    }

    // Fill gaps between first and last month
    const first = months[0]!;
    const last = months[months.length - 1]!;

    const monthMap = new Map(
      months.map((m) => [`${m.year}-${m.month}`, m])
    );

    const monthLabels: string[] = [];
    const fixed: number[] = [];
    const variable: number[] = [];
    const budgets: (number | null)[] = [];

    let curYear = first.year;
    let curMonth = first.month;

    while (curYear < last.year || (curYear === last.year && curMonth <= last.month)) {
      monthLabels.push(toMonthLabel(curYear, curMonth));

      const record = monthMap.get(`${curYear}-${curMonth}`);

      let fixedTotal = 0;
      let variableTotal = 0;

      if (record) {
        for (const expense of record.expenses) {
          const value = Number(expense.analytics_amount ?? expense.amount);

          if (expense.kind === "FIXED") {
            fixedTotal += value;
          } else {
            variableTotal += value;
          }
        }
      }

      fixed.push(fixedTotal);
      variable.push(variableTotal);
      budgets.push(record?.budget ? Number(record.budget.amount) : null);

      curMonth++;
      if (curMonth > 12) {
        curMonth = 1;
        curYear++;
      }
    }

    return NextResponse.json(
      { months: monthLabels, fixed, variable, budgets } satisfies ExpensesByKindResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/metrics/expenses-by-kind error:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses by kind" },
      { status: 500 }
    );
  }
}

export function OPTIONS() {
  return NextResponse.json(
    {},
    { status: 405, headers: { Allow: "GET" } }
  );
}
