# Implementation Plan: Portfolio Performance

## Overview

Implement the Portfolio Performance feature by building pure computation modules first (testable business logic), then API route handlers, and finally the frontend page with charts and table. Each step builds incrementally, and property-based tests validate correctness properties from the design.

## Tasks

- [x] 1. Create performance computation modules
  - [x] 1.1 Create `performanceCalculator.ts` with types and core functions
    - Create `apps/web/app/api/_lib/performance/performanceCalculator.ts`
    - Define types: `InvestmentInput`, `PriceInput`, `PositionResult`, `PortfolioSummaryResult`
    - Implement `computeCostBasis()` — average cost method with chronological BUY/SELL processing
    - Implement `computePortfolioPerformance()` — aggregates positions across all accounts, computes metrics, daily change, weights
    - Handle edge cases: zero invested (return 0%), missing price (exclude from totals), no previous price (null daily change)
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 1.6, 2.1, 2.4, 3.2, 3.3, 7.2, 10.1, 10.2, 10.3_

  - [ ]* 1.2 Write property tests for `performanceCalculator`
    - Create `apps/web/app/api/_lib/performance/performanceCalculator.property.test.ts`
    - **Property 1: Portfolio summary arithmetic consistency**
    - **Property 2: Cross-account position aggregation**
    - **Property 3: Daily change consistency**
    - **Property 5: Position weights sum to 100%**
    - **Property 9: Missing price exclusion from totals**
    - **Validates: Requirements 1.1, 1.2, 1.4, 1.5, 1.6, 2.1, 2.4, 3.3, 7.2**

  - [x] 1.3 Create `twrCalculator.ts` with TWR computation
    - Create `apps/web/app/api/_lib/performance/twrCalculator.ts`
    - Define type: `CashFlowEvent`
    - Implement `computeTWR()` — modified Dietz method with sub-periods between cash flow events
    - Handle edge cases: V_start = 0 (skip sub-period), no cash flows (simple return), single point
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 1.4 Write property tests for `twrCalculator`
    - Create `apps/web/app/api/_lib/performance/twrCalculator.property.test.ts`
    - **Property 8: TWR multiplicative formula**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

  - [x] 1.5 Create `historyCalculator.ts` with portfolio and asset history computation
    - Create `apps/web/app/api/_lib/performance/historyCalculator.ts`
    - Define types: `HistoryInput`, `HistoryPoint`
    - Implement `computePortfolioHistory()` — walks dates chronologically, applies BUY/SELL events, carry-forward pricing
    - Implement `computeAssetHistory()` — per-asset value series with cost basis at each date
    - Handle edge cases: date with no price (carry forward), BUY/SELL on a date (end-of-day position)
    - _Requirements: 4.2, 4.5, 4.6, 4.7, 5.1, 5.2_

  - [ ]* 1.6 Write property tests for `historyCalculator`
    - Create `apps/web/app/api/_lib/performance/historyCalculator.property.test.ts`
    - **Property 6: Portfolio history value correctness**
    - **Property 7: Price carry-forward in history**
    - **Validates: Requirements 4.2, 4.3, 4.6, 4.7**

  - [ ]* 1.7 Write property tests for cost basis (dedicated)
    - Create `apps/web/app/api/_lib/performance/costBasis.property.test.ts`
    - **Property 4: Cost basis with average cost method**
    - **Validates: Requirements 3.2, 10.1, 10.2**

- [x] 2. Checkpoint - Core computation modules
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Implement API route handlers
  - [x] 3.1 Create `GET /api/investments/performance` route
    - Create `apps/web/app/api/investments/performance/route.ts`
    - Fetch all COMPLETED investments, latest prices (current + previous day), and asset metadata from Prisma
    - Call `computePortfolioPerformance()` and `computeTWR()` with fetched data
    - Format response as `PerformanceResponse` with string-encoded decimals
    - Export `dynamic = "force-dynamic"` and `OPTIONS()` handler
    - Exclude PENDING/CANCELLED investments from queries
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 1.6, 2.1, 2.4, 6.1, 7.4, 8.1_

  - [x] 3.2 Create `GET /api/investments/performance/history` route
    - Create `apps/web/app/api/investments/performance/history/route.ts`
    - Validate `timeframe` query param with Zod schema (default "1Y"), default on invalid values
    - Fetch COMPLETED investments and daily AssetPrice data within timeframe range
    - Call `computePortfolioHistory()` with fetched data
    - Format response as `HistoryResponse` with string-encoded decimals
    - Export `dynamic = "force-dynamic"` and `OPTIONS()` handler
    - _Requirements: 4.2, 4.4, 4.5, 4.6, 4.7, 8.2, 8.4_

  - [x] 3.3 Create `GET /api/investments/performance/asset/[assetId]` route
    - Create `apps/web/app/api/investments/performance/asset/[assetId]/route.ts`
    - Validate `assetId` param (Zod: coerce number, int, positive) and `timeframe` query param
    - Return 400 for invalid assetId, 404 for non-existent asset
    - Fetch COMPLETED operations for asset, price series, and asset metadata
    - Call `computeAssetHistory()` and compute position summary
    - Return response with asset metadata, summary, series, operations array, and timeframe
    - Export `dynamic = "force-dynamic"` and `OPTIONS()` handler
    - _Requirements: 5.1, 5.2, 5.6, 5.7, 8.3, 8.5_

  - [ ]* 3.4 Write property tests for API validation (timeframe and assetId)
    - Create `apps/web/app/api/_lib/performance/performance-api.property.test.ts`
    - **Property 10: Invalid timeframe defaults to 1Y**
    - **Property 11: Invalid route parameters return HTTP 400**
    - **Validates: Requirements 8.4, 8.5**

- [x] 4. Checkpoint - API routes complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Build frontend page and components
  - [x] 5.1 Create performance page and layout integration
    - Create `apps/web/app/investments/performance/page.tsx` as async server component
    - Fetch initial performance data from `/api/investments/performance`
    - Pass data to `PerformanceView` client component
    - Update `apps/web/app/investments/layout.tsx` to add navigation tabs (Portfolio, Performance, Compare, Exposure)
    - Handle empty state: display message "No active positions. Buy some assets to track performance." when no positions
    - _Requirements: 1.3, 7.1, 9.1, 9.2_

  - [x] 5.2 Create `PerformanceSummaryCards` component
    - Create `apps/web/components/performance/PerformanceSummaryCards.tsx`
    - Display 6 metric cards: total invested, total current value, total P&L (€), total P&L (%), TWR, daily change badge
    - Format daily change as "+€X.XX (+Y.YY%) today" with green/red coloring
    - Show "—" when daily change is null (no previous data)
    - _Requirements: 1.3, 2.2, 2.3_

  - [x] 5.3 Create `TimeframeSelector` component
    - Create `apps/web/components/performance/TimeframeSelector.tsx`
    - Render toggle buttons for 1M, 3M, 6M, 1Y, YTD, ALL
    - Accept `value` and `onChange` props
    - Default selection: 1Y
    - _Requirements: 4.4, 5.5_

  - [x] 5.4 Create `PortfolioValueChart` component
    - Create `apps/web/components/performance/PortfolioValueChart.tsx`
    - Fetch data from `/api/investments/performance/history?timeframe=X` based on selected timeframe
    - Render ECharts area chart showing portfolio value over time
    - Overlay dashed "total invested" reference line
    - Include `TimeframeSelector` above the chart
    - _Requirements: 4.1, 4.3, 4.4_

  - [x] 5.5 Create `PositionsTable` component
    - Create `apps/web/components/performance/PositionsTable.tsx`
    - Use `DataTable` (TanStack Table) with columns: asset name, ticker, type, units, avg cost, current price, current value, P&L (€), P&L (%), weight, daily change
    - Default sort by current value descending
    - Enable sorting on all columns
    - Color positive returns green, negative red
    - Show stale price indicator (warning icon + timestamp) when `price_updated_at` > 24h old
    - Show "Price unavailable" for positions without price data
    - Make rows expandable to show `AssetPerformanceDetail`
    - _Requirements: 3.1, 3.4, 3.5, 3.6, 7.2, 7.3_

  - [x] 5.6 Create `AssetPerformanceDetail` component (expandable row)
    - Create `apps/web/components/performance/AssetPerformanceDetail.tsx`
    - Fetch data from `/api/investments/performance/asset/:assetId?timeframe=X` on expand
    - Display per-asset summary stats: units held, avg cost, current price, P&L (€ and %), daily change
    - Render `AssetValueChart` below the stats
    - Display operations mini-table (date, type, units, amount)
    - _Requirements: 5.1, 5.6, 5.7_

  - [x] 5.7 Create `AssetValueChart` component
    - Create `apps/web/components/performance/AssetValueChart.tsx`
    - Render ECharts area chart showing position value over time
    - Overlay cost basis line
    - Shade area green where value > cost, red where cost > value
    - Display BUY/SELL markers on the timeline at operation dates
    - Include `TimeframeSelector` for the per-asset chart
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 5.8 Create `PerformanceView` orchestrator component
    - Create `apps/web/components/performance/PerformanceView.tsx` as client component
    - Compose: `PerformanceSummaryCards` → `PortfolioValueChart` → `PositionsTable`
    - Pass initial server-fetched data as props
    - Manage timeframe state shared between chart components
    - _Requirements: 1.3, 3.1, 4.1_

- [x] 6. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design (11 properties across 5 test files)
- Unit tests validate specific examples and edge cases
- The computation modules are pure functions (no DB dependency) enabling fast property-based testing with fast-check
- All API routes follow existing project patterns: `force-dynamic`, Zod validation, `OPTIONS()` export
- Frontend components follow project conventions: PascalCase, `'use client'` directive, DataTable pattern

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.3"] },
    { "id": 1, "tasks": ["1.2", "1.4", "1.5", "1.7"] },
    { "id": 2, "tasks": ["1.6", "3.1", "3.2"] },
    { "id": 3, "tasks": ["3.3", "3.4"] },
    { "id": 4, "tasks": ["5.1", "5.2", "5.3"] },
    { "id": 5, "tasks": ["5.4", "5.5"] },
    { "id": 6, "tasks": ["5.6", "5.7", "5.8"] }
  ]
}
```
