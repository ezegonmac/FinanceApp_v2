import { prisma, type Granularity } from "@repo/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { deriveGranularity, syncPrices } from "../../_lib/financialProducts/priceSyncAlgorithm";
import type { Timeframe } from "../../_lib/financialProducts/types";

export const dynamic = "force-dynamic";

const pricesQuerySchema = z.object({
  assetId: z.coerce.number().int().positive(),
  timeframe: z.enum(["TODAY", "1W", "1M", "3M", "6M", "1Y", "5Y", "ALL"]),
});

// GET /api/financial-products/prices?assetId=<id>&timeframe=<timeframe>
export async function GET(request: Request) {
  try {
    // 1. Validate query params — 400 on ZodError
    const { searchParams } = new URL(request.url);
    const parsed = pricesQuerySchema.parse({
      assetId: searchParams.get("assetId"),
      timeframe: searchParams.get("timeframe"),
    });

    // 2. Load asset from DB — 404 if not found
    const asset = await prisma.asset.findUnique({
      where: { id: parsed.assetId },
      include: { providerMappings: true },
    });

    if (!asset) {
      return NextResponse.json(
        { error: "Asset not found" },
        { status: 404 }
      );
    }

    // Resolve Yahoo symbol from provider mapping
    const yahooMapping = asset.providerMappings.find(
      (m) => m.provider === "YAHOO_FINANCE"
    );
    if (!yahooMapping) {
      return NextResponse.json(
        { error: "No Yahoo Finance mapping found for this asset" },
        { status: 404 }
      );
    }

    // 3. Derive granularity, interval, and date range
    const { granularity, interval, from, to } = deriveGranularity(
      parsed.timeframe as Timeframe,
      asset.price_frequency as "DAILY" | "INTRADAY",
    );

    // 4. Sync prices — 502 if Yahoo throws
    try {
      await syncPrices(
        { id: asset.id, ticker: yahooMapping.provider_symbol },
        granularity,
        interval,
        from,
        to,
      );
    } catch (syncError) {
      console.error("GET /api/financial-products/prices syncPrices error:", syncError);
      return NextResponse.json(
        { error: "Failed to fetch price data from Yahoo Finance" },
        { status: 502 }
      );
    }

    // 5. Query asset_prices filtered by asset_id, granularity, and timestamp range
    const priceRows = await prisma.assetPrice.findMany({
      where: {
        asset_id: asset.id,
        granularity: granularity as Granularity,
        timestamp: {
          gte: from,
          lte: to,
        },
      },
      orderBy: { timestamp: "asc" },
    });

    // 6. Return 200 with PricePoint[]
    const pricePoints = priceRows.map((row) => ({
      timestamp: row.timestamp.toISOString(),
      price: Number(row.price),
    }));

    return NextResponse.json(pricePoints, { status: 200 });
  } catch (error) {
    console.error("GET /api/financial-products/prices error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
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
        Allow: "GET, OPTIONS",
      },
    }
  );
}
