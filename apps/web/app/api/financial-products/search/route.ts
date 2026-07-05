import { NextResponse } from "next/server";
import { z } from "zod";
import YahooFinance from "yahoo-finance2";

export const dynamic = "force-dynamic";

const yahooFinance = new YahooFinance();

const searchQuerySchema = z.string().min(1).max(200);

type AssetType = "FUND" | "ETF" | "ETP" | "STOCK" | "CRYPTO";

type AssetSearchResult = {
  ticker: string;
  name: string;
  asset_type: AssetType;
  exchange: string;
  currency: string;
};

const QUOTE_TYPE_MAP: Record<string, AssetType> = {
  EQUITY: "STOCK",
  ETF: "ETF",
  MUTUALFUND: "FUND",
  CRYPTOCURRENCY: "CRYPTO",
  ETP: "ETP",
};

// GET /api/financial-products/search?q=<query>
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");

    const parsed = searchQuerySchema.parse(q);

    const results = await yahooFinance.search(parsed);

    const mapped: AssetSearchResult[] = [];

    for (const item of results.quotes) {
      // Skip non-Yahoo Finance results (e.g. Crunchbase entries)
      if (!item.isYahooFinance) continue;

      const quoteType = item.quoteType;
      if (!quoteType) continue;

      const assetType = QUOTE_TYPE_MAP[quoteType];
      if (!assetType) continue;

      mapped.push({
        ticker: item.symbol,
        name: item.shortname || item.longname || item.symbol,
        asset_type: assetType,
        exchange: item.exchange || "",
        currency: (item as Record<string, unknown>).currency as string || "",
      });
    }

    return NextResponse.json(mapped, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("GET /api/financial-products/search error:", error);
    return NextResponse.json(
      { error: "Failed to search assets" },
      { status: 502 }
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
