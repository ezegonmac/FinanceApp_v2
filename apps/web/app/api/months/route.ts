import { prisma } from "@repo/db";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const monthSchema = z.object({
  year: z.number().int().min(2000).max(3000),
  month: z.number().int().min(1).max(12),
});

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