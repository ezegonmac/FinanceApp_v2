import { prisma } from "@repo/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { computeAssetHistory } from "../../../../_lib/performance/historyCalculator";
import {
  computeCostBasis,
  type InvestmentInput,
} from "../../../../_lib/performance/performanceCalculator";
import { syncPrices } from "../../../../_lib/financialProducts/priceSyncAlgorithm";

export const dynamic = "force-dynamic";

const assetPerformanceSchema = z.object({
  assetId: z.coerce.number().int().positive(),
  timeframe: z.enum(["1M", "3M", "6M", "1Y", "YTD", "ALL"]).catch("1Y"),
});

/**
 * Computes the start date based on the selected timeframe.
 * Returns a YYYY-MM-DD string in UTC, or null for "ALL".
 */
function computeStartDate(timeframe: string, now: Date): string | null {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const day = now.getUTCDate();

  switch (timeframe) {
    case "1M": {
      const d = new Date(Date.UTC(year, month - 1, day));
      return d.toISOString().slice(0, 10);
    }
    case "3M": {
      const d = new Date(Date.UTC(year, month - 3, day));
      return d.toISOString().slice(0, 10);
    }
    case "6M": {
      const d = new Date(Date.UTC(year, month - 6, day));
      return d.toISOString().slice(0, 10);
    }
    case "1Y": {
      const d = new Date(Date.UTC(year - 1, month, day));
      return d.toISOString().slice(0, 10);
    }
    case "YTD": {
      const d = new Date(Date.UTC(year, 0, 1));
      return d.toISOString().slice(0, 10);
    }
    case "ALL":
      return null;
    default: {
      const d = new Date(Date.UTC(year - 1, month, day));
      return d.toISOString().slice(0, 10);
    }
  }
}

// GET /api/investments/performance/asset/[assetId]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ assetId: string }> },
) {
  try {
    const { assetId: assetIdParam } = await params;
    const { searchParams } = new URL(request.url);

    // 1. Validate assetId (strict — throw on invalid)
    const assetIdParsed = z.coerce.number().int().positive().parse(assetIdParam);

    // 2. Validate timeframe (lenient — defaults to "1Y")
    const { timeframe } = assetPerformanceSchema.parse({
      assetId: assetIdParam,
      timeframe: searchParams.get("timeframe") ?? undefined,
    });

    // 3. Check asset exists
    const asset = await prisma.asset.findUnique({
      where: { id: assetIdParsed },
      select: { id: true, ticker: true, name: true, asset_type: true },
    });

    if (!asset) {
      return NextResponse.json(
        { error: "Asset not found" },
        { status: 404 },
      );
    }

    const now = new Date();
    const endDate = now.toISOString().slice(0, 10);

    // 4. Fetch COMPLETED investments for this asset
    const investments = await prisma.investment.findMany({
      where: {
        asset_id: assetIdParsed,
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

    // Map to InvestmentInput format
    const investmentInputs: InvestmentInput[] = investments.map((inv) => ({
      asset_id: inv.asset_id,
      type: inv.type as "BUY" | "SELL",
      units: Number(inv.units),
      total_amount: Number(inv.total_amount),
      executed_at: inv.executed_at!,
    }));

    // 5. Compute start date
    let startDate = computeStartDate(timeframe, now);

    if (startDate === null) {
      // "ALL" — use earliest investment date
      if (investmentInputs.length > 0) {
        const earliestInvestment = investmentInputs.reduce(
          (earliest, inv) =>
            inv.executed_at < earliest ? inv.executed_at : earliest,
          investmentInputs[0]!.executed_at,
        );
        startDate = earliestInvestment.toISOString().slice(0, 10);
      } else {
        // No investments — use 1Y default
        startDate = new Date(
          Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), now.getUTCDate()),
        )
          .toISOString()
          .slice(0, 10);
      }
    }

    // 6. Sync DAILY prices from Yahoo Finance for the full range (backfills gaps)
    const yahooMapping = await prisma.assetProviderMapping.findFirst({
      where: { asset_id: assetIdParsed, provider: "YAHOO_FINANCE" },
      select: { provider_symbol: true },
    });

    if (yahooMapping) {
      try {
        await syncPrices(
          { id: assetIdParsed, ticker: yahooMapping.provider_symbol },
          "DAILY",
          "1d",
          new Date(startDate + "T00:00:00Z"),
          new Date(endDate + "T23:59:59Z"),
        );
      } catch (syncError) {
        // Non-fatal: continue with whatever data is available
        console.error("Asset performance syncPrices error:", syncError);
      }
    }

    // 7. Fetch DAILY price data within the timeframe range
    const priceRecords = await prisma.assetPrice.findMany({
      where: {
        asset_id: assetIdParsed,
        granularity: "DAILY",
        timestamp: {
          gte: new Date(startDate + "T00:00:00Z"),
          lte: new Date(endDate + "T23:59:59Z"),
        },
      },
      select: {
        price: true,
        timestamp: true,
      },
      orderBy: { timestamp: "asc" },
    });

    const prices: Array<{ date: string; price: number }> = priceRecords.map(
      (record) => ({
        date: record.timestamp.toISOString().slice(0, 10),
        price: Number(record.price),
      }),
    );

    // 8. Compute asset history series
    const historySeries = computeAssetHistory(
      investmentInputs,
      prices,
      startDate,
      endDate,
    );

    // 9. Compute position summary using computeCostBasis
    const { totalUnits, costBasis, avgCost } = computeCostBasis(investmentInputs);

    // Get current price (latest price from the series)
    const currentPrice =
      prices.length > 0 ? prices[prices.length - 1]!.price : 0;
    const currentValue = totalUnits * currentPrice;
    const unrealizedPnl = currentValue - costBasis;
    const unrealizedPct =
      costBasis > 0 ? (unrealizedPnl / costBasis) * 100 : 0;

    // 9. Compute daily change: fetch latest 2 prices
    let dailyChange = 0;
    let dailyChangePct = 0;

    if (prices.length >= 2) {
      const latestPrice = prices[prices.length - 1]!.price;
      const previousPrice = prices[prices.length - 2]!.price;
      dailyChange = totalUnits * (latestPrice - previousPrice);
      const previousValue = totalUnits * previousPrice;
      dailyChangePct =
        previousValue > 0 ? (dailyChange / previousValue) * 100 : 0;
    }

    // 10. Build operations array
    const operations = investmentInputs
      .sort((a, b) => a.executed_at.getTime() - b.executed_at.getTime())
      .map((inv) => ({
        date: inv.executed_at.toISOString().slice(0, 10),
        type: inv.type,
        units: inv.units.toFixed(6),
        total_amount: inv.total_amount.toFixed(2),
      }));

    // 11. Format series with string-encoded decimals
    const series = historySeries.map((point) => ({
      date: point.date,
      position_value: point.position_value.toFixed(2),
      cost_basis: point.cost_basis.toFixed(2),
    }));

    // 12. Build response
    const response = {
      asset: {
        id: asset.id,
        ticker: asset.ticker,
        name: asset.name,
        asset_type: asset.asset_type,
      },
      summary: {
        total_units: totalUnits.toFixed(6),
        total_invested: costBasis.toFixed(2),
        avg_cost: avgCost.toFixed(2),
        current_price: currentPrice.toFixed(2),
        current_value: currentValue.toFixed(2),
        unrealized_pnl: unrealizedPnl.toFixed(2),
        unrealized_pct: unrealizedPct.toFixed(2),
        daily_change: dailyChange.toFixed(2),
        daily_change_pct: dailyChangePct.toFixed(2),
      },
      series,
      operations,
      timeframe,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch asset performance data" },
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
