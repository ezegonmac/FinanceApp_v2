import { prisma } from "@repo/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  computePortfolioHistory,
  type HistoryInput,
} from "../../../_lib/performance/historyCalculator";
import { type InvestmentInput } from "../../../_lib/performance/performanceCalculator";

export const dynamic = "force-dynamic";

const historyQuerySchema = z.object({
  timeframe: z
    .enum(["1M", "3M", "6M", "1Y", "YTD", "ALL"])
    .catch("1Y"),
});

/**
 * Computes the start date based on the selected timeframe.
 * Returns a YYYY-MM-DD string in UTC.
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
      return null; // Will be determined from earliest data
    default: {
      const d = new Date(Date.UTC(year - 1, month, day));
      return d.toISOString().slice(0, 10);
    }
  }
}

// GET /api/investments/performance/history
export async function GET(request: Request) {
  try {
    // 1. Validate query params — invalid timeframe defaults to "1Y"
    const { searchParams } = new URL(request.url);
    const parsed = historyQuerySchema.parse({
      timeframe: searchParams.get("timeframe") ?? undefined,
    });

    const timeframe = parsed.timeframe;
    const now = new Date();
    const endDate = now.toISOString().slice(0, 10);

    // 2. Fetch ALL completed investments (need all for accurate position tracking)
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

    if (investments.length === 0) {
      return NextResponse.json(
        { series: [], timeframe },
        { status: 200 },
      );
    }

    // 3. Compute startDate based on timeframe
    let startDate = computeStartDate(timeframe, now);

    if (startDate === null) {
      // "ALL" — use earliest investment date or earliest price date
      const earliestInvestment = investments.reduce(
        (earliest, inv) => {
          const execDate = inv.executed_at!;
          return execDate < earliest ? execDate : earliest;
        },
        investments[0]!.executed_at!,
      );
      startDate = earliestInvestment.toISOString().slice(0, 10);
    }

    // 4. Map investments to InvestmentInput format
    const investmentInputs: InvestmentInput[] = investments.map((inv) => ({
      asset_id: inv.asset_id,
      type: inv.type as "BUY" | "SELL",
      units: Number(inv.units),
      total_amount: Number(inv.total_amount),
      executed_at: inv.executed_at!,
    }));

    // 5. Get unique asset IDs from investments
    const assetIds = [...new Set(investmentInputs.map((inv) => inv.asset_id))];

    // 6. Fetch DAILY price data within the timeframe range
    const priceRecords = await prisma.assetPrice.findMany({
      where: {
        asset_id: { in: assetIds },
        granularity: "DAILY",
        timestamp: {
          gte: new Date(startDate + "T00:00:00Z"),
          lte: new Date(endDate + "T23:59:59Z"),
        },
      },
      select: {
        asset_id: true,
        price: true,
        timestamp: true,
      },
      orderBy: { timestamp: "asc" },
    });

    // 7. Build prices map: asset_id → Array<{ date, price }>
    const pricesMap = new Map<number, Array<{ date: string; price: number }>>();
    for (const record of priceRecords) {
      const date = record.timestamp.toISOString().slice(0, 10);
      const existing = pricesMap.get(record.asset_id) ?? [];
      existing.push({ date, price: Number(record.price) });
      pricesMap.set(record.asset_id, existing);
    }

    // Adjust startDate to the earliest available price date to avoid flatline
    // periods where no price data exists for any asset
    if (priceRecords.length > 0) {
      const earliestPriceDate = priceRecords[0]!.timestamp.toISOString().slice(0, 10);
      if (earliestPriceDate > startDate) {
        startDate = earliestPriceDate;
      }
    }

    // 8. Call computePortfolioHistory
    const historyInput: HistoryInput = {
      investments: investmentInputs,
      prices: pricesMap,
      startDate,
      endDate,
    };

    const historyPoints = computePortfolioHistory(historyInput);

    // 9. Format response with string-encoded decimals
    const series = historyPoints.map((point) => ({
      date: point.date,
      portfolio_value: point.portfolio_value.toFixed(2),
      total_invested: point.total_invested.toFixed(2),
    }));

    return NextResponse.json(
      { series, timeframe },
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
      { error: "Failed to fetch performance history" },
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
