import { prisma } from "@repo/db";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic"; // recommended with Prisma

const incomeSchema = z.object({
  description: z.string().min(1),
  amount: z.number().nonnegative(),
  month_id: z.number().int(),
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

    const incomes = await prisma.income.findMany({
      where: { account_id: accountId },
      include: {
        month: true,
      },
    });

    return NextResponse.json(incomes, { status: 200 });
  } catch (error) {
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

    // Determine if the monthId is the current one or previous
    // to decide if we apply the transaction immediately or keep it pending
    const monthRecord = await prisma.month.findUnique({
        where: { id: parsed.month_id },
      });

      if (!monthRecord) {
        return NextResponse.json(
          { error: "Month not found" },
          { status: 400 }
        );
      }

    // Get current year and month
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 0-indexed, so +1

    // Check if the month_id corresponds to current month
    const isCurrentMonth =
      monthRecord.year === currentYear && monthRecord.month === currentMonth;

    // Check if the month_id corresponds to a previous month
    const isPreviousMonth =
      monthRecord.year < currentYear ||
      (monthRecord.year === currentYear && monthRecord.month < currentMonth);

    const isEffectiveNow = isCurrentMonth || isPreviousMonth;

    let newIncome;
    if (isEffectiveNow) {
      // Apply balances immediately in a incomes
      newIncome = await prisma.$transaction(async (tx) => {
        const income = await tx.income.create({
          data: {
            description: parsed.description,
            amount: parsed.amount,
            month_id: parsed.month_id,
            account_id: accountId,
            // status: "COMPLETED",
          },
        });

        await tx.account.update({
          where: { id: accountId },
          data: { balance: { increment: parsed.amount } },
        });

        return income;
      });
    } else {
      // Future incomes, keep pending
      newIncome = await prisma.income.create({
        data: {
          description: parsed.description,
          amount: parsed.amount,
          month_id: parsed.month_id,
          account_id: accountId,
          // status: "PENDING",
        },
      });
    }

    return NextResponse.json(newIncome, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error },
        { status: 400 }
      );
    }
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