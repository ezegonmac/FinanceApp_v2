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

import { customRangeGranularity } from "./customRangeGranularity";

/**
 * Feature: asset-comparison, Property 11: Custom range granularity derivation
 *
 * **Validates: Requirements 7.5**
 *
 * For any custom date range, the derived granularity SHALL follow the span thresholds:
 *   - span ≤7 days → HOURLY / "1h"
 *   - span ≤31 days → DAILY / "1d"
 *   - span ≤365 days → DAILY / "1d"
 *   - span >365 days → WEEKLY / "1wk"
 *
 * The DAILY fallback for DAILY-frequency assets SHALL still apply when the derived
 * granularity would be sub-daily (HOURLY).
 */
describe("customRangeGranularity - Property 11: Custom range granularity derivation", () => {
  // Arbitrary: generate a start date and a positive span in milliseconds
  const startDateArb = fc.date({
    min: new Date("2000-01-01T00:00:00Z"),
    max: new Date("2030-01-01T00:00:00Z"),
  });

  const priceFrequencyArb = fc.constantFrom(
    "DAILY" as const,
    "INTRADAY" as const,
  );

  it("span ≤7 days maps to HOURLY/1h for INTRADAY assets", () => {
    const spanArb = fc.double({
      min: 0.001,
      max: 7,
      noNaN: true,
    });

    fc.assert(
      fc.property(startDateArb, spanArb, (startDate, spanDays) => {
        const endDate = new Date(
          startDate.getTime() + spanDays * 24 * 60 * 60 * 1000,
        );
        const result = customRangeGranularity(startDate, endDate, "INTRADAY");

        expect(result.granularity).toBe("HOURLY");
        expect(result.interval).toBe("1h");
      }),
      { numRuns: 100 },
    );
  });

  it("span ≤7 days with DAILY frequency falls back to DAILY/1d", () => {
    const spanArb = fc.double({
      min: 0.001,
      max: 7,
      noNaN: true,
    });

    fc.assert(
      fc.property(startDateArb, spanArb, (startDate, spanDays) => {
        const endDate = new Date(
          startDate.getTime() + spanDays * 24 * 60 * 60 * 1000,
        );
        const result = customRangeGranularity(startDate, endDate, "DAILY");

        // DAILY fallback: sub-daily granularity falls back to DAILY
        expect(result.granularity).toBe("DAILY");
        expect(result.interval).toBe("1d");
      }),
      { numRuns: 100 },
    );
  });

  it("span >7 days and ≤31 days maps to DAILY/1d", () => {
    // Generate span strictly > 7 and ≤ 31
    const spanArb = fc.double({
      min: 7.001,
      max: 31,
      noNaN: true,
    });

    fc.assert(
      fc.property(
        startDateArb,
        spanArb,
        priceFrequencyArb,
        (startDate, spanDays, freq) => {
          const endDate = new Date(
            startDate.getTime() + spanDays * 24 * 60 * 60 * 1000,
          );
          const result = customRangeGranularity(startDate, endDate, freq);

          expect(result.granularity).toBe("DAILY");
          expect(result.interval).toBe("1d");
        },
      ),
      { numRuns: 100 },
    );
  });

  it("span >31 days and ≤365 days maps to DAILY/1d", () => {
    const spanArb = fc.double({
      min: 31.001,
      max: 365,
      noNaN: true,
    });

    fc.assert(
      fc.property(
        startDateArb,
        spanArb,
        priceFrequencyArb,
        (startDate, spanDays, freq) => {
          const endDate = new Date(
            startDate.getTime() + spanDays * 24 * 60 * 60 * 1000,
          );
          const result = customRangeGranularity(startDate, endDate, freq);

          expect(result.granularity).toBe("DAILY");
          expect(result.interval).toBe("1d");
        },
      ),
      { numRuns: 100 },
    );
  });

  it("span >365 days maps to WEEKLY/1wk", () => {
    const spanArb = fc.double({
      min: 365.001,
      max: 3650,
      noNaN: true,
    });

    fc.assert(
      fc.property(
        startDateArb,
        spanArb,
        priceFrequencyArb,
        (startDate, spanDays, freq) => {
          const endDate = new Date(
            startDate.getTime() + spanDays * 24 * 60 * 60 * 1000,
          );
          const result = customRangeGranularity(startDate, endDate, freq);

          expect(result.granularity).toBe("WEEKLY");
          expect(result.interval).toBe("1wk");
        },
      ),
      { numRuns: 100 },
    );
  });

  it("DAILY fallback applies only when derived granularity is sub-daily", () => {
    // For any span and frequency, if frequency is DAILY, granularity must never be HOURLY
    const spanArb = fc.double({
      min: 0.001,
      max: 3650,
      noNaN: true,
    });

    fc.assert(
      fc.property(startDateArb, spanArb, (startDate, spanDays) => {
        const endDate = new Date(
          startDate.getTime() + spanDays * 24 * 60 * 60 * 1000,
        );
        const result = customRangeGranularity(startDate, endDate, "DAILY");

        // DAILY frequency must never produce sub-daily granularity
        expect(result.granularity).not.toBe("HOURLY");
        expect(result.granularity).not.toBe("FIFTEEN_MIN");
      }),
      { numRuns: 100 },
    );
  });
});
