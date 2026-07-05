import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";

/**
 * In-memory stores simulating the database for investment property tests.
 */
let accountStore: Array<{ id: number; balance: number }> = [];
let assetStore: Array<{ id: number }> = [];
let monthStore: Array<{ id: number; year: number; month: number }> = [];
let investmentStore: Array<{
  id: number;
  account_id: number;
  asset_id: number;
  month_id: number;
  type: "BUY" | "SELL";
  units: number;
  unit_price: number;
  total_amount: number;
  description: string | null;
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  processed_at: Date | null;
  job_run_id: number | null;
  processing_error: string | null;
  created_at: Date;
}> = [];
let nextInvestmentId = 1;
let nextMonthId = 1;

/** Controlled "current" date parts for month classification */
let mockedDateParts = { year: 2024, month: 6, day: 15 };

vi.mock("@repo/utils", () => ({
  getEuropeMadridDateParts: () => mockedDateParts,
}));

vi.mock("@/app/api/_lib/snapshots/recalculateMonthSnapshot", () => ({
  recalculateMonthSnapshot: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/app/api/_lib/financialProducts/priceSyncAlgorithm", () => ({
  syncPrices: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@repo/db", () => ({
  prisma: {
    account: {
      findUnique: vi.fn(({ where }: { where: { id: number } }) => {
        const account = accountStore.find((a) => a.id === where.id);
        return Promise.resolve(account ?? null);
      }),
      update: vi.fn(
        ({
          where,
          data,
        }: {
          where: { id: number };
          data: { balance: { increment?: number; decrement?: number } };
        }) => {
          const account = accountStore.find((a) => a.id === where.id);
          if (!account) return Promise.resolve(null);
          if (data.balance.increment != null) {
            account.balance += data.balance.increment;
          }
          if (data.balance.decrement != null) {
            account.balance -= data.balance.decrement;
          }
          return Promise.resolve(account);
        },
      ),
    },
    asset: {
      findUnique: vi.fn(({ where }: { where: { id: number } }) => {
        const asset = assetStore.find((a) => a.id === where.id);
        return Promise.resolve(asset ? { ...asset, providerMappings: [] } : null);
      }),
    },
    month: {
      upsert: vi.fn(
        ({
          where,
          create,
        }: {
          where: { year_month: { year: number; month: number } };
          update: object;
          create: { year: number; month: number };
        }) => {
          const existing = monthStore.find(
            (m) =>
              m.year === where.year_month.year &&
              m.month === where.year_month.month,
          );
          if (existing) return Promise.resolve(existing);
          const newMonth = { id: nextMonthId++, ...create };
          monthStore.push(newMonth);
          return Promise.resolve(newMonth);
        },
      ),
    },
    investment: {
      findMany: vi.fn(({ where }: { where: { month_id?: number; status?: string; account_id?: number } }) => {
        return Promise.resolve(
          investmentStore.filter((inv) => {
            if (where.month_id != null && inv.month_id !== where.month_id) return false;
            if (where.status != null && inv.status !== where.status) return false;
            if (where.account_id != null && inv.account_id !== where.account_id) return false;
            return true;
          }),
        );
      }),
      findFirst: vi.fn(
        ({ where }: { where: { id: number; account_id: number } }) => {
          const inv = investmentStore.find(
            (i) => i.id === where.id && i.account_id === where.account_id,
          );
          return Promise.resolve(inv ?? null);
        },
      ),
      create: vi.fn(({ data }: { data: any }) => {
        const inv = {
          id: nextInvestmentId++,
          ...data,
          created_at: new Date(),
          processed_at: data.processed_at ?? null,
          job_run_id: data.job_run_id ?? null,
          processing_error: data.processing_error ?? null,
        };
        investmentStore.push(inv);
        return Promise.resolve(inv);
      }),
      update: vi.fn(({ where, data }: { where: { id: number }; data: any }) => {
        const inv = investmentStore.find((i) => i.id === where.id);
        if (!inv) return Promise.resolve(null);
        Object.assign(inv, data);
        return Promise.resolve(inv);
      }),
      updateMany: vi.fn(),
      aggregate: vi.fn(
        ({
          where,
        }: {
          where: {
            account_id: number;
            asset_id: number;
            status: string;
            type?: string;
          };
        }) => {
          const matching = investmentStore.filter(
            (i) =>
              i.account_id === where.account_id &&
              i.asset_id === where.asset_id &&
              i.status === where.status &&
              (where.type == null || i.type === where.type),
          );
          const sum = matching.reduce((acc, i) => acc + i.units, 0);
          return Promise.resolve({ _sum: { units: sum || null } });
        },
      ),
    },
    $transaction: vi.fn(async (fn: (tx: any) => Promise<any>) => {
      // Provide a transaction proxy that delegates to the same mocks
      const tx = {
        investment: {
          create: vi.fn(({ data }: { data: any }) => {
            const inv = {
              id: nextInvestmentId++,
              ...data,
              created_at: new Date(),
              processed_at: data.processed_at ?? null,
              job_run_id: data.job_run_id ?? null,
              processing_error: data.processing_error ?? null,
            };
            investmentStore.push(inv);
            return Promise.resolve(inv);
          }),
          update: vi.fn(({ where, data }: { where: { id: number }; data: any }) => {
            const inv = investmentStore.find((i) => i.id === where.id);
            if (!inv) return Promise.resolve(null);
            Object.assign(inv, data);
            return Promise.resolve(inv);
          }),
        },
        account: {
          update: vi.fn(
            ({
              where,
              data,
            }: {
              where: { id: number };
              data: { balance: { increment?: number; decrement?: number } };
            }) => {
              const account = accountStore.find((a) => a.id === where.id);
              if (!account) return Promise.resolve(null);
              if (data.balance.increment != null) {
                account.balance += data.balance.increment;
              }
              if (data.balance.decrement != null) {
                account.balance -= data.balance.decrement;
              }
              return Promise.resolve(account);
            },
          ),
        },
      };
      return fn(tx);
    }),
  },
}));

import { POST, PATCH } from "./route";

function createPostRequest(
  accountId: number,
  body: Record<string, unknown>,
): [Request, { params: Promise<{ id: string }> }] {
  const req = new Request(
    `http://localhost/api/accounts/${accountId}/investments`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  return [req, { params: Promise.resolve({ id: String(accountId) }) }];
}

function createPatchRequest(
  accountId: number,
  body: Record<string, unknown>,
): [Request, { params: Promise<{ id: string }> }] {
  const req = new Request(
    `http://localhost/api/accounts/${accountId}/investments`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  return [req, { params: Promise.resolve({ id: String(accountId) }) }];
}

function resetStores() {
  accountStore = [];
  assetStore = [];
  monthStore = [];
  investmentStore = [];
  nextInvestmentId = 1;
  nextMonthId = 1;
  mockedDateParts = { year: 2024, month: 6, day: 15 };
}

describe("Investments API - Property 1: Total amount computation", () => {
  /**
   * **Validates: Requirements 1.1, 1.2**
   *
   * Property 1: For any valid units (positive decimal) and unit_price (positive
   * decimal), the computed total_amount SHALL equal round(units × unit_price, 2).
   */
  beforeEach(resetStores);

  it("total_amount equals round(units × unit_price, 2) for arbitrary positive decimals", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.double({ min: 0.01, max: 100000, noNaN: true }),
        fc.double({ min: 0.01, max: 100000, noNaN: true }),
        async (units, unitPrice) => {
          resetStores();
          accountStore.push({ id: 1, balance: 999999999 });
          assetStore.push({ id: 1 });

          const [req, ctx] = createPostRequest(1, {
            asset_id: 1,
            type: "BUY",
            units,
            unit_price: unitPrice,
            year: 2024,
            month: 6,
          });

          const res = await POST(req, ctx);
          expect(res.status).toBe(201);

          const body = await res.json();
          const expected = Math.round(units * unitPrice * 100) / 100;
          expect(body.total_amount).toBeCloseTo(expected, 2);
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe("Investments API - Property 2: Current/past month operations complete immediately", () => {
  /**
   * **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
   *
   * Property 2: For any investment (BUY or SELL) created for the current or a
   * past month, the Investment status SHALL be COMPLETED and the Account balance
   * SHALL change by exactly -total_amount for BUY or +total_amount for SELL.
   */
  beforeEach(resetStores);

  it("current/past month BUY/SELL operations are COMPLETED with correct balance change", async () => {
    const monthArb = fc.record({
      year: fc.integer({ min: 2020, max: 2024 }),
      month: fc.integer({ min: 1, max: 12 }),
    }).filter(({ year, month }) => {
      // Must be current or past relative to mocked current (2024-06)
      return year < 2024 || (year === 2024 && month <= 6);
    });

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("BUY" as const, "SELL" as const),
        fc.double({ min: 0.01, max: 1000, noNaN: true }),
        fc.double({ min: 0.01, max: 1000, noNaN: true }),
        monthArb,
        async (type, units, unitPrice, month) => {
          resetStores();
          const initialBalance = 500000;
          accountStore.push({ id: 1, balance: initialBalance });
          assetStore.push({ id: 1 });

          // For SELL, pre-seed completed BUY units so the sell can pass validation
          if (type === "SELL") {
            investmentStore.push({
              id: nextInvestmentId++,
              account_id: 1,
              asset_id: 1,
              month_id: 1,
              type: "BUY",
              units: units + 1000, // ensure enough
              unit_price: 1,
              total_amount: units + 1000,
              description: null,
              status: "COMPLETED",
              processed_at: new Date(),
              job_run_id: null,
              processing_error: null,
              created_at: new Date(),
            });
          }

          const [req, ctx] = createPostRequest(1, {
            asset_id: 1,
            type,
            units,
            unit_price: unitPrice,
            year: month.year,
            month: month.month,
          });

          const res = await POST(req, ctx);
          expect(res.status).toBe(201);

          const body = await res.json();
          expect(body.status).toBe("COMPLETED");

          const totalAmount = Math.round(units * unitPrice * 100) / 100;
          const account = accountStore.find((a) => a.id === 1)!;

          if (type === "BUY") {
            expect(account.balance).toBeCloseTo(initialBalance - totalAmount, 2);
          } else {
            expect(account.balance).toBeCloseTo(initialBalance + totalAmount, 2);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe("Investments API - Property 3: Future month operations are pending", () => {
  /**
   * **Validates: Requirements 1.2, 2.2**
   *
   * Property 3: For any investment (BUY or SELL) created for a future month,
   * the Investment status SHALL be PENDING and the Account balance SHALL remain unchanged.
   */
  beforeEach(resetStores);

  it("future month operations are PENDING with no balance change", async () => {
    const futureMonthArb = fc.record({
      year: fc.integer({ min: 2024, max: 2030 }),
      month: fc.integer({ min: 1, max: 12 }),
    }).filter(({ year, month }) => {
      // Must be strictly future relative to mocked current (2024-06)
      return year > 2024 || (year === 2024 && month > 6);
    });

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("BUY" as const, "SELL" as const),
        fc.double({ min: 0.01, max: 1000, noNaN: true }),
        fc.double({ min: 0.01, max: 1000, noNaN: true }),
        futureMonthArb,
        async (type, units, unitPrice, month) => {
          resetStores();
          const initialBalance = 500000;
          accountStore.push({ id: 1, balance: initialBalance });
          assetStore.push({ id: 1 });

          // For SELL, pre-seed completed BUY units
          if (type === "SELL") {
            investmentStore.push({
              id: nextInvestmentId++,
              account_id: 1,
              asset_id: 1,
              month_id: 1,
              type: "BUY",
              units: units + 1000,
              unit_price: 1,
              total_amount: units + 1000,
              description: null,
              status: "COMPLETED",
              processed_at: new Date(),
              job_run_id: null,
              processing_error: null,
              created_at: new Date(),
            });
          }

          const [req, ctx] = createPostRequest(1, {
            asset_id: 1,
            type,
            units,
            unit_price: unitPrice,
            year: month.year,
            month: month.month,
          });

          const res = await POST(req, ctx);
          expect(res.status).toBe(201);

          const body = await res.json();
          expect(body.status).toBe("PENDING");

          // Balance must remain unchanged
          const account = accountStore.find((a) => a.id === 1)!;
          expect(account.balance).toBe(initialBalance);
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe("Investments API - Property 4: SELL is rejected when insufficient units", () => {
  /**
   * **Validates: Requirements 2.3**
   *
   * Property 4: For any SELL operation where the requested units exceed the
   * available units, the system SHALL reject the operation with status 400.
   */
  beforeEach(resetStores);

  it("SELL is rejected when requested units exceed available units", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.double({ min: 0.01, max: 100, noNaN: true }),
        fc.double({ min: 0.01, max: 100, noNaN: true }),
        fc.double({ min: 0.01, max: 1000, noNaN: true }),
        async (availableUnits, extraUnits, unitPrice) => {
          resetStores();
          accountStore.push({ id: 1, balance: 500000 });
          assetStore.push({ id: 1 });

          // Pre-seed with exact available BUY units
          if (availableUnits > 0) {
            investmentStore.push({
              id: nextInvestmentId++,
              account_id: 1,
              asset_id: 1,
              month_id: 1,
              type: "BUY",
              units: availableUnits,
              unit_price: 1,
              total_amount: availableUnits,
              description: null,
              status: "COMPLETED",
              processed_at: new Date(),
              job_run_id: null,
              processing_error: null,
              created_at: new Date(),
            });
          }

          // Request more than available
          const requestedUnits = availableUnits + extraUnits;

          const [req, ctx] = createPostRequest(1, {
            asset_id: 1,
            type: "SELL",
            units: requestedUnits,
            unit_price: unitPrice,
            year: 2024,
            month: 6,
          });

          const res = await POST(req, ctx);
          expect(res.status).toBe(400);

          const body = await res.json();
          expect(body.error).toBe("Insufficient units");
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe("Investments API - Property 5: Cancellation reverses balance for COMPLETED, preserves for PENDING", () => {
  /**
   * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
   *
   * Property 5: For any PENDING investment that is cancelled, the Account
   * balance SHALL remain unchanged. For any COMPLETED investment that is
   * cancelled, the Account balance SHALL change by +total_amount for BUY
   * or -total_amount for SELL (the reverse of the original operation).
   */
  beforeEach(resetStores);

  it("cancelling a COMPLETED investment reverses the balance change", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("BUY" as const, "SELL" as const),
        fc.double({ min: 0.01, max: 1000, noNaN: true }),
        fc.double({ min: 0.01, max: 1000, noNaN: true }),
        async (type, units, unitPrice) => {
          resetStores();
          const initialBalance = 500000;
          accountStore.push({ id: 1, balance: initialBalance });
          assetStore.push({ id: 1 });
          monthStore.push({ id: 1, year: 2024, month: 6 });

          const totalAmount = Math.round(units * unitPrice * 100) / 100;

          // Pre-seed a COMPLETED investment
          const investmentId = nextInvestmentId++;
          investmentStore.push({
            id: investmentId,
            account_id: 1,
            asset_id: 1,
            month_id: 1,
            type,
            units,
            unit_price: unitPrice,
            total_amount: totalAmount,
            description: null,
            status: "COMPLETED",
            processed_at: new Date(),
            job_run_id: null,
            processing_error: null,
            created_at: new Date(),
          });

          const balanceBeforeCancel = accountStore[0]!.balance;

          const [req, ctx] = createPatchRequest(1, {
            investment_id: investmentId,
            action: "cancel",
          });

          const res = await PATCH(req, ctx);
          expect(res.status).toBe(200);

          const body = await res.json();
          expect(body.status).toBe("CANCELLED");

          const account = accountStore.find((a) => a.id === 1)!;
          if (type === "BUY") {
            // BUY reversal: balance should increase
            expect(account.balance).toBeCloseTo(balanceBeforeCancel + totalAmount, 2);
          } else {
            // SELL reversal: balance should decrease
            expect(account.balance).toBeCloseTo(balanceBeforeCancel - totalAmount, 2);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("cancelling a PENDING investment preserves the balance", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("BUY" as const, "SELL" as const),
        fc.double({ min: 0.01, max: 1000, noNaN: true }),
        fc.double({ min: 0.01, max: 1000, noNaN: true }),
        async (type, units, unitPrice) => {
          resetStores();
          const initialBalance = 500000;
          accountStore.push({ id: 1, balance: initialBalance });
          assetStore.push({ id: 1 });
          monthStore.push({ id: 1, year: 2024, month: 7 });

          const totalAmount = Math.round(units * unitPrice * 100) / 100;

          // Pre-seed a PENDING investment
          const investmentId = nextInvestmentId++;
          investmentStore.push({
            id: investmentId,
            account_id: 1,
            asset_id: 1,
            month_id: 1,
            type,
            units,
            unit_price: unitPrice,
            total_amount: totalAmount,
            description: null,
            status: "PENDING",
            processed_at: null,
            job_run_id: null,
            processing_error: null,
            created_at: new Date(),
          });

          const [req, ctx] = createPatchRequest(1, {
            investment_id: investmentId,
            action: "cancel",
          });

          const res = await PATCH(req, ctx);
          expect(res.status).toBe(200);

          const body = await res.json();
          expect(body.status).toBe("CANCELLED");

          // Balance must remain unchanged
          const account = accountStore.find((a) => a.id === 1)!;
          expect(account.balance).toBe(initialBalance);
        },
      ),
      { numRuns: 100 },
    );
  });
});
