import { prisma } from "@repo/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/financial-products/assets/summary
 *
 * Returns favorited assets with their latest price and daily change.
 * Used by the watchlist panel for at-a-glance info.
 */
export async function GET() {
  try {
    const assets = await prisma.asset.findMany({
      where: { is_favorite: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        ticker: true,
        name: true,
        asset_type: true,
        currency: true,
        price_frequency: true,
        is_favorite: true,
      },
    });

    if (assets.length === 0) {
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    // Fetch latest 2 daily prices per asset to compute daily change
    const assetIds = assets.map((a) => a.id);

    const summaries = await Promise.all(
      assetIds.map(async (assetId) => {
        const prices = await prisma.assetPrice.findMany({
          where: { asset_id: assetId, granularity: "DAILY" },
          orderBy: { timestamp: "desc" },
          take: 2,
          select: { price: true, timestamp: true },
        });

        const latestPrice = prices[0] ? Number(prices[0].price) : null;
        const previousPrice = prices[1] ? Number(prices[1].price) : null;

        let dailyChange: number | null = null;
        let dailyChangePercent: number | null = null;

        if (latestPrice != null && previousPrice != null && previousPrice !== 0) {
          dailyChange = latestPrice - previousPrice;
          dailyChangePercent = (dailyChange / previousPrice) * 100;
        }

        return {
          assetId,
          latestPrice,
          latestPriceAt: prices[0]?.timestamp?.toISOString() ?? null,
          dailyChange,
          dailyChangePercent,
        };
      }),
    );

    const summaryMap = new Map(summaries.map((s) => [s.assetId, s]));

    const data = assets.map((asset) => {
      const summary = summaryMap.get(asset.id);
      return {
        ...asset,
        latestPrice: summary?.latestPrice ?? null,
        latestPriceAt: summary?.latestPriceAt ?? null,
        dailyChange: summary?.dailyChange ?? null,
        dailyChangePercent: summary?.dailyChangePercent ?? null,
      };
    });

    return NextResponse.json({ data }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch asset summaries" },
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
