import { prisma } from "@repo/db";
import { NextResponse } from "next/server";
import { recalculateMonthSnapshot } from "@/app/api/_lib/snapshots/recalculateMonthSnapshot";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST /api/todos/:id/complete
export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const todoId = Number(id);

    if (Number.isNaN(todoId)) {
      return NextResponse.json({ error: "Invalid todo id" }, { status: 400 });
    }

    const todo = await prisma.todo.findUnique({
      where: { id: todoId },
      select: {
        id: true,
        type: true,
        status: true,
        completed_at: true,
        title: true,
        description: true,
        amount: true,
        due_year: true,
        due_month: true,
        account_id: true,
        from_account_id: true,
        to_account_id: true,
      },
    });

    if (!todo || todo.status !== "OPEN") {
      return NextResponse.json({ error: "Todo not found or not open" }, { status: 404 });
    }

    const monthRecord = await prisma.month.upsert({
      where: {
        year_month: {
          year: todo.due_year,
          month: todo.due_month,
        },
      },
      update: {},
      create: {
        year: todo.due_year,
        month: todo.due_month,
      },
    });

    const amount = Number(todo.amount ?? 0);

    const result = await prisma.$transaction(async (tx) => {
      const claim = await tx.todo.updateMany({
        where: {
          id: todoId,
          status: "OPEN",
        },
        data: {
          status: "DONE",
          completed_at: new Date(),
          skip_reason: null,
          action_error: null,
        },
      });

      if (claim.count === 0) {
        return { claimed: false } as const;
      }

      // If this todo was completed before and later reopened, only switch status back to DONE.
      // The original movement has already been recorded.
      if (todo.completed_at) {
        return { claimed: true, accountIds: [] as number[] } as const;
      }

      if (todo.type === "EXPENSE") {
        if (!todo.account_id || amount <= 0) {
          throw new Error("Invalid expense todo payload");
        }

        await tx.expense.create({
          data: {
            account_id: todo.account_id,
            month_id: monthRecord.id,
            amount,
            analytics_amount: amount,
            description: todo.description ?? todo.title,
            kind: "FIXED",
            status: "COMPLETED",
            processed_at: new Date(),
          },
        });

        await tx.account.update({
          where: { id: todo.account_id },
          data: { balance: { decrement: amount } },
        });

        return { claimed: true, accountIds: [todo.account_id] } as const;
      }

      if (!todo.from_account_id || !todo.to_account_id || amount <= 0) {
        throw new Error("Invalid transaction todo payload");
      }

      await tx.transaction.create({
        data: {
          from_account_id: todo.from_account_id,
          to_account_id: todo.to_account_id,
          month_id: monthRecord.id,
          amount,
          description: todo.description ?? todo.title,
          status: "COMPLETED",
          processed_at: new Date(),
        },
      });

      await tx.account.update({
        where: { id: todo.from_account_id },
        data: { balance: { decrement: amount } },
      });

      await tx.account.update({
        where: { id: todo.to_account_id },
        data: { balance: { increment: amount } },
      });

      return { claimed: true, accountIds: [todo.from_account_id, todo.to_account_id] } as const;
    });

    if (!result.claimed) {
      return NextResponse.json({ error: "Todo is no longer open" }, { status: 409 });
    }

    for (const accountId of new Set(result.accountIds)) {
      await recalculateMonthSnapshot(accountId, monthRecord.id);
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to complete todo",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
