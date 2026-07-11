import { prisma } from "@repo/db";
import { getEuropeMadridDateParts } from "@repo/utils";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  computePortfolioExposure,
  type PositionInput,
  type SnapshotInput,
} from "../../_lib/exposure/calculator";

export const dynamic = "force-dynamic";

const exposureQuerySchema = z.object({
  type: z.enum(["SECTOR", "COUNTRY"]),
  period: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
    .optional(),
  accountId: z.coerce.number().int().positive().optional(),
});

// GET /api/investments/exposure
export async function GET(request: Request) {
  try {
    // 1. Validate query params
    const { searchParams } = new URL(request.url);
    const parsed = exposureQuerySchema.parse({
      type: searchParams.get("type") ?? undefined,
      period: searchParams.get("period") ?? undefined,
      accountId: searchParams.get("accountId") ?? undefined,
    });

    // 2. Default period to current month
    const { year, month } = getEuropeMadridDateParts();
    const period =
      parsed.period ?? `${year}-${String(month).padStart(2, "0")}`;

    const exposureType = parsed.type;

    // 3. Compute positions (reuse pattern from existing positions route)
    const investments = await prisma.investment.findMany({
      where: {
        status: "COMPLETED",
        ...(parsed.accountId ? { account_id: parsed.accountId } : {}),
      },
      select: {
        asset_id: true,
        type: true,
        units: true,
      },
    });

    // Group by asset_id and compute net units
    const positionMap = new Map<number, { buyUnits: number; sellUnits: number }>();

    for (const inv of investments) {
      const entry = positionMap.get(inv.asset_id) ?? {
        buyUnits: 0,
        sellUnits: 0,
      };

      if (inv.type === "BUY") {
        entry.buyUnits += Number(inv.units);
      } else {
        entry.sellUnits += Number(inv.units);
      }

      positionMap.set(inv.asset_id, entry);
    }

    // Filter to positive positions
    const activePositions: Array<{ asset_id: number; total_units: number }> = [];

    for (const [assetId, entry] of positionMap) {
      const totalUnits = entry.buyUnits - entry.sellUnits;
      if (totalUnits > 0) {
        activePositions.push({ asset_id: assetId, total_units: totalUnits });
      }
    }

    if (activePositions.length === 0) {
      return NextResponse.json(
        {
          data: [],
          coveragePercentage: 0,
          uncoveredValue: 0,
          totalPortfolioValue: 0,
          period,
          type: exposureType,
        },
        { status: 200 },
      );
    }

    const assetIds = activePositions.map((p) => p.asset_id);

    // Fetch latest price per asset
    const latestPrices = await Promise.all(
      assetIds.map((assetId) =>
        prisma.assetPrice.findFirst({
          where: { asset_id: assetId },
          orderBy: { timestamp: "desc" },
          select: { price: true },
        }),
      ),
    );

    const priceMap = new Map(
      assetIds.map((assetId, idx) => [assetId, latestPrices[idx]]),
    );

    // Compute position values
    const positions: PositionInput[] = [];
    for (const pos of activePositions) {
      const latestPrice = priceMap.get(pos.asset_id);
      if (latestPrice) {
        const value = pos.total_units * Number(latestPrice.price);
        positions.push({ assetId: pos.asset_id, value });
      }
    }

    // 4. Compute totalPortfolioValue
    const totalPortfolioValue = positions.reduce((sum, p) => sum + p.value, 0);

    // 5. Fetch AssetExposureSnapshot records for each position's asset, period, and type
    const positionAssetIds = positions.map((p) => p.assetId);

    const snapshots = await prisma.assetExposureSnapshot.findMany({
      where: {
        asset_id: { in: positionAssetIds },
        period,
        exposure_type: exposureType,
      },
      include: {
        category: {
          select: { display_name: true },
        },
      },
    });

    // 6. Map snapshots to SnapshotInput format
    const snapshotInputs: SnapshotInput[] = snapshots.map((s) => ({
      asset_id: s.asset_id,
      category_id: s.category_id,
      categoryName: s.category.display_name,
      percentage: Number(s.percentage),
    }));

    // 7. Call computePortfolioExposure
    const result = computePortfolioExposure(
      positions,
      snapshotInputs,
      totalPortfolioValue,
      exposureType,
    );

    // 8. Return response
    // Fetch asset names for the positions breakdown
    const assetRecords = await prisma.asset.findMany({
      where: { id: { in: positionAssetIds } },
      select: { id: true, name: true, ticker: true, asset_type: true },
    });
    const assetNameMap = new Map(assetRecords.map((a) => [a.id, a]));

    // Determine which assets have exposure data
    const assetsWithExposure = new Set(snapshots.map((s) => s.asset_id));

    const positionsBreakdown = positions.map((p) => {
      const asset = assetNameMap.get(p.assetId);
      return {
        assetId: p.assetId,
        name: asset?.name ?? "Unknown",
        ticker: asset?.ticker ?? "",
        assetType: asset?.asset_type ?? "STOCK",
        value: p.value,
        percentage: totalPortfolioValue > 0 ? (p.value / totalPortfolioValue) * 100 : 0,
        hasCoverage: assetsWithExposure.has(p.assetId),
      };
    }).sort((a, b) => b.percentage - a.percentage);

    return NextResponse.json(
      {
        data: result.data,
        coveragePercentage: result.coveragePercentage,
        uncoveredValue: result.uncoveredValue,
        totalPortfolioValue: result.totalPortfolioValue,
        period,
        type: exposureType,
        positions: positionsBreakdown,
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
      { error: "Failed to fetch exposure data" },
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
        Allow: "GET, OPTIONS",
      },
    },
  );
}
