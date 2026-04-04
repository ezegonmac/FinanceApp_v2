import { prisma } from "@repo/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST /api/todos/:id/reopen
export async function POST(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const todoId = Number(id);

    if (Number.isNaN(todoId)) {
      return NextResponse.json({ error: "Invalid todo id" }, { status: 400 });
    }

    const updated = await prisma.todo.updateMany({
      where: {
        id: todoId,
        status: { in: ["DONE", "SKIPPED"] },
      },
      data: {
        status: "OPEN",
        skip_reason: null,
        action_error: null,
      },
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: "Todo not found or not completed" }, { status: 404 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to move todo back to pending",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
