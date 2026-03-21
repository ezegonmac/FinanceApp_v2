import { prisma } from "@repo/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/months/:year/:month
export async function GET(
    request: Request,
  { params }: { params: Promise<{ year: string; month: string }> }
  ) {
  try {
    const { year: yearParam, month: monthParam } = await params;
    const year = Number(yearParam);
    const month = Number(monthParam);

    if (Number.isNaN(year)) {
      return NextResponse.json(
        { error: "Invalid value for year" },
        { status: 400 }
      );
    }

    if (Number.isNaN(month)) {
      return NextResponse.json(
        { error: "Invalid value for month" },
        { status: 400 }
      );
    }

    const monthEntity = await prisma.month.upsert({
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

    return NextResponse.json(monthEntity, { status: 200 });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch or create month" },
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