import { prisma } from "@repo/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/financial-products/assets/:id/position
 *
 * Returns aggregated position summary for a single asset across all accounts.
 */
export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const assetId = parseInt(id, 10);

    if (isNaN(assetId)) {
      return NextResponse.json({ error: "Invalid asset id" }, { status: 400 });
    }

    // Aggregate all COMPLETED investments for this asset across all accounts
    const investments = await prisma.investment.findMany({
      where: {
        asset_id: assetId,
        status: "COMPLETED",
      },
      select: {
        type: true,
        units: true,
        total_amount: true,
      },
    });

    let buyUnits = 0;
    let sellUnits = 0;
    let totalInvested = 0;

    for (const inv of investments) {
      if (inv.type === "BUY") {
        buyUnits += Number(inv.units);
        totalInvested += Number(inv.total_amount);
      } else {
        sellUnits += Number(inv.units);
      }
    }

    const totalUnits = buyUnits - sellUnits;

    // Fetch latest price
    const latestPrice = await prisma.assetPrice.findFirst({
      where: { asset_id: assetId },
      orderBy: { timestamp: "desc" },
      select: { price: true, timestamp: true },
    });

    const currentValue =
      latestPrice != null ? totalUnits * Number(latestPrice.price) : null;

    return NextResponse.json(
      {
        total_units: totalUnits.toString(),
        total_invested: totalInvested.toString(),
        current_value: currentValue != null ? currentValue.toString() : null,
        latest_price: latestPrice != null ? latestPrice.price.toString() : null,
        latest_price_at: latestPrice != null ? latestPrice.timestamp.toISOString() : null,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch position" },
      { status: 500 },
    );
  }
}

export function OPTIONS() {
  return NextResponse.json(
    {},
    { status: 405, headers: { Allow: "GET" } },
  );
}
