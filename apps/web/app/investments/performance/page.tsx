import { PerformanceView } from "@/components/performance/PerformanceView";
import { prisma } from "@repo/db";
import {
  computePortfolioPerformance,
  type InvestmentInput,
} from "@/app/api/_lib/performance/performanceCalculator";
import { computeTWR, type CashFlowEvent } from "@/app/api/_lib/performance/twrCalculator";

export const dynamic = "force-dynamic";

export default async function PerformancePage() {
  let data: { summary: Record<string, string>; positions: Record<string, unknown>[] } | null = null;
  let error = false;

  try {
    // 1. Fetch all COMPLETED investments
    const investments = await prisma.investment.findMany({
      where: { status: "COMPLETED", executed_at: { not: null } },
      select: { asset_id: true, type: true, units: true, total_amount: true, executed_at: true },
    });

    const investmentInputs: InvestmentInput[] = investments.map((inv) => ({
      asset_id: inv.asset_id,
      type: inv.type as "BUY" | "SELL",
      units: Number(inv.units),
      total_amount: Number(inv.total_amount),
      executed_at: inv.executed_at!,
    }));

    // 2. Determine active asset IDs
    const unitsByAsset = new Map<number, number>();
    for (const inv of investmentInputs) {
      const current = unitsByAsset.get(inv.asset_id) ?? 0;
      unitsByAsset.set(inv.asset_id, inv.type === "BUY" ? current + inv.units : current - inv.units);
    }
    const activeAssetIds = [...unitsByAsset.entries()].filter(([, u]) => u > 0).map(([id]) => id);

    if (activeAssetIds.length === 0) {
      data = {
        summary: {
          total_invested: "0.00", total_current_value: "0.00", total_pnl: "0.00",
          total_pnl_pct: "0.00", twr: "0.00", daily_change: "0.00",
          daily_change_pct: "0.00", previous_value: "0.00",
        },
        positions: [],
      };
    } else {
      // 3. Fetch prices
      const [latestPriceResults, previousPriceResults, assets] = await Promise.all([
        Promise.all(activeAssetIds.map((id) =>
          prisma.assetPrice.findFirst({ where: { asset_id: id }, orderBy: { timestamp: "desc" }, select: { asset_id: true, price: true, timestamp: true } })
        )),
        Promise.all(activeAssetIds.map(async (id) => {
          const prices = await prisma.assetPrice.findMany({ where: { asset_id: id }, orderBy: { timestamp: "desc" }, take: 2, select: { asset_id: true, price: true, timestamp: true } });
          return prices.length >= 2 ? prices[1] : null;
        })),
        prisma.asset.findMany({ where: { id: { in: activeAssetIds } }, select: { id: true, ticker: true, name: true, asset_type: true, currency: true } }),
      ]);

      const currentPrices = new Map(
        latestPriceResults.filter((p): p is NonNullable<typeof p> => p !== null)
          .map((p) => [p.asset_id, { asset_id: p.asset_id, price: Number(p.price), timestamp: p.timestamp }])
      );
      const previousPrices = new Map(
        previousPriceResults.filter((p): p is NonNullable<typeof p> => p !== null)
          .map((p) => [p.asset_id, { asset_id: p.asset_id, price: Number(p.price), timestamp: p.timestamp }])
      );
      const assetMap = new Map(assets.map((a) => [a.id, a]));

      // 4. Compute performance
      const result = computePortfolioPerformance(investmentInputs, currentPrices, previousPrices);

      // 5. Compute TWR
      const sortedInvestments = [...investmentInputs].sort((a, b) => a.executed_at.getTime() - b.executed_at.getTime());
      const cashFlows: CashFlowEvent[] = [];
      const runningUnits = new Map<number, number>();
      const runningCostBasis = new Map<number, number>();

      for (const inv of sortedInvestments) {
        let portfolioValueBefore = 0;
        for (const [assetId, units] of runningUnits) {
          if (units > 0) {
            const priceData = currentPrices.get(assetId);
            if (priceData) portfolioValueBefore += units * priceData.price;
          }
        }
        cashFlows.push({ date: inv.executed_at.toISOString().slice(0, 10), amount: inv.type === "BUY" ? inv.total_amount : -inv.total_amount, portfolio_value_before: portfolioValueBefore });

        const currentUnits = runningUnits.get(inv.asset_id) ?? 0;
        if (inv.type === "BUY") {
          runningUnits.set(inv.asset_id, currentUnits + inv.units);
          runningCostBasis.set(inv.asset_id, (runningCostBasis.get(inv.asset_id) ?? 0) + inv.total_amount);
        } else {
          runningUnits.set(inv.asset_id, currentUnits - inv.units);
          const currentCost = runningCostBasis.get(inv.asset_id) ?? 0;
          const avgCost = currentUnits > 0 ? currentCost / currentUnits : 0;
          runningCostBasis.set(inv.asset_id, currentCost - inv.units * avgCost);
        }
      }

      const twr = computeTWR(cashFlows, 0, result.total_current_value);

      // 6. Build response
      const positions = result.positions.map((pos) => {
        const asset = assetMap.get(pos.asset_id);
        const latestPrice = currentPrices.get(pos.asset_id);
        return {
          asset_id: pos.asset_id,
          asset: { ticker: asset?.ticker ?? "", name: asset?.name ?? "Unknown", asset_type: asset?.asset_type ?? "STOCK", currency: asset?.currency ?? "EUR" },
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

      data = {
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
      };
    }
  } catch {
    error = true;
  }

  if (error || !data) {
    return (
      <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
        Failed to load performance data.
      </div>
    );
  }

  if (data.positions.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-12">
        No active positions. Buy some assets to track performance.
      </p>
    );
  }

  return <PerformanceView data={data as any} />;
}
