import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";

/**
 * In-memory store simulating the asset_price_sync_ranges table.
 * The mock functions mutate this store so mergeSyncRange (called internally
 * by syncPrices) can read and write state across multiple calls.
 */
let syncRangeStore: Array<{
  id: number;
  asset_id: number;
  granularity: string;
  from_timestamp: Date;
  until_timestamp: Date;
}> = [];
let nextId = 1;

vi.mock("@repo/db", () => {
  return {
    prisma: {
      assetPriceSyncRange: {
        findMany: vi.fn(({ where }: { where: { asset_id: number; granularity: string } }) => {
          const results = syncRangeStore.filter(
            (r) => r.asset_id === where.asset_id && r.granularity === where.granularity,
          );
          return Promise.resolve(results);
        }),
        deleteMany: vi.fn(({ where }: { where: { id: { in: number[] } } }) => {
          syncRangeStore = syncRangeStore.filter((r) => !where.id.in.includes(r.id));
          return Promise.resolve({ count: where.id.in.length });
        }),
        create: vi.fn(({ data }: { data: { asset_id: number; granularity: string; from_timestamp: Date; until_timestamp: Date } }) => {
          const record = {
            id: nextId++,
            asset_id: data.asset_id,
            granularity: data.granularity,
            from_timestamp: data.from_timestamp,
            until_timestamp: data.until_timestamp,
          };
          syncRangeStore.push(record);
          return Promise.resolve(record);
        }),
      },
      assetPrice: {
        createMany: vi.fn(() => Promise.resolve({ count: 0 })),
      },
      $transaction: vi.fn(async (ops: Promise<unknown>[]) => {
        return Promise.all(ops);
      }),
    },
  };
});

vi.mock("yahoo-finance2", () => ({
  default: class {
    historical() {
      return [];
    }
  },
}));

import { syncPrices } from "./priceSyncAlgorithm";

describe("syncPrices - Property 1: Sync ranges always cover the requested window", () => {
  /**
   * **Validates: Requirements 7.4, 7.5**
   *
   * Property 1: For any asset and for any requested [from, to] window,
   * after a successful syncPrices call the asset_price_sync_ranges table
   * SHALL contain a set of intervals whose union completely covers [from, to],
   * even if Yahoo Finance returned zero price rows for some sub-ranges.
   */
  beforeEach(() => {
    syncRangeStore = [];
    nextId = 1;
  });

  it("after syncPrices, union of sync ranges covers [from, to]", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000 }), // assetId
        fc.integer({ min: 0, max: 1_000_000_000_000 }), // baseMs
        fc.integer({ min: 1, max: 365 * 24 * 60 * 60 * 1000 }), // windowSize
        async (assetId, baseMs, windowSize) => {
          // Reset store for each iteration
          syncRangeStore = [];
          nextId = 1;

          const from = new Date(baseMs);
          const to = new Date(baseMs + windowSize);
          const asset = { id: assetId, ticker: `TST${assetId}` };

          await syncPrices(asset, "DAILY", "1d", from, to);

          // Get all sync ranges for this asset and granularity
          const ranges = syncRangeStore
            .filter((r) => r.asset_id === assetId && r.granularity === "DAILY")
            .sort((a, b) => a.from_timestamp.getTime() - b.from_timestamp.getTime());

          // There must be at least one sync range
          expect(ranges.length).toBeGreaterThanOrEqual(1);

          // Verify the union of ranges covers [from, to]
          // Walk through sorted ranges with a cursor starting at `from`
          let cursor = from.getTime();
          for (const range of ranges) {
            // Each range must start at or before the cursor (no uncovered gap)
            expect(range.from_timestamp.getTime()).toBeLessThanOrEqual(cursor);
            // Advance cursor to the end of this range
            cursor = Math.max(cursor, range.until_timestamp.getTime());
          }
          // After processing all ranges, cursor must reach or exceed `to`
          expect(cursor).toBeGreaterThanOrEqual(to.getTime());
        },
      ),
      { numRuns: 100 },
    );
  });
});
