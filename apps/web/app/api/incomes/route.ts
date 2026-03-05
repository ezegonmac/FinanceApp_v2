import { prisma } from "@repo/db";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic"; // recommended with Prisma

// GET /api/incomes
export async function GET() {
  try {
    const incomes = await prisma.income.findMany();

    return NextResponse.json(incomes, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch incomes" },
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
        Allow: "GET",
      },
    }
  );
}