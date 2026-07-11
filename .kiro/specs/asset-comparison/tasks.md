# Implementation Plan: Asset Comparison

## Overview

Implement a multi-asset percentage performance comparison feature. Users select 2–5 tracked assets, choose a timeframe (preset or custom date range), and view normalized percentage returns on a shared ECharts line chart. The implementation reuses existing price sync infrastructure and extends the TimeframeSelector with custom date range support across both the new comparison page and the existing Portfolio page.

## Tasks

- [x] 1. Implement core comparison utility functions
  - [x] 1.1 Create `customRangeGranularity` function
    - Create `apps/web/app/api/_lib/financialProducts/customRangeGranularity.ts`
    - Implement the span-based granularity derivation: ≤7 days → HOURLY/"1h", ≤31 days → DAILY/"1d", ≤365 days → DAILY/"1d", >365 days → WEEKLY/"1wk"
    - Apply the existing DAILY fallback for assets with price_frequency "DAILY" when derived granularity is sub-daily
    - Export the `customRangeGranularity(startDate, endDate, priceFrequency)` function
    - _Requirements: 7.5_

  - [x] 1.2 Create `normalizeSeries` function
    - Create `apps/web/app/api/_lib/financialProducts/normalizeSeries.ts`
    - Implement formula: `round(((price / firstPrice) - 1) * 100, 2)` for each data point
    - First value in the output must always be exactly `0.00`
    - Accept `prices: { timestamp: Date; price: number }[]` and `firstPrice: number`
    - Return `{ timestamp: string; value: number }[]` with ISO 8601 timestamps
    - _Requirements: 5.1, 5.2_

  - [x] 1.3 Create `carryForwardGaps` function
    - Create `apps/web/app/api/_lib/financialProducts/carryForwardGaps.ts`
    - Compute the union of all timestamps across all series
    - For each series, fill missing timestamps with the last known normalized value
    - Accept `Map<number, { timestamp: string; value: number }[]>` and return the same type with gaps filled
    - _Requirements: 5.4, 6.5_

  - [x] 1.4 Write property test for `customRangeGranularity`
    - **Property 11: Custom range granularity derivation**
    - **Validates: Requirements 7.5**

  - [x] 1.5 Write property test for `normalizeSeries`
    - **Property 8: Normalization formula correctness**
    - **Validates: Requirements 5.1, 5.2**

  - [x] 1.6 Write property test for `carryForwardGaps`
    - **Property 9: Carry-forward for missing data points**
    - **Validates: Requirements 5.4, 6.5**

- [x] 2. Implement the ComparisonService orchestration
  - [x] 2.1 Create `compareAssets` service function
    - Create `apps/web/app/api/_lib/financialProducts/compareAssets.ts`
    - Validate input: 2–5 unique asset IDs, valid timeframe or custom date range
    - Resolve date window (preset via `resolveTimeframeDates` or custom dates directly)
    - Derive granularity per asset via `deriveGranularity` or `customRangeGranularity`
    - Invoke `syncPrices` for all assets in parallel with `Promise.allSettled`
    - Abort with failed asset details if any sync fails
    - Query `asset_prices` for each asset within the window and granularity
    - Compute effective common start date (max of each asset's first timestamp)
    - Validate minimum 2 data points per asset after common start
    - Validate firstPrice is not zero/null
    - Normalize each series, apply carry-forward, return structured response
    - Define the `COMPARISON_COLORS` palette array
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 2.1, 2.2, 2.3, 2.7, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 5.5, 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 2.2 Write property test for asset count validation
    - **Property 1: Asset count validation bounds**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**

  - [x] 2.3 Write property test for duplicate asset prevention
    - **Property 2: Duplicate asset prevention**
    - **Validates: Requirements 1.5**

  - [x] 2.4 Write property test for custom date range validation
    - **Property 4: Custom date range validation**
    - **Validates: Requirements 2.7, 2.8**

  - [x] 2.5 Write property test for effective common start date computation
    - **Property 5: Effective common start date computation**
    - **Validates: Requirements 3.1, 3.2**

  - [x] 2.6 Write property test for insufficient data detection
    - **Property 6: Insufficient data detection**
    - **Validates: Requirements 3.4, 3.5, 4.4**

  - [x] 2.7 Write property test for sync failure identification
    - **Property 7: Sync failure identification**
    - **Validates: Requirements 4.2, 4.3**

  - [x] 2.8 Write property test for distinct color assignment
    - **Property 10: Distinct color assignment**
    - **Validates: Requirements 6.2**

  - [x] 2.9 Write property test for independent per-asset granularity
    - **Property 12: Independent per-asset granularity**
    - **Validates: Requirements 7.4**

- [x] 3. Checkpoint - Core logic verification
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement the API route
  - [x] 4.1 Create `GET /api/financial-products/compare` route
    - Create `apps/web/app/api/financial-products/compare/route.ts`
    - Define Zod query schema with `assetIds`, `timeframe`, `startDate`, `endDate` and refinement validations
    - Parse and validate query parameters (400 on Zod error)
    - Load assets from DB, return 404 if any not found
    - Call `compareAssets` service and map results to the response shape
    - Handle all error scenarios: 400, 404, 422, 502, 500
    - Export `dynamic = "force-dynamic"` and `OPTIONS()` handler
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 2.1, 2.4, 2.7, 2.8, 3.4, 3.5, 4.2, 4.3, 4.4, 5.5_

  - [x] 4.2 Write property test for invalid timeframe rejection
    - **Property 3: Invalid timeframe rejection**
    - **Validates: Requirements 2.4**

- [x] 5. Extend TimeframeSelector with custom date range
  - [x] 5.1 Extend `TimeframeSelector` component with custom date range picker
    - Modify `apps/web/components/financial-products/TimeframeSelector.tsx`
    - Add a "Custom" button that reveals start date and end date inputs
    - When custom is active, deactivate all preset buttons visually
    - Selecting a preset clears the custom range and hides the picker
    - Validate start date is before end date before emitting onChange
    - Update the component props to support both preset timeframes and custom date range callback
    - _Requirements: 2.5, 2.6, 2.8, 2.9_

  - [x] 5.2 Integrate custom date range into existing `FinancialProductsView`
    - Modify `apps/web/components/financial-products/FinancialProductsView.tsx`
    - Pass the custom date range handler to the updated `TimeframeSelector`
    - When custom range is selected, fetch prices using startDate/endDate instead of preset timeframe
    - _Requirements: 2.10_

- [x] 6. Checkpoint - API and TimeframeSelector verification
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement comparison page UI
  - [x] 7.1 Create `AssetSelector` component
    - Create `apps/web/components/financial-products/AssetSelector.tsx`
    - Reuse the existing `AssetSearch` component pattern for asset lookup
    - Allow selecting 2–5 assets, display selected assets with remove buttons
    - Prevent adding duplicates, show min/max messaging
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 7.2 Create `ComparisonChart` component
    - Create `apps/web/components/financial-products/ComparisonChart.tsx`
    - Render ECharts multi-line chart with shared percentage y-axis and time x-axis
    - Use `COMPARISON_COLORS` palette for 2–5 lines with distinct colors
    - Display legend with asset name + period return (last normalized value, formatted as `X.XX%`)
    - Handle loading state and responsive resize
    - _Requirements: 6.1, 6.2, 6.3, 6.5, 6.6_

  - [x] 7.3 Create comparison page at `/investments/compare`
    - Create `apps/web/app/investments/compare/page.tsx`
    - Server component shell that renders the client comparison view
    - Wire `AssetSelector`, `TimeframeSelector` (with custom support), and `ComparisonChart`
    - Fetch comparison data from `/api/financial-products/compare` when assets and timeframe are set
    - Default timeframe to "1Y"
    - Display user-friendly error messages on API errors with retry option
    - _Requirements: 2.1, 6.1, 6.4, 6.6_

- [x] 8. Final checkpoint - Full integration verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document using `fast-check`
- The implementation reuses existing infrastructure: `syncPrices`, `deriveGranularity`, `resolveTimeframeDates`, `TIMEFRAME_CONFIG`
- No new database tables or migrations are needed — all data is derived from existing `asset_prices` table
- All property test files should follow the existing pattern: `*.property.test.ts` in `apps/web/app/api/_lib/financialProducts/`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["1.4", "1.5", "1.6", "2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "2.5", "2.6", "2.7", "2.8", "2.9", "4.1"] },
    { "id": 3, "tasks": ["4.2", "5.1"] },
    { "id": 4, "tasks": ["5.2", "7.1", "7.2"] },
    { "id": 5, "tasks": ["7.3"] }
  ]
}
```
