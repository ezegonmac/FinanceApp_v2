import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";

/**
 * In-memory stores simulating the DB tables for sync ranges and prices.
 */
let syncRangeStore: Array<{
  id: number;
  asset_id: number;
  granularity: string;
  from_timestamp: Date;
  until_timestamp: Date;
}> = [];

let priceStore: Array<{
  asset_id: number;
  timestamp: Date;
  price: number;
  granularity: string;
}> = [];

let nextId = 1;

function resetStores() {
  syncRangeStore = [];
  priceStore = [];
  nextId = 1;
}

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
        createMany: vi.fn(({ data, skipDuplicates }: { data: Array<{ asset_id: number; timestamp: Date; price: number; granularity: string }>; skipDuplicates?: boolean }) => {
          let added = 0;
          for (const row of data) {
            const exists = priceStore.some(
              (p) =>
                p.asset_id === row.asset_id &&
                p.timestamp.getTime() === row.timestamp.getTime() &&
                p.granularity === row.granularity,
            );
            if (skipDuplicates && exists) {
              continue;
            }
            priceStore.push({ ...row });
            added++;
          }
          return Promise.resolve({ count: added });
        }),
      },
      $transaction: vi.fn(async (ops: Promise<unknown>[]) => {
        return Promise.all(ops);
      }),
    },
  };
});

vi.mock("yahoo-finance2", () => ({
  default: class {
    historical(_ticker: string, opts: { period1: Date | string; period2: Date | string }) {
      // Deterministic price data: one row per day in the requested range
      const rows: Array<{ date: Date; close: number }> = [];
      const start = new Date(opts.period1).getTime();
      const end = new Date(opts.period2).getTime();
      const dayMs = 24 * 60 * 60 * 1000;
      for (let t = start; t < end; t += dayMs) {
        rows.push({ date: new Date(t), close: 100 + (t % 1000) / 1000 });
      }
      return rows;
    }
  },
}));

import { syncPrices } from "./priceSyncAlgorithm";

describe("syncPrices - Property 3: Sync idempotency", () => {
  /**
   * **Validates: Requirements 7.3, 7.6, 9.3**
   *
   * Property 3: For any asset, for any granularity, and for any [from, to] range,
   * calling syncPrices twice with identical arguments SHALL produce the same
   * asset_prices and asset_price_sync_ranges state as calling it once
   * (no duplicate rows, no duplicate sync range records, no errors).
   */
  beforeEach(() => {
    resetStores();
  });

  it("calling syncPrices twice produces the same DB state as calling it once", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 100 }), // assetId
        fc.integer({ min: 1_600_000_000_000, max: 1_700_000_000_000 }), // baseMs
        fc.integer({ min: 86_400_000, max: 30 * 86_400_000 }), // windowSize (1-30 days)
        async (assetId, baseMs, windowSize) => {
          // Reset stores for each iteration
          resetStores();

          const from = new Date(baseMs);
          const to = new Date(baseMs + windowSize);
          const asset = { id: assetId, ticker: `TST${assetId}` };

          // First call
          await syncPrices(asset, "DAILY", "1d", from, to);

          // Snapshot state after first call
          const pricesAfterFirst = priceStore.map((p) => ({
            ...p,
            timestamp: p.timestamp.getTime(),
          }));
          const rangesAfterFirst = syncRangeStore.map((r) => ({
            ...r,
            from_timestamp: r.from_timestamp.getTime(),
            until_timestamp: r.until_timestamp.getTime(),
          }));

          // Second call with identical arguments
          await syncPrices(asset, "DAILY", "1d", from, to);

          // Assert: price count unchanged (no duplicate prices)
          expect(priceStore.length).toBe(pricesAfterFirst.length);

          // Assert: sync range count unchanged (no duplicate sync ranges)
          expect(syncRangeStore.length).toBe(rangesAfterFirst.length);

          // Assert: no duplicate prices (unique key: asset_id + timestamp + granularity)
          const priceKeys = priceStore.map(
            (p) => `${p.asset_id}-${p.timestamp.getTime()}-${p.granularity}`,
          );
          const uniqueKeys = new Set(priceKeys);
          expect(uniqueKeys.size).toBe(priceStore.length);

          // Assert: sync ranges are identical to after first call
          const rangesAfterSecond = syncRangeStore.map((r) => ({
            ...r,
            from_timestamp: r.from_timestamp.getTime(),
            until_timestamp: r.until_timestamp.getTime(),
          }));
          expect(rangesAfterSecond).toEqual(rangesAfterFirst);
        },
      ),
      { numRuns: 100 },
    );
  });
});
