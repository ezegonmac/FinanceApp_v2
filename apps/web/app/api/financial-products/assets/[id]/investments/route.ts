import { prisma } from "@repo/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveTimeframeDates } from "../../../../_lib/financialProducts/priceSyncAlgorithm";
import type { Timeframe } from "../../../../_lib/financialProducts/types";

export const dynamic = "force-dynamic";

const investmentsQuerySchema = z.object({
  assetId: z.coerce.number().int().positive(),
  timeframe: z.enum(["TODAY", "1W", "1M", "3M", "6M", "1Y", "5Y", "ALL"]),
});

// GET /api/financial-products/assets/[id]/investments?timeframe=<timeframe>
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 1. Extract params and validate
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    const parsed = investmentsQuerySchema.parse({
      assetId: id,
      timeframe: searchParams.get("timeframe"),
    });

    // 2. Lookup asset by ID — 404 if not found
    const asset = await prisma.asset.findUnique({
      where: { id: parsed.assetId },
    });

    if (!asset) {
      return NextResponse.json(
        { error: "Asset not found" },
        { status: 404 },
      );
    }

    // 3. Resolve timeframe date range
    const { from, to } = resolveTimeframeDates(parsed.timeframe as Timeframe);

    // 4. Query COMPLETED investments for this asset.
    // Use executed_at (the actual buy/sell date) for chart positioning.
    // Fall back to created_at for legacy records that don't have executed_at.
    const investments = await prisma.investment.findMany({
      where: {
        asset_id: parsed.assetId,
        status: "COMPLETED",
      },
      include: { month: { select: { year: true, month: true } } },
      orderBy: { created_at: "asc" },
    });

    // 5. Filter by timeframe using the best available date, then map to response shape.
    const fromMs = from.getTime();
    const toMs = to.getTime();

    const data = investments
      .map((inv) => {
        // Best date: executed_at > created_at > month-derived fallback
        const chartDate = inv.executed_at
          ?? inv.created_at
          ?? new Date(inv.month.year, inv.month.month - 1, 1);
        return {
          id: inv.id,
          type: inv.type,
          units: inv.units.toString(),
          unit_price: inv.unit_price.toString(),
          total_amount: inv.total_amount.toString(),
          description: inv.description,
          processed_at: chartDate.toISOString(),
          _dateMs: chartDate.getTime(),
        };
      })
      .filter((item) => item._dateMs >= fromMs && item._dateMs <= toMs)
      .sort((a, b) => a._dateMs - b._dateMs)
      .map(({ _dateMs, ...rest }) => rest);

    // 6. Return 200 with data
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error(
      "GET /api/financial-products/assets/[id]/investments error:",
      error,
    );
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
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
        Allow: "GET, OPTIONS",
      },
    },
  );
}
