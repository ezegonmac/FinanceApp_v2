import { prisma } from "@repo/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // recommended with Prisma

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/accounts/:id/transactions
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const accountId = Number(id);

    if (Number.isNaN(accountId)) {
      return NextResponse.json({ error: "Invalid account id" }, { status: 400 });
    }

    const url = new URL(request.url);
    const startMonth = url.searchParams.get("startMonth") ?? "1900-01";
    const endMonth = url.searchParams.get("endMonth") ?? "9999-12";
    const direction = url.searchParams.get("direction"); // "incoming" | "outgoing" | null
    const cursorParam = url.searchParams.get("cursor");
    const cursor = cursorParam ? Number(cursorParam) : null;
    const limit = Math.min(Number(url.searchParams.get("limit") ?? "30"), 100);

    const [startYear, startM] = startMonth.split("-").map(Number);
    const [endYear, endM] = endMonth.split("-").map(Number);

    const monthFilter = {
      AND: [
        { OR: [{ year: { gt: startYear } }, { year: startYear, month: { gte: startM } }] },
        { OR: [{ year: { lt: endYear } }, { year: endYear, month: { lte: endM } }] },
      ],
    };

    const accountFilter =
      direction === "incoming"
        ? { to_account_id: accountId }
        : direction === "outgoing"
          ? { from_account_id: accountId }
          : { OR: [{ from_account_id: accountId }, { to_account_id: accountId }] };

    const where = { ...accountFilter, month: monthFilter };

    const orderBy = [
      { month: { year: "desc" as const } },
      { month: { month: "desc" as const } },
      { description: "asc" as const },
      { amount: "asc" as const },
      { id: "asc" as const },
    ];

    const [items, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy,
        include: { month: true, from_account: true, to_account: true },
        take: limit + 1,
        ...(cursor != null ? { cursor: { id: cursor }, skip: 1 } : {}),
      }),
      prisma.transaction.count({ where }),
    ]);

    const hasMore = items.length > limit;
    const data = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return NextResponse.json({ data, total, nextCursor }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

// Handle unsupported methods
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