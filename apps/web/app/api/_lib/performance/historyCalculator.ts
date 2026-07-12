import { type InvestmentInput } from "./performanceCalculator";

// ─── Input/Output Types ──────────────────────────────────────────────────────

export type HistoryInput = {
  investments: InvestmentInput[];
  prices: Map<number, Array<{ date: string; price: number }>>;
  startDate: string; // YYYY-MM-DD
  endDate: string;
};

export type HistoryPoint = {
  date: string;
  portfolio_value: number;
  total_invested: number;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Generates an array of date strings (YYYY-MM-DD) from startDate to endDate inclusive.
 */
function generateDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate + "T00:00:00Z");
  const end = new Date(endDate + "T00:00:00Z");

  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

/**
 * Formats a Date to YYYY-MM-DD string (UTC).
 */
function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Builds a price lookup map for an asset: date string → price.
 * Used for O(1) lookups during the date walk.
 */
function buildPriceLookup(
  prices: Array<{ date: string; price: number }>,
): Map<string, number> {
  const lookup = new Map<string, number>();
  for (const p of prices) {
    lookup.set(p.date, p.price);
  }
  return lookup;
}

// ─── Portfolio History ───────────────────────────────────────────────────────

/**
 * Pure function: computes daily portfolio value series.
 * Walks chronologically through dates, applying BUY/SELL events
 * and using carry-forward for missing prices.
 *
 * Edge cases handled:
 * - Date with no price: carry forward last known price
 * - BUY/SELL on a date: use end-of-day position (post-transaction)
 * - Asset with no price data at all: contributes 0
 * - Empty investments: returns empty series
 * - Start date before any investment: shows 0 until first investment
 */
export function computePortfolioHistory(input: HistoryInput): HistoryPoint[] {
  const { investments, prices, startDate, endDate } = input;

  // Empty investments → empty series
  if (investments.length === 0) {
    return [];
  }

  const dates = generateDateRange(startDate, endDate);
  if (dates.length === 0) return [];

  // Group investments by asset_id
  const investmentsByAsset = new Map<number, InvestmentInput[]>();
  for (const inv of investments) {
    const existing = investmentsByAsset.get(inv.asset_id) ?? [];
    existing.push(inv);
    investmentsByAsset.set(inv.asset_id, existing);
  }

  // Sort each asset's investments chronologically
  for (const [, ops] of investmentsByAsset) {
    ops.sort((a, b) => a.executed_at.getTime() - b.executed_at.getTime());
  }

  // Build price lookups per asset
  const priceLookups = new Map<number, Map<string, number>>();
  for (const [assetId, assetPrices] of prices) {
    priceLookups.set(assetId, buildPriceLookup(assetPrices));
  }

  // Get all unique asset IDs
  const assetIds = [...investmentsByAsset.keys()];

  // Track state per asset across the date walk
  const assetUnits = new Map<number, number>();
  const assetCostBasis = new Map<number, number>();
  const lastKnownPrice = new Map<number, number>();

  // Initialize
  for (const assetId of assetIds) {
    assetUnits.set(assetId, 0);
    assetCostBasis.set(assetId, 0);
  }

  // Pre-apply operations that occurred before startDate so positions
  // reflect the correct state at the beginning of the chart range.
  for (const assetId of assetIds) {
    const ops = investmentsByAsset.get(assetId)!;
    for (const op of ops) {
      const opDate = toDateString(op.executed_at);
      if (opDate >= startDate) break;

      let u = assetUnits.get(assetId)!;
      let cb = assetCostBasis.get(assetId)!;

      if (op.type === "BUY") {
        u += op.units;
        cb += op.total_amount;
      } else {
        if (u > 0) {
          const avgCostAtSale = cb / u;
          const costReduction = op.units * avgCostAtSale;
          cb -= costReduction;
          u -= op.units;
        }
      }

      if (u < 0) u = 0;
      if (cb < 0) cb = 0;

      assetUnits.set(assetId, u);
      assetCostBasis.set(assetId, cb);
    }
  }

  const result: HistoryPoint[] = [];

  for (const date of dates) {
    // Apply all BUY/SELL events on this date (end-of-day position)
    for (const assetId of assetIds) {
      const ops = investmentsByAsset.get(assetId)!;
      for (const op of ops) {
        const opDate = toDateString(op.executed_at);
        if (opDate !== date) continue;

        let units = assetUnits.get(assetId)!;
        let costBasis = assetCostBasis.get(assetId)!;

        if (op.type === "BUY") {
          units += op.units;
          costBasis += op.total_amount;
        } else {
          // SELL — reduce cost basis using average cost method
          if (units > 0) {
            const avgCostAtSale = costBasis / units;
            const costReduction = op.units * avgCostAtSale;
            costBasis -= costReduction;
            units -= op.units;
          }
        }

        // Guard against floating point negatives
        if (units < 0) units = 0;
        if (costBasis < 0) costBasis = 0;

        assetUnits.set(assetId, units);
        assetCostBasis.set(assetId, costBasis);
      }
    }

    // Compute portfolio value and total invested at this date
    let portfolioValue = 0;
    let totalInvested = 0;
    let hasAnyPrice = false;

    for (const assetId of assetIds) {
      const units = assetUnits.get(assetId)!;
      const costBasis = assetCostBasis.get(assetId)!;

      totalInvested += costBasis;

      if (units <= 0) continue;

      // Get price for this date (carry-forward if missing)
      const priceLookup = priceLookups.get(assetId);
      if (priceLookup) {
        const priceAtDate = priceLookup.get(date);
        if (priceAtDate !== undefined) {
          lastKnownPrice.set(assetId, priceAtDate);
        }
      }

      const price = lastKnownPrice.get(assetId);
      if (price !== undefined) {
        portfolioValue += units * price;
        hasAnyPrice = true;
      }
    }

    // Only emit data points once we have at least one known price.
    // Before any price is observed, the chart would show a misleading flatline at 0.
    if (!hasAnyPrice && totalInvested > 0) continue;

    result.push({
      date,
      portfolio_value: portfolioValue,
      total_invested: totalInvested,
    });
  }

  return result;
}

// ─── Asset History ───────────────────────────────────────────────────────────

/**
 * Pure function: computes per-asset daily value series.
 * Takes operations for a single asset and its price series.
 *
 * Returns { date, position_value, cost_basis } for each date in range.
 * - position_value = units_held_at_date × price_at_date
 * - cost_basis = running cost basis using average cost method
 *
 * Edge cases:
 * - Date with no price: carry forward last known price
 * - BUY/SELL on a date: end-of-day position
 * - No price data at all: position_value = 0
 * - Empty investments: returns empty series
 */
export function computeAssetHistory(
  assetInvestments: InvestmentInput[],
  prices: Array<{ date: string; price: number }>,
  startDate: string,
  endDate: string,
): Array<{ date: string; position_value: number; cost_basis: number }> {
  // Empty investments → empty series
  if (assetInvestments.length === 0) {
    return [];
  }

  const dates = generateDateRange(startDate, endDate);
  if (dates.length === 0) return [];

  // Sort operations chronologically
  const sortedOps = [...assetInvestments].sort(
    (a, b) => a.executed_at.getTime() - b.executed_at.getTime(),
  );

  // Build price lookup
  const priceLookup = buildPriceLookup(prices);

  let units = 0;
  let costBasis = 0;
  let lastPrice: number | undefined;

  // Pre-apply operations that occurred before startDate so the position
  // reflects the correct state at the beginning of the chart range.
  for (const op of sortedOps) {
    const opDate = toDateString(op.executed_at);
    if (opDate >= startDate) break;

    if (op.type === "BUY") {
      units += op.units;
      costBasis += op.total_amount;
    } else {
      if (units > 0) {
        const avgCostAtSale = costBasis / units;
        const costReduction = op.units * avgCostAtSale;
        costBasis -= costReduction;
        units -= op.units;
      }
    }

    if (units < 0) units = 0;
    if (costBasis < 0) costBasis = 0;
  }

  const result: Array<{ date: string; position_value: number; cost_basis: number }> = [];

  for (const date of dates) {
    // Apply all operations on this date (end-of-day position)
    for (const op of sortedOps) {
      const opDate = toDateString(op.executed_at);
      if (opDate !== date) continue;

      if (op.type === "BUY") {
        units += op.units;
        costBasis += op.total_amount;
      } else {
        // SELL — reduce cost basis using average cost method
        if (units > 0) {
          const avgCostAtSale = costBasis / units;
          const costReduction = op.units * avgCostAtSale;
          costBasis -= costReduction;
          units -= op.units;
        }
      }

      // Guard against floating point negatives
      if (units < 0) units = 0;
      if (costBasis < 0) costBasis = 0;
    }

    // Get price (carry-forward if missing)
    const priceAtDate = priceLookup.get(date);
    if (priceAtDate !== undefined) {
      lastPrice = priceAtDate;
    }

    // Only emit data points once we have a known price.
    // Before any price is observed, the chart would show a misleading flatline at 0.
    if (lastPrice === undefined) continue;

    const positionValue = units > 0 ? units * lastPrice : 0;

    result.push({
      date,
      position_value: positionValue,
      cost_basis: costBasis,
    });
  }

  return result;
}
