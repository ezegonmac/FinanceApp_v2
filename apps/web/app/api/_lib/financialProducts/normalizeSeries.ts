/**
 * Transforms a raw price series into percentage change values relative to a
 * reference price (firstPrice). Each value represents the cumulative return
 * from the start date as a percentage.
 *
 * Formula: round(((price / firstPrice) - 1) * 100, 2)
 *
 * The first value in the output is always exactly 0.00 (since the first price
 * IS the reference price).
 *
 * Requirements: 5.1, 5.2
 */
export function normalizeSeries(
  prices: { timestamp: Date; price: number }[],
  firstPrice: number,
): { timestamp: string; value: number }[] {
  return prices.map((point) => ({
    timestamp: point.timestamp.toISOString(),
    value: Math.round(((point.price / firstPrice - 1) * 100) * 100) / 100,
  }));
}
