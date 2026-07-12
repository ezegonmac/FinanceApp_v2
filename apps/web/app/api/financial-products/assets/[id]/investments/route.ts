import { prisma } from "@repo/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveTimeframeDates } from "../../../../_lib/financialProducts/priceSyncAlgorithm";
import type { Timeframe } from "../../../../_lib/financialProducts/types";

export const dynamic = "force-dynamic";

const investmentsQuerySchema = z.object({
  assetId: z.coerce.number().int().positive(),
  timeframe: z.enum(["TODAY", "1W", "1M", "3M", "6M", "1Y", "5Y", "ALL"]).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
}).refine(
  (data) => data.timeframe || (data.startDate && data.endDate),
  { message: "Either timeframe or both startDate and endDate must be provided" },
);

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
      timeframe: searchParams.get("timeframe") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
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
    let from: Date;
    let to: Date;

    if (parsed.timeframe) {
      const resolved = resolveTimeframeDates(parsed.timeframe as Timeframe);
      from = resolved.from;
      to = resolved.to;
    } else {
      from = parsed.startDate!;
      to = parsed.endDate!;
    }

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
        // Determine the best chart date.  If executed_at falls within the
        // investment's own month, use it (correctly placed manual or fixed
        // automated investments).  Otherwise fall back to the first of the
        // month so backfilled operations don't cluster on a single date.
        const monthFirst = new Date(Date.UTC(inv.month.year, inv.month.month - 1, 1));
        const monthLast = new Date(Date.UTC(inv.month.year, inv.month.month, 0, 23, 59, 59, 999));

        let chartDate: Date;
        if (inv.executed_at) {
          const execMs = inv.executed_at.getTime();
          chartDate = (execMs >= monthFirst.getTime() && execMs <= monthLast.getTime())
            ? inv.executed_at
            : monthFirst;
        } else {
          chartDate = inv.created_at ?? monthFirst;
        }

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
