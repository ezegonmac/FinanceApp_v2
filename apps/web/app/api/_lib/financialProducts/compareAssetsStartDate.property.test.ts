import { describe, it, expect, vi } from "vitest";
import * as fc from "fast-check";

// ─── Mocks ───────────────────────────────────────────────────────────────────

/**
 * The findMany mock derives price data from the asset_id directly.
 * Convention: asset_id encodes the day offset from 2020-01-01 as (asset_id - 1000).
 * The mock generates 10 prices starting from that computed first timestamp,
 * ensuring enough data points after any possible effective start date.
 */
vi.mock("@repo/db", () => ({
  prisma: {
    assetPrice: {
      findMany: vi.fn((args: any) => {
        const assetId = args.where.asset_id as number;
        const dayOffset = assetId - 1000;
        const ONE_DAY = 24 * 60 * 60 * 1000;
        const baseDate = new Date("2020-01-01T00:00:00.000Z");
        const firstTs = new Date(baseDate.getTime() + dayOffset * ONE_DAY);

        // Generate 10 prices starting from this asset's first timestamp
        const prices = [];
        for (let i = 0; i < 10; i++) {
          prices.push({
            timestamp: new Date(firstTs.getTime() + i * ONE_DAY),
            price: 10 + i, // positive prices, never zero
          });
        }
        return Promise.resolve(prices);
      }),
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
  syncPrices: vi.fn(() => Promise.resolve()),
}));

import { compareAssets } from "./compareAssets";

// ─── Constants ───────────────────────────────────────────────────────────────

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const BASE_DATE = new Date("2020-01-01T00:00:00.000Z");

describe("compareAssets - Property 5: Effective common start date computation", () => {
  /**
   * **Validates: Requirements 3.1, 3.2**
   *
   * For any set of 2–5 assets where each asset has a first available price date
   * within the resolved timeframe window, the effective common start date SHALL
   * equal the maximum (latest) of all those first available dates.
   */

  it("should compute effectiveStartDate as the maximum of all assets' first timestamps", async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate 2-5 unique day offsets within a small range (0-5 days apart).
        // This ensures all assets have sufficient data points (≥2) after the
        // effective common start date, since each asset gets 10 prices.
        fc.uniqueArray(fc.integer({ min: 0, max: 5 }), {
          minLength: 2,
          maxLength: 5,
        }),
        async (dayOffsets) => {
          // Build assets: encode each day offset into the asset_id
          // so the findMany mock derives the first timestamp from the id alone.
          const assets = dayOffsets.map((dayOffset, idx) => ({
            id: 1000 + dayOffset,
            ticker: `T${idx}`,
            name: `Asset ${idx}`,
            price_frequency: "DAILY" as const,
          }));

          // The expected effective start date is the max of all first timestamps
          const expectedStartDate = new Date(
            Math.max(
              ...dayOffsets.map(
                (offset) => BASE_DATE.getTime() + offset * ONE_DAY_MS,
              ),
            ),
          );

          const result = await compareAssets({ assets, timeframe: "1Y" });

          // Verify the effective start date matches the maximum of first timestamps
          expect(new Date(result.effectiveStartDate).getTime()).toBe(
            expectedStartDate.getTime(),
          );
        },
      ),
      { numRuns: 100 },
    );
  });
});
