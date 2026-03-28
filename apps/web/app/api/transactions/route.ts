import { prisma } from "@repo/db";
import { getEuropeMadridDateParts } from "@repo/utils";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic"; // recommended with Prisma

const transactionSchema = z.object({
    amount: z.number().nonnegative(),
    description: z.string().optional(),
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
    from_account_id: z.number(),
    to_account_id: z.number(),
    status: z.enum(["PENDING", "COMPLETED", "CANCELLED"]).default("PENDING"),
});

// GET /api/transactions
export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany();
    return NextResponse.json(transactions, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

// POST /api/transactions
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate incoming request
    const parsed = transactionSchema.parse(body);

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

    let newTransaction;
    if (isEffectiveNow) {
      // Apply balances immediately in a transaction
      newTransaction = await prisma.$transaction(async (tx) => {
        const transaction = await tx.transaction.create({
          data: {
            from_account_id: parsed.from_account_id,
            to_account_id: parsed.to_account_id,
            amount: parsed.amount,
            description: parsed.description,
            month_id: monthRecord.id,
            status: "COMPLETED",
          },
        });

        await tx.account.update({
          where: { id: parsed.from_account_id },
          data: { balance: { decrement: parsed.amount } },
        });

        await tx.account.update({
          where: { id: parsed.to_account_id },
          data: { balance: { increment: parsed.amount } },
        });

        return transaction;
      });
    } else {
      // Future transaction, keep pending
      newTransaction = await prisma.transaction.create({
        data: {
          from_account_id: parsed.from_account_id,
          to_account_id: parsed.to_account_id,
          amount: parsed.amount,
          description: parsed.description,
          month_id: monthRecord.id,
          status: "PENDING",
        },
      });
    }

    return NextResponse.json(newTransaction, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to create transaction" },
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