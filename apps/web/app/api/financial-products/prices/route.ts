import { prisma, type Granularity } from "@repo/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { deriveGranularity, syncPrices, getFirstTradeDate } from "../../_lib/financialProducts/priceSyncAlgorithm";
import { customRangeGranularity } from "../../_lib/financialProducts/customRangeGranularity";
import type { Timeframe, GranularityValue, YahooInterval } from "../../_lib/financialProducts/types";

export const dynamic = "force-dynamic";

const pricesQuerySchema = z.object({
  assetId: z.coerce.number().int().positive(),
  timeframe: z.enum(["TODAY", "1W", "1M", "3M", "6M", "1Y", "5Y", "ALL"]).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
}).refine(
  (data) => data.timeframe || (data.startDate && data.endDate),
  { message: "Either timeframe or both startDate and endDate must be provided" },
).refine(
  (data) => !(data.timeframe && data.startDate && data.endDate),
  { message: "Cannot provide both timeframe and custom date range" },
).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.startDate < data.endDate;
    }
    return true;
  },
  { message: "startDate must be before endDate" },
);

// GET /api/financial-products/prices?assetId=<id>&timeframe=<timeframe>
// GET /api/financial-products/prices?assetId=<id>&startDate=<iso>&endDate=<iso>
export async function GET(request: Request) {
  try {
    // 1. Validate query params — 400 on ZodError
    const { searchParams } = new URL(request.url);
    const parsed = pricesQuerySchema.parse({
      assetId: searchParams.get("assetId"),
      timeframe: searchParams.get("timeframe") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
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
    let granularity: GranularityValue;
    let interval: YahooInterval;
    let from: Date;
    let to: Date;

    if (parsed.timeframe) {
      const derived = deriveGranularity(
        parsed.timeframe as Timeframe,
        asset.price_frequency as "DAILY" | "INTRADAY",
      );
      granularity = derived.granularity;
      interval = derived.interval;
      from = derived.from;
      to = derived.to;

      // For ALL, resolve the actual first trade date from Yahoo metadata
      // so we don't request data for dates before the asset existed.
      if (parsed.timeframe === "ALL") {
        const firstTradeDate = await getFirstTradeDate(yahooMapping.provider_symbol);
        if (firstTradeDate) {
          from = firstTradeDate;
        }
      }
    } else {
      // Custom date range
      const derived = customRangeGranularity(
        parsed.startDate!,
        parsed.endDate!,
        asset.price_frequency as "DAILY" | "INTRADAY",
      );
      granularity = derived.granularity;
      interval = derived.interval;
      from = parsed.startDate!;
      to = parsed.endDate!;
    }

    // 4. Sync prices — on failure, fall back to serving cached data
    let syncFailed = false;
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
      syncFailed = true;
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

    // If sync failed and we have no cached data at all, return 502
    if (syncFailed && priceRows.length === 0) {
      return NextResponse.json(
        { error: "Failed to fetch price data from Yahoo Finance" },
        { status: 502 }
      );
    }

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
