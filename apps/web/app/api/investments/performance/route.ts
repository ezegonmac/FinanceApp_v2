import { prisma } from "@repo/db";
import { NextResponse } from "next/server";
import {
  computePortfolioPerformance,
  type InvestmentInput,
} from "../../_lib/performance/performanceCalculator";
import { computeTWR, type CashFlowEvent } from "../../_lib/performance/twrCalculator";

export const dynamic = "force-dynamic";

// GET /api/investments/performance
export async function GET() {
  try {
    // 1. Fetch all COMPLETED investments with executed_at NOT NULL
    const investments = await prisma.investment.findMany({
      where: {
        status: "COMPLETED",
        executed_at: { not: null },
      },
      select: {
        asset_id: true,
        type: true,
        units: true,
        total_amount: true,
        executed_at: true,
      },
    });

    // Convert to InvestmentInput format
    const investmentInputs: InvestmentInput[] = investments.map((inv) => ({
      asset_id: inv.asset_id,
      type: inv.type as "BUY" | "SELL",
      units: Number(inv.units),
      total_amount: Number(inv.total_amount),
      executed_at: inv.executed_at!,
    }));

    // 2. Determine active asset IDs (net units > 0)
    const unitsByAsset = new Map<number, number>();
    for (const inv of investmentInputs) {
      const current = unitsByAsset.get(inv.asset_id) ?? 0;
      if (inv.type === "BUY") {
        unitsByAsset.set(inv.asset_id, current + inv.units);
      } else {
        unitsByAsset.set(inv.asset_id, current - inv.units);
      }
    }

    const activeAssetIds = [...unitsByAsset.entries()]
      .filter(([, units]) => units > 0)
      .map(([assetId]) => assetId);

    // If no active positions, return zeroed summary
    if (activeAssetIds.length === 0) {
      return NextResponse.json(
        {
          summary: {
            total_invested: "0.00",
            total_current_value: "0.00",
            total_pnl: "0.00",
            total_pnl_pct: "0.00",
            twr: "0.00",
            daily_change: "0.00",
            daily_change_pct: "0.00",
            previous_value: "0.00",
          },
          positions: [],
        },
        { status: 200 },
      );
    }

    // 3. Fetch latest price per asset (current price)
    const latestPriceResults = await Promise.all(
      activeAssetIds.map((assetId) =>
        prisma.assetPrice.findFirst({
          where: { asset_id: assetId },
          orderBy: { timestamp: "desc" },
          select: { asset_id: true, price: true, timestamp: true },
        }),
      ),
    );

    // 4. Fetch previous day price per asset (second-latest)
    const previousPriceResults = await Promise.all(
      activeAssetIds.map(async (assetId) => {
        const prices = await prisma.assetPrice.findMany({
          where: { asset_id: assetId },
          orderBy: { timestamp: "desc" },
          take: 2,
          select: { asset_id: true, price: true, timestamp: true },
        });
        // Return the second entry (previous day) if available
        return prices.length >= 2 ? prices[1] : null;
      }),
    );

    // Build price maps
    const currentPrices = new Map(
      latestPriceResults
        .filter((p): p is NonNullable<typeof p> => p !== null)
        .map((p) => [
          p.asset_id,
          { asset_id: p.asset_id, price: Number(p.price), timestamp: p.timestamp },
        ]),
    );

    const previousPrices = new Map(
      previousPriceResults
        .filter((p): p is NonNullable<typeof p> => p !== null)
        .map((p) => [
          p.asset_id,
          { asset_id: p.asset_id, price: Number(p.price), timestamp: p.timestamp },
        ]),
    );

    // 5. Fetch asset metadata
    const assets = await prisma.asset.findMany({
      where: { id: { in: activeAssetIds } },
      select: { id: true, ticker: true, name: true, asset_type: true, currency: true },
    });

    const assetMap = new Map(assets.map((a) => [a.id, a]));

    // 6. Compute portfolio performance
    const result = computePortfolioPerformance(investmentInputs, currentPrices, previousPrices);

    // 7. Compute TWR
    // Build cash flow events from investments sorted chronologically
    const sortedInvestments = [...investmentInputs].sort(
      (a, b) => a.executed_at.getTime() - b.executed_at.getTime(),
    );

    // For TWR: we need portfolio value before each cash flow.
    // Approximate by computing cumulative positions up to each event.
    const cashFlows: CashFlowEvent[] = [];
    let runningUnits = new Map<number, number>();
    let runningCostBasis = new Map<number, number>();

    for (const inv of sortedInvestments) {
      // Calculate portfolio value before this cash flow using current prices
      let portfolioValueBefore = 0;
      for (const [assetId, units] of runningUnits) {
        if (units > 0) {
          const priceData = currentPrices.get(assetId);
          if (priceData) {
            portfolioValueBefore += units * priceData.price;
          }
        }
      }

      const amount = inv.type === "BUY" ? inv.total_amount : -inv.total_amount;

      cashFlows.push({
        date: inv.executed_at.toISOString().slice(0, 10),
        amount,
        portfolio_value_before: portfolioValueBefore,
      });

      // Update running state
      const currentUnits = runningUnits.get(inv.asset_id) ?? 0;
      if (inv.type === "BUY") {
        runningUnits.set(inv.asset_id, currentUnits + inv.units);
        const currentCost = runningCostBasis.get(inv.asset_id) ?? 0;
        runningCostBasis.set(inv.asset_id, currentCost + inv.total_amount);
      } else {
        runningUnits.set(inv.asset_id, currentUnits - inv.units);
        const currentCost = runningCostBasis.get(inv.asset_id) ?? 0;
        const avgCost = currentUnits > 0 ? currentCost / currentUnits : 0;
        runningCostBasis.set(inv.asset_id, currentCost - inv.units * avgCost);
      }
    }

    const twr = computeTWR(cashFlows, 0, result.total_current_value);

    // 8. Build response
    const positions = result.positions.map((pos) => {
      const asset = assetMap.get(pos.asset_id);
      const latestPrice = currentPrices.get(pos.asset_id);

      return {
        asset_id: pos.asset_id,
        asset: {
          ticker: asset?.ticker ?? "",
          name: asset?.name ?? "Unknown",
          asset_type: asset?.asset_type ?? "STOCK",
          currency: asset?.currency ?? "EUR",
        },
        total_units: pos.total_units.toFixed(6),
        total_invested: pos.total_invested.toFixed(2),
        avg_cost: pos.avg_cost.toFixed(6),
        current_price: pos.current_price.toFixed(6),
        current_value: pos.current_value.toFixed(2),
        unrealized_pnl: pos.unrealized_pnl.toFixed(2),
        unrealized_pct: pos.unrealized_pct.toFixed(2),
        weight: pos.weight.toFixed(2),
        daily_change: pos.daily_change.toFixed(2),
        daily_change_pct: pos.daily_change_pct.toFixed(2),
        price_updated_at: latestPrice ? latestPrice.timestamp.toISOString() : null,
      };
    });

    return NextResponse.json(
      {
        summary: {
          total_invested: result.total_invested.toFixed(2),
          total_current_value: result.total_current_value.toFixed(2),
          total_pnl: result.total_pnl.toFixed(2),
          total_pnl_pct: result.total_pnl_pct.toFixed(2),
          twr: (twr * 100).toFixed(2),
          daily_change: result.daily_change.toFixed(2),
          daily_change_pct: result.daily_change_pct.toFixed(2),
          previous_value: result.previous_value.toFixed(2),
        },
        positions,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch performance data" },
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
