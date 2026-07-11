/**
 * Fills gaps in multiple normalized series so every series contains
 * every timestamp from the union of all series' timestamps.
 *
 * For each series, missing timestamps are filled by carrying forward
 * the last known normalized value. If a gap exists at the start (before
 * the series has any data), the first known value is used (or 0 if empty).
 *
 * After this function, all series share the same set of timestamps with
 * no gaps remaining.
 */
export function carryForwardGaps(
  series: Map<number, { timestamp: string; value: number }[]>,
): Map<number, { timestamp: string; value: number }[]> {
  // 1. Compute the union of all timestamps across all series
  const timestampSet = new Set<string>();
  for (const dataPoints of series.values()) {
    for (const dp of dataPoints) {
      timestampSet.add(dp.timestamp);
    }
  }

  // 2. Sort the union timestamps chronologically (ISO 8601 strings sort lexicographically)
  const allTimestamps = Array.from(timestampSet).sort();

  // 3. For each series, produce a complete array covering all union timestamps
  const result = new Map<number, { timestamp: string; value: number }[]>();

  for (const [assetId, dataPoints] of series.entries()) {
    // Build a lookup map for O(1) access by timestamp
    const valueByTimestamp = new Map<string, number>();
    for (const dp of dataPoints) {
      valueByTimestamp.set(dp.timestamp, dp.value);
    }

    // Determine the fill value for gaps before any data exists
    const firstValue = dataPoints.length > 0 ? dataPoints[0]!.value : 0;

    const filled: { timestamp: string; value: number }[] = [];
    let lastKnown: number | null = null;

    for (const ts of allTimestamps) {
      const existing = valueByTimestamp.get(ts);
      if (existing !== undefined) {
        lastKnown = existing;
        filled.push({ timestamp: ts, value: existing });
      } else {
        // Use last known value, or first value if no data seen yet
        const fillValue = lastKnown !== null ? lastKnown : firstValue;
        filled.push({ timestamp: ts, value: fillValue });
      }
    }

    result.set(assetId, filled);
  }

  return result;
}
