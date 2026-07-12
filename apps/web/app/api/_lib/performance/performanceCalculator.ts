// ─── Input Types ─────────────────────────────────────────────────────────────

export type InvestmentInput = {
  asset_id: number;
  type: "BUY" | "SELL";
  units: number;
  total_amount: number;
  executed_at: Date;
};

export type PriceInput = {
  asset_id: number;
  price: number;
  timestamp: Date;
};

// ─── Output Types ────────────────────────────────────────────────────────────

export type PositionResult = {
  asset_id: number;
  total_units: number;
  total_invested: number; // cost basis after sell adjustments
  avg_cost: number;
  current_price: number;
  current_value: number;
  unrealized_pnl: number;
  unrealized_pct: number;
  weight: number;
  daily_change: number;
  daily_change_pct: number;
};

export type PortfolioSummaryResult = {
  total_invested: number;
  total_current_value: number;
  total_pnl: number;
  total_pnl_pct: number;
  daily_change: number;
  daily_change_pct: number;
  previous_value: number;
  positions: PositionResult[];
};

// ─── Cost Basis (Average Cost Method) ────────────────────────────────────────

/**
 * Pure function: computes cost basis for a single asset using average cost method.
 * Processes operations chronologically — for each SELL, reduces cost basis by
 * units_sold × (total_invested / total_units) at the time of sale.
 *
 * Returns the adjusted cost basis, remaining units, and average cost per unit.
 */
export function computeCostBasis(
  operations: InvestmentInput[],
): { totalUnits: number; costBasis: number; avgCost: number } {
  // Sort chronologically
  const sorted = [...operations].sort(
    (a, b) => a.executed_at.getTime() - b.executed_at.getTime(),
  );

  let totalUnits = 0;
  let costBasis = 0;

  for (const op of sorted) {
    if (op.type === "BUY") {
      totalUnits += op.units;
      costBasis += op.total_amount;
    } else {
      // SELL — reduce cost basis using average cost at time of sale
      if (totalUnits > 0) {
        const avgCostAtSale = costBasis / totalUnits;
        const costReduction = op.units * avgCostAtSale;
        costBasis -= costReduction;
        totalUnits -= op.units;
      }
    }
  }

  // Guard against floating point issues leaving tiny negatives
  if (totalUnits < 0) totalUnits = 0;
  if (costBasis < 0) costBasis = 0;

  const avgCost = totalUnits > 0 ? costBasis / totalUnits : 0;

  return { totalUnits, costBasis, avgCost };
}

// ─── Portfolio Performance ───────────────────────────────────────────────────

/**
 * Pure function: computes portfolio positions with performance metrics.
 * Operates on pre-fetched data — no DB calls.
 *
 * - Aggregates investments across all accounts into one position per asset
 * - Uses average cost method for sell adjustments
 * - Computes unrealized P&L, weights, and daily change
 * - Excludes positions with missing current price from value totals
 */
export function computePortfolioPerformance(
  investments: InvestmentInput[],
  currentPrices: Map<number, PriceInput>,
  previousPrices: Map<number, PriceInput>,
): PortfolioSummaryResult {
  // 1. Group investments by asset_id
  const investmentsByAsset = new Map<number, InvestmentInput[]>();
  for (const inv of investments) {
    const existing = investmentsByAsset.get(inv.asset_id) ?? [];
    existing.push(inv);
    investmentsByAsset.set(inv.asset_id, existing);
  }

  // 2. Compute cost basis for each asset
  const positions: PositionResult[] = [];
  let totalCurrentValue = 0;
  let totalPreviousValue = 0;
  let totalInvested = 0;

  for (const [assetId, ops] of investmentsByAsset) {
    const { totalUnits, costBasis, avgCost } = computeCostBasis(ops);

    // Skip positions with zero units (fully sold)
    if (totalUnits <= 0) continue;

    const currentPriceData = currentPrices.get(assetId);
    const previousPriceData = previousPrices.get(assetId);

    if (!currentPriceData) {
      // Missing price — exclude from value totals, include position with zeroed metrics
      positions.push({
        asset_id: assetId,
        total_units: totalUnits,
        total_invested: costBasis,
        avg_cost: avgCost,
        current_price: 0,
        current_value: 0,
        unrealized_pnl: 0,
        unrealized_pct: 0,
        weight: 0,
        daily_change: 0,
        daily_change_pct: 0,
      });
      // Still count the cost basis in total_invested for the portfolio summary
      totalInvested += costBasis;
      continue;
    }

    const currentPrice = currentPriceData.price;
    const currentValue = totalUnits * currentPrice;

    const unrealizedPnl = currentValue - costBasis;
    const unrealizedPct = costBasis > 0 ? (unrealizedPnl / costBasis) * 100 : 0;

    // Daily change calculation
    let dailyChange = 0;
    let dailyChangePct = 0;
    if (previousPriceData) {
      const previousValue = totalUnits * previousPriceData.price;
      dailyChange = currentValue - previousValue;
      dailyChangePct = previousValue > 0 ? (dailyChange / previousValue) * 100 : 0;
      totalPreviousValue += previousValue;
    } else {
      // No previous price — daily change is 0 (null-safe)
      totalPreviousValue += currentValue;
    }

    totalCurrentValue += currentValue;
    totalInvested += costBasis;

    positions.push({
      asset_id: assetId,
      total_units: totalUnits,
      total_invested: costBasis,
      avg_cost: avgCost,
      current_price: currentPrice,
      current_value: currentValue,
      unrealized_pnl: unrealizedPnl,
      unrealized_pct: unrealizedPct,
      weight: 0, // computed after total is known
      daily_change: dailyChange,
      daily_change_pct: dailyChangePct,
    });
  }

  // 3. Compute weights (position_current_value / total_portfolio_value × 100)
  for (const position of positions) {
    if (totalCurrentValue > 0 && position.current_value > 0) {
      position.weight = (position.current_value / totalCurrentValue) * 100;
    } else {
      position.weight = 0;
    }
  }

  // 4. Compute portfolio-level metrics
  const totalPnl = totalCurrentValue - totalInvested;
  const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

  const dailyChange = totalCurrentValue - totalPreviousValue;
  const dailyChangePct =
    totalPreviousValue > 0 ? (dailyChange / totalPreviousValue) * 100 : 0;

  return {
    total_invested: totalInvested,
    total_current_value: totalCurrentValue,
    total_pnl: totalPnl,
    total_pnl_pct: totalPnlPct,
    daily_change: dailyChange,
    daily_change_pct: dailyChangePct,
    previous_value: totalPreviousValue,
    positions,
  };
}
