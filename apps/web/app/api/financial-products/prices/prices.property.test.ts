import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import type { Timeframe, GranularityValue } from "../../_lib/financialProducts/types";
import { TIMEFRAME_CONFIG } from "../../_lib/financialProducts/types";

const ALL_TIMEFRAMES: Timeframe[] = [
  "TODAY",
  "1W",
  "1M",
  "3M",
  "6M",
  "1Y",
  "5Y",
  "ALL",
];

type PriceFrequency = "DAILY" | "INTRADAY";

/**
 * Computes the expected granularity for a given timeframe and price frequency,
 * replicating the deriveGranularity logic.
 */
function expectedGranularity(
  timeframe: Timeframe,
  priceFrequency: PriceFrequency,
): GranularityValue {
  const config = TIMEFRAME_CONFIG[timeframe];
  const isIntraday =
    config.granularity === "FIFTEEN_MIN" || config.granularity === "HOURLY";
  if (priceFrequency === "DAILY" && isIntraday) {
    return "DAILY";
  }
  return config.granularity;
}

// --- Mocks ---

const mockFindUnique = vi.fn();
const mockFindManyPrices = vi.fn();

vi.mock("@repo/db", () => ({
  prisma: {
    asset: { findUnique: (...args: unknown[]) => mockFindUnique(...args) },
    assetPrice: { findMany: (...args: unknown[]) => mockFindManyPrices(...args) },
  },
}));

const mockSyncPrices = vi.fn();

vi.mock("../../_lib/financialProducts/priceSyncAlgorithm", () => ({
  deriveGranularity: (timeframe: Timeframe, priceFrequency: PriceFrequency) => {
    // Use the real mapping logic so the test validates actual behavior
    const config = TIMEFRAME_CONFIG[timeframe];
    const isIntraday =
      config.granularity === "FIFTEEN_MIN" || config.granularity === "HOURLY";
    const granularity =
      priceFrequency === "DAILY" && isIntraday ? "DAILY" : config.granularity;
    const interval =
      priceFrequency === "DAILY" && isIntraday ? "1d" : config.interval;
    // Use a deterministic window for testing
    const from = new Date("2024-01-01T00:00:00Z");
    const to = new Date("2024-06-01T00:00:00Z");
    return { granularity, interval, from, to };
  },
  syncPrices: (...args: unknown[]) => mockSyncPrices(...args),
}));

import { GET } from "./route";

function createRequest(queryString: string) {
  return new Request(
    `http://localhost/api/financial-products/prices${queryString}`,
  );
}

describe("Prices API - Property 5: Price query only returns rows in the requested granularity and window", () => {
  /**
   * **Validates: Requirements 5.3, 5.4**
   *
   * Property 5: For any GET /prices?assetId=X&timeframe=Y request,
   * every PricePoint in the response SHALL have a timestamp within [from, to]
   * and SHALL have been stored with the granularity derived for that timeframe.
   * No rows from a different granularity tier SHALL appear in the response.
   */
  beforeEach(() => {
    mockFindUnique.mockReset();
    mockFindManyPrices.mockReset();
    mockSyncPrices.mockReset();
  });

  it("every PricePoint in the response has timestamp within [from, to] and matches expected granularity", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...ALL_TIMEFRAMES),
        fc.constantFrom<PriceFrequency>("DAILY", "INTRADAY"),
        fc.array(
          fc.record({
            // Generate timestamps across a wide range including outside the window
            timestampMs: fc.integer({
              min: new Date("2023-06-01T00:00:00Z").getTime(),
              max: new Date("2024-12-01T00:00:00Z").getTime(),
            }),
            price: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
            // Generate prices with various granularities (some may not match)
            granularity: fc.constantFrom<GranularityValue>(
              "DAILY",
              "HOURLY",
              "FIFTEEN_MIN",
              "WEEKLY",
            ),
          }),
          { minLength: 1, maxLength: 20 },
        ),
        async (timeframe, priceFrequency, priceRows) => {
          // Reset mocks for each iteration
          mockFindUnique.mockReset();
          mockFindManyPrices.mockReset();
          mockSyncPrices.mockReset();

          // Asset mock
          mockFindUnique.mockResolvedValue({
            id: 1,
            ticker: "TST",
            price_frequency: priceFrequency,
            providerMappings: [{ provider: "YAHOO_FINANCE", provider_symbol: "TST" }],
          });

          // syncPrices does nothing (no-op)
          mockSyncPrices.mockResolvedValue(undefined);

          // The deterministic window from our deriveGranularity mock
          const from = new Date("2024-01-01T00:00:00Z");
          const to = new Date("2024-06-01T00:00:00Z");
          const expectedGran = expectedGranularity(timeframe, priceFrequency);

          // Mock findMany to simulate a database that correctly filters by the
          // provided where clause. This simulates DB behavior — only returns rows
          // that match the granularity AND fall within [from, to].
          mockFindManyPrices.mockImplementation(
            (args: {
              where: {
                asset_id: number;
                granularity: string;
                timestamp: { gte: Date; lte: Date };
              };
            }) => {
              const { where } = args;

              // Verify the route is passing the correct filter parameters
              expect(where.asset_id).toBe(1);
              expect(where.granularity).toBe(expectedGran);
              expect(where.timestamp.gte.getTime()).toBe(from.getTime());
              expect(where.timestamp.lte.getTime()).toBe(to.getTime());

              // Simulate DB filtering: only return rows that match the WHERE clause
              const filtered = priceRows
                .filter(
                  (row) =>
                    row.granularity === where.granularity &&
                    row.timestampMs >= where.timestamp.gte.getTime() &&
                    row.timestampMs <= where.timestamp.lte.getTime(),
                )
                .map((row) => ({
                  timestamp: new Date(row.timestampMs),
                  price: row.price,
                  granularity: row.granularity,
                }));

              return Promise.resolve(filtered);
            },
          );

          const res = await GET(
            createRequest(`?assetId=1&timeframe=${timeframe}`),
          );
          expect(res.status).toBe(200);

          const body: Array<{ timestamp: string; price: number }> =
            await res.json();

          // Assert: every returned PricePoint has a timestamp within [from, to]
          for (const point of body) {
            const ts = new Date(point.timestamp).getTime();
            expect(ts).toBeGreaterThanOrEqual(from.getTime());
            expect(ts).toBeLessThanOrEqual(to.getTime());
          }

          // Assert: all returned rows came from the correctly filtered set
          // (no rows from a different granularity tier appear because the route
          // queries with the correct granularity in the WHERE clause)
          // This is enforced by the mock above that verifies the query parameters

          // Assert: if we generated rows that DON'T match, they must NOT appear
          const outsideRows = priceRows.filter(
            (row) =>
              row.granularity !== expectedGran ||
              row.timestampMs < from.getTime() ||
              row.timestampMs > to.getTime(),
          );
          const insideRows = priceRows.filter(
            (row) =>
              row.granularity === expectedGran &&
              row.timestampMs >= from.getTime() &&
              row.timestampMs <= to.getTime(),
          );

          // Response length should equal the number of rows that match the filter
          expect(body.length).toBe(insideRows.length);

          // No outside row timestamps should appear in the response
          const responseTimestamps = new Set(
            body.map((p) => new Date(p.timestamp).getTime()),
          );
          for (const row of outsideRows) {
            // Only check if the timestamp is unique to outside rows
            if (
              !insideRows.some((r) => r.timestampMs === row.timestampMs)
            ) {
              expect(responseTimestamps.has(row.timestampMs)).toBe(false);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
