import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";

/** Feature: portfolio-exposure, Property 14: Invalid input rejection */

// Mock @repo/db — should never be reached since validation fails first
vi.mock("@repo/db", () => ({
  prisma: {
    investment: { findMany: vi.fn() },
    assetExposureSnapshot: { findMany: vi.fn() },
    assetPrice: { findFirst: vi.fn() },
  },
}));

// Mock @repo/utils — should never be reached since validation fails first
vi.mock("@repo/utils", () => ({
  getEuropeMadridDateParts: vi.fn(() => ({ year: 2025, month: 1 })),
}));

import { GET } from "./route";

describe("Exposure API - Property 14: Invalid input rejection", () => {
  /**
   * **Validates: Requirements 10.5, 10.6**
   *
   * Property 14: For any string value that is not "SECTOR" or "COUNTRY" passed
   * as the `type` parameter, or any string that does not match the YYYY-MM format
   * passed as the `period` parameter, the Exposure API SHALL return HTTP 400 with
   * validation details.
   */

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid type values with 400 and validation details", async () => {
    // Generator for invalid type values: any string that is NOT "SECTOR" or "COUNTRY"
    const invalidTypeArb = fc
      .oneof(
        // Random strings
        fc.string({ minLength: 1, maxLength: 30 }),
        // Lowercase variants
        fc.constantFrom("sector", "country", "Sector", "Country", "SECTORS", "COUNTRIES"),
        // Numbers as strings
        fc.integer().map(String),
        // Empty string
        fc.constant(""),
      )
      .filter((s) => s !== "SECTOR" && s !== "COUNTRY");

    await fc.assert(
      fc.asyncProperty(invalidTypeArb, async (invalidType) => {
        const url = `http://localhost:3000/api/investments/exposure?type=${encodeURIComponent(invalidType)}`;
        const request = new Request(url);
        const response = await GET(request);

        expect(response.status).toBe(400);

        const body = await response.json();
        expect(body.error).toBe("Validation failed");
        expect(body.details).toBeDefined();
        expect(Array.isArray(body.details)).toBe(true);
        expect(body.details.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 },
    );
  });

  it("rejects invalid period formats with 400 and validation details", async () => {
    // Generator for invalid period strings that don't match YYYY-MM format
    const invalidPeriodArb = fc
      .oneof(
        // Random strings
        fc.string({ minLength: 1, maxLength: 20 }),
        // Wrong separators
        fc.tuple(fc.integer({ min: 2000, max: 2030 }), fc.integer({ min: 1, max: 12 })).map(
          ([y, m]) => `${y}/${String(m).padStart(2, "0")}`,
        ),
        // Invalid month (13-99)
        fc.tuple(fc.integer({ min: 2000, max: 2030 }), fc.integer({ min: 13, max: 99 })).map(
          ([y, m]) => `${y}-${String(m).padStart(2, "0")}`,
        ),
        // Month without leading zero (e.g., "2025-1")
        fc.tuple(fc.integer({ min: 2000, max: 2030 }), fc.integer({ min: 1, max: 9 })).map(
          ([y, m]) => `${y}-${m}`,
        ),
        // Two-digit year (e.g., "25-01")
        fc.tuple(fc.integer({ min: 10, max: 99 }), fc.integer({ min: 1, max: 12 })).map(
          ([y, m]) => `${y}-${String(m).padStart(2, "0")}`,
        ),
        // Random text
        fc.constantFrom("abcd-01", "not-a-date", "2025-00", "2025-1", "202501"),
      )
      .filter((s) => !/^\d{4}-(0[1-9]|1[0-2])$/.test(s));

    await fc.assert(
      fc.asyncProperty(invalidPeriodArb, async (invalidPeriod) => {
        // Use a valid type so only the period fails
        const url = `http://localhost:3000/api/investments/exposure?type=SECTOR&period=${encodeURIComponent(invalidPeriod)}`;
        const request = new Request(url);
        const response = await GET(request);

        expect(response.status).toBe(400);

        const body = await response.json();
        expect(body.error).toBe("Validation failed");
        expect(body.details).toBeDefined();
        expect(Array.isArray(body.details)).toBe(true);
        expect(body.details.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 },
    );
  });
});
