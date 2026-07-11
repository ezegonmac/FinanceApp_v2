import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";

/** Feature: portfolio-exposure, Property 7: ETF/Fund entries produce one snapshot per category */

const { mockQuoteSummary } = vi.hoisted(() => {
  const mockQuoteSummary = vi.fn();
  return { mockQuoteSummary };
});

vi.mock("yahoo-finance2", () => {
  return {
    default: class {
      quoteSummary = mockQuoteSummary;
    },
  };
});

import { fetchExposureFromYahoo, type AssetWithMapping } from "./yahooFetcher";

describe("fetchExposureFromYahoo - Property 7: ETF/Fund entries produce one snapshot per category", () => {
  /**
   * **Validates: Requirements 5.2**
   *
   * Property 7: For any ETF or FUND asset with N sector entries reported by
   * the provider, the function SHALL produce exactly N sector entries, each
   * with the percentage reported by the provider (multiplied by 100).
   */

  beforeEach(() => {
    mockQuoteSummary.mockReset();
  });

  it("ETF/FUND assets produce exactly N sector snapshots matching provider data", async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate asset type: ETF or FUND
        fc.constantFrom("ETF", "FUND") as fc.Arbitrary<"ETF" | "FUND">,
        // Generate N sector entries with unique labels and percentages (0-1)
        fc.array(
          fc.record({
            label: fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0),
            percentage: fc.double({ min: 0.001, max: 1, noNaN: true }),
          }),
          { minLength: 1, maxLength: 15 },
        ).chain((entries) => {
          // Ensure unique labels
          const seen = new Set<string>();
          const unique = entries.filter((e) => {
            const key = e.label.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          return fc.constant(unique.length > 0 ? unique : [entries[0]!]);
        }),
        async (assetType, sectorEntries) => {
          // Build the asset
          const asset: AssetWithMapping = {
            id: 1,
            asset_type: assetType as AssetWithMapping["asset_type"],
            providerMappings: [
              { provider: "YAHOO_FINANCE", provider_symbol: "VTI" },
            ],
          };

          // Build sectorWeightings in Yahoo's format: [{ "label": percentage }, ...]
          const sectorWeightings = sectorEntries.map((entry) => ({
            [entry.label]: entry.percentage,
          }));

          // Mock yahoo-finance2 to return topHoldings with the generated data
          mockQuoteSummary.mockResolvedValueOnce({
            topHoldings: {
              sectorWeightings,
            },
          });

          const result = await fetchExposureFromYahoo(asset);

          // Assert result is not null
          expect(result).not.toBeNull();

          // Assert exactly N sector entries
          expect(result!.sectors).toHaveLength(sectorEntries.length);

          // Assert each sector entry has the correct percentage (raw * 100)
          for (let i = 0; i < sectorEntries.length; i++) {
            expect(result!.sectors[i]!.label).toBe(sectorEntries[i]!.label);
            expect(result!.sectors[i]!.percentage).toBeCloseTo(
              sectorEntries[i]!.percentage * 100,
              5,
            );
          }

          // Countries should be empty (Yahoo doesn't always provide it)
          expect(result!.countries).toHaveLength(0);
        },
      ),
      { numRuns: 100 },
    );
  });
});

/** Feature: portfolio-exposure, Property 9: Raw percentages stored without normalization */

describe("fetchExposureFromYahoo - Property 9: Raw percentages stored without normalization", () => {
  /**
   * **Validates: Requirements 6.2**
   *
   * Property 9: For any provider-reported exposure data where category
   * percentages sum to less than 100%, the returned percentage values SHALL
   * exactly match the raw provider values (decimal * 100) without being
   * scaled to sum to 100%.
   */

  beforeEach(() => {
    mockQuoteSummary.mockReset();
  });

  it("raw percentages are stored as-is without normalization to 100%", async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate N sector entries with decimals that intentionally sum to less than 1.0
        fc.integer({ min: 2, max: 10 }).chain((n) =>
          fc.array(
            fc.record({
              label: fc.stringMatching(/^[A-Za-z][A-Za-z ]{0,19}$/),
              percentage: fc.double({ min: 0.01, max: 0.3, noNaN: true }),
            }),
            { minLength: n, maxLength: n },
          ).map((entries) => {
            // Ensure unique labels
            const seen = new Set<string>();
            const unique = entries.filter((e) => {
              const key = e.label.toLowerCase();
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
            // Ensure sum < 1.0 by scaling down if needed
            const arr = unique.length >= 2 ? unique : [
              { label: "SectorA", percentage: 0.1 },
              { label: "SectorB", percentage: 0.15 },
            ];
            const sum = arr.reduce((acc, e) => acc + e.percentage, 0);
            if (sum >= 1.0) {
              const scaleFactor = 0.8 / sum;
              return arr.map((e) => ({ ...e, percentage: e.percentage * scaleFactor }));
            }
            return arr;
          }),
        ),
        async (sectorEntries) => {
          // Verify precondition: sum of raw decimals is less than 1.0
          const rawSum = sectorEntries.reduce((acc, e) => acc + e.percentage, 0);
          expect(rawSum).toBeLessThan(1.0);

          // Build the asset as ETF
          const asset: AssetWithMapping = {
            id: 1,
            asset_type: "ETF",
            providerMappings: [
              { provider: "YAHOO_FINANCE", provider_symbol: "SPY" },
            ],
          };

          // Build sectorWeightings in Yahoo's format: [{ "label": decimalValue }, ...]
          const sectorWeightings = sectorEntries.map((entry) => ({
            [entry.label]: entry.percentage,
          }));

          mockQuoteSummary.mockResolvedValueOnce({
            topHoldings: {
              sectorWeightings,
            },
          });

          const result = await fetchExposureFromYahoo(asset);

          expect(result).not.toBeNull();
          expect(result!.sectors).toHaveLength(sectorEntries.length);

          // Assert each stored percentage is exactly rawDecimal * 100 (NOT normalized)
          for (let i = 0; i < sectorEntries.length; i++) {
            const expectedPercentage = sectorEntries[i]!.percentage * 100;
            expect(result!.sectors[i]!.percentage).toBeCloseTo(expectedPercentage, 10);
          }

          // Assert the sum of stored percentages is less than 100% (no normalization)
          const storedSum = result!.sectors.reduce((acc, s) => acc + s.percentage, 0);
          expect(storedSum).toBeLessThan(100);

          // Verify sum of stored percentages equals raw sum * 100 (confirming no normalization)
          expect(storedSum).toBeCloseTo(rawSum * 100, 5);
        },
      ),
      { numRuns: 100 },
    );
  });
});
