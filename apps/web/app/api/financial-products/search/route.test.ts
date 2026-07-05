import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSearch = vi.hoisted(() => vi.fn());

vi.mock("yahoo-finance2", () => ({
  default: class {
    search = mockSearch;
  },
}));

import { GET } from "./route";

function createRequest(queryString: string) {
  return new Request(`http://localhost:3000/api/financial-products/search${queryString}`);
}

describe("GET /api/financial-products/search", () => {
  beforeEach(() => {
    mockSearch.mockReset();
  });

  describe("validation errors (400)", () => {
    it("returns 400 when q param is absent", async () => {
      const res = await GET(createRequest(""));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Invalid request data");
      expect(body.details).toBeDefined();
    });

    it("returns 400 when q param is empty string", async () => {
      const res = await GET(createRequest("?q="));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Invalid request data");
      expect(body.details).toBeDefined();
    });

    it("returns 400 when q param exceeds 200 characters", async () => {
      const longQuery = "a".repeat(201);
      const res = await GET(createRequest(`?q=${longQuery}`));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Invalid request data");
      expect(body.details).toBeDefined();
    });
  });

  describe("successful response (200)", () => {
    it("returns correctly shaped results with ticker, name, asset_type, exchange", async () => {
      mockSearch.mockResolvedValue({
        quotes: [
          {
            symbol: "AAPL",
            shortname: "Apple Inc.",
            longname: "Apple Inc.",
            quoteType: "EQUITY",
            exchange: "NMS",
            isYahooFinance: true,
          },
          {
            symbol: "VOO",
            shortname: "Vanguard S&P 500 ETF",
            longname: "Vanguard S&P 500 ETF",
            quoteType: "ETF",
            exchange: "PCX",
            isYahooFinance: true,
          },
        ],
      });

      const res = await GET(createRequest("?q=apple"));
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toHaveLength(2);

      expect(body[0]).toEqual({
        ticker: "AAPL",
        name: "Apple Inc.",
        asset_type: "STOCK",
        exchange: "NMS",
      });
      expect(body[1]).toEqual({
        ticker: "VOO",
        name: "Vanguard S&P 500 ETF",
        asset_type: "ETF",
        exchange: "PCX",
      });
    });

    it("uses shortname for name, falls back to longname, then symbol", async () => {
      mockSearch.mockResolvedValue({
        quotes: [
          {
            symbol: "XYZ",
            shortname: undefined,
            longname: "XYZ Long Name",
            quoteType: "EQUITY",
            exchange: "NYSE",
            isYahooFinance: true,
          },
          {
            symbol: "ABC",
            shortname: undefined,
            longname: undefined,
            quoteType: "ETF",
            exchange: "LSE",
            isYahooFinance: true,
          },
        ],
      });

      const res = await GET(createRequest("?q=test"));
      const body = await res.json();

      expect(body[0].name).toBe("XYZ Long Name");
      expect(body[1].name).toBe("ABC");
    });
  });

  describe("quoteType filtering", () => {
    it("omits results with unrecognised quoteType values", async () => {
      mockSearch.mockResolvedValue({
        quotes: [
          {
            symbol: "AAPL",
            shortname: "Apple Inc.",
            quoteType: "EQUITY",
            exchange: "NMS",
            isYahooFinance: true,
          },
          {
            symbol: "UNKNOWN",
            shortname: "Unknown Thing",
            quoteType: "FUTURE",
            exchange: "CME",
            isYahooFinance: true,
          },
          {
            symbol: "ALSO_UNKNOWN",
            shortname: "Also Unknown",
            quoteType: "OPTION",
            exchange: "CBOE",
            isYahooFinance: true,
          },
          {
            symbol: "BTC-USD",
            shortname: "Bitcoin USD",
            quoteType: "CRYPTOCURRENCY",
            exchange: "CCC",
            isYahooFinance: true,
          },
        ],
      });

      const res = await GET(createRequest("?q=mixed"));
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toHaveLength(2);
      expect(body[0].ticker).toBe("AAPL");
      expect(body[0].asset_type).toBe("STOCK");
      expect(body[1].ticker).toBe("BTC-USD");
      expect(body[1].asset_type).toBe("CRYPTO");
    });

    it("omits results where isYahooFinance is falsy", async () => {
      mockSearch.mockResolvedValue({
        quotes: [
          {
            symbol: "CRUNCHBASE",
            shortname: "Some Crunchbase Result",
            quoteType: "EQUITY",
            exchange: "NMS",
            isYahooFinance: false,
          },
          {
            symbol: "REAL",
            shortname: "Real Result",
            quoteType: "ETF",
            exchange: "LSE",
            isYahooFinance: true,
          },
        ],
      });

      const res = await GET(createRequest("?q=test"));
      const body = await res.json();

      expect(body).toHaveLength(1);
      expect(body[0].ticker).toBe("REAL");
    });

    it("maps all five recognised quoteType values correctly", async () => {
      mockSearch.mockResolvedValue({
        quotes: [
          { symbol: "S", shortname: "Stock", quoteType: "EQUITY", exchange: "X", isYahooFinance: true },
          { symbol: "E", shortname: "Etf", quoteType: "ETF", exchange: "X", isYahooFinance: true },
          { symbol: "F", shortname: "Fund", quoteType: "MUTUALFUND", exchange: "X", isYahooFinance: true },
          { symbol: "C", shortname: "Crypto", quoteType: "CRYPTOCURRENCY", exchange: "X", isYahooFinance: true },
          { symbol: "P", shortname: "Etp", quoteType: "ETP", exchange: "X", isYahooFinance: true },
        ],
      });

      const res = await GET(createRequest("?q=all"));
      const body = await res.json();

      expect(body).toHaveLength(5);
      expect(body[0].asset_type).toBe("STOCK");
      expect(body[1].asset_type).toBe("ETF");
      expect(body[2].asset_type).toBe("FUND");
      expect(body[3].asset_type).toBe("CRYPTO");
      expect(body[4].asset_type).toBe("ETP");
    });
  });

  describe("Yahoo Finance error (502)", () => {
    it("returns 502 when Yahoo Finance search throws", async () => {
      mockSearch.mockRejectedValue(new Error("Yahoo API unavailable"));

      const res = await GET(createRequest("?q=apple"));
      expect(res.status).toBe(502);

      const body = await res.json();
      expect(body.error).toBe("Failed to search assets");
    });
  });
});
