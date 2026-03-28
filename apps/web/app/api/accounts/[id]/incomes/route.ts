import { prisma } from "@repo/db";
import { getEuropeMadridDateParts } from "@repo/utils";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic"; // recommended with Prisma

const incomeSchema = z.object({
  description: z.string().min(1),
  amount: z.number().nonnegative(),
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
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
        job_run: true,
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

    const monthRecord = await prisma.month.upsert({
      where: {
        year_month: {
          year: parsed.year,
          month: parsed.month,
        },
      },
      update: {},
      create: {
        year: parsed.year,
        month: parsed.month,
      },
    });

    const { year: currentYear, month: currentMonth } = getEuropeMadridDateParts();

    // Check if the month corresponds to current month
    const isCurrentMonth =
      monthRecord.year === currentYear && monthRecord.month === currentMonth;

    // Check if the month corresponds to a previous month
    const isPreviousMonth =
      monthRecord.year < currentYear ||
      (monthRecord.year === currentYear && monthRecord.month < currentMonth);

    const isEffectiveNow = isCurrentMonth || isPreviousMonth;

    let newIncome;
    if (isEffectiveNow) {
      // Apply balances immediately for current/past month incomes
      newIncome = await prisma.$transaction(async (tx) => {
        const income = await tx.income.create({
          data: {
            description: parsed.description,
            amount: parsed.amount,
            month_id: monthRecord.id,
            account_id: accountId,
            status: "COMPLETED",
            processed_at: new Date(),
          },
        });

        await tx.account.update({
          where: { id: accountId },
          data: { balance: { increment: parsed.amount } },
        });

        return income;
      });
    } else {
      // Future incomes, keep pending until scheduler applies them
      newIncome = await prisma.income.create({
        data: {
          description: parsed.description,
          amount: parsed.amount,
          month_id: monthRecord.id,
          account_id: accountId,
          status: "PENDING",
        },
      });
    }

    console.log("Created income:", newIncome);

    return NextResponse.json(newIncome, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {

      console.error("Validation error:", error);

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