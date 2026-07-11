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

import { compareAssets, ComparisonValidationError } from "./compareAssets";

/**
 * Helper arbitrary: generates a valid asset object for ComparisonInput.
 */
const assetArb = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  ticker: fc.string({ minLength: 1, maxLength: 6 }),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  price_frequency: fc.constantFrom("DAILY" as const, "INTRADAY" as const),
});

describe("compareAssets - Property 2: Duplicate asset prevention", () => {
  /**
   * **Validates: Requirements 1.5**
   *
   * For any array of asset IDs containing at least one duplicate value,
   * the comparison validation SHALL reject the input regardless of the array length.
   */

  it("should reject arrays containing duplicate asset IDs", async () => {
    // Generate an array of 2-5 unique assets, then introduce a duplicate
    const assetsWithDuplicateArb = fc
      .array(assetArb, { minLength: 2, maxLength: 5 })
      .filter((assets) => {
        // Ensure all IDs are unique first
        const ids = assets.map((a) => a.id);
        return new Set(ids).size === ids.length;
      })
      .chain((assets) =>
        // Pick a source index and a different target index to copy the ID
        fc.record({
          assets: fc.constant(assets),
          sourceIdx: fc.integer({ min: 0, max: assets.length - 1 }),
          targetIdx: fc.integer({ min: 0, max: assets.length - 1 }),
        }).filter(({ sourceIdx, targetIdx }) => sourceIdx !== targetIdx),
      )
      .map(({ assets, sourceIdx, targetIdx }) => {
        // Create a copy with a duplicated ID
        const result = assets.map((a) => ({ ...a }));
        result[targetIdx]!.id = result[sourceIdx]!.id;
        return result;
      });

    await fc.assert(
      fc.asyncProperty(assetsWithDuplicateArb, async (assets) => {
        await expect(
          compareAssets({ assets, timeframe: "1Y" }),
        ).rejects.toThrow(ComparisonValidationError);
      }),
      { numRuns: 100 },
    );
  });
});
