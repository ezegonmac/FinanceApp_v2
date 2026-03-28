import { prisma } from "@repo/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/months/:year/:month/snapshots
export async function GET(
  request: Request,
  { params }: { params: Promise<{ year: string; month: string }> }
) {
  try {
    const { year: yearParam, month: monthParam } = await params;
    const year = Number(yearParam);
    const month = Number(monthParam);

    if (Number.isNaN(year) || Number.isNaN(month)) {
      return NextResponse.json({ error: "Invalid year or month" }, { status: 400 });
    }

    const monthRecord = await prisma.month.findUnique({
      where: { year_month: { year, month } },
    });

    if (!monthRecord) {
      return NextResponse.json([], { status: 200 });
    }

    const snapshots = await prisma.monthSnapshot.findMany({
      where: { month_id: monthRecord.id },
      include: { account: true },
      orderBy: { account: { name: "asc" } },
    });

    return NextResponse.json(snapshots, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch snapshots" }, { status: 500 });
  }
}
