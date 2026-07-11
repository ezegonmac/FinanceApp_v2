import { describe, it, expect, vi } from "vitest";
import * as fc from "fast-check";

// ─── Mocks ───────────────────────────────────────────────────────────────────

/**
 * The findMany mock captures the `where.granularity` for each call so we can
 * verify that each asset was queried with the correct granularity derived from
 * its own price_frequency.
 */
const findManyCalls: Array<{ asset_id: number; granularity: string }> = [];

vi.mock("@repo/db", () => ({
  prisma: {
    assetPrice: {
      findMany: vi.fn((args: any) => {
        const assetId = args.where.asset_id as number;
        const granularity = args.where.granularity as string;

        findManyCalls.push({ asset_id: assetId, granularity });

        // Return sufficient price data for comparison to succeed
        const ONE_DAY = 24 * 60 * 60 * 1000;
        const baseDate = new Date("2024-01-01T00:00:00.000Z");
        const prices = [];
        for (let i = 0; i < 10; i++) {
          prices.push({
            timestamp: new Date(baseDate.getTime() + i * ONE_DAY),
            price: 100 + i,
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

/**
 * Mock priceSyncAlgorithm with a deriveGranularity that mirrors real logic:
 * For "1W" timeframe: INTRADAY → HOURLY/"1h", DAILY → DAILY/"1d" (fallback).
 * For other timeframes, uses the real TIMEFRAME_CONFIG behavior.
 */
vi.mock("./priceSyncAlgorithm", () => ({
  resolveTimeframeDates: vi.fn(() => ({
    from: new Date("2024-01-01"),
    to: new Date("2024-06-01"),
  })),
  deriveGranularity: vi.fn(
    (timeframe: string, priceFrequency: "DAILY" | "INTRADAY") => {
      const from = new Date("2024-01-01");
      const to = new Date("2024-06-01");

      // Mirror the real deriveGranularity logic with DAILY fallback
      const configMap: Record<string, { granularity: string; interval: string }> = {
        TODAY: { granularity: "FIFTEEN_MIN", interval: "15m" },
        "1W": { granularity: "HOURLY", interval: "1h" },
        "1M": { granularity: "DAILY", interval: "1d" },
        "3M": { granularity: "DAILY", interval: "1d" },
        "6M": { granularity: "DAILY", interval: "1d" },
        "1Y": { granularity: "DAILY", interval: "1d" },
        "5Y": { granularity: "WEEKLY", interval: "1wk" },
        ALL: { granularity: "WEEKLY", interval: "1wk" },
      };

      const config = configMap[timeframe] ?? { granularity: "DAILY", interval: "1d" };
      const isSubDaily =
        config.granularity === "FIFTEEN_MIN" || config.granularity === "HOURLY";

      if (priceFrequency === "DAILY" && isSubDaily) {
        return { granularity: "DAILY", interval: "1d", from, to };
      }

      return { ...config, from, to };
    },
  ),
  syncPrices: vi.fn(() => Promise.resolve()),
}));

import { compareAssets } from "./compareAssets";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Computes the expected granularity for an asset given timeframe and price_frequency,
 * using the same DAILY fallback logic as the real deriveGranularity.
 */
function expectedGranularity(
  timeframe: string,
  priceFrequency: "DAILY" | "INTRADAY",
): string {
  const configMap: Record<string, { granularity: string }> = {
    TODAY: { granularity: "FIFTEEN_MIN" },
    "1W": { granularity: "HOURLY" },
    "1M": { granularity: "DAILY" },
    "3M": { granularity: "DAILY" },
    "6M": { granularity: "DAILY" },
    "1Y": { granularity: "DAILY" },
    "5Y": { granularity: "WEEKLY" },
    ALL: { granularity: "WEEKLY" },
  };

  const config = configMap[timeframe] ?? { granularity: "DAILY" };
  const isSubDaily =
    config.granularity === "FIFTEEN_MIN" || config.granularity === "HOURLY";

  if (priceFrequency === "DAILY" && isSubDaily) {
    return "DAILY";
  }

  return config.granularity;
}

// ─── Test ────────────────────────────────────────────────────────────────────

describe("compareAssets - Property 12: Independent per-asset granularity", () => {
  /**
   * **Validates: Requirements 7.4**
   *
   * For any comparison involving assets with differing price_frequency values,
   * each asset's display granularity SHALL be derived independently based on
   * its own price_frequency and the selected timeframe. An INTRADAY asset and
   * a DAILY asset in the same comparison MAY have different granularities.
   */

  it("should derive granularity independently per asset based on its price_frequency", async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate 2-5 assets with a random mix of DAILY/INTRADAY frequencies
        fc
          .array(
            fc.record({
              id: fc.integer({ min: 1, max: 10000 }),
              ticker: fc.stringMatching(/^[A-Z]{1,5}$/),
              name: fc.string({ minLength: 1, maxLength: 30 }),
              price_frequency: fc.constantFrom(
                "DAILY" as const,
                "INTRADAY" as const,
              ),
            }),
            { minLength: 2, maxLength: 5 },
          )
          .filter((assets) => {
            // Ensure unique IDs
            const ids = assets.map((a) => a.id);
            return new Set(ids).size === ids.length;
          }),
        // Pick a timeframe where DAILY vs INTRADAY actually produces different granularities
        fc.constantFrom("TODAY" as const, "1W" as const),
        async (assets, timeframe) => {
          // Clear captured calls before each run
          findManyCalls.length = 0;

          const result = await compareAssets({ assets, timeframe });

          // Verify: for each asset, the findMany call used the correct granularity
          // based on that asset's individual price_frequency
          for (const asset of assets) {
            const call = findManyCalls.find((c) => c.asset_id === asset.id);
            expect(call).toBeDefined();

            const expected = expectedGranularity(timeframe, asset.price_frequency);
            expect(call!.granularity).toBe(expected);
          }

          // Additional check: if there's a mix of DAILY and INTRADAY assets,
          // they MAY have different granularities in the query
          const dailyAssets = assets.filter((a) => a.price_frequency === "DAILY");
          const intradayAssets = assets.filter((a) => a.price_frequency === "INTRADAY");

          if (dailyAssets.length > 0 && intradayAssets.length > 0) {
            const dailyCalls = findManyCalls.filter((c) =>
              dailyAssets.some((a) => a.id === c.asset_id),
            );
            const intradayCalls = findManyCalls.filter((c) =>
              intradayAssets.some((a) => a.id === c.asset_id),
            );

            // DAILY assets always get "DAILY" granularity for sub-daily timeframes
            for (const call of dailyCalls) {
              expect(call.granularity).toBe("DAILY");
            }

            // INTRADAY assets get the timeframe's native granularity
            const nativeGranularity =
              timeframe === "TODAY" ? "FIFTEEN_MIN" : "HOURLY";
            for (const call of intradayCalls) {
              expect(call.granularity).toBe(nativeGranularity);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
