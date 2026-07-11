import { describe, it, expect } from "vitest";
import { carryForwardGaps } from "./carryForwardGaps";

describe("carryForwardGaps", () => {
  it("should return empty map for empty input", () => {
    const result = carryForwardGaps(new Map());
    expect(result.size).toBe(0);
  });

  it("should return series unchanged when all series share the same timestamps", () => {
    const input = new Map<number, { timestamp: string; value: number }[]>([
      [1, [
        { timestamp: "2024-01-01T00:00:00Z", value: 0 },
        { timestamp: "2024-01-02T00:00:00Z", value: 5.5 },
      ]],
      [2, [
        { timestamp: "2024-01-01T00:00:00Z", value: 0 },
        { timestamp: "2024-01-02T00:00:00Z", value: -2.3 },
      ]],
    ]);

    const result = carryForwardGaps(input);

    expect(result.get(1)).toEqual([
      { timestamp: "2024-01-01T00:00:00Z", value: 0 },
      { timestamp: "2024-01-02T00:00:00Z", value: 5.5 },
    ]);
    expect(result.get(2)).toEqual([
      { timestamp: "2024-01-01T00:00:00Z", value: 0 },
      { timestamp: "2024-01-02T00:00:00Z", value: -2.3 },
    ]);
  });

  it("should fill missing timestamps with last known value (carry forward)", () => {
    const input = new Map<number, { timestamp: string; value: number }[]>([
      [1, [
        { timestamp: "2024-01-01T00:00:00Z", value: 0 },
        { timestamp: "2024-01-02T00:00:00Z", value: 3.0 },
        { timestamp: "2024-01-03T00:00:00Z", value: 4.5 },
      ]],
      [2, [
        { timestamp: "2024-01-01T00:00:00Z", value: 0 },
        // Missing 2024-01-02
        { timestamp: "2024-01-03T00:00:00Z", value: 2.1 },
      ]],
    ]);

    const result = carryForwardGaps(input);

    // Series 1 is unchanged (already has all timestamps)
    expect(result.get(1)).toEqual([
      { timestamp: "2024-01-01T00:00:00Z", value: 0 },
      { timestamp: "2024-01-02T00:00:00Z", value: 3.0 },
      { timestamp: "2024-01-03T00:00:00Z", value: 4.5 },
    ]);

    // Series 2 carries forward 0 for missing 2024-01-02
    expect(result.get(2)).toEqual([
      { timestamp: "2024-01-01T00:00:00Z", value: 0 },
      { timestamp: "2024-01-02T00:00:00Z", value: 0 },  // carried forward from Jan 1
      { timestamp: "2024-01-03T00:00:00Z", value: 2.1 },
    ]);
  });

  it("should use first value for gaps at the start of a series", () => {
    const input = new Map<number, { timestamp: string; value: number }[]>([
      [1, [
        { timestamp: "2024-01-01T00:00:00Z", value: 0 },
        { timestamp: "2024-01-02T00:00:00Z", value: 1.5 },
        { timestamp: "2024-01-03T00:00:00Z", value: 3.0 },
      ]],
      [2, [
        // Missing Jan 1 — series starts on Jan 2
        { timestamp: "2024-01-02T00:00:00Z", value: 0 },
        { timestamp: "2024-01-03T00:00:00Z", value: 1.0 },
      ]],
    ]);

    const result = carryForwardGaps(input);

    // Series 2: gap at start, should use first value (0)
    expect(result.get(2)).toEqual([
      { timestamp: "2024-01-01T00:00:00Z", value: 0 },  // first value of series 2
      { timestamp: "2024-01-02T00:00:00Z", value: 0 },
      { timestamp: "2024-01-03T00:00:00Z", value: 1.0 },
    ]);
  });

  it("should handle an empty series by filling with 0", () => {
    const input = new Map<number, { timestamp: string; value: number }[]>([
      [1, [
        { timestamp: "2024-01-01T00:00:00Z", value: 0 },
        { timestamp: "2024-01-02T00:00:00Z", value: 2.0 },
      ]],
      [2, []],  // empty series
    ]);

    const result = carryForwardGaps(input);

    // Series 2 should have all timestamps filled with 0
    expect(result.get(2)).toEqual([
      { timestamp: "2024-01-01T00:00:00Z", value: 0 },
      { timestamp: "2024-01-02T00:00:00Z", value: 0 },
    ]);
  });

  it("should handle a single series (no gap filling needed)", () => {
    const input = new Map<number, { timestamp: string; value: number }[]>([
      [42, [
        { timestamp: "2024-06-01T00:00:00Z", value: 0 },
        { timestamp: "2024-06-02T00:00:00Z", value: 1.23 },
        { timestamp: "2024-06-03T00:00:00Z", value: -0.5 },
      ]],
    ]);

    const result = carryForwardGaps(input);

    expect(result.get(42)).toEqual([
      { timestamp: "2024-06-01T00:00:00Z", value: 0 },
      { timestamp: "2024-06-02T00:00:00Z", value: 1.23 },
      { timestamp: "2024-06-03T00:00:00Z", value: -0.5 },
    ]);
  });

  it("should handle multiple gaps across multiple series", () => {
    const input = new Map<number, { timestamp: string; value: number }[]>([
      [1, [
        { timestamp: "2024-01-01T00:00:00Z", value: 0 },
        { timestamp: "2024-01-03T00:00:00Z", value: 5.0 },
      ]],
      [2, [
        { timestamp: "2024-01-02T00:00:00Z", value: 0 },
        { timestamp: "2024-01-04T00:00:00Z", value: 3.0 },
      ]],
    ]);

    const result = carryForwardGaps(input);

    // Union timestamps: Jan 1, Jan 2, Jan 3, Jan 4
    expect(result.get(1)).toEqual([
      { timestamp: "2024-01-01T00:00:00Z", value: 0 },
      { timestamp: "2024-01-02T00:00:00Z", value: 0 },    // carry forward from Jan 1
      { timestamp: "2024-01-03T00:00:00Z", value: 5.0 },
      { timestamp: "2024-01-04T00:00:00Z", value: 5.0 },  // carry forward from Jan 3
    ]);

    expect(result.get(2)).toEqual([
      { timestamp: "2024-01-01T00:00:00Z", value: 0 },    // first value (gap at start)
      { timestamp: "2024-01-02T00:00:00Z", value: 0 },
      { timestamp: "2024-01-03T00:00:00Z", value: 0 },    // carry forward from Jan 2
      { timestamp: "2024-01-04T00:00:00Z", value: 3.0 },
    ]);
  });

  it("should ensure all output series have the same length", () => {
    const input = new Map<number, { timestamp: string; value: number }[]>([
      [1, [
        { timestamp: "2024-01-01T00:00:00Z", value: 0 },
        { timestamp: "2024-01-02T00:00:00Z", value: 1.0 },
      ]],
      [2, [
        { timestamp: "2024-01-02T00:00:00Z", value: 0 },
        { timestamp: "2024-01-03T00:00:00Z", value: 2.0 },
        { timestamp: "2024-01-04T00:00:00Z", value: 4.0 },
      ]],
      [3, [
        { timestamp: "2024-01-01T00:00:00Z", value: 0 },
        { timestamp: "2024-01-04T00:00:00Z", value: -1.0 },
      ]],
    ]);

    const result = carryForwardGaps(input);

    // All series should have 4 timestamps (union of all unique timestamps)
    const lengths = Array.from(result.values()).map((s) => s.length);
    expect(lengths).toEqual([4, 4, 4]);

    // All series should share the exact same timestamps
    const timestamps1 = result.get(1)!.map((dp) => dp.timestamp);
    const timestamps2 = result.get(2)!.map((dp) => dp.timestamp);
    const timestamps3 = result.get(3)!.map((dp) => dp.timestamp);
    expect(timestamps1).toEqual(timestamps2);
    expect(timestamps2).toEqual(timestamps3);
  });
});
