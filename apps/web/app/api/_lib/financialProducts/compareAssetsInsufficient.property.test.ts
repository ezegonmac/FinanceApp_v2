import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock("@repo/db", () => ({
  prisma: {
    assetPrice: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("yahoo-finance2", () => ({
  default: class {
    historical() {
      return [];
    }
  },
}));

vi.mock("./priceSyncAlgorithm", () => ({
  resolveTimeframeDates: vi.fn(() => ({
    from: new Date("2020-01-01"),
    to: new Date("2025-01-01"),
  })),
  deriveGranularity: vi.fn(() => ({
    granularity: "DAILY",
    interval: "1d",
    from: new Date("2020-01-01"),
    to: new Date("2025-01-01"),
  })),
  syncPrices: vi.fn(() => Promise.resolve()),
}));

import { prisma } from "@repo/db";
import { compareAssets, ComparisonDataError } from "./compareAssets";

describe("compareAssets - Property 6: Insufficient data detection", () => {
  /**
   * **Validates: Requirements 3.4, 3.5, 4.4**
   *
   * For any set of assets where at least one asset has fewer than 2 data points
   * at its display granularity after the effective common start date, the comparison
   * service SHALL return an error identifying which asset(s) have fewer than 2 data points.
   */

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw ComparisonDataError when at least one asset has < 2 data points after effective common start", async () => {
    /**
     * Strategy:
     * - Generate 2 assets.
     * - The "rich" asset starts at a certain day and has enough points to span past
     *   the effective common start date (ensuring >= 2 points after it).
     * - The "insufficient" asset starts LATER (establishing the common start), with
     *   only 0 or 1 data points total.
     *
     * The effective common start = max of all first timestamps.
     * If insufficientPointCount is 0, the NO_DATA path triggers (rows.length === 0 check).
     * If insufficientPointCount is 1, the INSUFFICIENT_DATA path triggers after filtering.
     *
     * Key: the rich asset must have enough points extending past the common start to have >= 2.
     */
    const testInputArb = fc.record({
      // The rich asset starts at day 0
      richPointCount: fc.integer({ min: 10, max: 50 }),
      // The insufficient asset starts later (at most richPointCount - 3 days in to
      // ensure the rich asset still has >= 2 points after the common start)
      insufficientStartDay: fc.integer({ min: 1, max: 5 }),
      insufficientPointCount: fc.constantFrom(0, 1),
      priceBase: fc.integer({ min: 1, max: 1000 }),
    });

    await fc.assert(
      fc.asyncProperty(testInputArb, async (input) => {
        const {
          richPointCount,
          insufficientStartDay,
          insufficientPointCount,
          priceBase,
        } = input;

        const baseDate = new Date("2020-01-01T00:00:00.000Z");
        const DAY_MS = 24 * 60 * 60 * 1000;

        // Rich asset starts at day 0, has richPointCount daily points
        const richPrices = Array.from({ length: richPointCount }, (_, i) => ({
          timestamp: new Date(baseDate.getTime() + i * DAY_MS),
          price: priceBase + i,
        }));

        // Insufficient asset starts at insufficientStartDay
        const insufficientStart = new Date(
          baseDate.getTime() + insufficientStartDay * DAY_MS,
        );
        const insufficientPrices = Array.from(
          { length: insufficientPointCount },
          (_, i) => ({
            timestamp: new Date(insufficientStart.getTime() + i * DAY_MS),
            price: priceBase + 100 + i,
          }),
        );

        const assets = [
          { id: 1, ticker: "RICH", name: "Rich Asset", price_frequency: "DAILY" as const },
          { id: 2, ticker: "INSUF", name: "Insufficient Asset", price_frequency: "DAILY" as const },
        ];

        const findManyMock = prisma.assetPrice.findMany as ReturnType<typeof vi.fn>;
        findManyMock.mockImplementation(
          (args: { where: { asset_id: number } }) => {
            if (args.where.asset_id === 1) {
              return Promise.resolve(richPrices);
            }
            if (args.where.asset_id === 2) {
              return Promise.resolve(insufficientPrices);
            }
            return Promise.resolve([]);
          },
        );

        try {
          await compareAssets({ assets, timeframe: "1Y" });
          // Should not reach here — an error must be thrown
          expect.fail("Expected ComparisonDataError to be thrown");
        } catch (error) {
          expect(error).toBeInstanceOf(ComparisonDataError);
          const dataError = error as ComparisonDataError;

          if (insufficientPointCount === 0) {
            // Zero rows triggers NO_DATA before the common start computation
            expect(dataError.code).toBe("NO_DATA");
            expect(dataError.assets.some((a) => a.assetId === 2)).toBe(true);
          } else {
            // 1 point: effective common start = max(day 0, insufficientStartDay) = insufficientStartDay
            // After filtering for >= common start, insufficient asset has exactly 1 point
            expect(dataError.code).toBe("INSUFFICIENT_DATA");
            expect(dataError.assets.some((a) => a.assetId === 2)).toBe(true);
            // The error should report the data point count
            const insufficientEntry = dataError.assets.find(
              (a) => a.assetId === 2,
            );
            expect(insufficientEntry?.dataPoints).toBe(1);
          }
        }
      }),
      { numRuns: 100 },
    );
  });

  it("should identify ALL assets with insufficient data, not just the first one", async () => {
    /**
     * Strategy:
     * - 3 assets: one reference with many points starting early, and two insufficient assets
     *   that each have only 1 data point.
     * - The reference asset starts at day 0 with many points so it always has >= 2 after common start.
     * - The two insufficient assets start at the same day (or very close), each with only 1 point.
     * - The effective common start = max of all first timestamps = the latest insufficient start day.
     * - After filtering, each insufficient asset has at most 1 point => both should be in the error.
     */
    const testInputArb = fc.record({
      refPointCount: fc.integer({ min: 20, max: 50 }),
      // Both insufficient assets start within the first few days of the ref asset
      insufStartDay: fc.integer({ min: 1, max: 5 }),
      priceBase: fc.integer({ min: 1, max: 500 }),
    });

    await fc.assert(
      fc.asyncProperty(testInputArb, async (input) => {
        const { refPointCount, insufStartDay, priceBase } = input;

        const baseDate = new Date("2020-01-01T00:00:00.000Z");
        const DAY_MS = 24 * 60 * 60 * 1000;

        // Reference asset: starts at day 0 with many points
        const refPrices = Array.from({ length: refPointCount }, (_, i) => ({
          timestamp: new Date(baseDate.getTime() + i * DAY_MS),
          price: priceBase + i,
        }));

        // Insufficient asset 1: starts at insufStartDay with only 1 point
        const insuf1Start = new Date(baseDate.getTime() + insufStartDay * DAY_MS);
        const insuf1Prices = [{ timestamp: insuf1Start, price: priceBase + 100 }];

        // Insufficient asset 2: also starts at insufStartDay with only 1 point
        const insuf2Prices = [{ timestamp: insuf1Start, price: priceBase + 200 }];

        // Effective common start = max(day 0, insufStartDay, insufStartDay) = insufStartDay
        // After filtering: ref has (refPointCount - insufStartDay) points >= insufStartDay (>= 2)
        // insuf1 has 1 point, insuf2 has 1 point => both insufficient

        const assets = [
          { id: 1, ticker: "REF", name: "Reference", price_frequency: "DAILY" as const },
          { id: 2, ticker: "INS1", name: "Insufficient 1", price_frequency: "DAILY" as const },
          { id: 3, ticker: "INS2", name: "Insufficient 2", price_frequency: "DAILY" as const },
        ];

        const findManyMock = prisma.assetPrice.findMany as ReturnType<typeof vi.fn>;
        findManyMock.mockImplementation(
          (args: { where: { asset_id: number } }) => {
            switch (args.where.asset_id) {
              case 1:
                return Promise.resolve(refPrices);
              case 2:
                return Promise.resolve(insuf1Prices);
              case 3:
                return Promise.resolve(insuf2Prices);
              default:
                return Promise.resolve([]);
            }
          },
        );

        try {
          await compareAssets({ assets, timeframe: "1Y" });
          expect.fail("Expected ComparisonDataError to be thrown");
        } catch (error) {
          expect(error).toBeInstanceOf(ComparisonDataError);
          const dataError = error as ComparisonDataError;
          expect(dataError.code).toBe("INSUFFICIENT_DATA");

          // Both insufficient assets should be identified in the error
          expect(dataError.assets.some((a) => a.assetId === 2)).toBe(true);
          expect(dataError.assets.some((a) => a.assetId === 3)).toBe(true);

          // Each should report exactly 1 data point
          const insuf1Entry = dataError.assets.find((a) => a.assetId === 2);
          const insuf2Entry = dataError.assets.find((a) => a.assetId === 3);
          expect(insuf1Entry?.dataPoints).toBe(1);
          expect(insuf2Entry?.dataPoints).toBe(1);
        }
      }),
      { numRuns: 100 },
    );
  });
});
