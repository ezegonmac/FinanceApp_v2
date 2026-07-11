import { prisma } from "@repo/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  compareAssets,
  ComparisonValidationError,
  ComparisonSyncError,
  ComparisonDataError,
} from "../../_lib/financialProducts/compareAssets";
import type { Timeframe } from "../../_lib/financialProducts/types";

export const dynamic = "force-dynamic";

const compareQuerySchema = z
  .object({
    assetIds: z.string().transform((s) => s.split(",").map(Number)),
    timeframe: z.enum(["1W", "1M", "3M", "6M", "1Y", "5Y", "ALL"]).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  })
  .refine((data) => data.timeframe || (data.startDate && data.endDate), {
    message: "Either timeframe or both startDate and endDate must be provided",
  })
  .refine(
    (data) => !data.startDate || !data.endDate || data.startDate < data.endDate,
    { message: "startDate must be before endDate" },
  )
  .refine(
    (data) => {
      const ids = data.assetIds;
      return (
        ids.length >= 2 &&
        ids.length <= 5 &&
        new Set(ids).size === ids.length
      );
    },
    { message: "Must provide 2-5 unique asset IDs" },
  );

// GET /api/financial-products/compare?assetIds=1,2&timeframe=1Y
export async function GET(request: Request) {
  try {
    // 1. Validate query params — 400 on ZodError
    const { searchParams } = new URL(request.url);
    const parsed = compareQuerySchema.parse({
      assetIds: searchParams.get("assetIds"),
      timeframe: searchParams.get("timeframe") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
    });

    // 2. Load all assets from DB — 404 if any not found
    const assets = await prisma.asset.findMany({
      where: { id: { in: parsed.assetIds } },
      include: { providerMappings: true },
    });

    const foundIds = new Set(assets.map((a) => a.id));
    for (const id of parsed.assetIds) {
      if (!foundIds.has(id)) {
        return NextResponse.json(
          { error: "Asset not found", assetId: id },
          { status: 404 },
        );
      }
    }

    // 3. Resolve Yahoo Finance mappings and build input
    const comparisonAssets = [];
    for (const id of parsed.assetIds) {
      const asset = assets.find((a) => a.id === id)!;
      const yahooMapping = asset.providerMappings.find(
        (m) => m.provider === "YAHOO_FINANCE",
      );
      if (!yahooMapping) {
        return NextResponse.json(
          { error: "No provider mapping for asset", assetId: id },
          { status: 404 },
        );
      }
      comparisonAssets.push({
        id: asset.id,
        ticker: yahooMapping.provider_symbol,
        name: asset.name,
        price_frequency: asset.price_frequency as "DAILY" | "INTRADAY",
      });
    }

    // 4. Call compareAssets service
    const result = await compareAssets({
      assets: comparisonAssets,
      timeframe: parsed.timeframe as Timeframe | undefined,
      startDate: parsed.startDate,
      endDate: parsed.endDate,
    });

    // 5. Return 200 with comparison result
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("GET /api/financial-products/compare error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 },
      );
    }

    if (error instanceof ComparisonValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 },
      );
    }

    if (error instanceof ComparisonSyncError) {
      return NextResponse.json(
        { error: "Price sync failed", failedAssets: error.failedAssets },
        { status: 502 },
      );
    }

    if (error instanceof ComparisonDataError) {
      return NextResponse.json(
        { error: error.message, assets: error.assets },
        { status: 422 },
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
