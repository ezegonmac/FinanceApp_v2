import { prisma } from "@repo/db";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ year: string; month: string }> };

const budgetSchema = z.object({
  amount: z.number().nonnegative(),
});

// GET /api/months/:year/:month/budget
export async function GET(_request: Request, { params }: Params) {
  const { year: yearStr, month: monthStr } = await params;
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  try {
    const monthRecord = await prisma.month.findUnique({
      where: { year_month: { year, month } },
      include: { budget: true },
    });

    if (!monthRecord || !monthRecord.budget) {
      return NextResponse.json({ budget: null }, { status: 200 });
    }

    return NextResponse.json(
      { budget: { id: monthRecord.budget.id, amount: Number(monthRecord.budget.amount) } },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/months/:year/:month/budget error:", error);
    return NextResponse.json(
      { error: "Failed to fetch budget" },
      { status: 500 }
    );
  }
}

// PUT /api/months/:year/:month/budget (upsert)
export async function PUT(request: Request, { params }: Params) {
  const { year: yearStr, month: monthStr } = await params;
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  try {
    const body = await request.json();
    const parsed = budgetSchema.parse(body);

    // Ensure month exists
    const monthRecord = await prisma.month.upsert({
      where: { year_month: { year, month } },
      create: { year, month },
      update: {},
    });

    const budget = await prisma.monthBudget.upsert({
      where: { month_id: monthRecord.id },
      create: { month_id: monthRecord.id, amount: parsed.amount },
      update: { amount: parsed.amount },
    });

    return NextResponse.json(
      { budget: { id: budget.id, amount: Number(budget.amount) } },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT /api/months/:year/:month/budget error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to save budget" },
      { status: 500 }
    );
  }
}

export function OPTIONS() {
  return NextResponse.json(
    {},
    { status: 405, headers: { Allow: "GET, PUT" } }
  );
}
