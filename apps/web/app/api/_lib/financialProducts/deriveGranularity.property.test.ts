import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { deriveGranularity } from "./priceSyncAlgorithm";
import type { Timeframe } from "./types";

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

describe("deriveGranularity - Property 4: Granularity fallback for DAILY assets", () => {
  /**
   * **Validates: Requirements 8.1, 8.2**
   *
   * Property 4: For any timeframe, when priceFrequency is "DAILY",
   * the resulting granularity must never be "FIFTEEN_MIN" or "HOURLY".
   * The DAILY fallback rule ensures intraday granularities are replaced
   * with "DAILY" for assets that only have daily pricing.
   */
  it("should never return FIFTEEN_MIN or HOURLY granularity for DAILY price frequency", () => {
    fc.assert(
      fc.property(fc.constantFrom(...ALL_TIMEFRAMES), (timeframe) => {
        const result = deriveGranularity(timeframe, "DAILY");

        expect(result.granularity).not.toBe("FIFTEEN_MIN");
        expect(result.granularity).not.toBe("HOURLY");
      }),
      { numRuns: 100 },
    );
  });
});
