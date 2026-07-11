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

/**
 * Generate an array of 2-5 assets with unique IDs.
 */
const uniqueAssetsArb = fc
  .array(assetArb, { minLength: 2, maxLength: 5 })
  .filter((assets) => {
    const ids = assets.map((a) => a.id);
    return new Set(ids).size === ids.length;
  });

describe("compareAssets - Property 4: Custom date range validation", () => {
  /**
   * **Validates: Requirements 2.7, 2.8**
   *
   * For any pair of dates where startDate >= endDate, the comparison validation
   * SHALL reject the input. For any pair of dates where startDate < endDate,
   * the dates SHALL be accepted (pass date validation).
   */

  it("should reject when startDate >= endDate", async () => {
    await fc.assert(
      fc.asyncProperty(
        uniqueAssetsArb,
        fc.integer({ min: 0, max: 2_000_000_000_000 }),
        fc.integer({ min: 0, max: 365 * 24 * 60 * 60 * 1000 }),
        async (assets, baseMs, offset) => {
          // endDate is at baseMs, startDate is at baseMs + offset (so startDate >= endDate)
          const endDate = new Date(baseMs);
          const startDate = new Date(baseMs + offset);

          await expect(
            compareAssets({ assets, startDate, endDate }),
          ).rejects.toThrow(ComparisonValidationError);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("should NOT throw ComparisonValidationError when startDate < endDate", async () => {
    await fc.assert(
      fc.asyncProperty(
        uniqueAssetsArb,
        fc.integer({ min: 0, max: 2_000_000_000_000 }),
        fc.integer({ min: 1, max: 365 * 24 * 60 * 60 * 1000 }),
        async (assets, baseMs, offset) => {
          // startDate is at baseMs, endDate is at baseMs + offset (so startDate < endDate)
          const startDate = new Date(baseMs);
          const endDate = new Date(baseMs + offset);

          try {
            await compareAssets({ assets, startDate, endDate });
          } catch (error) {
            // It's acceptable to throw other errors (e.g., sync errors since
            // DB is mocked) — just NOT a ComparisonValidationError about dates.
            if (error instanceof ComparisonValidationError) {
              expect(error.message).not.toBe("startDate must be before endDate");
              expect(error.message).not.toBe(
                "Either timeframe or both startDate and endDate must be provided",
              );
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
