import { describe, it, expect, vi } from "vitest";
import * as fc from "fast-check";

vi.mock("@repo/db", () => ({
  prisma: {
    asset: {
      findMany: vi.fn().mockResolvedValue([]),
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

import { GET } from "./route";

const VALID_TIMEFRAMES = ["1W", "1M", "3M", "6M", "1Y", "5Y", "ALL"];

/**
 * **Validates: Requirements 2.4**
 *
 * Property 3: Invalid timeframe rejection
 *
 * For any string value that is not one of the supported preset timeframes
 * (1W, 1M, 3M, 6M, 1Y, 5Y, ALL) and is not a valid custom date range,
 * the comparison service SHALL reject the request with a 400 status.
 */
describe("Compare API - Property 3: Invalid timeframe rejection", () => {
  const invalidTimeframeArb = fc
    .string({ minLength: 1, maxLength: 10 })
    .filter((s) => !VALID_TIMEFRAMES.includes(s));

  it("should reject any invalid timeframe string with 400", async () => {
    await fc.assert(
      fc.asyncProperty(invalidTimeframeArb, async (invalidTimeframe) => {
        const url = `http://localhost/api/financial-products/compare?assetIds=1,2&timeframe=${encodeURIComponent(invalidTimeframe)}`;
        const request = new Request(url, { method: "GET" });
        const response = await GET(request);

        expect(response.status).toBe(400);
      }),
      { numRuns: 100 },
    );
  });
});
