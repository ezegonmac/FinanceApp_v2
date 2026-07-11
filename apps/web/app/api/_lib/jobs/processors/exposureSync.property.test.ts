import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";

/** Feature: portfolio-exposure, Property 11: Sync fault tolerance */

// --- In-memory stores for mocking ---

let snapshotStore: Array<{
  asset_id: number;
  period: string;
  exposure_type: string;
  category_id: number;
  percentage: number;
  provider: string;
}> = [];

let nextCategoryId = 1;

// Track which asset IDs should cause Yahoo Finance to throw
let failingAssetIds: Set<number> = new Set();

vi.mock("@repo/db", () => {
  return {
    prisma: {
      investment: {
        findMany: vi.fn(() => Promise.resolve([])),
      },
      asset: {
        findMany: vi.fn(() => Promise.resolve([])),
      },
      assetExposureSnapshot: {
        count: vi.fn(({ where }: { where: { asset_id: number; period: string } }) => {
          const count = snapshotStore.filter(
            (s) => s.asset_id === where.asset_id && s.period === where.period,
          ).length;
          return Promise.resolve(count);
        }),
        create: vi.fn(({ data }: { data: { asset_id: number; period: string; exposure_type: string; category_id: number; percentage: number; provider: string } }) => {
          snapshotStore.push({ ...data });
          return Promise.resolve(data);
        }),
      },
    },
  };
});

vi.mock("@repo/utils", () => ({
  getEuropeMadridDateParts: vi.fn(() => ({ year: 2025, month: 1, day: 15 })),
}));

vi.mock("../../exposure/yahooFetcher", () => ({
  fetchExposureFromYahoo: vi.fn((asset: { id: number }) => {
    if (failingAssetIds.has(asset.id)) {
      return Promise.reject(new Error(`Yahoo Finance error for asset ${asset.id}`));
    }
    return Promise.resolve({
      sectors: [{ label: "Technology", percentage: 60 }, { label: "Healthcare", percentage: 40 }],
      countries: [{ label: "United States", percentage: 100 }],
    });
  }),
}));

vi.mock("../../exposure/normalizer", () => ({
  resolveCanonicalCategory: vi.fn(() => {
    return Promise.resolve(nextCategoryId++);
  }),
}));

// We need to mock the internal getAssetsWithActivePositions function.
// Since it's not exported, we mock the prisma calls it uses and control them from the test.
import { prisma } from "@repo/db";
import { syncExposureData } from "./exposureSync";

describe("Exposure Sync - Property 11: Sync fault tolerance", () => {
  /**
   * **Validates: Requirements 8.3**
   *
   * Property 11: For any set of assets being processed during sync where a subset
   * of Yahoo Finance calls fail, the processor SHALL still create snapshots for all
   * non-failing assets. Failed assets SHALL be counted in the `failed` count and
   * SHALL not affect processing of remaining assets.
   */

  beforeEach(() => {
    snapshotStore = [];
    nextCategoryId = 1;
    failingAssetIds = new Set();
    vi.clearAllMocks();
  });

  it("non-failing assets get snapshots and failed count matches failing subset", async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a set of unique asset IDs (1-20 assets)
        fc.array(fc.integer({ min: 1, max: 500 }), { minLength: 1, maxLength: 20 })
          .map((ids) => [...new Set(ids)])
          .filter((ids) => ids.length >= 2),
        // For each set of assets, generate a subset of failing indices
        fc.array(fc.boolean(), { minLength: 20, maxLength: 20 }),
        async (assetIds, failureFlags) => {
          // Reset state for each iteration
          snapshotStore = [];
          nextCategoryId = 1;
          vi.clearAllMocks();

          // Determine which assets will fail (use failureFlags as a pattern)
          failingAssetIds = new Set();
          const successIds: number[] = [];
          const failIds: number[] = [];

          for (let i = 0; i < assetIds.length; i++) {
            if (failureFlags[i % failureFlags.length]) {
              failingAssetIds.add(assetIds[i]!);
              failIds.push(assetIds[i]!);
            } else {
              successIds.push(assetIds[i]!);
            }
          }

          // Build investment records to produce the assets with active positions
          const investments = assetIds.map((id) => ({
            asset_id: id,
            type: "BUY",
            units: 10,
          }));

          // Build asset records with provider mappings
          const assets = assetIds.map((id) => ({
            id,
            asset_type: "ETF",
            providerMappings: [{ provider: "YAHOO_FINANCE", provider_symbol: `SYM${id}` }],
          }));

          // Mock prisma.investment.findMany to return our investments
          vi.mocked(prisma.investment.findMany).mockResolvedValue(investments as never);
          // Mock prisma.asset.findMany to return our assets
          vi.mocked(prisma.asset.findMany).mockResolvedValue(assets as never);

          const result = await syncExposureData(1);

          // Assertion 1: Failed count matches the number of assets that throw
          expect(result.failed).toBe(failIds.length);

          // Assertion 2: Processed count matches the number of successful assets
          expect(result.processed).toBe(successIds.length);

          // Assertion 3: Each successful asset should have had snapshots created
          for (const assetId of successIds) {
            const assetSnapshots = snapshotStore.filter((s) => s.asset_id === assetId);
            expect(assetSnapshots.length).toBeGreaterThan(0);
          }

          // Assertion 4: No snapshots created for failed assets
          for (const assetId of failIds) {
            const assetSnapshots = snapshotStore.filter((s) => s.asset_id === assetId);
            expect(assetSnapshots.length).toBe(0);
          }

          // Assertion 5: processed + failed + skipped = total assets
          expect(result.processed + result.failed + result.skipped).toBe(assetIds.length);
        },
      ),
      { numRuns: 100 },
    );
  });
});
