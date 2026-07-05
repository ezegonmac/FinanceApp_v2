import { prisma } from "@repo/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/accounts/:id/investments/positions
export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const accountId = Number(id);

    if (Number.isNaN(accountId)) {
      return NextResponse.json({ error: "Invalid account id" }, { status: 400 });
    }

    // Verify account exists
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { id: true },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Query all COMPLETED investments for this account
    const investments = await prisma.investment.findMany({
      where: {
        account_id: accountId,
        status: "COMPLETED",
      },
      select: {
        asset_id: true,
        type: true,
        units: true,
        total_amount: true,
      },
    });

    // Group by asset_id and compute positions in memory
    const positionMap = new Map<
      number,
      { buyUnits: number; sellUnits: number; totalInvested: number }
    >();

    for (const inv of investments) {
      const entry = positionMap.get(inv.asset_id) ?? {
        buyUnits: 0,
        sellUnits: 0,
        totalInvested: 0,
      };

      if (inv.type === "BUY") {
        entry.buyUnits += Number(inv.units);
        entry.totalInvested += Number(inv.total_amount);
      } else {
        entry.sellUnits += Number(inv.units);
      }

      positionMap.set(inv.asset_id, entry);
    }

    // Filter out zero positions and build asset_id list
    const activePositions: Array<{
      asset_id: number;
      total_units: number;
      total_invested: number;
    }> = [];

    for (const [assetId, entry] of positionMap) {
      const totalUnits = entry.buyUnits - entry.sellUnits;
      if (totalUnits > 0) {
        activePositions.push({
          asset_id: assetId,
          total_units: totalUnits,
          total_invested: entry.totalInvested,
        });
      }
    }

    if (activePositions.length === 0) {
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    const assetIds = activePositions.map((p) => p.asset_id);

    // Fetch asset details for all active positions
    const assets = await prisma.asset.findMany({
      where: { id: { in: assetIds } },
      select: {
        id: true,
        ticker: true,
        name: true,
        asset_type: true,
        currency: true,
      },
    });

    const assetMap = new Map(assets.map((a) => [a.id, a]));

    // Fetch latest AssetPrice per asset
    const latestPrices = await Promise.all(
      assetIds.map((assetId) =>
        prisma.assetPrice.findFirst({
          where: { asset_id: assetId },
          orderBy: { timestamp: "desc" },
          select: { price: true, timestamp: true },
        })
      )
    );

    const priceMap = new Map(
      assetIds.map((assetId, idx) => [assetId, latestPrices[idx]])
    );

    // Build response
    const data = activePositions.map((position) => {
      const asset = assetMap.get(position.asset_id)!;
      const latestPrice = priceMap.get(position.asset_id);

      const currentValue =
        latestPrice != null
          ? position.total_units * Number(latestPrice.price)
          : null;

      return {
        asset_id: position.asset_id,
        asset: {
          id: asset.id,
          ticker: asset.ticker,
          name: asset.name,
          asset_type: asset.asset_type,
          currency: asset.currency,
        },
        total_units: position.total_units.toString(),
        total_invested: position.total_invested.toString(),
        current_value: currentValue != null ? currentValue.toString() : null,
        latest_price: latestPrice != null ? latestPrice.price.toString() : null,
        latest_price_at:
          latestPrice != null ? latestPrice.timestamp.toISOString() : null,
      };
    });

    return NextResponse.json({ data }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch positions" },
      { status: 500 }
    );
  }
}

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
