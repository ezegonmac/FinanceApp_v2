import { describe, it, expect, vi } from "vitest";
import * as fc from "fast-check";

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock("@repo/db", () => ({
  prisma: {
    assetPrice: {
      findMany: vi.fn((args: any) => {
        const baseDate = new Date("2020-01-01T00:00:00.000Z");
        const DAY_MS = 24 * 60 * 60 * 1000;
        // Return 10 daily prices starting from baseDate for every asset
        return Promise.resolve(
          Array.from({ length: 10 }, (_, i) => ({
            timestamp: new Date(baseDate.getTime() + i * DAY_MS),
            price: 100 + i,
          })),
        );
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

describe("compareAssets - Property 10: Distinct color assignment", () => {
  /**
   * **Validates: Requirements 6.2**
   *
   * For any set of 2–5 assets in a comparison, the color assignment SHALL
   * produce all distinct color values — no two assets SHALL share the same color.
   */

  it("should assign distinct colors to all assets in the comparison", async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate 2-5 unique asset IDs
        fc.uniqueArray(fc.integer({ min: 1, max: 10000 }), {
          minLength: 2,
          maxLength: 5,
        }),
        async (assetIds) => {
          const assets = assetIds.map((id, idx) => ({
            id,
            ticker: `T${idx}`,
            name: `Asset ${idx}`,
            price_frequency: "DAILY" as const,
          }));

          const result = await compareAssets({ assets, timeframe: "1Y" });

          // Extract all colors from the series
          const colors = result.series.map((s) => s.color);

          // All colors should be distinct (no two assets share the same color)
          const uniqueColors = new Set(colors);
          expect(uniqueColors.size).toBe(colors.length);
        },
      ),
      { numRuns: 100 },
    );
  });
});
