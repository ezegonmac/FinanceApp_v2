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

describe("compareAssets - Property 1: Asset count validation bounds", () => {
  /**
   * **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
   *
   * For any array of asset IDs, the comparison validation SHALL accept it
   * if and only if the array length is between 2 and 5 inclusive.
   * Arrays with fewer than 2 or more than 5 elements SHALL be rejected.
   */

  it("should reject arrays with fewer than 2 assets", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(assetArb, { minLength: 0, maxLength: 1 }),
        async (assets) => {
          await expect(
            compareAssets({ assets, timeframe: "1Y" }),
          ).rejects.toThrow(ComparisonValidationError);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("should reject arrays with more than 5 assets", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(assetArb, { minLength: 6, maxLength: 10 }),
        async (assets) => {
          await expect(
            compareAssets({ assets, timeframe: "1Y" }),
          ).rejects.toThrow(ComparisonValidationError);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("should NOT throw ComparisonValidationError for arrays with 2-5 assets", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(assetArb, { minLength: 2, maxLength: 5 }).filter((assets) => {
          // Ensure unique IDs so we don't hit the duplicate validation
          const ids = assets.map((a) => a.id);
          return new Set(ids).size === ids.length;
        }),
        async (assets) => {
          try {
            await compareAssets({ assets, timeframe: "1Y" });
          } catch (error) {
            // It's acceptable for the function to throw other errors
            // (e.g., sync errors since DB is mocked) — just NOT a
            // ComparisonValidationError for asset count.
            expect(error).not.toBeInstanceOf(ComparisonValidationError);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
