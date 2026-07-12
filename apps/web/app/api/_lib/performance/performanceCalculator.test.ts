import { describe, expect, it } from "vitest";
import {
  computeCostBasis,
  computePortfolioPerformance,
  type InvestmentInput,
  type PriceInput,
} from "./performanceCalculator";

describe("computeCostBasis", () => {
  it("computes cost basis for BUY-only operations", () => {
    const operations: InvestmentInput[] = [
      { asset_id: 1, type: "BUY", units: 10, total_amount: 1000, executed_at: new Date("2024-01-01") },
      { asset_id: 1, type: "BUY", units: 5, total_amount: 600, executed_at: new Date("2024-02-01") },
    ];

    const result = computeCostBasis(operations);

    expect(result.totalUnits).toBe(15);
    expect(result.costBasis).toBe(1600);
    expect(result.avgCost).toBeCloseTo(1600 / 15, 10);
  });

  it("reduces cost basis on SELL using average cost method", () => {
    const operations: InvestmentInput[] = [
      { asset_id: 1, type: "BUY", units: 10, total_amount: 1000, executed_at: new Date("2024-01-01") },
      { asset_id: 1, type: "BUY", units: 10, total_amount: 1200, executed_at: new Date("2024-02-01") },
      { asset_id: 1, type: "SELL", units: 5, total_amount: 700, executed_at: new Date("2024-03-01") },
    ];

    const result = computeCostBasis(operations);

    // After 2 BUYs: 20 units, 2200 cost basis, avg cost = 110
    // SELL 5: cost reduction = 5 × 110 = 550
    // After SELL: 15 units, 1650 cost basis, avg cost = 110
    expect(result.totalUnits).toBe(15);
    expect(result.costBasis).toBeCloseTo(1650, 10);
    expect(result.avgCost).toBeCloseTo(110, 10);
  });

  it("returns zeros for empty operations", () => {
    const result = computeCostBasis([]);

    expect(result.totalUnits).toBe(0);
    expect(result.costBasis).toBe(0);
    expect(result.avgCost).toBe(0);
  });

  it("processes operations in chronological order regardless of input order", () => {
    const operations: InvestmentInput[] = [
      { asset_id: 1, type: "SELL", units: 5, total_amount: 600, executed_at: new Date("2024-03-01") },
      { asset_id: 1, type: "BUY", units: 10, total_amount: 1000, executed_at: new Date("2024-01-01") },
    ];

    const result = computeCostBasis(operations);

    // BUY 10 @ 1000 → avg = 100, then SELL 5 → cost reduction = 500
    expect(result.totalUnits).toBe(5);
    expect(result.costBasis).toBeCloseTo(500, 10);
    expect(result.avgCost).toBeCloseTo(100, 10);
  });
});

describe("computePortfolioPerformance", () => {
  it("computes basic portfolio metrics with a single position", () => {
    const investments: InvestmentInput[] = [
      { asset_id: 1, type: "BUY", units: 10, total_amount: 1000, executed_at: new Date("2024-01-01") },
    ];
    const currentPrices = new Map<number, PriceInput>([
      [1, { asset_id: 1, price: 120, timestamp: new Date("2024-06-01") }],
    ]);
    const previousPrices = new Map<number, PriceInput>([
      [1, { asset_id: 1, price: 115, timestamp: new Date("2024-05-31") }],
    ]);

    const result = computePortfolioPerformance(investments, currentPrices, previousPrices);

    expect(result.total_invested).toBe(1000);
    expect(result.total_current_value).toBe(1200); // 10 × 120
    expect(result.total_pnl).toBe(200);
    expect(result.total_pnl_pct).toBe(20); // 200/1000 × 100
    expect(result.daily_change).toBe(50); // 1200 - 1150
    expect(result.previous_value).toBe(1150); // 10 × 115
    expect(result.positions).toHaveLength(1);
    expect(result.positions[0]!.weight).toBe(100);
  });

  it("aggregates positions across multiple accounts (same asset)", () => {
    const investments: InvestmentInput[] = [
      { asset_id: 1, type: "BUY", units: 10, total_amount: 1000, executed_at: new Date("2024-01-01") },
      { asset_id: 1, type: "BUY", units: 5, total_amount: 500, executed_at: new Date("2024-02-01") },
    ];
    const currentPrices = new Map<number, PriceInput>([
      [1, { asset_id: 1, price: 110, timestamp: new Date("2024-06-01") }],
    ]);
    const previousPrices = new Map<number, PriceInput>();

    const result = computePortfolioPerformance(investments, currentPrices, previousPrices);

    // Single position with 15 units, cost basis 1500
    expect(result.positions).toHaveLength(1);
    expect(result.positions[0]!.total_units).toBe(15);
    expect(result.positions[0]!.total_invested).toBe(1500);
    expect(result.positions[0]!.current_value).toBe(1650); // 15 × 110
  });

  it("excludes positions with missing current price from value totals", () => {
    const investments: InvestmentInput[] = [
      { asset_id: 1, type: "BUY", units: 10, total_amount: 1000, executed_at: new Date("2024-01-01") },
      { asset_id: 2, type: "BUY", units: 5, total_amount: 500, executed_at: new Date("2024-01-01") },
    ];
    // Only asset 1 has a price
    const currentPrices = new Map<number, PriceInput>([
      [1, { asset_id: 1, price: 120, timestamp: new Date("2024-06-01") }],
    ]);
    const previousPrices = new Map<number, PriceInput>();

    const result = computePortfolioPerformance(investments, currentPrices, previousPrices);

    // total_current_value should only include asset 1
    expect(result.total_current_value).toBe(1200); // 10 × 120
    // total_invested includes both (cost basis is tracked even without price)
    expect(result.total_invested).toBe(1500);
    // Position with missing price has zeroed metrics
    const missingPricePos = result.positions.find((p) => p.asset_id === 2);
    expect(missingPricePos!.current_price).toBe(0);
    expect(missingPricePos!.current_value).toBe(0);
    expect(missingPricePos!.weight).toBe(0);
  });

  it("returns 0% pnl when total invested is zero", () => {
    const result = computePortfolioPerformance([], new Map(), new Map());

    expect(result.total_invested).toBe(0);
    expect(result.total_current_value).toBe(0);
    expect(result.total_pnl).toBe(0);
    expect(result.total_pnl_pct).toBe(0);
    expect(result.positions).toHaveLength(0);
  });

  it("sets daily change to 0 when no previous price is available", () => {
    const investments: InvestmentInput[] = [
      { asset_id: 1, type: "BUY", units: 10, total_amount: 1000, executed_at: new Date("2024-01-01") },
    ];
    const currentPrices = new Map<number, PriceInput>([
      [1, { asset_id: 1, price: 120, timestamp: new Date("2024-06-01") }],
    ]);
    const previousPrices = new Map<number, PriceInput>(); // no previous

    const result = computePortfolioPerformance(investments, currentPrices, previousPrices);

    expect(result.positions[0]!.daily_change).toBe(0);
    expect(result.positions[0]!.daily_change_pct).toBe(0);
    // Portfolio daily change should also be 0
    expect(result.daily_change).toBe(0);
  });

  it("computes correct weights for multiple positions", () => {
    const investments: InvestmentInput[] = [
      { asset_id: 1, type: "BUY", units: 10, total_amount: 1000, executed_at: new Date("2024-01-01") },
      { asset_id: 2, type: "BUY", units: 20, total_amount: 2000, executed_at: new Date("2024-01-01") },
    ];
    const currentPrices = new Map<number, PriceInput>([
      [1, { asset_id: 1, price: 100, timestamp: new Date("2024-06-01") }],
      [2, { asset_id: 2, price: 150, timestamp: new Date("2024-06-01") }],
    ]);
    const previousPrices = new Map<number, PriceInput>();

    const result = computePortfolioPerformance(investments, currentPrices, previousPrices);

    // Asset 1: 10 × 100 = 1000, Asset 2: 20 × 150 = 3000, Total = 4000
    const pos1 = result.positions.find((p) => p.asset_id === 1)!;
    const pos2 = result.positions.find((p) => p.asset_id === 2)!;
    expect(pos1.weight).toBeCloseTo(25, 10); // 1000/4000 × 100
    expect(pos2.weight).toBeCloseTo(75, 10); // 3000/4000 × 100
    // Weights should sum to 100
    expect(pos1.weight + pos2.weight).toBeCloseTo(100, 10);
  });
});
