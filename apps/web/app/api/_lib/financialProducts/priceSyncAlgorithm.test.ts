import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Timeframe } from "./types";

// Mock @repo/utils so we can control getEuropeMadridDateParts in tests
vi.mock("@repo/utils", () => ({
  getEuropeMadridDateParts: () => ({ year: 2024, month: 6, day: 15 }),
}));

// Mock @repo/db to avoid real DB connections
vi.mock("@repo/db", () => {
  return {
    prisma: {
      assetPriceSyncRange: {
        findMany: vi.fn(),
        deleteMany: vi.fn(),
        create: vi.fn(),
      },
      $transaction: vi.fn(),
    },
  };
});

// Mock yahoo-finance2 to avoid real network calls
vi.mock("yahoo-finance2", () => {
  return {
    default: class {
      historical() {
        return [];
      }
    },
  };
});

import { resolveTimeframeDates, deriveGranularity, computeMissingRanges, mergeSyncRange } from "./priceSyncAlgorithm";
import { prisma } from "@repo/db";

// Cast prisma methods as mocks for test assertions
const mockFindMany = prisma.assetPriceSyncRange.findMany as ReturnType<typeof vi.fn>;
const mockDeleteMany = prisma.assetPriceSyncRange.deleteMany as ReturnType<typeof vi.fn>;
const mockCreate = prisma.assetPriceSyncRange.create as ReturnType<typeof vi.fn>;
const mockTransaction = prisma.$transaction as unknown as ReturnType<typeof vi.fn>;

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

describe("resolveTimeframeDates", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Fix "now" to 2024-06-15T12:00:00.000Z
    vi.setSystemTime(new Date("2024-06-15T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each(ALL_TIMEFRAMES)(
    "returns from < to for timeframe %s",
    (timeframe) => {
      const { from, to } = resolveTimeframeDates(timeframe);
      expect(from.getTime()).toBeLessThan(to.getTime());
    },
  );

  it("returns 1980-01-01 as from for ALL timeframe", () => {
    const { from } = resolveTimeframeDates("ALL");
    expect(from.getTime()).toBe(new Date("1980-01-01T00:00:00Z").getTime());
  });

  it("TODAY resolves from to midnight Europe/Madrid", () => {
    // Our mock returns year=2024, month=6, day=15
    // So from should be new Date(2024, 5, 15) (month is 0-indexed in Date constructor)
    const { from } = resolveTimeframeDates("TODAY");
    expect(from.getFullYear()).toBe(2024);
    expect(from.getMonth()).toBe(5); // June is 5 (0-indexed)
    expect(from.getDate()).toBe(15);
    expect(from.getHours()).toBe(0);
    expect(from.getMinutes()).toBe(0);
    expect(from.getSeconds()).toBe(0);
  });

  it("1W resolves from to now minus 7 days", () => {
    const { from, to } = resolveTimeframeDates("1W");
    const diffMs = to.getTime() - from.getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    expect(diffMs).toBe(sevenDaysMs);
  });

  it("1M resolves from to now minus 1 month", () => {
    const { from } = resolveTimeframeDates("1M");
    expect(from.getMonth()).toBe(4); // May (June - 1)
    expect(from.getDate()).toBe(15);
  });

  it("1Y resolves from to now minus 1 year", () => {
    const { from } = resolveTimeframeDates("1Y");
    expect(from.getFullYear()).toBe(2023);
  });

  it("5Y resolves from to now minus 5 years", () => {
    const { from } = resolveTimeframeDates("5Y");
    expect(from.getFullYear()).toBe(2019);
  });
});

describe("deriveGranularity", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Expected default mappings per timeframe (when priceFrequency is INTRADAY)
  const expectedDefaults: Record<
    Timeframe,
    { granularity: string; interval: string }
  > = {
    TODAY: { granularity: "FIFTEEN_MIN", interval: "15m" },
    "1W": { granularity: "HOURLY", interval: "1h" },
    "1M": { granularity: "DAILY", interval: "1d" },
    "3M": { granularity: "DAILY", interval: "1d" },
    "6M": { granularity: "DAILY", interval: "1d" },
    "1Y": { granularity: "DAILY", interval: "1d" },
    "5Y": { granularity: "WEEKLY", interval: "1wk" },
    ALL: { granularity: "WEEKLY", interval: "1wk" },
  };

  describe("with INTRADAY priceFrequency (default mapping)", () => {
    it.each(ALL_TIMEFRAMES)(
      "returns correct granularity and interval for %s",
      (timeframe) => {
        const result = deriveGranularity(timeframe, "INTRADAY");
        expect(result.granularity).toBe(expectedDefaults[timeframe]!.granularity);
        expect(result.interval).toBe(expectedDefaults[timeframe]!.interval);
      },
    );
  });

  describe("with DAILY priceFrequency", () => {
    it.each(ALL_TIMEFRAMES)(
      "returns correct granularity and interval for %s",
      (timeframe) => {
        const result = deriveGranularity(timeframe, "DAILY");

        // DAILY fallback fires for TODAY and 1W (which map to FIFTEEN_MIN and HOURLY)
        if (timeframe === "TODAY" || timeframe === "1W") {
          expect(result.granularity).toBe("DAILY");
          expect(result.interval).toBe("1d");
        } else {
          expect(result.granularity).toBe(expectedDefaults[timeframe]!.granularity);
          expect(result.interval).toBe(expectedDefaults[timeframe]!.interval);
        }
      },
    );
  });

  describe("DAILY fallback confirmation", () => {
    it("fires for TODAY with DAILY frequency", () => {
      const result = deriveGranularity("TODAY", "DAILY");
      expect(result.granularity).toBe("DAILY");
      expect(result.interval).toBe("1d");
    });

    it("fires for 1W with DAILY frequency", () => {
      const result = deriveGranularity("1W", "DAILY");
      expect(result.granularity).toBe("DAILY");
      expect(result.interval).toBe("1d");
    });

    it("does NOT fire for TODAY with INTRADAY frequency", () => {
      const result = deriveGranularity("TODAY", "INTRADAY");
      expect(result.granularity).toBe("FIFTEEN_MIN");
      expect(result.interval).toBe("15m");
    });

    it("does NOT fire for 1W with INTRADAY frequency", () => {
      const result = deriveGranularity("1W", "INTRADAY");
      expect(result.granularity).toBe("HOURLY");
      expect(result.interval).toBe("1h");
    });
  });

  describe("all results include from and to dates", () => {
    it.each(ALL_TIMEFRAMES)(
      "returns from < to for %s with INTRADAY",
      (timeframe) => {
        const result = deriveGranularity(timeframe, "INTRADAY");
        expect(result.from.getTime()).toBeLessThan(result.to.getTime());
      },
    );

    it.each(ALL_TIMEFRAMES)(
      "returns from < to for %s with DAILY",
      (timeframe) => {
        const result = deriveGranularity(timeframe, "DAILY");
        expect(result.from.getTime()).toBeLessThan(result.to.getTime());
      },
    );
  });

  describe("unrecognised timeframe", () => {
    it("throws a runtime error for an unknown timeframe", () => {
      expect(() =>
        deriveGranularity("INVALID" as Timeframe, "INTRADAY"),
      ).toThrow('Unknown timeframe: "INVALID"');
    });

    it("throws a runtime error for another unrecognised value", () => {
      expect(() =>
        deriveGranularity("2Y" as Timeframe, "DAILY"),
      ).toThrow('Unknown timeframe: "2Y"');
    });
  });
});


describe("computeMissingRanges", () => {
  const d = (ms: number) => new Date(ms);

  it("returns the full window as a single gap when covered is empty", () => {
    const result = computeMissingRanges([], d(100), d(500));
    expect(result).toEqual([{ from: d(100), to: d(500) }]);
  });

  it("returns [] when fully covered", () => {
    const result = computeMissingRanges(
      [{ from: d(100), to: d(500) }],
      d(100),
      d(500),
    );
    expect(result).toEqual([]);
  });

  it("returns a single interior gap", () => {
    // covered: [100,200] and [400,500], window [100,500] → gap [200,400]
    const result = computeMissingRanges(
      [
        { from: d(100), to: d(200) },
        { from: d(400), to: d(500) },
      ],
      d(100),
      d(500),
    );
    expect(result).toEqual([{ from: d(200), to: d(400) }]);
  });

  it("returns two gaps when covered has two non-adjacent ranges", () => {
    // window [0,1000], covered [200,300] and [600,800]
    // → gaps: [0,200], [300,600], [800,1000]
    // Actually that's 3 gaps. Let me use a window where covered leaves exactly 2 gaps:
    // window [0,1000], covered [0,300] and [600,800]
    // → gaps: [300,600], [800,1000]
    const result = computeMissingRanges(
      [
        { from: d(0), to: d(300) },
        { from: d(600), to: d(800) },
      ],
      d(0),
      d(1000),
    );
    expect(result).toEqual([
      { from: d(300), to: d(600) },
      { from: d(800), to: d(1000) },
    ]);
  });

  it("returns a gap at the start when covered only covers the end portion", () => {
    // window [0,1000], covered [500,1000] → gap [0,500]
    const result = computeMissingRanges(
      [{ from: d(500), to: d(1000) }],
      d(0),
      d(1000),
    );
    expect(result).toEqual([{ from: d(0), to: d(500) }]);
  });

  it("returns a gap at the end when covered only covers the start portion", () => {
    // window [0,1000], covered [0,600] → gap [600,1000]
    const result = computeMissingRanges(
      [{ from: d(0), to: d(600) }],
      d(0),
      d(1000),
    );
    expect(result).toEqual([{ from: d(600), to: d(1000) }]);
  });

  it("returns [] when two adjacent ranges fully cover the window", () => {
    // window [0,1000], covered [0,500] and [500,1000] → no gaps
    const result = computeMissingRanges(
      [
        { from: d(0), to: d(500) },
        { from: d(500), to: d(1000) },
      ],
      d(0),
      d(1000),
    );
    expect(result).toEqual([]);
  });

  it("returns [] when covered exactly matches the window boundaries", () => {
    const result = computeMissingRanges(
      [{ from: d(0), to: d(1000) }],
      d(0),
      d(1000),
    );
    expect(result).toEqual([]);
  });

  it("returns [] when from >= to (degenerate window)", () => {
    // from === to
    expect(computeMissingRanges([], d(500), d(500))).toEqual([]);
    // from > to
    expect(computeMissingRanges([], d(1000), d(500))).toEqual([]);
  });
});


describe("mergeSyncRange", () => {
  beforeEach(() => {
    mockFindMany.mockReset();
    mockDeleteMany.mockReset();
    mockCreate.mockReset();
    mockTransaction.mockReset();
    mockTransaction.mockResolvedValue(undefined);
  });

  it("inserts a single new record when no existing records overlap", async () => {
    // No existing sync ranges
    mockFindMany.mockResolvedValue([]);

    const from = new Date("2024-01-01T00:00:00Z");
    const to = new Date("2024-01-31T23:59:59Z");

    await mergeSyncRange(1, "DAILY", from, to);

    // $transaction should be called with just a create (no deleteMany since overlappingIds is empty)
    expect(mockTransaction).toHaveBeenCalledTimes(1);
    const transactionArg = mockTransaction.mock.calls[0]![0] as unknown[];
    // Only the create call (no deleteMany)
    expect(transactionArg).toHaveLength(1);
  });

  it("merges with an adjacent range (touching at boundary)", async () => {
    const existingFrom = new Date("2024-01-01T00:00:00Z");
    const existingTo = new Date("2024-01-15T00:00:00Z");

    // Existing record touches at the boundary of the new range
    mockFindMany.mockResolvedValue([
      { id: 10, from_timestamp: existingFrom, until_timestamp: existingTo },
    ]);

    const newFrom = new Date("2024-01-15T00:00:00Z");
    const newTo = new Date("2024-01-31T00:00:00Z");

    await mergeSyncRange(1, "DAILY", newFrom, newTo);

    expect(mockTransaction).toHaveBeenCalledTimes(1);
    const transactionArg = mockTransaction.mock.calls[0]![0] as unknown[];
    // deleteMany + create
    expect(transactionArg).toHaveLength(2);

    // Verify deleteMany was called with the overlapping record's ID
    expect(mockDeleteMany).toHaveBeenCalledWith({
      where: { id: { in: [10] } },
    });

    // Verify create uses the merged span (min from, max to)
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        asset_id: 1,
        granularity: "DAILY",
        from_timestamp: existingFrom, // min(newFrom, existingFrom) = existingFrom
        until_timestamp: newTo,       // max(newTo, existingTo) = newTo
      },
    });
  });

  it("merges with an overlapping range", async () => {
    const existingFrom = new Date("2024-01-10T00:00:00Z");
    const existingTo = new Date("2024-01-20T00:00:00Z");

    mockFindMany.mockResolvedValue([
      { id: 5, from_timestamp: existingFrom, until_timestamp: existingTo },
    ]);

    const newFrom = new Date("2024-01-15T00:00:00Z");
    const newTo = new Date("2024-01-25T00:00:00Z");

    await mergeSyncRange(1, "DAILY", newFrom, newTo);

    expect(mockTransaction).toHaveBeenCalledTimes(1);
    const transactionArg = mockTransaction.mock.calls[0]![0] as unknown[];
    expect(transactionArg).toHaveLength(2);

    expect(mockDeleteMany).toHaveBeenCalledWith({
      where: { id: { in: [5] } },
    });

    // Merged span: min(newFrom, existingFrom) = existingFrom, max(newTo, existingTo) = newTo
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        asset_id: 1,
        granularity: "DAILY",
        from_timestamp: existingFrom,
        until_timestamp: newTo,
      },
    });
  });

  it("produces the same span when the new range is fully inside an existing record", async () => {
    const existingFrom = new Date("2024-01-01T00:00:00Z");
    const existingTo = new Date("2024-01-31T00:00:00Z");

    mockFindMany.mockResolvedValue([
      { id: 7, from_timestamp: existingFrom, until_timestamp: existingTo },
    ]);

    // New range is entirely within the existing one
    const newFrom = new Date("2024-01-10T00:00:00Z");
    const newTo = new Date("2024-01-20T00:00:00Z");

    await mergeSyncRange(1, "DAILY", newFrom, newTo);

    expect(mockTransaction).toHaveBeenCalledTimes(1);

    // Even though it's a "no-op" in terms of span, the code still deletes and re-creates
    expect(mockDeleteMany).toHaveBeenCalledWith({
      where: { id: { in: [7] } },
    });

    // Merged span equals the existing record's span (unchanged)
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        asset_id: 1,
        granularity: "DAILY",
        from_timestamp: existingFrom,
        until_timestamp: existingTo,
      },
    });
  });
});
