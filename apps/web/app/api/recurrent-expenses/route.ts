import { prisma } from "@repo/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const recurrentExpenses = await prisma.recurrentExpense.findMany({
      include: {
        account: {
          select: {
            name: true,
          },
        },
        last_applied_month: true,
      },
      orderBy: { id: "desc" },
    });

    const response = recurrentExpenses.map((row) => ({
      id: row.id,
      account_id: row.account_id,
      amount: row.amount,
      description: row.description,
      kind: row.kind,
      status: row.status,
      start_month: row.start_month,
      end_month: row.end_month,
      next_run_year: row.next_run_year,
      next_run_month: row.next_run_month,
      last_applied_month_id: row.last_applied_month_id,
      created_at: row.created_at,
      account_name: row.account.name,
    }));

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch recurrent expenses",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 405,
      headers: {
        Allow: "GET",
      },
    }
  );
}
