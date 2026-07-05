# Implementation Plan: Contribution History

## Overview

Overlay BUY/SELL transaction markers on the existing asset price chart. Implementation proceeds in waves: pure utility functions first (groupMarkers, findNearestPrice), then the API endpoint, followed by UI components (ContributionToggle, PriceChart enhancement, FinancialProductsView wiring). Property tests validate the pure logic at each wave boundary.

## Tasks

- [x] 1. Implement pure utility functions
  - [x] 1.1 Create `apps/web/lib/groupMarkers.ts`
    - Export types: `ContributionMarker`, `PricePoint`, `SingleMarker`, `MarkerGroup`, `MarkerOrGroup`
    - Implement `findNearestPrice(timestamp: string, priceData: PricePoint[]): number` using binary search on sorted priceData
    - Implement `groupMarkers(markers: ContributionMarker[], priceData: PricePoint[], chartWidth: number, threshold?: number): MarkerOrGroup[]` with the greedy pixel-proximity algorithm described in the design
    - Handle edge cases: empty markers, empty priceData, chartWidth <= 0 → return `[]`
    - _Requirements: 2.2, 2.4, 5.1, 5.2, 5.3, 5.4_

  - [ ]* 1.2 Write property test for findNearestPrice
    - Create `apps/web/lib/groupMarkers.property.test.ts`
    - **Property 5: Nearest price lookup returns the closest price point**
    - Generate sorted PricePoint arrays and arbitrary target timestamps; assert returned price is the one with minimum absolute time distance
    - **Validates: Requirements 2.2, 2.4**

  - [ ]* 1.3 Write property test for groupMarkers threshold invariant
    - **Property 9: Grouping ensures no two ungrouped markers are within threshold**
    - Generate random ContributionMarker sets, priceData, chartWidth, threshold; assert no two `kind: "single"` results have pixel positions within threshold, and every `MarkerGroup` has `count >= 2` and `count === markers.length`
    - **Validates: Requirements 5.1, 5.2**

- [x] 2. Implement Contribution API endpoint
  - [x] 2.1 Create `apps/web/app/api/financial-products/assets/[assetId]/investments/route.ts`
    - Add `export const dynamic = "force-dynamic"`
    - Define Zod schema: `assetId` as coerced positive int, `timeframe` as enum of valid values
    - Extract `assetId` from route params, `timeframe` from query string
    - Validate with Zod — ZodError → 400 with `{ error, details }`
    - Lookup asset by ID — not found → 404 with `{ error: "Asset not found" }`
    - Call `resolveTimeframeDates(timeframe)` from `priceSyncAlgorithm.ts` to get `{ from, to }`
    - Query `Investment` table: `WHERE asset_id = :assetId AND status = 'COMPLETED' AND processed_at >= :from AND processed_at <= :to`, ordered by `processed_at ASC`
    - Map rows to `ContributionMarker` shape (id, type, units, unit_price, total_amount, description, processed_at as ISO string)
    - Return `{ data: ContributionMarker[] }` with status 200
    - Export `OPTIONS()` handler returning 405 with `Allow: GET, OPTIONS`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 2.2 Write property tests for API filtering and validation
    - Create `apps/web/app/api/financial-products/assets/[assetId]/investments/investments.property.test.ts`
    - **Property 1: API returns only COMPLETED investments within timeframe**
    - **Property 2: API validation rejects all invalid parameter combinations**
    - **Property 3: API response contains all required fields for every item**
    - **Property 4: API response is ordered by processed_at ascending**
    - Mock Prisma and test the filtering/mapping/ordering logic with generated investment sets
    - **Validates: Requirements 1.1, 1.3, 1.4, 1.5**

- [x] 3. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement UI components
  - [x] 4.1 Create `apps/web/components/financial-products/ContributionToggle.tsx`
    - Accept props: `checked: boolean`, `onChange: (checked: boolean) => void`
    - Render a labeled checkbox indicating marker visibility
    - Use `'use client'` directive
    - _Requirements: 3.1, 3.4_

  - [x] 4.2 Enhance `apps/web/components/financial-products/PriceChart.tsx`
    - Add new props: `contributions?: ContributionMarker[]`, `showMarkers?: boolean`
    - Import `groupMarkers` and `findNearestPrice` from `@/lib/groupMarkers`
    - In the ECharts useEffect, when priceData + contributions are available and showMarkers is true:
      - Call `groupMarkers(contributions, priceData, chartRef.current.clientWidth)`
      - Build BUY scatter series (green upward triangle, `symbol: 'triangle'`, `symbolRotate: 0`)
      - Build SELL scatter series (red downward triangle, `symbol: 'triangle'`, `symbolRotate: 180`)
      - Build GROUP scatter series (gray circle, `symbolSize` scaled by count)
      - Configure per-series tooltip formatters (single marker: type, units, unit_price, total_amount, date, description; group: count, combined total, BUY/SELL breakdown)
    - Handle unrecognized investment type by rendering with neutral marker style
    - On window resize, recalculate grouping with new `clientWidth`
    - When showMarkers is false or contributions is empty, omit scatter series
    - When priceData is null/empty, do not render any markers
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.2, 3.3, 4.1, 4.2, 4.3, 5.4, 6.3, 6.4_

  - [x] 4.3 Enhance `apps/web/components/financial-products/FinancialProductsView.tsx`
    - Add state: `contributions: ContributionMarker[] | null`, `showMarkers: boolean` (default `true`)
    - Add useEffect: when `selectedAsset` or `timeframe` changes, fetch `GET /api/financial-products/assets/${selectedAsset.id}/investments?timeframe=${timeframe}`
    - On success: set `contributions` to the response data array
    - On failure: set `contributions` to `null` (silent degradation)
    - Pass `contributions` and `showMarkers` as props to `<PriceChart>`
    - Render `<ContributionToggle>` only when `contributions` is non-null and has items
    - _Requirements: 2.5, 3.1, 3.4, 6.1, 6.2_

  - [ ]* 4.4 Write property test for marker visibility toggle
    - **Property 6: Marker visibility matches showMarkers flag**
    - Generate non-empty contribution data and boolean flag; assert scatter series presence matches the flag
    - **Validates: Requirements 3.2, 3.3**

  - [ ]* 4.5 Write property test for single marker tooltip
    - **Property 7: Single marker tooltip contains all required details**
    - Generate valid ContributionMarker instances; assert tooltip output contains type, units, unit_price, total_amount, processed_at, and description when present
    - **Validates: Requirements 4.1, 4.3**

  - [ ]* 4.6 Write property test for group marker tooltip
    - **Property 8: Group marker tooltip contains aggregated details**
    - Generate MarkerGroup instances with 2+ markers; assert tooltip output contains count, combined total, and BUY/SELL breakdown
    - **Validates: Requirements 4.2**

- [x] 5. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Use `fast-check` for property-based tests (already used in the project)
- The `resolveTimeframeDates()` function from `priceSyncAlgorithm.ts` is reused for the new API endpoint
- Follow the existing prices route pattern for Zod validation, error handling, and OPTIONS export
- `ContributionToggle` is intentionally minimal — just a labeled checkbox
- Tooltip formatters are defined inside the PriceChart ECharts configuration (not separate components)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "2.1"] },
    { "id": 2, "tasks": ["2.2"] },
    { "id": 3, "tasks": ["4.1", "4.2", "4.3"] },
    { "id": 4, "tasks": ["4.4", "4.5", "4.6"] }
  ]
}
```
