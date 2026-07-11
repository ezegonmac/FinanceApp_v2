import { describe, it, expect, vi } from "vitest";
import * as fc from "fast-check";

vi.mock("@repo/db", () => ({ prisma: {} }));
vi.mock("yahoo-finance2", () => ({
  default: class {
    historical() {
      return [];
    }
  },
}));

import { carryForwardGaps } from "./carryForwardGaps";

/**
 * Feature: asset-comparison, Property 9: Carry-forward for missing data points
 *
 * **Validates: Requirements 5.4, 6.5**
 *
 * For any normalized series with gaps (timestamps present in one asset but not another),
 * the carry-forward function SHALL fill each gap with the most recent known value from
 * that series. No gaps SHALL remain in the output, and no value SHALL be invented that
 * wasn't the last known value.
 */

/**
 * Generates a pool of sorted ISO timestamp strings and 2-5 series that each
 * contain a varying subset of those timestamps with numeric values.
 */
const seriesInputArb = fc
  .record({
    numSeries: fc.integer({ min: 2, max: 5 }),
    baseMs: fc.integer({ min: 1_000_000_000_000, max: 1_700_000_000_000 }),
    numTimestamps: fc.integer({ min: 2, max: 20 }),
  })
  .chain(({ numSeries, baseMs, numTimestamps }) =>
    fc
      .record({
        // Generate offsets for timestamps (in hours to keep them distinct)
        offsets: fc.array(
          fc.integer({ min: 0, max: 10_000 }),
          { minLength: numTimestamps, maxLength: numTimestamps },
        ),
        // For each series, generate a subset mask and values
        seriesData: fc.array(
          fc.record({
            mask: fc.array(fc.boolean(), {
              minLength: numTimestamps,
              maxLength: numTimestamps,
            }),
            values: fc.array(
              fc.double({ min: -100, max: 500, noNaN: true, noDefaultInfinity: true }),
              { minLength: numTimestamps, maxLength: numTimestamps },
            ),
          }),
          { minLength: numSeries, maxLength: numSeries },
        ),
      })
      .map(({ offsets, seriesData }) => {
        // Create sorted unique timestamps
        const uniqueOffsets = [...new Set(offsets)].sort((a, b) => a - b);
        const timestamps = uniqueOffsets.map(
          (offset) => new Date(baseMs + offset * 3_600_000).toISOString(),
        );

        // Build the series map
        const series = new Map<number, { timestamp: string; value: number }[]>();

        for (let i = 0; i < seriesData.length; i++) {
          const { mask, values } = seriesData[i]!;
          const dataPoints: { timestamp: string; value: number }[] = [];

          for (let j = 0; j < timestamps.length; j++) {
            // Include this timestamp if mask says so (ensure at least 1 point per series)
            if (mask[j % mask.length]) {
              dataPoints.push({
                timestamp: timestamps[j]!,
                value: values[j % values.length]!,
              });
            }
          }

          // Ensure at least one data point per series
          if (dataPoints.length === 0) {
            dataPoints.push({
              timestamp: timestamps[0]!,
              value: values[0]!,
            });
          }

          series.set(i + 1, dataPoints);
        }

        return series;
      }),
  );

describe("carryForwardGaps - Property 9: Carry-forward for missing data points", () => {
  it("should fill gaps so all series share the same timestamps with no gaps remaining", () => {
    fc.assert(
      fc.property(seriesInputArb, (inputSeries) => {
        const result = carryForwardGaps(inputSeries);

        // Compute expected union of all timestamps
        const expectedTimestamps = new Set<string>();
        for (const dataPoints of inputSeries.values()) {
          for (const dp of dataPoints) {
            expectedTimestamps.add(dp.timestamp);
          }
        }
        const sortedUnion = Array.from(expectedTimestamps).sort();

        // Verification 1: All output series have the same length (= union of all timestamps)
        for (const [assetId, dataPoints] of result.entries()) {
          expect(dataPoints.length).toBe(sortedUnion.length);
        }

        // Verification 2: All output series share the same set of timestamps
        for (const [assetId, dataPoints] of result.entries()) {
          const outputTimestamps = dataPoints.map((dp) => dp.timestamp);
          expect(outputTimestamps).toEqual(sortedUnion);
        }

        // Verification 3: Original data points are preserved (not modified)
        for (const [assetId, originalPoints] of inputSeries.entries()) {
          const outputPoints = result.get(assetId)!;
          const outputByTimestamp = new Map<string, number>();
          for (const dp of outputPoints) {
            outputByTimestamp.set(dp.timestamp, dp.value);
          }

          for (const original of originalPoints) {
            expect(outputByTimestamp.get(original.timestamp)).toBe(original.value);
          }
        }

        // Verification 4: Filled values come from the last known value in that series
        // (or the first value if gap is before any data)
        for (const [assetId, originalPoints] of inputSeries.entries()) {
          const outputPoints = result.get(assetId)!;
          const originalByTimestamp = new Map<string, number>();
          for (const dp of originalPoints) {
            originalByTimestamp.set(dp.timestamp, dp.value);
          }

          const firstValue = originalPoints.length > 0 ? originalPoints[0]!.value : 0;
          let lastKnown: number | null = null;

          for (const outputDp of outputPoints) {
            const originalValue = originalByTimestamp.get(outputDp.timestamp);
            if (originalValue !== undefined) {
              // This is an original data point — should be preserved
              lastKnown = originalValue;
              expect(outputDp.value).toBe(originalValue);
            } else {
              // This is a filled gap — should be last known or first value
              const expectedFill = lastKnown !== null ? lastKnown : firstValue;
              expect(outputDp.value).toBe(expectedFill);
            }
          }
        }

        // Verification 5: No gaps remain — every timestamp in the union appears in every output series
        for (const [assetId, dataPoints] of result.entries()) {
          const outputTimestampSet = new Set(dataPoints.map((dp) => dp.timestamp));
          for (const ts of sortedUnion) {
            expect(outputTimestampSet.has(ts)).toBe(true);
          }
        }
      }),
      { numRuns: 100 },
    );
  });
});
