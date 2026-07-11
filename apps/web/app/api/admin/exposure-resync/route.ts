import { z } from "zod";
import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { fetchExposureFromYahoo } from "../../_lib/exposure/yahooFetcher";
import { resolveCanonicalCategory } from "../../_lib/exposure/normalizer";

export const dynamic = "force-dynamic";

const resyncSchema = z.object({
  assetId: z.number().int().positive(),
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
});

// POST /api/admin/exposure-resync
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resyncSchema.parse(body);

    // Verify asset exists
    const asset = await prisma.asset.findUnique({
      where: { id: parsed.assetId },
      select: {
        id: true,
        asset_type: true,
        providerMappings: {
          select: {
            provider: true,
            provider_symbol: true,
          },
        },
      },
    });

    if (!asset) {
      return NextResponse.json(
        { error: "Asset not found" },
        { status: 404 },
      );
    }

    // Fetch fresh exposure data from Yahoo Finance
    const exposureData = await fetchExposureFromYahoo(asset);

    if (!exposureData) {
      return NextResponse.json(
        { error: "Failed to fetch exposure data from provider" },
        { status: 502 },
      );
    }

    // Delete existing snapshots for this asset + period (both SECTOR and COUNTRY)
    await prisma.assetExposureSnapshot.deleteMany({
      where: {
        asset_id: parsed.assetId,
        period: parsed.period,
      },
    });

    // Insert new snapshots with normalized categories
    let sectorsCreated = 0;
    let countriesCreated = 0;

    for (const sector of exposureData.sectors) {
      const categoryId = await resolveCanonicalCategory(
        "YAHOO_FINANCE",
        sector.label,
        "SECTOR",
      );

      await prisma.assetExposureSnapshot.create({
        data: {
          asset_id: parsed.assetId,
          period: parsed.period,
          exposure_type: "SECTOR",
          category_id: categoryId,
          percentage: sector.percentage,
          provider: "YAHOO_FINANCE",
        },
      });

      sectorsCreated += 1;
    }

    for (const country of exposureData.countries) {
      const categoryId = await resolveCanonicalCategory(
        "YAHOO_FINANCE",
        country.label,
        "COUNTRY",
      );

      await prisma.assetExposureSnapshot.create({
        data: {
          asset_id: parsed.assetId,
          period: parsed.period,
          exposure_type: "COUNTRY",
          category_id: categoryId,
          percentage: country.percentage,
          provider: "YAHOO_FINANCE",
        },
      });

      countriesCreated += 1;
    }

    return NextResponse.json(
      {
        assetId: parsed.assetId,
        period: parsed.period,
        sectorsCreated,
        countriesCreated,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to re-sync exposure data" },
      { status: 500 },
    );
  }
}

export function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 405,
      headers: {
        Allow: "POST, OPTIONS",
      },
    },
  );
}
