import type { GranularityValue, YahooInterval } from "./types";

/**
 * Derives the display granularity and Yahoo interval for a custom date range
 * based on the span (number of days between start and end dates).
 *
 * Thresholds mirror the preset TIMEFRAME_CONFIG:
 *   ≤7 days  → HOURLY / "1h"  (same as 1W)
 *   ≤31 days → DAILY  / "1d"  (same as 1M)
 *   ≤365 days→ DAILY  / "1d"  (same as 1Y)
 *   >365 days→ WEEKLY / "1wk" (same as 5Y)
 *
 * Applies the DAILY fallback: if priceFrequency is "DAILY" and derived
 * granularity is sub-daily (FIFTEEN_MIN or HOURLY), falls back to DAILY/"1d".
 */
export function customRangeGranularity(
  startDate: Date,
  endDate: Date,
  priceFrequency: "DAILY" | "INTRADAY",
): { granularity: GranularityValue; interval: YahooInterval } {
  const spanMs = endDate.getTime() - startDate.getTime();
  const spanDays = spanMs / (1000 * 60 * 60 * 24);

  let granularity: GranularityValue;
  let interval: YahooInterval;

  if (spanDays <= 7) {
    granularity = "HOURLY";
    interval = "1h";
  } else if (spanDays <= 31) {
    granularity = "DAILY";
    interval = "1d";
  } else if (spanDays <= 365) {
    granularity = "DAILY";
    interval = "1d";
  } else {
    granularity = "WEEKLY";
    interval = "1wk";
  }

  // DAILY fallback: assets with price_frequency "DAILY" cannot use sub-daily granularity
  if (priceFrequency === "DAILY" && granularity === "HOURLY") {
    return { granularity: "DAILY", interval: "1d" };
  }

  return { granularity, interval };
}
