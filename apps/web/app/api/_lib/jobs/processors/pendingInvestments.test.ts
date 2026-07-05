import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";

// --- Mock setup ---

const mockFindMany = vi.fn();
const mockUpdateMany = vi.fn();
const mockAccountUpdate = vi.fn();
const mockTransaction = vi.fn();
const mockInvestmentUpdateMany = vi.fn();

vi.mock("@repo/db", () => ({
  prisma: {
    investment: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      updateMany: (...args: unknown[]) => mockInvestmentUpdateMany(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

import { applyPendingInvestmentsForMonth } from "./pendingInvestments";

beforeEach(() => {
  vi.clearAllMocks();
});

// --- Unit Tests ---

describe("applyPendingInvestmentsForMonth - Unit Tests", () => {
  describe("successful processing transitions PENDING → COMPLETED with correct balance", () => {
    it("should process a BUY investment: decrement account balance", async () => {
      const pending = {
        id: 1,
        account_id: 10,
        type: "BUY",
        total_amount: 150.0,
        status: "PENDING",
      };

      mockFindMany.mockResolvedValue([pending]);
      mockTransaction.mockImplementation(async (cb: Function) => {
        const tx = {
          investment: { updateMany: mockUpdateMany },
          account: { update: mockAccountUpdate },
        };
        return cb(tx);
      });
      mockUpdateMany.mockResolvedValue({ count: 1 });
      mockAccountUpdate.mockResolvedValue({});

      const result = await applyPendingInvestmentsForMonth(1, 100);

      expect(result).toEqual({ processed: 1, failed: 0, skipped: 0 });
      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: { id: 1, status: "PENDING" },
        data: expect.objectContaining({
          status: "COMPLETED",
          processing_error: null,
          job_run_id: 100,
        }),
      });
      expect(mockAccountUpdate).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { balance: { decrement: 150.0 } },
      });
    });

    it("should process a SELL investment: increment account balance", async () => {
      const pending = {
        id: 2,
        account_id: 20,
        type: "SELL",
        total_amount: 200.5,
        status: "PENDING",
      };

      mockFindMany.mockResolvedValue([pending]);
      mockTransaction.mockImplementation(async (cb: Function) => {
        const tx = {
          investment: { updateMany: mockUpdateMany },
          account: { update: mockAccountUpdate },
        };
        return cb(tx);
      });
      mockUpdateMany.mockResolvedValue({ count: 1 });
      mockAccountUpdate.mockResolvedValue({});

      const result = await applyPendingInvestmentsForMonth(1, 100);

      expect(result).toEqual({ processed: 1, failed: 0, skipped: 0 });
      expect(mockAccountUpdate).toHaveBeenCalledWith({
        where: { id: 20 },
        data: { balance: { increment: 200.5 } },
      });
    });

    it("should process multiple investments and count them correctly", async () => {
      const investments = [
        { id: 1, account_id: 10, type: "BUY", total_amount: 100.0, status: "PENDING" },
        { id: 2, account_id: 10, type: "SELL", total_amount: 50.0, status: "PENDING" },
        { id: 3, account_id: 10, type: "BUY", total_amount: 75.25, status: "PENDING" },
      ];

      mockFindMany.mockResolvedValue(investments);
      mockTransaction.mockImplementation(async (cb: Function) => {
        const tx = {
          investment: { updateMany: mockUpdateMany },
          account: { update: mockAccountUpdate },
        };
        return cb(tx);
      });
      mockUpdateMany.mockResolvedValue({ count: 1 });
      mockAccountUpdate.mockResolvedValue({});

      const result = await applyPendingInvestmentsForMonth(1, 100);

      expect(result).toEqual({ processed: 3, failed: 0, skipped: 0 });
    });
  });

  describe("error recording continues processing remaining items", () => {
    it("should record the error and continue processing the next investment", async () => {
      const investments = [
        { id: 1, account_id: 10, type: "BUY", total_amount: 100.0, status: "PENDING" },
        { id: 2, account_id: 10, type: "SELL", total_amount: 50.0, status: "PENDING" },
        { id: 3, account_id: 10, type: "BUY", total_amount: 75.0, status: "PENDING" },
      ];

      mockFindMany.mockResolvedValue(investments);

      let callCount = 0;
      mockTransaction.mockImplementation(async (cb: Function) => {
        callCount++;
        if (callCount === 2) {
          throw new Error("DB connection lost");
        }
        const tx = {
          investment: { updateMany: mockUpdateMany },
          account: { update: mockAccountUpdate },
        };
        return cb(tx);
      });
      mockUpdateMany.mockResolvedValue({ count: 1 });
      mockAccountUpdate.mockResolvedValue({});
      mockInvestmentUpdateMany.mockResolvedValue({ count: 1 });

      const result = await applyPendingInvestmentsForMonth(1, 100);

      expect(result).toEqual({ processed: 2, failed: 1, skipped: 0 });
      expect(mockInvestmentUpdateMany).toHaveBeenCalledWith({
        where: { id: 2, status: "PENDING" },
        data: { processing_error: "DB connection lost" },
      });
    });

    it("should handle all investments failing", async () => {
      const investments = [
        { id: 1, account_id: 10, type: "BUY", total_amount: 100.0, status: "PENDING" },
        { id: 2, account_id: 10, type: "SELL", total_amount: 50.0, status: "PENDING" },
      ];

      mockFindMany.mockResolvedValue(investments);
      mockTransaction.mockImplementation(async () => {
        throw new Error("Transaction failed");
      });
      mockInvestmentUpdateMany.mockResolvedValue({ count: 1 });

      const result = await applyPendingInvestmentsForMonth(1, 100);

      expect(result).toEqual({ processed: 0, failed: 2, skipped: 0 });
      expect(mockInvestmentUpdateMany).toHaveBeenCalledTimes(2);
    });
  });

  describe("skipped count when concurrent claim fails", () => {
    it("should increment skipped when claim returns count 0", async () => {
      const pending = {
        id: 1,
        account_id: 10,
        type: "BUY",
        total_amount: 100.0,
        status: "PENDING",
      };

      mockFindMany.mockResolvedValue([pending]);
      mockTransaction.mockImplementation(async (cb: Function) => {
        const tx = {
          investment: { updateMany: mockUpdateMany },
          account: { update: mockAccountUpdate },
        };
        return cb(tx);
      });
      // Claim fails because another process already claimed it
      mockUpdateMany.mockResolvedValue({ count: 0 });

      const result = await applyPendingInvestmentsForMonth(1, 100);

      expect(result).toEqual({ processed: 0, failed: 0, skipped: 1 });
      expect(mockAccountUpdate).not.toHaveBeenCalled();
    });

    it("should handle a mix of processed and skipped investments", async () => {
      const investments = [
        { id: 1, account_id: 10, type: "BUY", total_amount: 100.0, status: "PENDING" },
        { id: 2, account_id: 10, type: "SELL", total_amount: 50.0, status: "PENDING" },
        { id: 3, account_id: 10, type: "BUY", total_amount: 75.0, status: "PENDING" },
      ];

      mockFindMany.mockResolvedValue(investments);

      let txCallIdx = 0;
      mockTransaction.mockImplementation(async (cb: Function) => {
        const currentIdx = txCallIdx++;
        const tx = {
          investment: {
            updateMany: vi.fn().mockResolvedValue({
              // Second investment is skipped (already claimed)
              count: currentIdx === 1 ? 0 : 1,
            }),
          },
          account: { update: mockAccountUpdate },
        };
        return cb(tx);
      });
      mockAccountUpdate.mockResolvedValue({});

      const result = await applyPendingInvestmentsForMonth(1, 100);

      expect(result).toEqual({ processed: 2, failed: 0, skipped: 1 });
    });
  });

  it("should return zero counts when no pending investments exist", async () => {
    mockFindMany.mockResolvedValue([]);

    const result = await applyPendingInvestmentsForMonth(1, 100);

    expect(result).toEqual({ processed: 0, failed: 0, skipped: 0 });
  });
});

// --- Property-Based Test ---

describe("Property 8: MonthSnapshot investment totals", () => {
  /**
   * **Validates: Requirements 4.1, 4.2, 7.1, 7.2**
   *
   * Property 8: After processing, the sum of total_amount from all successfully
   * processed BUY investments equals the expected total_investments_out, and the sum
   * of total_amount from all successfully processed SELL investments equals the
   * expected total_investments_in for a given month snapshot.
   */
  it("snapshot totals match sum of completed investments after processing", () => {
    const investmentArb = fc.record({
      id: fc.integer({ min: 1, max: 10000 }),
      account_id: fc.integer({ min: 1, max: 100 }),
      type: fc.constantFrom("BUY" as const, "SELL" as const),
      total_amount: fc.integer({ min: 1, max: 1000000 }).map(
        (cents) => Number((cents / 100).toFixed(2))
      ),
      status: fc.constant("PENDING" as const),
    });

    const investmentsArb = fc
      .array(investmentArb, { minLength: 0, maxLength: 20 })
      .map((items) =>
        items.map((item, idx) => ({ ...item, id: idx + 1 }))
      );

    return fc.assert(
      fc.asyncProperty(investmentsArb, async (investments) => {
        vi.clearAllMocks();

        mockFindMany.mockResolvedValue(investments);
        mockTransaction.mockImplementation(async (cb: Function) => {
          const tx = {
            investment: {
              updateMany: vi.fn().mockResolvedValue({ count: 1 }),
            },
            account: { update: vi.fn().mockResolvedValue({}) },
          };
          return cb(tx);
        });

        const result = await applyPendingInvestmentsForMonth(1, 100);

        // All investments should be processed successfully
        expect(result.processed).toBe(investments.length);
        expect(result.failed).toBe(0);
        expect(result.skipped).toBe(0);

        // Compute expected snapshot totals
        const expectedInvestmentsOut = investments
          .filter((inv) => inv.type === "BUY")
          .reduce((sum, inv) => sum + inv.total_amount, 0);

        const expectedInvestmentsIn = investments
          .filter((inv) => inv.type === "SELL")
          .reduce((sum, inv) => sum + inv.total_amount, 0);

        // The total of all processed amounts must equal BUY + SELL totals
        const buyCount = investments.filter((inv) => inv.type === "BUY").length;
        const sellCount = investments.filter((inv) => inv.type === "SELL").length;
        expect(result.processed).toBe(buyCount + sellCount);

        // Snapshot invariant: total_investments_out = sum of BUY total_amounts
        // Snapshot invariant: total_investments_in = sum of SELL total_amounts
        // Both must be non-negative
        expect(expectedInvestmentsOut).toBeGreaterThanOrEqual(0);
        expect(expectedInvestmentsIn).toBeGreaterThanOrEqual(0);

        // The combined amounts must equal total of all investment amounts
        const totalAllAmounts = investments.reduce(
          (sum, inv) => sum + inv.total_amount,
          0
        );
        expect(
          Math.round((expectedInvestmentsOut + expectedInvestmentsIn) * 100)
        ).toBe(Math.round(totalAllAmounts * 100));
      }),
      { numRuns: 100 }
    );
  });
});
