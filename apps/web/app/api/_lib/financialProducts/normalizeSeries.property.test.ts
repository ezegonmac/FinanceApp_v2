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

import { normalizeSeries } from "./normalizeSeries";

/**
 * Feature: asset-comparison, Property 8: Normalization formula correctness
 *
 * **Validates: Requirements 5.1, 5.2**
 *
 * For any price series [p0, p1, ..., pN] where p0 > 0 is the price at the
 * effective common start date, the normalized series SHALL be
 * [0.00, round(((p1/p0) - 1) * 100, 2), ..., round(((pN/p0) - 1) * 100, 2)].
 * The first value SHALL always be exactly 0.00.
 */

const pricePointArb = fc
  .record({
    timestampMs: fc.integer({ min: 0, max: 2_000_000_000_000 }),
    price: fc.double({ min: 0.01, max: 1_000_000, noNaN: true }),
  })
  .map(({ timestampMs, price }) => ({
    timestamp: new Date(timestampMs),
    price,
  }));

const testInputArb = fc.record({
  firstPrice: fc.double({ min: 0.01, max: 1_000_000, noNaN: true }),
  prices: fc.array(pricePointArb, { minLength: 1, maxLength: 50 }),
});

describe("normalizeSeries - Property 8: Normalization formula correctness", () => {
  it("first output value is exactly 0.00 when first price equals firstPrice", () => {
    fc.assert(
      fc.property(testInputArb, ({ firstPrice, prices }) => {
        // Set the first price in the array to equal firstPrice
        const pricesWithMatchingFirst = [
          { timestamp: prices[0]!.timestamp, price: firstPrice },
          ...prices.slice(1),
        ];

        const result = normalizeSeries(pricesWithMatchingFirst, firstPrice);

        // Property: first value is exactly 0.00
        expect(result[0]!.value).toBe(0.0);
      }),
      { numRuns: 100 },
    );
  });

  it("each output value matches the normalization formula", () => {
    fc.assert(
      fc.property(testInputArb, ({ firstPrice, prices }) => {
        const result = normalizeSeries(prices, firstPrice);

        // Property: each value matches round(((price / firstPrice) - 1) * 100, 2)
        for (let i = 0; i < prices.length; i++) {
          const expected =
            Math.round(((prices[i]!.price / firstPrice - 1) * 100) * 100) / 100;
          expect(result[i]!.value).toBe(expected);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("output timestamps are valid ISO 8601 strings", () => {
    fc.assert(
      fc.property(testInputArb, ({ firstPrice, prices }) => {
        const result = normalizeSeries(prices, firstPrice);

        // Property: each timestamp is a valid ISO 8601 string
        for (const point of result) {
          const parsed = new Date(point.timestamp);
          expect(parsed.getTime()).not.toBeNaN();
          // ISO string should roundtrip
          expect(parsed.toISOString()).toBe(point.timestamp);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("output array length equals input array length", () => {
    fc.assert(
      fc.property(testInputArb, ({ firstPrice, prices }) => {
        const result = normalizeSeries(prices, firstPrice);

        // Property: output length equals input length
        expect(result.length).toBe(prices.length);
      }),
      { numRuns: 100 },
    );
  });
});
