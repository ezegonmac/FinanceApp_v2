import { prisma } from "@repo/db";
import { getEuropeMadridDateParts } from "@repo/utils";
import type { ProcessCounts } from "../types";
import { resolveCanonicalCategory } from "../../exposure/normalizer";
import {
  fetchExposureFromYahoo,
  type AssetWithMapping,
  type ExposureData,
} from "../../exposure/yahooFetcher";

/**
 * Syncs exposure data (sector + country breakdowns) from Yahoo Finance
 * for all assets with active positions.
 *
 * - Determines the current period from the Madrid timezone date.
 * - Skips assets that already have snapshots for the current period.
 * - On per-asset failure, increments `failed` and continues processing.
 */
export async function syncExposureData(
  jobRunId: number,
): Promise<ProcessCounts> {
  const counts: ProcessCounts = { processed: 0, failed: 0, skipped: 0 };
  const { year, month } = getEuropeMadridDateParts();
  const period = `${year}-${String(month).padStart(2, "0")}`;

  // 1. Get all assets with active positions (units > 0 across all COMPLETED investments)
  const assetsWithPositions = await getAssetsWithActivePositions();

  for (const asset of assetsWithPositions) {
    try {
      // 2. Check if snapshots already exist for this asset + period
      const existingCount = await prisma.assetExposureSnapshot.count({
        where: { asset_id: asset.id, period },
      });

      if (existingCount > 0) {
        counts.skipped += 1;
        continue;
      }

      // 3. Fetch exposure data from Yahoo Finance
      const exposureData = await fetchExposureFromYahoo(asset);

      if (!exposureData) {
        counts.skipped += 1;
        continue;
      }

      // 4. Normalize labels and create snapshots
      await createExposureSnapshots(asset.id, period, exposureData);
      counts.processed += 1;
    } catch {
      counts.failed += 1;
      // Log error but continue processing remaining assets
    }
  }

  return counts;
}

/**
 * Queries all assets that have active positions (net units > 0)
 * across all COMPLETED investments, regardless of account.
 * Returns assets with their provider mappings for Yahoo Finance lookup.
 */
async function getAssetsWithActivePositions(): Promise<AssetWithMapping[]> {
  const investments = await prisma.investment.findMany({
    where: { status: "COMPLETED" },
    select: {
      asset_id: true,
      type: true,
      units: true,
    },
  });

  // Group by asset_id and compute net units (BUY - SELL)
  const positionMap = new Map<number, number>();

  for (const inv of investments) {
    const current = positionMap.get(inv.asset_id) ?? 0;
    if (inv.type === "BUY") {
      positionMap.set(inv.asset_id, current + Number(inv.units));
    } else {
      positionMap.set(inv.asset_id, current - Number(inv.units));
    }
  }

  // Filter to assets with positive net units
  const activeAssetIds: number[] = [];
  for (const [assetId, netUnits] of positionMap) {
    if (netUnits > 0) {
      activeAssetIds.push(assetId);
    }
  }

  if (activeAssetIds.length === 0) return [];

  // Fetch assets with their provider mappings
  const assets = await prisma.asset.findMany({
    where: { id: { in: activeAssetIds } },
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

  return assets;
}

/**
 * Creates AssetExposureSnapshot records for the given asset and period,
 * normalizing each sector/country label to a canonical category.
 */
async function createExposureSnapshots(
  assetId: number,
  period: string,
  exposureData: ExposureData,
): Promise<void> {
  // Create sector snapshots
  for (const sector of exposureData.sectors) {
    const categoryId = await resolveCanonicalCategory(
      "YAHOO_FINANCE",
      sector.label,
      "SECTOR",
    );

    await prisma.assetExposureSnapshot.create({
      data: {
        asset_id: assetId,
        period,
        exposure_type: "SECTOR",
        category_id: categoryId,
        percentage: sector.percentage,
        provider: "YAHOO_FINANCE",
      },
    });
  }

  // Create country snapshots
  for (const country of exposureData.countries) {
    const categoryId = await resolveCanonicalCategory(
      "YAHOO_FINANCE",
      country.label,
      "COUNTRY",
    );

    await prisma.assetExposureSnapshot.create({
      data: {
        asset_id: assetId,
        period,
        exposure_type: "COUNTRY",
        category_id: categoryId,
        percentage: country.percentage,
        provider: "YAHOO_FINANCE",
      },
    });
  }
}
