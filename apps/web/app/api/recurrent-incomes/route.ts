import { prisma } from "@repo/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/recurrent-incomes?status=ACTIVE&limit=15&skip=0
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const statusParam = url.searchParams.get("status") ?? "ALL";
    const limitParam = url.searchParams.get("limit") ?? "15";
    const skipParam = url.searchParams.get("skip") ?? "0";

    const limit = Math.min(Math.max(1, parseInt(limitParam, 10) || 15), 100);
    const skip = Math.max(0, parseInt(skipParam, 10) || 0);

    // Build where clause
    const where: any = {};
    if (statusParam !== "ALL") {
      where.status = statusParam;
    }

    // Fetch total count and paginated results in parallel
    const [total, recurrentIncomes] = await Promise.all([
      prisma.recurrentIncome.count({ where }),
      prisma.recurrentIncome.findMany({
        where,
        include: {
          account: {
            select: {
              name: true,
            },
          },
          last_applied_month: true,
        },
        orderBy: { id: "desc" },
        take: limit,
        skip,
      }),
    ]);

    const response = recurrentIncomes.map((row) => ({
      id: row.id,
      account_id: row.account_id,
      amount: row.amount,
      description: row.description,
      status: row.status,
      start_month: row.start_month,
      end_month: row.end_month,
      next_run_year: row.next_run_year,
      next_run_month: row.next_run_month,
      last_applied_month_id: row.last_applied_month_id,
      created_at: row.created_at,
      account_name: row.account.name,
    }));

    return NextResponse.json({ data: response, total }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch recurrent incomes",
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
