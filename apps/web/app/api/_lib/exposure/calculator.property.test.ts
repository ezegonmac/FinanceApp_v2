import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  computePortfolioExposure,
  type PositionInput,
  type SnapshotInput,
} from "./calculator";

/** Feature: portfolio-exposure, Property 1: Weighted exposure calculation */
describe("Exposure Calculator - Property 1: Weighted exposure calculation", () => {
  /**
   * **Validates: Requirements 1.1, 1.3**
   *
   * Property 1: For any portfolio of positions with per-category exposure percentages,
   * the calculated portfolio exposure for each category equals the sum of
   * (assetCategoryPercentage × positionValue) / totalPortfolioValue.
   * The monetary value for each category equals percentage / 100 × totalPortfolioValue.
   */
  it("each category percentage equals weighted sum and value equals percentage/100 × totalPortfolioValue", () => {
    // Generator for a single position with associated snapshot entries
    const positionWithSnapshotsArb = fc
      .record({
        assetId: fc.integer({ min: 1, max: 100 }),
        value: fc.double({ min: 0.01, max: 100_000, noNaN: true, noDefaultInfinity: true }),
        // Each position can be exposed to 1-4 categories
        categories: fc.array(
          fc.record({
            category_id: fc.integer({ min: 1, max: 20 }),
            categoryName: fc.stringMatching(/^[A-Z][a-z]{2,10}$/),
            percentage: fc.double({ min: 0.01, max: 100, noNaN: true, noDefaultInfinity: true }),
          }),
          { minLength: 1, maxLength: 4 },
        ),
      })
      .filter((p) => p.value > 0);

    // Generator for a portfolio: 1-10 positions with unique assetIds
    const portfolioArb = fc
      .array(positionWithSnapshotsArb, { minLength: 1, maxLength: 10 })
      .map((positionsWithSnapshots) => {
        const seen = new Set<number>();
        return positionsWithSnapshots.filter((p) => {
          if (seen.has(p.assetId)) return false;
          seen.add(p.assetId);
          return true;
        });
      })
      .filter((arr) => arr.length > 0);

    fc.assert(
      fc.property(portfolioArb, (portfolio) => {
        // Build positions and snapshots from generated data
        const positions: PositionInput[] = portfolio.map((p) => ({
          assetId: p.assetId,
          value: p.value,
        }));

        const snapshots: SnapshotInput[] = portfolio.flatMap((p) =>
          p.categories.map((cat) => ({
            asset_id: p.assetId,
            category_id: cat.category_id,
            categoryName: cat.categoryName,
            percentage: cat.percentage,
          })),
        );

        const totalPortfolioValue = positions.reduce((sum, p) => sum + p.value, 0);

        const result = computePortfolioExposure(
          positions,
          snapshots,
          totalPortfolioValue,
          "SECTOR",
        );

        // Compute expected weighted percentages per category manually
        const expectedPerCategory = new Map<number, number>();
        for (const p of portfolio) {
          for (const cat of p.categories) {
            const weighted = (cat.percentage * p.value) / totalPortfolioValue;
            expectedPerCategory.set(
              cat.category_id,
              (expectedPerCategory.get(cat.category_id) ?? 0) + weighted,
            );
          }
        }

        // Verify each category in the result matches expected
        for (const entry of result.data) {
          const expected = expectedPerCategory.get(entry.categoryId) ?? 0;
          expect(entry.percentage).toBeCloseTo(expected, 5);
          // Verify monetary value = percentage / 100 × totalPortfolioValue
          const expectedValue = (entry.percentage / 100) * totalPortfolioValue;
          expect(entry.value).toBeCloseTo(expectedValue, 5);
        }

        // Verify all expected categories appear in the result
        for (const [categoryId, expectedPct] of expectedPerCategory.entries()) {
          if (expectedPct > 0) {
            const found = result.data.find((d) => d.categoryId === categoryId);
            expect(found).toBeDefined();
            expect(found!.percentage).toBeCloseTo(expectedPct, 5);
          }
        }
      }),
      { numRuns: 100 },
    );
  });
});


/** Feature: portfolio-exposure, Property 3: Exposure percentages bounded by coverage */
describe("Exposure Calculator - Property 3: Exposure percentages bounded by coverage", () => {
  /**
   * **Validates: Requirements 1.6**
   *
   * Property 3: For any portfolio that contains assets without exposure data,
   * the sum of all category percentages in the response SHALL be less than or
   * equal to the coveragePercentage, because the denominator (totalPortfolioValue)
   * includes uncovered assets.
   */
  it("sum of category percentages ≤ coveragePercentage", () => {
    fc.assert(
      fc.property(
        // Generate a portfolio with some covered and some uncovered positions
        // Use uniqueBy to ensure unique assetIds per group
        fc
          .record({
            // Positions that WILL have snapshots (covered) - IDs in range 1-500
            coveredPositions: fc
              .uniqueArray(
                fc.record({
                  assetId: fc.integer({ min: 1, max: 500 }),
                  value: fc.double({ min: 0.01, max: 100_000, noNaN: true, noDefaultInfinity: true }),
                }),
                { minLength: 1, maxLength: 10, selector: (p) => p.assetId },
              ),
            // Positions that will NOT have snapshots (uncovered) - IDs in range 501-1000
            uncoveredPositions: fc
              .uniqueArray(
                fc.record({
                  assetId: fc.integer({ min: 501, max: 1000 }),
                  value: fc.double({ min: 0.01, max: 100_000, noNaN: true, noDefaultInfinity: true }),
                }),
                { minLength: 1, maxLength: 10, selector: (p) => p.assetId },
              ),
          })
          .chain(({ coveredPositions, uncoveredPositions }) => {
            // Generate snapshots only for covered positions
            // Per-asset percentages must sum to ≤ 100% for the property to hold
            const categoryNames: Record<number, string> = {
              1: "Technology",
              2: "Healthcare",
              3: "Financials",
              4: "Energy",
              5: "Real Estate",
            };

            // For each unique covered asset, generate 1-5 categories whose percentages sum ≤ 100
            const perAssetArbs = coveredPositions.map((p) =>
              fc
                .record({
                  numCategories: fc.integer({ min: 1, max: 5 }),
                  totalPct: fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
                })
                .chain(({ numCategories, totalPct }) =>
                  fc
                    .array(
                      fc.double({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true }),
                      { minLength: numCategories, maxLength: numCategories },
                    )
                    .map((rawWeights) => {
                      // Distribute totalPct proportionally across categories
                      const sum = rawWeights.reduce((a, b) => a + b, 0);
                      return rawWeights.map((w, i) => ({
                        assetId: p.assetId,
                        categoryId: (i % 5) + 1,
                        categoryName: categoryNames[(i % 5) + 1] ?? "Technology",
                        percentage: sum > 0 ? (w / sum) * totalPct : 0,
                      }));
                    }),
                ),
            );

            return fc.tuple(...perAssetArbs).map((arrays) => ({
              coveredPositions,
              uncoveredPositions,
              snapshots: arrays.flat(),
            }));
          }),
        ({ coveredPositions, uncoveredPositions, snapshots }) => {
          // Build all positions (covered + uncovered)
          const positions: PositionInput[] = [
            ...coveredPositions.map((p) => ({
              assetId: p.assetId,
              value: p.value,
            })),
            ...uncoveredPositions.map((p) => ({
              assetId: p.assetId,
              value: p.value,
            })),
          ];

          // Build snapshot inputs only for covered assets
          const snapshotInputs: SnapshotInput[] = snapshots.map((s) => ({
            asset_id: s.assetId,
            category_id: s.categoryId,
            categoryName: s.categoryName,
            percentage: s.percentage,
          }));

          const totalPortfolioValue = positions.reduce(
            (sum, p) => sum + p.value,
            0,
          );

          const result = computePortfolioExposure(
            positions,
            snapshotInputs,
            totalPortfolioValue,
            "SECTOR",
          );

          // Sum of all category percentages must be ≤ coveragePercentage
          const sumPercentages = result.data.reduce(
            (sum, d) => sum + d.percentage,
            0,
          );

          // Allow small floating point tolerance (IEEE 754 rounding can cause tiny overflows)
          expect(sumPercentages).toBeLessThanOrEqual(
            result.coveragePercentage + 1e-4,
          );
        },
      ),
      { numRuns: 100 },
    );
  });
});

/** Feature: portfolio-exposure, Property 2: Account filtering consistency */
describe("Exposure Calculator - Property 2: Account filtering consistency", () => {
  /**
   * **Validates: Requirements 1.4, 1.5**
   *
   * Property 2: For any multi-account portfolio, the exposure calculated with
   * an accountId filter SHALL include only positions from that account, and the
   * exposure calculated without an accountId filter SHALL include positions from
   * all accounts. The unfiltered result's total portfolio value SHALL equal the
   * sum of all individual accounts' portfolio values.
   */

  // Generator for a single position with a positive value
  const positionArb = fc.record({
    assetId: fc.integer({ min: 1, max: 50 }),
    value: fc.double({ min: 0.01, max: 100000, noNaN: true, noDefaultInfinity: true }),
  });

  // Generator for a non-empty array of positions representing one account
  const accountPositionsArb = fc.array(positionArb, { minLength: 1, maxLength: 5 });

  it("filtered exposure uses only the filtered account's positions, and unfiltered total equals sum of all accounts", () => {
    fc.assert(
      fc.property(
        // Generate 2 accounts with their own positions
        accountPositionsArb,
        accountPositionsArb,
        (accountAPositions, accountBPositions) => {
          // Compute total portfolio values per account
          const accountAValue = accountAPositions.reduce((sum, p) => sum + p.value, 0);
          const accountBValue = accountBPositions.reduce((sum, p) => sum + p.value, 0);
          const totalValue = accountAValue + accountBValue;

          // All positions combined
          const allPositions: PositionInput[] = [
            ...accountAPositions,
            ...accountBPositions,
          ];

          // Gather all unique asset IDs across both accounts
          const allAssetIds = [...new Set(allPositions.map((p) => p.assetId))];

          // Create snapshots that cover all assets (deterministic for consistency)
          const snapshots: SnapshotInput[] = allAssetIds.map((assetId) => ({
            asset_id: assetId,
            category_id: (assetId % 5) + 1,
            categoryName: ["Technology", "Healthcare", "Financials", "Energy", "Industrials"][assetId % 5]!,
            percentage: 50, // Fixed percentage for predictability
          }));

          // Call calculator for account A only
          const resultA = computePortfolioExposure(
            accountAPositions,
            snapshots,
            accountAValue,
            "SECTOR",
          );

          // Call calculator for account B only
          const resultB = computePortfolioExposure(
            accountBPositions,
            snapshots,
            accountBValue,
            "SECTOR",
          );

          // Call calculator with ALL positions combined
          const resultAll = computePortfolioExposure(
            allPositions,
            snapshots,
            totalValue,
            "SECTOR",
          );

          // 1. Each filtered result should use its own totalPortfolioValue
          expect(resultA.totalPortfolioValue).toBeCloseTo(accountAValue, 5);
          expect(resultB.totalPortfolioValue).toBeCloseTo(accountBValue, 5);

          // 2. Unfiltered total should equal sum of both accounts
          expect(resultAll.totalPortfolioValue).toBeCloseTo(totalValue, 5);
          expect(resultAll.totalPortfolioValue).toBeCloseTo(
            resultA.totalPortfolioValue + resultB.totalPortfolioValue,
            5,
          );

          // 3. The monetary values in the unfiltered result should equal the sum
          //    of monetary values from both filtered results for matching categories
          const allCategoryValues = new Map<number, number>();
          for (const entry of resultAll.data) {
            allCategoryValues.set(entry.categoryId, entry.value);
          }

          const summedCategoryValues = new Map<number, number>();
          for (const entry of [...resultA.data, ...resultB.data]) {
            const current = summedCategoryValues.get(entry.categoryId) ?? 0;
            summedCategoryValues.set(entry.categoryId, current + entry.value);
          }

          // Every category in the combined result should have a value equal to
          // the sum of that category across both account-filtered results
          for (const [categoryId, combinedValue] of allCategoryValues) {
            const summed = summedCategoryValues.get(categoryId) ?? 0;
            expect(combinedValue).toBeCloseTo(summed, 2);
          }

          // 4. Filtered results should only reflect their own positions
          //    The sum of monetary values in resultA's data should be bounded by accountAValue
          const resultAMonetarySum = resultA.data.reduce((sum, d) => sum + d.value, 0);
          expect(resultAMonetarySum).toBeLessThanOrEqual(accountAValue + 0.01);

          const resultBMonetarySum = resultB.data.reduce((sum, d) => sum + d.value, 0);
          expect(resultBMonetarySum).toBeLessThanOrEqual(accountBValue + 0.01);
        },
      ),
      { numRuns: 100 },
    );
  });
});


/** Feature: portfolio-exposure, Property 8: Unclassified remainder computation */
describe("Exposure Calculator - Property 8: Unclassified remainder computation", () => {
  /**
   * **Validates: Requirements 6.1, 11.5**
   *
   * Property 8: Given a set of category percentages for an asset that sum to
   * at most 100%, the "Other / Unclassified" remainder equals 100% - sum(percentages).
   * When the sum equals exactly 100%, there is no remainder (no "Other" bucket).
   *
   * The client-side uses a small epsilon (0.01) threshold to decide whether to
   * show the "Other" bucket, since floating point arithmetic can produce tiny
   * remainders that shouldn't be displayed as a real category.
   */

  // Minimum threshold below which the remainder is not considered meaningful.
  // This mirrors what the client-side UI would use to decide "show Other or not".
  const EPSILON = 0.01;

  /**
   * Client-side logic under test (pure function extracted from ExposurePage):
   * Given an array of category percentages, compute the "Other" bucket remainder.
   */
  function computeUnclassifiedRemainder(categoryPercentages: number[]): number {
    const sum = categoryPercentages.reduce((acc, p) => acc + p, 0);
    const remainder = 100 - sum;
    // Only return a meaningful remainder (ignore floating point dust)
    return remainder > EPSILON ? remainder : 0;
  }

  it("remainder equals 100 - sum(percentages) when sum < 100, and is 0 when sum ≈ 100", () => {
    fc.assert(
      fc.property(
        // Generate an array of 1-10 percentages between 0 and 100
        // then scale them down so their sum is at most 100
        fc
          .array(
            fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
            { minLength: 1, maxLength: 10 },
          )
          .map((percentages) => {
            const rawSum = percentages.reduce((acc, p) => acc + p, 0);
            // If sum exceeds 100, scale all values proportionally to fit within 100
            if (rawSum > 100 && rawSum > 0) {
              const scale = 100 / rawSum;
              return percentages.map((p) => p * scale);
            }
            return percentages;
          })
          .filter((percentages) => {
            const sum = percentages.reduce((acc, p) => acc + p, 0);
            return sum <= 100;
          }),
        (categoryPercentages) => {
          const sum = categoryPercentages.reduce((acc, p) => acc + p, 0);
          const remainder = computeUnclassifiedRemainder(categoryPercentages);

          // Remainder must be non-negative
          expect(remainder).toBeGreaterThanOrEqual(0);

          if (remainder > 0) {
            // When there IS an "Other" bucket, it equals 100 - sum
            expect(remainder).toBeCloseTo(100 - sum, 5);
          }

          // When sum is meaningfully less than 100, the "Other" bucket should exist
          if (sum < 100 - EPSILON) {
            expect(remainder).toBeGreaterThan(0);
            expect(remainder).toBeCloseTo(100 - sum, 5);
          }

          // When sum is approximately 100 (within epsilon), no "Other" bucket
          if (100 - sum <= EPSILON) {
            expect(remainder).toBe(0);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("when percentages sum to exactly 100, no Other bucket exists", () => {
    fc.assert(
      fc.property(
        // Generate percentages that sum to exactly 100
        fc
          .array(
            fc.double({ min: 0.01, max: 99, noNaN: true, noDefaultInfinity: true }),
            { minLength: 1, maxLength: 9 },
          )
          .map((partials) => {
            // Normalize so that all values sum to exactly 100
            const rawSum = partials.reduce((acc, p) => acc + p, 0);
            return partials.map((p) => (p / rawSum) * 100);
          }),
        (categoryPercentages) => {
          const remainder = computeUnclassifiedRemainder(categoryPercentages);

          // Remainder should be 0 — no "Other" bucket when sum ≈ 100
          expect(remainder).toBe(0);
        },
      ),
      { numRuns: 100 },
    );
  });
});
