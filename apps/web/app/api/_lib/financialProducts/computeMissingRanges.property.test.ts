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

import { computeMissingRanges } from "./priceSyncAlgorithm";

/**
 * Generates a [from, to] window and a list of non-overlapping intervals.
 * Strategy: generate a base timestamp and a positive window size for [from, to],
 * then generate sorted breakpoints and take alternating pairs as intervals.
 */
const testInputArb = fc
  .record({
    baseMs: fc.integer({ min: 0, max: 1_000_000_000_000 }),
    windowSize: fc.integer({ min: 1, max: 365 * 24 * 60 * 60 * 1000 }),
    breakpoints: fc.array(fc.double({ min: -0.25, max: 1.25, noNaN: true }), {
      minLength: 0,
      maxLength: 20,
    }),
  })
  .map(({ baseMs, windowSize, breakpoints }) => {
    const from = new Date(baseMs);
    const to = new Date(baseMs + windowSize);

    // Convert relative breakpoints to absolute timestamps (may extend beyond [from, to])
    const absolutes = breakpoints.map((bp) =>
      Math.round(baseMs + bp * windowSize),
    );
    const sorted = [...new Set(absolutes)].sort((a, b) => a - b);

    // Take alternating pairs as non-overlapping intervals
    const covered: Array<{ from: Date; to: Date }> = [];
    for (let i = 0; i + 1 < sorted.length; i += 2) {
      const cFrom = new Date(sorted[i]!);
      const cTo = new Date(sorted[i + 1]!);
      if (cFrom < cTo) {
        covered.push({ from: cFrom, to: cTo });
      }
    }

    return { from, to, covered };
  });

describe("computeMissingRanges - Property 2: Missing range computation is exact", () => {
  /**
   * **Validates: Requirements 7.1, 7.2**
   *
   * Property 2: For any set of non-overlapping covered intervals and any [from, to] window,
   * computeMissingRanges returns gaps such that:
   *   1. Result intervals are disjoint (each ends before or at the start of the next)
   *   2. Each result interval is contained in [from, to]
   *   3. Union of covered (clipped to [from, to]) + result covers the entire [from, to] window
   *   4. Result ∩ covered (clipped to [from, to]) = ∅
   */
  it("should produce disjoint gaps contained in [from, to] that exactly fill uncovered space", () => {
    fc.assert(
      fc.property(testInputArb, ({ from, to, covered }) => {
        const result = computeMissingRanges(covered, from, to);

        // Property 1: Result intervals are disjoint
        for (let i = 0; i + 1 < result.length; i++) {
          expect(result[i]!.to.getTime()).toBeLessThanOrEqual(
            result[i + 1]!.from.getTime(),
          );
        }

        // Property 2: Each result interval is contained in [from, to]
        for (const gap of result) {
          expect(gap.from.getTime()).toBeGreaterThanOrEqual(from.getTime());
          expect(gap.to.getTime()).toBeLessThanOrEqual(to.getTime());
          // Each gap must be a valid interval (from < to)
          expect(gap.from.getTime()).toBeLessThan(gap.to.getTime());
        }

        // Property 3: Union of covered (clipped to [from, to]) + result covers [from, to]
        const clippedCovered = covered
          .map((c) => ({
            from: new Date(Math.max(c.from.getTime(), from.getTime())),
            to: new Date(Math.min(c.to.getTime(), to.getTime())),
          }))
          .filter((c) => c.from < c.to);

        const allIntervals = [...clippedCovered, ...result].sort(
          (a, b) => a.from.getTime() - b.from.getTime(),
        );

        // Merge all intervals and verify they cover [from, to]
        const merged: Array<{ from: number; to: number }> = [];
        for (const interval of allIntervals) {
          const iFrom = interval.from.getTime();
          const iTo = interval.to.getTime();
          if (merged.length === 0 || iFrom > merged[merged.length - 1]!.to) {
            merged.push({ from: iFrom, to: iTo });
          } else {
            merged[merged.length - 1]!.to = Math.max(
              merged[merged.length - 1]!.to,
              iTo,
            );
          }
        }

        expect(merged.length).toBeGreaterThanOrEqual(1);
        expect(merged[0]!.from).toBeLessThanOrEqual(from.getTime());
        expect(merged[merged.length - 1]!.to).toBeGreaterThanOrEqual(
          to.getTime(),
        );
        // No internal gaps
        for (let i = 0; i + 1 < merged.length; i++) {
          expect(merged[i]!.to).toBeGreaterThanOrEqual(merged[i + 1]!.from);
        }

        // Property 4: Result ∩ covered (clipped to [from, to]) = ∅
        for (const gap of result) {
          for (const cov of clippedCovered) {
            const overlaps =
              gap.from.getTime() < cov.to.getTime() &&
              gap.to.getTime() > cov.from.getTime();
            expect(overlaps).toBe(false);
          }
        }
      }),
      { numRuns: 100 },
    );
  });
});
