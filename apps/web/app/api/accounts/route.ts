import { prisma } from "@repo/db";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic"; // recommended with Prisma

const accountSchema = z.object({
  name: z.string().min(1),
  icon: z.string().nullable().optional(),
  balance: z.number().nonnegative().optional(),
});

// GET /api/accounts
export async function GET() {
  try {
    const accounts = await prisma.account.findMany();

    return NextResponse.json(accounts, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}

// POST /api/accounts
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // validation
    const parsed = accountSchema.parse(body);
    const newAccount = await prisma.account.create({
      data: {
        name: parsed.name,
        icon: parsed.icon ?? undefined,
        balance: parsed.balance ?? 0,
      },
    });

    return NextResponse.json(newAccount, { status: 201 });

  } catch (error) {
    console.error("POST /api/accounts error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create account" },
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