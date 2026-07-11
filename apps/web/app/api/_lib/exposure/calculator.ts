import { type ExposureType } from "@repo/db";

// ─── Input Types ─────────────────────────────────────────────────────────────

export type PositionInput = {
  assetId: number;
  value: number; // positionValue = units × currentPrice
};

export type SnapshotInput = {
  asset_id: number;
  category_id: number;
  categoryName: string; // from the joined ExposureCategory.display_name
  percentage: number; // already a number (converted from Decimal)
};

export type ExposureResult = {
  data: Array<{
    categoryId: number;
    categoryName: string;
    percentage: number; // 0-100 weighted portfolio percentage
    value: number; // monetary value
    assetCount: number; // number of assets contributing to this category
  }>;
  coveragePercentage: number; // 0-100
  uncoveredValue: number;
  totalPortfolioValue: number;
};

// ─── Calculator ──────────────────────────────────────────────────────────────

/**
 * Pure computation function for portfolio-level exposure.
 *
 * Takes pre-fetched positions and snapshots (already filtered by type/period)
 * and returns the aggregated portfolio exposure breakdown.
 *
 * The `type` parameter is included for API clarity but is not used in the
 * computation — callers are responsible for passing snapshots already filtered
 * by the desired ExposureType.
 */
export function computePortfolioExposure(
  positions: PositionInput[],
  snapshots: SnapshotInput[],
  totalPortfolioValue: number,
  _type: ExposureType,
): ExposureResult {
  // 1. Build set of asset IDs that have at least one snapshot
  const assetsWithSnapshots = new Set<number>();
  for (const snapshot of snapshots) {
    assetsWithSnapshots.add(snapshot.asset_id);
  }

  // 2. Compute coveredValue = sum of position values where asset has snapshots
  let coveredValue = 0;
  for (const position of positions) {
    if (assetsWithSnapshots.has(position.assetId)) {
      coveredValue += position.value;
    }
  }

  // 3. coveragePercentage = (coveredValue / totalPortfolioValue) × 100
  const coveragePercentage =
    totalPortfolioValue > 0 ? (coveredValue / totalPortfolioValue) * 100 : 0;

  // 4. uncoveredValue = totalPortfolioValue - coveredValue
  const uncoveredValue = totalPortfolioValue - coveredValue;

  // 5. For each position, weight its snapshot percentages by positionValue / totalPortfolioValue
  const categoryMap = new Map<
    number,
    { categoryName: string; percentage: number; assetIds: Set<number> }
  >();

  for (const position of positions) {
    if (totalPortfolioValue === 0) break;

    // Filter snapshots for this asset
    const assetSnapshots = snapshots.filter(
      (s) => s.asset_id === position.assetId,
    );

    for (const snapshot of assetSnapshots) {
      const weightedPercentage =
        (snapshot.percentage * position.value) / totalPortfolioValue;

      const existing = categoryMap.get(snapshot.category_id);
      if (existing) {
        existing.percentage += weightedPercentage;
        existing.assetIds.add(position.assetId);
      } else {
        categoryMap.set(snapshot.category_id, {
          categoryName: snapshot.categoryName,
          percentage: weightedPercentage,
          assetIds: new Set([position.assetId]),
        });
      }
    }
  }

  // 6. Build result array sorted by percentage descending
  const data = Array.from(categoryMap.entries())
    .map(([categoryId, { categoryName, percentage, assetIds }]) => ({
      categoryId,
      categoryName,
      percentage,
      value: totalPortfolioValue > 0 ? (percentage / 100) * totalPortfolioValue : 0,
      assetCount: assetIds.size,
    }))
    .sort((a, b) => b.percentage - a.percentage);

  return {
    data,
    coveragePercentage,
    uncoveredValue,
    totalPortfolioValue,
  };
}
