import { prisma } from "@repo/db";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic"; // recommended with Prisma

const incomeSchema = z.object({
  description: z.string().min(1),
  amount: z.number().nonnegative(),
});

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/accounts/:id/incomes
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const accountId = Number(id);

    if (Number.isNaN(accountId)) {
      return NextResponse.json({ error: "Invalid account id" }, { status: 400 });
    }

    console.log("Fetching incomes for account ID:", accountId);

    const incomes = await prisma.income.findMany({
      where: { account_id: accountId },
    });

    return NextResponse.json(incomes, { status: 200 });
  } catch (error) {
    console.error("Error fetching incomes:", error);
    return NextResponse.json(
      { error: "Failed to fetch incomes" },
      { status: 500 }
    );
  }
}

// POST /api/accounts/:id/incomes
export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const accountId = Number(id);

    if (Number.isNaN(accountId)) {
      return NextResponse.json({ error: "Invalid account id" }, { status: 400 });
    }

    const body = await request.json();

    const parsed = incomeSchema.parse(body);

    const newIncome = await prisma.income.create({
      data: {
        ...parsed,
        account_id: accountId,
      },
    });

    return NextResponse.json(newIncome, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create income" },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 405,
      headers: {
        Allow: "GET, POST",
      },
    }
  );
}