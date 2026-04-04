import { prisma } from "@repo/db";
import { getEuropeMadridDateParts } from "@repo/utils";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const toInt = (value: string | null, fallback: number) => {
  const parsed = value ? Number.parseInt(value, 10) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
};

// GET /api/todos?status=OPEN&limit=20&skip=0
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const statusParam = url.searchParams.get("status") ?? "OPEN";
    const limit = Math.min(Math.max(1, toInt(url.searchParams.get("limit"), 20)), 100);
    const skip = Math.max(0, toInt(url.searchParams.get("skip"), 0));
    const includeDone = url.searchParams.get("includeDone") === "true";

    const { year: currentYear, month: currentMonth } = getEuropeMadridDateParts();

    const where: any = {
      OR: [{ due_year: { lt: currentYear } }, { due_year: currentYear, due_month: { lte: currentMonth } }],
    };

    if (!includeDone) {
      where.status = statusParam;
    }

    const [total, todos] = await Promise.all([
      prisma.todo.count({ where }),
      prisma.todo.findMany({
        where,
        include: {
          account: { select: { name: true } },
          from_account: { select: { name: true } },
          to_account: { select: { name: true } },
        },
        orderBy: [{ due_year: "asc" }, { due_month: "asc" }, { id: "asc" }],
        take: limit,
        skip,
      }),
    ]);

    return NextResponse.json({ data: todos, total }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch todos",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
