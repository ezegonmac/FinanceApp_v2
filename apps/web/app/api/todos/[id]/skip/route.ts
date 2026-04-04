import { prisma } from "@repo/db";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const skipSchema = z.object({
  reason: z.string().trim().min(3, "Skip reason is required"),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST /api/todos/:id/skip
export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const todoId = Number(id);

    if (Number.isNaN(todoId)) {
      return NextResponse.json({ error: "Invalid todo id" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = skipSchema.parse(body);

    const updated = await prisma.todo.updateMany({
      where: {
        id: todoId,
        status: "OPEN",
      },
      data: {
        status: "SKIPPED",
        skip_reason: parsed.reason,
      },
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: "Todo not found or not open" }, { status: 404 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: error.flatten(),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to skip todo",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
