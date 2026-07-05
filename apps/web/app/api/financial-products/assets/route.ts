import { prisma } from "@repo/db";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createAssetSchema = z.object({
  ticker: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  asset_type: z.enum(["FUND", "ETF", "ETP", "STOCK", "CRYPTO"]),
  price_frequency: z.enum(["DAILY", "INTRADAY"]),
  currency: z.string().length(3),
  isin: z.string().nullable().optional(),
  provider_symbol: z.string().min(1).max(50),
});

// GET /api/financial-products/assets
export async function GET() {
  try {
    const assets = await prisma.asset.findMany({
      orderBy: { name: "asc" },
      include: { providerMappings: true },
    });

    return NextResponse.json(assets, { status: 200 });
  } catch (error) {
    console.error("GET /api/financial-products/assets error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/financial-products/assets
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createAssetSchema.parse(body);

    // 1. Check ISIN dedup first (if provided)
    if (parsed.isin) {
      const existingByIsin = await prisma.asset.findUnique({
        where: { isin: parsed.isin },
        include: { providerMappings: true },
      });

      if (existingByIsin) {
        // Add provider mapping if not already present
        const hasMapping = existingByIsin.providerMappings.some(
          (m) => m.provider === "YAHOO_FINANCE"
        );
        if (!hasMapping) {
          await prisma.assetProviderMapping.create({
            data: {
              asset_id: existingByIsin.id,
              provider: "YAHOO_FINANCE",
              provider_symbol: parsed.provider_symbol,
            },
          });
        }
        const refreshed = await prisma.asset.findUnique({
          where: { id: existingByIsin.id },
          include: { providerMappings: true },
        });
        return NextResponse.json(refreshed, { status: 200 });
      }
    }

    // 2. Check if this provider_symbol is already mapped
    const existingMapping = await prisma.assetProviderMapping.findUnique({
      where: {
        provider_symbol_unique: {
          provider: "YAHOO_FINANCE",
          provider_symbol: parsed.provider_symbol,
        },
      },
      include: { asset: { include: { providerMappings: true } } },
    });

    if (existingMapping) {
      return NextResponse.json(existingMapping.asset, { status: 200 });
    }

    // 3. Create new asset + provider mapping atomically
    const newAsset = await prisma.asset.create({
      data: {
        ticker: parsed.ticker,
        name: parsed.name,
        asset_type: parsed.asset_type,
        price_frequency: parsed.price_frequency,
        currency: parsed.currency,
        isin: parsed.isin ?? null,
        providerMappings: {
          create: {
            provider: "YAHOO_FINANCE",
            provider_symbol: parsed.provider_symbol,
          },
        },
      },
      include: { providerMappings: true },
    });

    return NextResponse.json(newAsset, { status: 200 });
  } catch (error) {
    console.error("POST /api/financial-products/assets error:", error);
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
        Allow: "GET, POST, OPTIONS",
      },
    }
  );
}
