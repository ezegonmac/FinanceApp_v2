import { prisma } from "@repo/db";
import { getEuropeMadridDateParts } from "@repo/utils";
import { NextResponse } from "next/server";
import { z } from "zod";
import { recalculateMonthSnapshot } from "@/app/api/_lib/snapshots/recalculateMonthSnapshot";

export const dynamic = "force-dynamic";

const incomeSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
});

function getEffectiveStatus(year: number, month: number) {
  const { year: currentYear, month: currentMonth } = getEuropeMadridDateParts();

  const isCurrentMonth = year === currentYear && month === currentMonth;
  const isPreviousMonth =
    year < currentYear || (year === currentYear && month < currentMonth);

  return isCurrentMonth || isPreviousMonth ? "COMPLETED" : "PENDING";
}

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const incomeId = Number(id);

    if (Number.isNaN(incomeId)) {
      return NextResponse.json({ error: "Invalid income id" }, { status: 400 });
    }

    const income = await prisma.income.findUnique({
      where: { id: incomeId },
      include: {
        month: true,
        account: true,
        job_run: true,
      },
    });

    if (!income) {
      return NextResponse.json({ error: "Income not found" }, { status: 404 });
    }

    return NextResponse.json(income, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch income", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const incomeId = Number(id);

    if (Number.isNaN(incomeId)) {
      return NextResponse.json({ error: "Invalid income id" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = incomeSchema.parse(body);

    const existingIncome = await prisma.income.findUnique({
      where: { id: incomeId },
    });

    if (!existingIncome) {
      return NextResponse.json({ error: "Income not found" }, { status: 404 });
    }

    const targetMonth = await prisma.month.upsert({
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

    const nextStatus = getEffectiveStatus(targetMonth.year, targetMonth.month);

    const updatedIncome = await prisma.$transaction(async (tx) => {
      if (existingIncome.status === "COMPLETED") {
        await tx.account.update({
          where: { id: existingIncome.account_id },
          data: { balance: { decrement: existingIncome.amount } },
        });
      }

      const income = await tx.income.update({
        where: { id: incomeId },
        data: {
          description: parsed.description,
          amount: parsed.amount,
          month_id: targetMonth.id,
          status: nextStatus,
          processed_at: nextStatus === "COMPLETED" ? new Date() : null,
          processing_error: null,
        },
        include: {
          month: true,
          account: true,
          job_run: true,
        },
      });

      if (nextStatus === "COMPLETED") {
        await tx.account.update({
          where: { id: existingIncome.account_id },
          data: { balance: { increment: parsed.amount } },
        });
      }

      return income;
    });

    const affectedMonthIds = new Set<number>();
    if (existingIncome.status === "COMPLETED") {
      affectedMonthIds.add(existingIncome.month_id);
    }
    if (nextStatus === "COMPLETED") {
      affectedMonthIds.add(targetMonth.id);
    }

    for (const monthId of affectedMonthIds) {
      await recalculateMonthSnapshot(existingIncome.account_id, monthId);
    }

    return NextResponse.json(updatedIncome, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update income", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const incomeId = Number(id);

    if (Number.isNaN(incomeId)) {
      return NextResponse.json({ error: "Invalid income id" }, { status: 400 });
    }

    const income = await prisma.income.findUnique({
      where: { id: incomeId },
    });

    if (!income) {
      return NextResponse.json({ error: "Income not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // Revert account balance if income was already applied
      if (income.status === "COMPLETED") {
        await tx.account.update({
          where: { id: income.account_id },
          data: { balance: { decrement: income.amount } },
        });
      }

      await tx.recurrentIncomeRun.updateMany({
        where: { income_id: incomeId },
        data: { income_id: null },
      });

      await tx.income.delete({
        where: { id: incomeId },
      });
    });

    if (income.status === "COMPLETED") {
      await recalculateMonthSnapshot(income.account_id, income.month_id);
    }

    return NextResponse.json({ deleted: true, income_id: incomeId }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete income", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export function OPTIONS() {
  return NextResponse.json({}, { status: 405, headers: { Allow: "GET, PUT, DELETE" } });
}
