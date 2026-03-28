import { prisma } from "@repo/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/metrics/balances
export async function GET() {
  try {
    const accounts = await prisma.account.findMany({
      where: { active: true },
      select: { id: true, name: true, balance: true },
      orderBy: { name: "asc" },
    });

    const total = accounts.reduce((sum, a) => sum + Number(a.balance), 0);

    return NextResponse.json({ accounts, total }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch balances" }, { status: 500 });
  }
}
