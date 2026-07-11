import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindMany = vi.fn();
const mockFindUnique = vi.fn();
const mockCreate = vi.fn();
const mockDelete = vi.fn();
const mockProviderMappingFindUnique = vi.fn();

vi.mock("@repo/db", () => ({
  prisma: {
    asset: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      create: (...args: unknown[]) => mockCreate(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
    },
    assetProviderMapping: {
      findUnique: (...args: unknown[]) => mockProviderMappingFindUnique(...args),
      create: vi.fn(),
    },
  },
}));

import { GET, POST } from "./route";
import { DELETE } from "./[id]/route";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/financial-products/assets", () => {
  it("returns 200 with empty array when no assets exist", async () => {
    mockFindMany.mockResolvedValue([]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual([]);
    expect(mockFindMany).toHaveBeenCalledWith({ orderBy: { name: "asc" }, include: { providerMappings: true } });
  });

  it("returns 200 with list ordered by name", async () => {
    const assets = [
      { id: 1, ticker: "AAPL", name: "Apple Inc", asset_type: "STOCK", price_frequency: "INTRADAY", currency: "USD" },
      { id: 2, ticker: "MSFT", name: "Microsoft Corp", asset_type: "STOCK", price_frequency: "INTRADAY", currency: "USD" },
    ];
    mockFindMany.mockResolvedValue(assets);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(assets);
    expect(mockFindMany).toHaveBeenCalledWith({ orderBy: { name: "asc" }, include: { providerMappings: true } });
  });
});

describe("POST /api/financial-products/assets", () => {
  const validPayload = {
    ticker: "AAPL",
    name: "Apple Inc",
    asset_type: "STOCK",
    price_frequency: "INTRADAY",
    currency: "USD",
    provider_symbol: "AAPL",
  };

  it("returns 400 on missing required fields", async () => {
    const request = new Request("http://localhost/api/financial-products/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Apple Inc" }), // missing ticker, asset_type, price_frequency, currency
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid request data");
    expect(body.details).toBeDefined();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 400 on invalid asset_type enum value", async () => {
    const request = new Request("http://localhost/api/financial-products/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...validPayload, asset_type: "INVALID" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid request data");
    expect(body.details).toBeDefined();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 400 on currency length ≠ 3", async () => {
    const request = new Request("http://localhost/api/financial-products/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...validPayload, currency: "US" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid request data");
    expect(body.details).toBeDefined();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 200 with existing record on idempotent re-track", async () => {
    const existingAsset = { id: 1, ...validPayload, isin: null, created_at: "2024-01-01T00:00:00Z", providerMappings: [{ provider: "YAHOO_FINANCE", provider_symbol: "AAPL" }] };
    // ISIN is null so skip ISIN check; provider_symbol already mapped → return existing asset
    mockProviderMappingFindUnique.mockResolvedValue({
      asset: existingAsset,
    });

    const request = new Request("http://localhost/api/financial-products/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validPayload),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(existingAsset);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 200 with new record on first track", async () => {
    const newAsset = { id: 1, ...validPayload, isin: null, created_at: "2024-01-01T00:00:00Z", providerMappings: [{ provider: "YAHOO_FINANCE", provider_symbol: "AAPL" }] };
    // No existing ISIN match, no existing provider mapping → create new
    mockProviderMappingFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue(newAsset);

    const request = new Request("http://localhost/api/financial-products/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validPayload),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(newAsset);
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        ticker: "AAPL",
        name: "Apple Inc",
        asset_type: "STOCK",
        price_frequency: "INTRADAY",
        currency: "USD",
        isin: null,
        providerMappings: {
          create: {
            provider: "YAHOO_FINANCE",
            provider_symbol: "AAPL",
          },
        },
      },
      include: { providerMappings: true },
    });
  });
});

describe("DELETE /api/financial-products/assets/[id]", () => {
  it("returns 404 when asset does not exist", async () => {
    mockFindUnique.mockResolvedValue(null);

    const request = new Request("http://localhost/api/financial-products/assets/999", { method: "DELETE" });
    const response = await DELETE(request, { params: Promise.resolve({ id: "999" }) });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("Asset not found");
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("returns 204 on successful deletion", async () => {
    const existingAsset = { id: 1, ticker: "AAPL", name: "Apple Inc" };
    mockFindUnique.mockResolvedValue(existingAsset);
    mockDelete.mockResolvedValue(existingAsset);

    const request = new Request("http://localhost/api/financial-products/assets/1", { method: "DELETE" });
    const response = await DELETE(request, { params: Promise.resolve({ id: "1" }) });

    expect(response.status).toBe(204);
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});
