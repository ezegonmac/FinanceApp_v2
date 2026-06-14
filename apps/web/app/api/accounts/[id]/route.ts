import { prisma } from "@repo/db";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateAccountSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  active: z.boolean().optional(),
}).refine(
  (data) => data.name === undefined || data.name.trim().length > 0,
  { message: "Name cannot be empty or whitespace-only", path: ["name"] }
);

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteContext) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: "Invalid ID" },
      { status: 400 }
    );
  }

  const accountId = Number(id);

  if (Number.isNaN(accountId)) {
    return NextResponse.json(
      { error: "ID must be a number" },
      { status: 400 }
    );
  }

  try {
    const account = await prisma.account.findUnique({
        where: { id: accountId },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(account, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch account" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const accountId = Number(id);

    if (Number.isNaN(accountId)) {
      return NextResponse.json(
        { error: "ID must be a number" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = updateAccountSchema.parse(body);

    const existingAccount = await prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!existingAccount) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.name !== undefined) updateData.name = parsed.name;
    if (parsed.description !== undefined) updateData.description = parsed.description;
    if (parsed.icon !== undefined) updateData.icon = parsed.icon;
    if (parsed.active !== undefined) updateData.active = parsed.active;

    const updatedAccount = await prisma.account.update({
      where: { id: accountId },
      data: updateData,
    });

    return NextResponse.json(updatedAccount, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update account" },
      { status: 500 }
    );
  }
}

export function OPTIONS() {
  return NextResponse.json({}, { status: 405, headers: { Allow: "GET, PATCH" } });
}