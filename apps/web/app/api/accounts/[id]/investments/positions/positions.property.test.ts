import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";

/**
 * In-memory stores simulating the database tables needed
 * for the positions route handler.
 */
let accountStore: Array<{ id: number }> = [];
let investmentStore: Array<{
  asset_id: number;
  type: "BUY" | "SELL";
  units: number;
  total_amount: number;
  status: string;
  account_id: number;
}> = [];
let assetStore: Array<{
  id: number;
  ticker: string;
  name: string;
  asset_type: string;
  currency: string;
}> = [];
let assetPriceStore: Array<{
  asset_id: number;
  price: number;
  timestamp: Date;
}> = [];

vi.mock("@repo/db", () => ({
  prisma: {
    account: {
      findUnique: vi.fn(({ where }: { where: { id: number } }) => {
        const account = accountStore.find((a) => a.id === where.id);
        return Promise.resolve(account ?? null);
      }),
    },
    investment: {
      findMany: vi.fn(
        ({
          where,
        }: {
          where: { account_id: number; status: string };
        }) => {
          const results = investmentStore.filter(
            (inv) =>
              inv.account_id === where.account_id &&
              inv.status === where.status
          );
          return Promise.resolve(results);
        }
      ),
    },
    asset: {
      findMany: vi.fn(
        ({ where }: { where: { id: { in: number[] } } }) => {
          const results = assetStore.filter((a) =>
            where.id.in.includes(a.id)
          );
          return Promise.resolve(results);
        }
      ),
    },
    assetPrice: {
      findFirst: vi.fn(
        ({
          where,
          orderBy: _orderBy,
        }: {
          where: { asset_id: number };
          orderBy: { timestamp: string };
        }) => {
          const prices = assetPriceStore
            .filter((p) => p.asset_id === where.asset_id)
            .sort(
              (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
            );
          return Promise.resolve(prices[0] ?? null);
        }
      ),
    },
  },
}));

import { GET } from "./route";

function createGetRequest(): Request {
  return new Request(
    "http://localhost/api/accounts/1/investments/positions",
    { method: "GET" }
  );
}

function createRouteContext(
  accountId: number
): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id: String(accountId) }) };
}

/**
 * Arbitrary that generates a list of COMPLETED investments for a single asset,
 * ensuring buy units >= sell units (realistic: you can't sell more than you hold).
 */
const investmentListArb = (assetId: number, accountId: number) =>
  fc
    .record({
      buyCount: fc.integer({ min: 1, max: 5 }),
      sellCount: fc.integer({ min: 0, max: 4 }),
      buyUnits: fc.array(
        fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true }),
        { minLength: 5, maxLength: 5 }
      ),
      sellUnits: fc.array(
        fc.float({ min: Math.fround(0.01), max: Math.fround(100), noNaN: true }),
        { minLength: 4, maxLength: 4 }
      ),
      buyAmounts: fc.array(
        fc.float({ min: Math.fround(1), max: Math.fround(100000), noNaN: true }),
        { minLength: 5, maxLength: 5 }
      ),
    })
    .map(({ buyCount, sellCount, buyUnits, sellUnits, buyAmounts }) => {
      const buys: typeof investmentStore = [];
      for (let i = 0; i < buyCount; i++) {
        buys.push({
          asset_id: assetId,
          type: "BUY",
          units: buyUnits[i]!,
          total_amount: buyAmounts[i]!,
          status: "COMPLETED",
          account_id: accountId,
        });
      }

      const totalBuyUnits = buys.reduce((sum, b) => sum + b.units, 0);
      const sells: typeof investmentStore = [];
      let remainingUnits = totalBuyUnits;

      for (let i = 0; i < sellCount; i++) {
        const maxSellable = remainingUnits * 0.4; // never sell more than 40% of remaining
        if (maxSellable < 0.01) break;
        const sellUnit = Math.min(sellUnits[i]!, maxSellable);
        if (sellUnit < 0.01) continue;
        sells.push({
          asset_id: assetId,
          type: "SELL",
          units: sellUnit,
          total_amount: sellUnit * 10, // arbitrary amount
          status: "COMPLETED",
          account_id: accountId,
        });
        remainingUnits -= sellUnit;
      }

      return [...buys, ...sells];
    });

describe("Positions API - Property 6: Position units held equals BUY minus SELL", () => {
  /**
   * **Validates: Requirements 6.2, 6.6**
   *
   * Property 6: For any account and asset combination, the position's
   * `total_units` SHALL equal the sum of `units` from all COMPLETED BUY
   * investments minus the sum of `units` from all COMPLETED SELL investments.
   * Positions with zero total units SHALL be excluded from the active positions response.
   */
  beforeEach(() => {
    accountStore = [];
    investmentStore = [];
    assetStore = [];
    assetPriceStore = [];
  });

  it("total_units equals sum(BUY units) - sum(SELL units) and zero positions are excluded", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 3 }).chain((assetCount) =>
          fc.tuple(
            ...Array.from({ length: assetCount }, (_, i) =>
              investmentListArb(i + 1, 1)
            )
          )
        ),
        async (investmentGroups) => {
          // Reset stores
          accountStore = [{ id: 1 }];
          investmentStore = [];
          assetStore = [];
          assetPriceStore = [];

          // Populate stores from generated groups
          for (let i = 0; i < investmentGroups.length; i++) {
            const assetId = i + 1;
            assetStore.push({
              id: assetId,
              ticker: `TKR${assetId}`,
              name: `Asset ${assetId}`,
              asset_type: "ETF",
              currency: "USD",
            });
            // Add a price so the position is included in response
            assetPriceStore.push({
              asset_id: assetId,
              price: 50,
              timestamp: new Date(),
            });
            investmentStore.push(...investmentGroups[i]!);
          }

          const req = createGetRequest();
          const ctx = createRouteContext(1);
          const res = await GET(req, ctx);
          expect(res.status).toBe(200);

          const body = await res.json();
          const positions: Array<{
            asset_id: number;
            total_units: string;
          }> = body.data;

          // Verify each asset's position
          for (let i = 0; i < investmentGroups.length; i++) {
            const assetId = i + 1;
            const group = investmentGroups[i]!;

            const expectedBuyUnits = group
              .filter((inv) => inv.type === "BUY")
              .reduce((sum, inv) => sum + inv.units, 0);
            const expectedSellUnits = group
              .filter((inv) => inv.type === "SELL")
              .reduce((sum, inv) => sum + inv.units, 0);
            const expectedTotalUnits =
              expectedBuyUnits - expectedSellUnits;

            const position = positions.find(
              (p) => p.asset_id === assetId
            );

            if (expectedTotalUnits <= 0) {
              // Zero or negative positions should be excluded
              expect(position).toBeUndefined();
            } else {
              // Position should exist with correct total_units
              expect(position).toBeDefined();
              expect(Number(position!.total_units)).toBeCloseTo(
                expectedTotalUnits,
                4
              );
            }
          }

          // Also verify no extra positions appear
          for (const position of positions) {
            const group = investmentGroups[position.asset_id - 1]!;
            const buyUnits = group
              .filter((inv) => inv.type === "BUY")
              .reduce((sum, inv) => sum + inv.units, 0);
            const sellUnits = group
              .filter((inv) => inv.type === "SELL")
              .reduce((sum, inv) => sum + inv.units, 0);
            expect(buyUnits - sellUnits).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Positions API - Property 7: Position market value computation", () => {
  /**
   * **Validates: Requirements 6.4, 6.5**
   *
   * Property 7: For any position with a non-null latest AssetPrice, the
   * `current_value` SHALL equal `total_units × latest_price`. If no
   * AssetPrice exists, `current_value` SHALL be null.
   */
  beforeEach(() => {
    accountStore = [];
    investmentStore = [];
    assetStore = [];
    assetPriceStore = [];
  });

  it("current_value equals total_units × latest_price when price exists, null otherwise", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          buyUnits: fc.array(
            fc.float({ min: Math.fround(0.1), max: Math.fround(500), noNaN: true }),
            { minLength: 1, maxLength: 4 }
          ),
          latestPrice: fc.option(
            fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
            { nil: undefined }
          ),
          hasOlderPrice: fc.boolean(),
          olderPrice: fc.float({ min: Math.fround(0.01), max: Math.fround(5000), noNaN: true }),
        }),
        async ({ buyUnits, latestPrice, hasOlderPrice, olderPrice }) => {
          // Reset stores
          accountStore = [{ id: 1 }];
          investmentStore = [];
          assetStore = [
            {
              id: 1,
              ticker: "TEST",
              name: "Test Asset",
              asset_type: "ETF",
              currency: "USD",
            },
          ];
          assetPriceStore = [];

          // Create BUY investments (no sells, so total_units = sum of buys)
          for (const units of buyUnits) {
            investmentStore.push({
              asset_id: 1,
              type: "BUY",
              units,
              total_amount: units * 10,
              status: "COMPLETED",
              account_id: 1,
            });
          }

          const totalUnits = buyUnits.reduce((sum, u) => sum + u, 0);

          // Set up price store
          if (latestPrice !== undefined) {
            assetPriceStore.push({
              asset_id: 1,
              price: latestPrice,
              timestamp: new Date("2025-01-15T12:00:00Z"),
            });
            // Optionally add an older price to verify we use the latest
            if (hasOlderPrice) {
              assetPriceStore.push({
                asset_id: 1,
                price: olderPrice,
                timestamp: new Date("2024-06-01T12:00:00Z"),
              });
            }
          }

          const req = createGetRequest();
          const ctx = createRouteContext(1);
          const res = await GET(req, ctx);
          expect(res.status).toBe(200);

          const body = await res.json();
          const positions: Array<{
            asset_id: number;
            total_units: string;
            current_value: string | null;
            latest_price: string | null;
          }> = body.data;

          if (totalUnits <= 0) {
            // Should be excluded
            expect(positions.length).toBe(0);
            return;
          }

          expect(positions.length).toBe(1);
          const position = positions[0]!;

          if (latestPrice === undefined) {
            // No price → current_value should be null
            expect(position.current_value).toBeNull();
            expect(position.latest_price).toBeNull();
          } else {
            // Price exists → current_value = total_units × latest_price
            expect(position.current_value).not.toBeNull();
            expect(position.latest_price).not.toBeNull();

            const expectedValue = totalUnits * latestPrice;
            expect(Number(position.current_value)).toBeCloseTo(
              expectedValue,
              2
            );
            expect(Number(position.latest_price)).toBeCloseTo(
              latestPrice,
              4
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
