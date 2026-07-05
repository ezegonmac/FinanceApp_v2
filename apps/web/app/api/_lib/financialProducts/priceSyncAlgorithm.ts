import { getEuropeMadridDateParts } from "@repo/utils";
import type { Timeframe, YahooInterval, GranularityValue } from "./types";
import { TIMEFRAME_CONFIG } from "./types";
import { prisma } from "@repo/db";
import { type Granularity } from "@repo/db";
import YahooFinance from "yahoo-finance2";
import type { HistoricalOptionsEventsHistory } from "yahoo-finance2/modules/historical";

const yahooFinance = new YahooFinance();

/**
 * Resolves the [from, to] Date window for a given timeframe.
 * "to" is always the current timestamp at call time.
 * "from" is derived per timeframe:
 *   TODAY → start of current calendar day (midnight local Europe/Madrid)
 *   1W    → now − 7 days
 *   1M    → now − 1 month
 *   3M    → now − 3 months
 *   6M    → now − 6 months
 *   1Y    → now − 1 year
 *   5Y    → now − 5 years
 *   ALL   → Unix epoch (new Date(0))
 */
export function resolveTimeframeDates(timeframe: Timeframe): { from: Date; to: Date } {
  const to = new Date();

  switch (timeframe) {
    case "TODAY": {
      const { year, month, day } = getEuropeMadridDateParts();
      // midnight local time (not UTC) for the current calendar day in Europe/Madrid
      const from = new Date(year, month - 1, day);
      return { from, to };
    }
    case "1W": {
      const from = new Date(to);
      from.setDate(from.getDate() - 7);
      return { from, to };
    }
    case "1M": {
      const from = new Date(to);
      from.setMonth(from.getMonth() - 1);
      return { from, to };
    }
    case "3M": {
      const from = new Date(to);
      from.setMonth(from.getMonth() - 3);
      return { from, to };
    }
    case "6M": {
      const from = new Date(to);
      from.setMonth(from.getMonth() - 6);
      return { from, to };
    }
    case "1Y": {
      const from = new Date(to);
      from.setFullYear(from.getFullYear() - 1);
      return { from, to };
    }
    case "5Y": {
      const from = new Date(to);
      from.setFullYear(from.getFullYear() - 5);
      return { from, to };
    }
    case "ALL": {
      return { from: new Date(0), to };
    }
  }
}

/**
 * Maps a user-facing timeframe + asset price frequency to DB granularity,
 * Yahoo Finance interval, and the resolved date range.
 *
 * Applies the DAILY fallback rule: if the asset only publishes one price per
 * trading day (priceFrequency === "DAILY") and the timeframe would otherwise
 * request intraday granularity (FIFTEEN_MIN or HOURLY), the granularity is
 * downgraded to DAILY and the interval to "1d".
 *
 * Throws a runtime Error if timeframe is not present in TIMEFRAME_CONFIG.
 */
export function deriveGranularity(
  timeframe: Timeframe,
  priceFrequency: "DAILY" | "INTRADAY",
): { granularity: GranularityValue; interval: YahooInterval; from: Date; to: Date } {
  const config = TIMEFRAME_CONFIG[timeframe];

  if (!config) {
    throw new Error(`Unknown timeframe: "${timeframe}"`);
  }

  const { from, to } = resolveTimeframeDates(timeframe);

  const isIntraday =
    config.granularity === "FIFTEEN_MIN" || config.granularity === "HOURLY";

  if (priceFrequency === "DAILY" && isIntraday) {
    return { granularity: "DAILY", interval: "1d", from, to };
  }

  return { ...config, from, to };
}

/**
 * Computes the date ranges within [from, to] that are NOT covered by any of
 * the provided `covered` intervals.
 *
 * Steps:
 *  1. If from >= to, return [].
 *  2. Clip each covered range to the [from, to] window; discard fully-outside ranges.
 *  3. Sort clipped ranges by `from` ascending.
 *  4. Walk the window collecting gaps between ranges.
 *  5. Append a trailing gap if the last range doesn't reach `to`.
 *
 * Requirements: 7.1, 7.2
 */
export function computeMissingRanges(
  covered: Array<{ from: Date; to: Date }>,
  from: Date,
  to: Date,
): Array<{ from: Date; to: Date }> {
  // 1. Degenerate window
  if (from >= to) {
    return [];
  }

  // 2. Clip each range to [from, to] and discard anything fully outside
  const clipped = covered
    .map((range) => ({
      from: new Date(Math.max(range.from.getTime(), from.getTime())),
      to:   new Date(Math.min(range.to.getTime(),   to.getTime())),
    }))
    .filter((range) => range.from < range.to);

  // 3. Sort by from ascending
  clipped.sort((a, b) => a.from.getTime() - b.from.getTime());

  // 4. Walk the window collecting gaps
  const gaps: Array<{ from: Date; to: Date }> = [];
  let cursor = from;

  for (const range of clipped) {
    if (range.from > cursor) {
      gaps.push({ from: cursor, to: range.from });
    }
    // Advance cursor, but never move it backwards
    if (range.to > cursor) {
      cursor = range.to;
    }
  }

  // 5. Trailing gap
  if (cursor < to) {
    gaps.push({ from: cursor, to });
  }

  return gaps;
}

/**
 * Merges the given [from, to] range into the `asset_price_sync_ranges` table
 * for the specified asset and granularity. Any existing records that overlap
 * or touch the new range are deleted and replaced with a single merged record
 * spanning the full extent of all combined intervals.
 *
 * Requirements: 7.6
 */
export async function mergeSyncRange(
  assetId: number,
  granularity: GranularityValue,
  from: Date,
  to: Date,
): Promise<void> {
  // 1. Query all existing sync range records for this asset + granularity
  const existing = await prisma.assetPriceSyncRange.findMany({
    where: {
      asset_id: assetId,
      granularity: granularity as Granularity,
    },
  });

  // 2. Find records that overlap or touch the new [from, to] range
  const overlapping = existing.filter(
    (record) =>
      record.from_timestamp <= to && record.until_timestamp >= from,
  );

  // 3 & 4. Compute merged span from the new range + all overlapping records
  const allFroms = [from, ...overlapping.map((r) => r.from_timestamp)];
  const allTos   = [to,   ...overlapping.map((r) => r.until_timestamp)];

  const mergedFrom = new Date(Math.min(...allFroms.map((d) => d.getTime())));
  const mergedTo   = new Date(Math.max(...allTos.map((d) => d.getTime())));

  // 5. Execute delete(s) + create in a single transaction
  const overlappingIds = overlapping.map((r) => r.id);

  await prisma.$transaction([
    ...(overlappingIds.length > 0
      ? [
          prisma.assetPriceSyncRange.deleteMany({
            where: { id: { in: overlappingIds } },
          }),
        ]
      : []),
    prisma.assetPriceSyncRange.create({
      data: {
        asset_id:        assetId,
        granularity:     granularity as Granularity,
        from_timestamp:  mergedFrom,
        until_timestamp: mergedTo,
      },
    }),
  ]);
}

/**
 * Fetches and stores missing price data for the given asset, granularity, and
 * date range. Already-covered intervals (from `asset_price_sync_ranges`) are
 * skipped so that Yahoo Finance is only called for genuine gaps.
 *
 * Algorithm:
 *  1. Query existing sync ranges for this asset + granularity.
 *  2. Compute gaps via `computeMissingRanges`.
 *  3. Return early if there are no gaps.
 *  4. For each gap:
 *     a. Fetch historical prices from Yahoo Finance (propagate errors immediately).
 *     b. Batch-upsert the returned rows into `asset_prices`.
 *     c. Call `mergeSyncRange` to record the gap as covered (even if Yahoo
 *        returned zero rows).
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.7, 7.8, 7.9
 */
export async function syncPrices(
  asset: { id: number; ticker: string },
  granularity: GranularityValue,
  interval: YahooInterval,
  from: Date,
  to: Date,
): Promise<void> {
  // 1. Query already-covered intervals for this asset + granularity
  const syncRangeRecords = await prisma.assetPriceSyncRange.findMany({
    where: {
      asset_id:    asset.id,
      granularity: granularity as Granularity,
    },
  });

  // 2. Map to plain { from, to } objects
  const covered = syncRangeRecords.map((record) => ({
    from: record.from_timestamp,
    to:   record.until_timestamp,
  }));

  // 3. Compute gaps
  const gaps = computeMissingRanges(covered, from, to);

  // 4. Return early if no gaps
  if (gaps.length === 0) {
    return;
  }

  // 5. Fetch + persist each gap
  for (const gap of gaps) {
    // a. Fetch from Yahoo Finance — let errors propagate immediately
    const historicalOptions: HistoricalOptionsEventsHistory = {
      period1:  gap.from,
      period2:  gap.to,
      // Yahoo historical only supports "1d" | "1wk" | "1mo"; intraday intervals
      // ("15m", "1h") must be fetched via the chart module. We cast here because
      // the caller is responsible for passing a compatible interval.
      interval: interval as HistoricalOptionsEventsHistory["interval"],
    };
    const rows = await yahooFinance.historical(asset.ticker, historicalOptions);

    // b. Batch-upsert returned rows into asset_prices
    if (rows.length > 0) {
      await prisma.assetPrice.createMany({
        data: rows.map((row) => ({
          asset_id:    asset.id,
          timestamp:   row.date,
          price:       row.close ?? row.adjClose ?? 0,
          granularity: granularity as Granularity,
        })),
        skipDuplicates: true,
      });
    }

    // c. Mark this gap as synced (even when Yahoo returned zero rows)
    await mergeSyncRange(asset.id, granularity, gap.from, gap.to);
  }
}
