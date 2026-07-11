import { prisma, type Granularity } from "@repo/db";
import type { Timeframe, GranularityValue, YahooInterval } from "./types";
import { resolveTimeframeDates, deriveGranularity, syncPrices } from "./priceSyncAlgorithm";
import { normalizeSeries } from "./normalizeSeries";
import { carryForwardGaps } from "./carryForwardGaps";
import { customRangeGranularity } from "./customRangeGranularity";

// ─── Color Palette ────────────────────────────────────────────────────────────

export const COMPARISON_COLORS = [
  "#2563eb", // blue
  "#dc2626", // red
  "#16a34a", // green
  "#9333ea", // purple
  "#ea580c", // orange
];

// ─── Error Classes ────────────────────────────────────────────────────────────

export class ComparisonValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ComparisonValidationError";
  }
}

export class ComparisonSyncError extends Error {
  public failedAssets: Array<{ assetId: number; ticker: string; reason: string }>;

  constructor(failedAssets: Array<{ assetId: number; ticker: string; reason: string }>) {
    super("Price sync failed");
    this.name = "ComparisonSyncError";
    this.failedAssets = failedAssets;
  }
}

export class ComparisonDataError extends Error {
  public code: string;
  public assets: Array<{ assetId: number; ticker: string; dataPoints?: number }>;

  constructor(
    code: string,
    message: string,
    assets: Array<{ assetId: number; ticker: string; dataPoints?: number }>,
  ) {
    super(message);
    this.name = "ComparisonDataError";
    this.code = code;
    this.assets = assets;
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type ComparisonInput = {
  assets: Array<{
    id: number;
    ticker: string;
    name: string;
    price_frequency: "DAILY" | "INTRADAY";
  }>;
  timeframe?: Timeframe;
  startDate?: Date;
  endDate?: Date;
};

export type ComparisonResult = {
  series: Array<{
    assetId: number;
    assetName: string;
    ticker: string;
    color: string;
    periodReturn: number;
    dataPoints: Array<{ timestamp: string; value: number }>;
  }>;
  effectiveStartDate: string;
  timeframe: string;
};

// ─── Service Function ─────────────────────────────────────────────────────────

export async function compareAssets(input: ComparisonInput): Promise<ComparisonResult> {
  const { assets, timeframe, startDate, endDate } = input;

  // ── 1. Validate input ──────────────────────────────────────────────────────

  if (assets.length < 2 || assets.length > 5) {
    throw new ComparisonValidationError(
      "Must provide 2-5 assets for comparison",
    );
  }

  const uniqueIds = new Set(assets.map((a) => a.id));
  if (uniqueIds.size !== assets.length) {
    throw new ComparisonValidationError(
      "Asset IDs must be unique (no duplicates)",
    );
  }

  if (!timeframe && (!startDate || !endDate)) {
    throw new ComparisonValidationError(
      "Either timeframe or both startDate and endDate must be provided",
    );
  }

  if (startDate && endDate && startDate >= endDate) {
    throw new ComparisonValidationError(
      "startDate must be before endDate",
    );
  }

  // ── 2. Resolve date window ─────────────────────────────────────────────────

  let from: Date;
  let to: Date;

  if (timeframe) {
    const resolved = resolveTimeframeDates(timeframe);
    from = resolved.from;
    to = resolved.to;
  } else {
    from = startDate!;
    to = endDate!;
  }

  // ── 3. Derive granularity per asset ────────────────────────────────────────

  const assetGranularities: Array<{
    asset: ComparisonInput["assets"][number];
    granularity: GranularityValue;
    interval: YahooInterval;
    from: Date;
    to: Date;
  }> = [];

  for (const asset of assets) {
    if (timeframe) {
      const derived = deriveGranularity(timeframe, asset.price_frequency);
      assetGranularities.push({ asset, ...derived });
    } else {
      const derived = customRangeGranularity(startDate!, endDate!, asset.price_frequency);
      assetGranularities.push({ asset, ...derived, from, to });
    }
  }

  // ── 4. Sync prices in parallel ─────────────────────────────────────────────

  const syncResults = await Promise.allSettled(
    assetGranularities.map((ag) =>
      syncPrices(
        { id: ag.asset.id, ticker: ag.asset.ticker },
        ag.granularity,
        ag.interval,
        ag.from,
        ag.to,
      ),
    ),
  );

  const failedSyncs: Array<{ assetId: number; ticker: string; reason: string }> = [];
  for (let i = 0; i < syncResults.length; i++) {
    const result = syncResults[i]!;
    if (result.status === "rejected") {
      const asset = assetGranularities[i]!.asset;
      failedSyncs.push({
        assetId: asset.id,
        ticker: asset.ticker,
        reason: result.reason instanceof Error ? result.reason.message : String(result.reason),
      });
    }
  }

  if (failedSyncs.length > 0) {
    throw new ComparisonSyncError(failedSyncs);
  }

  // ── 5. Query asset_prices for each asset ───────────────────────────────────

  const assetPriceData: Array<{
    asset: ComparisonInput["assets"][number];
    prices: Array<{ timestamp: Date; price: number }>;
  }> = [];

  for (const ag of assetGranularities) {
    const rows = await prisma.assetPrice.findMany({
      where: {
        asset_id: ag.asset.id,
        granularity: ag.granularity as Granularity,
        timestamp: {
          gte: ag.from,
          lte: ag.to,
        },
      },
      orderBy: { timestamp: "asc" },
      select: { timestamp: true, price: true },
    });

    if (rows.length === 0) {
      throw new ComparisonDataError(
        "NO_DATA",
        "No price data available",
        [{ assetId: ag.asset.id, ticker: ag.asset.ticker }],
      );
    }

    assetPriceData.push({
      asset: ag.asset,
      prices: rows.map((r) => ({
        timestamp: r.timestamp,
        price: Number(r.price),
      })),
    });
  }

  // ── 6. Compute effective common start date ─────────────────────────────────

  const effectiveStartDate = new Date(
    Math.max(...assetPriceData.map((apd) => apd.prices[0]!.timestamp.getTime())),
  );

  // ── 7. Filter prices after common start and validate ───────────────────────

  const insufficientAssets: Array<{ assetId: number; ticker: string; dataPoints: number }> = [];

  const filteredPriceData: Array<{
    asset: ComparisonInput["assets"][number];
    prices: Array<{ timestamp: Date; price: number }>;
  }> = [];

  for (const apd of assetPriceData) {
    const filtered = apd.prices.filter(
      (p) => p.timestamp >= effectiveStartDate,
    );

    if (filtered.length < 2) {
      insufficientAssets.push({
        assetId: apd.asset.id,
        ticker: apd.asset.ticker,
        dataPoints: filtered.length,
      });
    }

    filteredPriceData.push({ asset: apd.asset, prices: filtered });
  }

  if (insufficientAssets.length > 0) {
    throw new ComparisonDataError(
      "INSUFFICIENT_DATA",
      "Insufficient data points",
      insufficientAssets,
    );
  }

  // ── 8. Validate firstPrice is not zero/null ────────────────────────────────

  const zeroFirstPriceAssets: Array<{ assetId: number; ticker: string }> = [];

  for (const fpd of filteredPriceData) {
    const firstPrice = fpd.prices[0]?.price;
    if (!firstPrice || firstPrice === 0) {
      zeroFirstPriceAssets.push({
        assetId: fpd.asset.id,
        ticker: fpd.asset.ticker,
      });
    }
  }

  if (zeroFirstPriceAssets.length > 0) {
    throw new ComparisonDataError(
      "ZERO_FIRST_PRICE",
      "Cannot normalize: zero price at start date",
      zeroFirstPriceAssets,
    );
  }

  // ── 9. Normalize each series ───────────────────────────────────────────────

  const normalizedMap = new Map<number, { timestamp: string; value: number }[]>();

  for (const fpd of filteredPriceData) {
    const firstPrice = fpd.prices[0]!.price;
    const normalized = normalizeSeries(fpd.prices, firstPrice);
    normalizedMap.set(fpd.asset.id, normalized);
  }

  // ── 10. Apply carry-forward ────────────────────────────────────────────────

  const alignedMap = carryForwardGaps(normalizedMap);

  // ── 11. Build structured response ──────────────────────────────────────────

  const series = filteredPriceData.map((fpd, index) => {
    const dataPoints = alignedMap.get(fpd.asset.id) ?? [];
    const periodReturn = dataPoints.length > 0 ? dataPoints[dataPoints.length - 1]!.value : 0;

    return {
      assetId: fpd.asset.id,
      assetName: fpd.asset.name,
      ticker: fpd.asset.ticker,
      color: COMPARISON_COLORS[index % COMPARISON_COLORS.length]!,
      periodReturn,
      dataPoints,
    };
  });

  return {
    series,
    effectiveStartDate: effectiveStartDate.toISOString(),
    timeframe: timeframe ?? "CUSTOM",
  };
}
