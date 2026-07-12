import { prisma } from "@repo/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/recurrent-investments?status=ACTIVE&limit=15&skip=0
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const statusParam = url.searchParams.get("status") ?? "ALL";
    const limitParam = url.searchParams.get("limit") ?? "15";
    const skipParam = url.searchParams.get("skip") ?? "0";

    const limit = Math.min(Math.max(1, parseInt(limitParam, 10) || 15), 100);
    const skip = Math.max(0, parseInt(skipParam, 10) || 0);

    const where: any = {};
    if (statusParam !== "ALL") {
      where.status = statusParam;
    }

    const [total, recurrentInvestments] = await Promise.all([
      prisma.recurrentInvestment.count({ where }),
      prisma.recurrentInvestment.findMany({
        where,
        include: {
          account: {
            select: { name: true },
          },
          asset: {
            select: { id: true, name: true, ticker: true },
          },
          last_applied_month: true,
        },
        orderBy: { id: "desc" },
        take: limit,
        skip,
      }),
    ]);

    const response = recurrentInvestments.map((row) => ({
      id: row.id,
      account_id: row.account_id,
      asset_id: row.asset_id,
      type: row.type,
      total_amount: row.total_amount,
      description: row.description,
      automated: row.automated,
      status: row.status,
      start_month: row.start_month,
      end_month: row.end_month,
      next_run_year: row.next_run_year,
      next_run_month: row.next_run_month,
      last_applied_month_id: row.last_applied_month_id,
      created_at: row.created_at,
      account_name: row.account.name,
      asset_name: row.asset.name,
      asset_ticker: row.asset.ticker,
    }));

    return NextResponse.json({ data: response, total }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch recurrent investments",
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
