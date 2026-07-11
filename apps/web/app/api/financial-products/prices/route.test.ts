import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindUnique = vi.fn();
const mockFindManyPrices = vi.fn();

vi.mock("@repo/db", () => ({
  prisma: {
    asset: { findUnique: (...args: unknown[]) => mockFindUnique(...args) },
    assetPrice: { findMany: (...args: unknown[]) => mockFindManyPrices(...args) },
  },
}));

const mockDeriveGranularity = vi.fn();
const mockSyncPrices = vi.fn();

vi.mock("../../_lib/financialProducts/priceSyncAlgorithm", () => ({
  deriveGranularity: (...args: unknown[]) => mockDeriveGranularity(...args),
  syncPrices: (...args: unknown[]) => mockSyncPrices(...args),
}));

import { GET } from "./route";

function createRequest(queryString: string) {
  return new Request(`http://localhost/api/financial-products/prices${queryString}`);
}

describe("GET /api/financial-products/prices", () => {
  beforeEach(() => {
    mockFindUnique.mockReset();
    mockFindManyPrices.mockReset();
    mockDeriveGranularity.mockReset();
    mockSyncPrices.mockReset();
  });

  describe("validation errors (400)", () => {
    it("returns 400 when assetId is non-numeric", async () => {
      const res = await GET(createRequest("?assetId=abc&timeframe=1M"));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Invalid request data");
      expect(body.details).toBeDefined();
    });

    it("returns 400 when timeframe is absent", async () => {
      const res = await GET(createRequest("?assetId=1"));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Invalid request data");
      expect(body.details).toBeDefined();
    });

    it("returns 400 when timeframe is not a valid enum value", async () => {
      const res = await GET(createRequest("?assetId=1&timeframe=INVALID"));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Invalid request data");
      expect(body.details).toBeDefined();
    });
  });

  describe("asset not found (404)", () => {
    it("returns 404 when assetId is numeric but no asset exists", async () => {
      mockFindUnique.mockResolvedValue(null);

      const res = await GET(createRequest("?assetId=999&timeframe=1M"));
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe("Asset not found");
    });
  });

  describe("upstream Yahoo Finance error (502)", () => {
    it("returns 502 when syncPrices propagates a Yahoo error", async () => {
      mockFindUnique.mockResolvedValue({
        id: 1,
        ticker: "AAPL",
        price_frequency: "INTRADAY",
        providerMappings: [{ provider: "YAHOO_FINANCE", provider_symbol: "AAPL" }],
      });
      mockDeriveGranularity.mockReturnValue({
        granularity: "DAILY",
        interval: "1d",
        from: new Date("2024-01-01"),
        to: new Date("2024-02-01"),
      });
      mockSyncPrices.mockRejectedValue(new Error("Yahoo Finance API error"));

      const res = await GET(createRequest("?assetId=1&timeframe=1M"));
      expect(res.status).toBe(502);
      const body = await res.json();
      expect(body.error).toBe("Failed to fetch price data from Yahoo Finance");
    });
  });

  describe("successful response (200)", () => {
    it("returns 200 with empty array when asset exists but no price rows in range", async () => {
      mockFindUnique.mockResolvedValue({
        id: 1,
        ticker: "AAPL",
        price_frequency: "INTRADAY",
        providerMappings: [{ provider: "YAHOO_FINANCE", provider_symbol: "AAPL" }],
      });
      mockDeriveGranularity.mockReturnValue({
        granularity: "DAILY",
        interval: "1d",
        from: new Date("2024-01-01"),
        to: new Date("2024-02-01"),
      });
      mockSyncPrices.mockResolvedValue(undefined);
      mockFindManyPrices.mockResolvedValue([]);

      const res = await GET(createRequest("?assetId=1&timeframe=1M"));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual([]);
    });
  });
});
