import { prisma } from "@repo/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { syncPrices } from "@/app/api/_lib/financialProducts/priceSyncAlgorithm";

export const dynamic = "force-dynamic";

const sparklinesQuerySchema = z.object({
  assetIds: z.string().transform((val) =>
    val.split(",").map((id) => {
      const parsed = Number(id.trim());
      if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error(`Invalid asset ID: ${id}`);
      }
      return parsed;
    }),
  ),
});

export type SparklinePoint = {
  timestamp: string;
  percentChange: number;
};

export type SparklineData = {
  assetId: number;
  points: SparklinePoint[];
};

/**
 * GET /api/financial-products/assets/sparklines?assetIds=1,2,3
 *
 * Returns ~30 DAILY price points per asset for the last 1 month,
 * normalized as percentage change from the first available price.
 * If data is missing, attempts a sync. If still insufficient, returns
 * an empty points array (client renders a flat line).
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = sparklinesQuerySchema.parse({
      assetIds: searchParams.get("assetIds"),
    });

    const assetIds = parsed.assetIds;

    // Resolve date range: last 1 month
    const to = new Date();
    const from = new Date(to);
    from.setMonth(from.getMonth() - 1);

    // Fetch assets with their provider mappings for potential sync
    const assets = await prisma.asset.findMany({
      where: { id: { in: assetIds } },
      include: { providerMappings: true },
    });

    const assetMap = new Map(assets.map((a) => [a.id, a]));

    // Attempt price sync for assets that may have missing coverage
    await Promise.allSettled(
      assets.map(async (asset) => {
        const yahooMapping = asset.providerMappings.find(
          (m) => m.provider === "YAHOO_FINANCE",
        );
        if (!yahooMapping) return;

        try {
          await syncPrices(
            { id: asset.id, ticker: yahooMapping.provider_symbol },
            "DAILY",
            "1d",
            from,
            to,
          );
        } catch {
          // Sync failure is non-blocking — we serve whatever cached data exists
        }
      }),
    );

    // Fetch DAILY prices for all requested assets in the 1-month window
    const priceRows = await prisma.assetPrice.findMany({
      where: {
        asset_id: { in: assetIds },
        granularity: "DAILY",
        timestamp: { gte: from, lte: to },
      },
      orderBy: { timestamp: "asc" },
      select: {
        asset_id: true,
        timestamp: true,
        price: true,
      },
    });

    // Group by asset
    const pricesByAsset = new Map<number, Array<{ timestamp: Date; price: number }>>();
    for (const row of priceRows) {
      const list = pricesByAsset.get(row.asset_id) ?? [];
      list.push({ timestamp: row.timestamp, price: Number(row.price) });
      pricesByAsset.set(row.asset_id, list);
    }

    // Build sparkline response for each requested asset
    const data: SparklineData[] = assetIds.map((assetId) => {
      const prices = pricesByAsset.get(assetId) ?? [];

      if (prices.length === 0) {
        return { assetId, points: [] };
      }

      const firstPrice = prices[0]!.price;

      // Normalize as percentage change from first price
      const points: SparklinePoint[] = prices.map((p) => ({
        timestamp: p.timestamp.toISOString(),
        percentChange:
          firstPrice !== 0 ? ((p.price / firstPrice) - 1) * 100 : 0,
      }));

      return { assetId, points };
    });

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request parameters", details: err.issues },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch sparkline data" },
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
