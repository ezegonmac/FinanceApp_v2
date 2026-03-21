import { prisma } from "@repo/db";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const monthSchema = z.object({
  year: z.number().int().min(2000).max(3000),
  month: z.number().int().min(1).max(12),
});

// GET /api/months
export async function GET() {
  try {
    const months = await prisma.month.findMany({
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    return NextResponse.json(months);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch months" },
      { status: 500 }
    );
  }
}

// POST /api/months
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { year, month } = monthSchema.parse(body);

    const monthRecord = await prisma.month.upsert({
      where: {
        year_month: {
          year,
          month,
        },
      },
      update: {},
      create: {
        year,
        month,
      },
    });

    return NextResponse.json(monthRecord, { status: 200 });

  } catch (error) {
    console.error("Month creation error:", error);

    return NextResponse.json(
      { error: "Failed to create or fetch month" },
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
        Allow: "POST",
      },
    }
  );
}