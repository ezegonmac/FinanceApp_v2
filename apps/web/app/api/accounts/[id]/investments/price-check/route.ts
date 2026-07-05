import { prisma } from "@repo/db";
import { NextResponse } from "next/server";
import { syncPrices } from "@/app/api/_lib/financialProducts/priceSyncAlgorithm";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/accounts/:id/investments/price-check?asset_id=<id>&date=<YYYY-MM-DD>
 *
 * Syncs and returns the asset price for the given date.
 * Used by the form to preview the unit price before submitting.
 */
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const accountId = Number(id);
    if (Number.isNaN(accountId)) {
      return NextResponse.json({ error: "Invalid account id" }, { status: 400 });
    }

    const url = new URL(request.url);
    const assetId = Number(url.searchParams.get("asset_id"));
    const dateStr = url.searchParams.get("date");

    if (!assetId || Number.isNaN(assetId)) {
      return NextResponse.json({ error: "asset_id is required" }, { status: 400 });
    }
    if (!dateStr) {
      return NextResponse.json({ error: "date is required" }, { status: 400 });
    }

    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      select: { id: true, providerMappings: true },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    const executedDate = new Date(`${dateStr}T00:00:00.000Z`);

    // Sync prices around the date
    const yahooMapping = asset.providerMappings.find(
      (m: { provider: string }) => m.provider === "YAHOO_FINANCE"
    );
    if (yahooMapping) {
      const syncFrom = new Date(executedDate);
      syncFrom.setDate(syncFrom.getDate() - 5);
      const syncTo = new Date(executedDate);
      syncTo.setDate(syncTo.getDate() + 1);
      try {
        await syncPrices(
          { id: assetId, ticker: yahooMapping.provider_symbol },
          "DAILY",
          "1d",
          syncFrom,
          syncTo,
        );
      } catch {
        // Non-fatal
      }
    }

    // Look up the price
    const endOfDay = new Date(executedDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const priceRecord = await prisma.assetPrice.findFirst({
      where: {
        asset_id: assetId,
        timestamp: { gte: executedDate, lte: endOfDay },
      },
      orderBy: { timestamp: "asc" },
      select: { price: true, timestamp: true },
    });

    const finalPriceRecord = priceRecord ?? await prisma.assetPrice.findFirst({
      where: {
        asset_id: assetId,
        timestamp: { lt: executedDate },
      },
      orderBy: { timestamp: "desc" },
      select: { price: true, timestamp: true },
    });

    if (!finalPriceRecord) {
      return NextResponse.json({ error: "No price data available" }, { status: 404 });
    }

    return NextResponse.json({
      price: Number(finalPriceRecord.price),
      timestamp: finalPriceRecord.timestamp,
    }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to check price" }, { status: 500 });
  }
}

export function OPTIONS() {
  return NextResponse.json({}, {
    status: 405,
    headers: { Allow: "GET" },
  });
}
