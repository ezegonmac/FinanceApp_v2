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
    to: new Date("2024-01-01"),
  })),
  deriveGranularity: vi.fn(() => ({
    granularity: "DAILY",
    interval: "1d",
    from: new Date("2020-01-01"),
    to: new Date("2024-01-01"),
  })),
  syncPrices: vi.fn(),
}));

import { syncPrices } from "./priceSyncAlgorithm";
import { compareAssets, ComparisonSyncError } from "./compareAssets";

describe("compareAssets - Property 7: Sync failure identification", () => {
  /**
   * **Validates: Requirements 4.2, 4.3**
   *
   * For any set of assets being synchronized where a non-empty subset of sync
   * operations fail, the comparison service SHALL abort and return an error that
   * contains exactly the set of failed asset identifiers along with failure reasons.
   */

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw ComparisonSyncError containing exactly the failed asset IDs with reasons", async () => {
    /**
     * Strategy:
     * - Generate 2-5 assets with unique IDs and tickers
     * - Generate a non-empty subset of indices that should fail (with random error messages)
     * - Set up syncPrices mock to reject for failed assets and resolve for others
     * - Verify: ComparisonSyncError is thrown, failedAssets contains exactly the
     *   set of failed asset IDs, each has a reason string matching the error message
     */
    const testInputArb = fc
      .integer({ min: 2, max: 5 })
      .chain((assetCount) =>
        fc.record({
          assets: fc
            .array(
              fc.record({
                id: fc.integer({ min: 1, max: 100000 }),
                ticker: fc.stringMatching(/^[A-Z]{1,6}$/),
                name: fc.string({ minLength: 1, maxLength: 30 }),
                price_frequency: fc.constantFrom(
                  "DAILY" as const,
                  "INTRADAY" as const,
                ),
              }),
              { minLength: assetCount, maxLength: assetCount },
            )
            .filter((assets) => {
              // Ensure unique IDs and tickers
              const ids = new Set(assets.map((a) => a.id));
              const tickers = new Set(assets.map((a) => a.ticker));
              return ids.size === assets.length && tickers.size === assets.length;
            }),
          // Generate at least 1 failed index (non-empty subset)
          failedIndices: fc
            .subarray(
              Array.from({ length: assetCount }, (_, i) => i),
              { minLength: 1 },
            ),
          errorMessages: fc.array(
            fc.string({ minLength: 1, maxLength: 50 }),
            { minLength: assetCount, maxLength: assetCount },
          ),
        }),
      );

    await fc.assert(
      fc.asyncProperty(testInputArb, async ({ assets, failedIndices, errorMessages }) => {
        const failedIdSet = new Set(failedIndices.map((i) => assets[i]!.id));

        const syncPricesMock = syncPrices as ReturnType<typeof vi.fn>;
        syncPricesMock.mockImplementation(
          (asset: { id: number; ticker: string }) => {
            const idx = assets.findIndex((a) => a.id === asset.id);
            if (failedIdSet.has(asset.id)) {
              return Promise.reject(new Error(errorMessages[idx]!));
            }
            return Promise.resolve();
          },
        );

        try {
          await compareAssets({ assets, timeframe: "1Y" });
          expect.fail("Expected ComparisonSyncError to be thrown");
        } catch (error) {
          expect(error).toBeInstanceOf(ComparisonSyncError);
          const syncError = error as ComparisonSyncError;

          // The error should contain exactly the set of failed asset IDs
          const reportedIds = new Set(
            syncError.failedAssets.map((fa) => fa.assetId),
          );
          expect(reportedIds).toEqual(failedIdSet);

          // Each failed asset should have a reason string
          for (const fa of syncError.failedAssets) {
            expect(typeof fa.reason).toBe("string");
            expect(fa.reason.length).toBeGreaterThan(0);
          }

          // Each failed asset should have the correct ticker
          for (const fa of syncError.failedAssets) {
            const originalAsset = assets.find((a) => a.id === fa.assetId);
            expect(fa.ticker).toBe(originalAsset!.ticker);
          }

          // The reason should match the error message we provided
          for (const fa of syncError.failedAssets) {
            const idx = assets.findIndex((a) => a.id === fa.assetId);
            expect(fa.reason).toBe(errorMessages[idx]!);
          }
        }
      }),
      { numRuns: 100 },
    );
  });
});
