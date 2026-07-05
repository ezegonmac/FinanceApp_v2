# Implementation Plan: Financial Product Data

## Overview

Implement the `/financial-products` page end-to-end: Prisma schema additions, the price sync algorithm, five API routes, and the four client components that make up the search-track-chart workflow. Tasks proceed in dependency order — data models first, then server logic, then API routes, then UI.

## Tasks

- [x] 1. Add Prisma schema models and run migration
  - Add `AssetType`, `PriceFrequency`, and `Granularity` enums to `packages/db/prisma/schema.prisma`
  - Add `Asset`, `AssetPrice`, and `AssetPriceSyncRange` models with all columns, relations, unique constraints, and indexes exactly as specified in the design
  - Verify cascade deletes are set to `onDelete: Cascade` on both `AssetPrice` and `AssetPriceSyncRange` relations
  - Run `npm run db:generate` and `npm run db:migrate` from `packages/db` to apply the migration
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [x] 2. Add `yahoo-finance2` dependency to `apps/web`
  - Run `npm install yahoo-finance2 --workspace=apps/web` from the repo root to add the package
  - Confirm the entry appears in `apps/web/package.json`
  - _Requirements: 1.1, 5.2_

- [x] 3. Create shared TypeScript types and the `deriveGranularity` / `resolveTimeframeDates` functions
  - [x] 3.1 Create `apps/web/app/api/_lib/financialProducts/types.ts`
    - Export `Timeframe`, `YahooInterval`, `GranularityValue` union types
    - Export `TIMEFRAME_CONFIG` record constant mapping each of the eight timeframes to `{ granularity, interval }`
    - _Requirements: 8.1_

  - [x] 3.2 Implement `resolveTimeframeDates` and `deriveGranularity` in `apps/web/app/api/_lib/financialProducts/priceSyncAlgorithm.ts`
    - `resolveTimeframeDates(timeframe)` resolves `from`/`to` dates using `getEuropeMadridDateParts()` from `@repo/utils` for the `TODAY` case; all other cases use arithmetic on `new Date()`; `ALL` returns `new Date(0)`
    - `deriveGranularity(timeframe, priceFrequency)` applies the DAILY fallback rule for `TODAY`/`1W` when `priceFrequency === "DAILY"`; throws on unrecognised timeframe values
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 3.3 Write unit tests for `resolveTimeframeDates` and `deriveGranularity`
    - Test all 8 timeframes for `resolveTimeframeDates`: assert `from < to` for each, and that `ALL` returns `new Date(0)` as `from`
    - Test all 8 timeframes × 2 price frequencies (16 cases) for `deriveGranularity`: verify correct granularity and interval, and confirm the DAILY fallback fires only for `TODAY`/`1W` with `DAILY` frequency
    - Test that an unrecognised timeframe string throws
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 3.4 Write property test for `deriveGranularity` fallback (Property 4)
    - **Property 4: Granularity fallback for DAILY assets**
    - Generate any timeframe from all eight values; call `deriveGranularity(timeframe, "DAILY")`; assert `result.granularity` is never `"FIFTEEN_MIN"` or `"HOURLY"`
    - Use `fast-check` with at least 100 iterations
    - **Validates: Requirements 8.1, 8.2**

- [x] 4. Implement `computeMissingRanges` and `mergeSyncRange`
  - [x] 4.1 Add `computeMissingRanges` to `apps/web/app/api/_lib/financialProducts/priceSyncAlgorithm.ts`
    - Pure function: accepts `covered: Array<{ from: Date; to: Date }>` and a `[from, to]` window; returns the list of sub-intervals inside `[from, to]` not covered by any existing range
    - Handle edge cases: empty covered set, full coverage (returns `[]`), single gap, multiple gaps, adjacent ranges, exact boundary alignment
    - _Requirements: 7.1, 7.2_

  - [x] 4.2 Write unit tests for `computeMissingRanges`
    - Cover: empty covered set (returns full window), fully covered (returns `[]`), single interior gap, two gaps, gap at start, gap at end, adjacent ranges, boundary-exact coverage
    - _Requirements: 7.1, 7.2_

  - [x] 4.3 Write property test for `computeMissingRanges` (Property 2)
    - **Property 2: Missing range computation is exact**
    - Generate an arbitrary list of non-overlapping intervals and an arbitrary `[from, to]` window; call `computeMissingRanges`; assert: result intervals are disjoint, each is contained in `[from, to]`, union of covered + result ⊇ `[from, to]`, and result ∩ covered = ∅
    - Use `fast-check` with at least 100 iterations
    - **Validates: Requirements 7.1, 7.2**

  - [x] 4.4 Add `mergeSyncRange` to `apps/web/app/api/_lib/financialProducts/priceSyncAlgorithm.ts`
    - Queries `asset_price_sync_ranges` for the given `assetId` and `granularity`; collapses all overlapping or touching records with the new `[from, to]` into a single record; writes the merged record back to the DB (delete old + insert merged)
    - _Requirements: 7.6_

  - [x] 4.5 Write unit tests for `mergeSyncRange`
    - Mock the Prisma client; test: single insert (no existing records), merge with adjacent range, merge with overlapping range, no-op when range is fully inside an existing record
    - _Requirements: 7.6_

- [x] 5. Implement `syncPrices` and wire up the full sync algorithm
  - [x] 5.1 Add `syncPrices` to `apps/web/app/api/_lib/financialProducts/priceSyncAlgorithm.ts`
    - Calls `computeMissingRanges` to find gaps; for each gap calls `yahooFinance.historical()` with the correct interval; batch-upserts returned rows into `asset_prices` using the `(asset_id, timestamp, granularity)` unique key; calls `mergeSyncRange` to record the covered interval; skips all Yahoo calls when there are no gaps
    - On Yahoo error: propagates the error without writing a sync range record
    - Marks a range as synced even when Yahoo returns zero rows for it
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.7, 7.8, 7.9_

  - [x] 5.2 Write property test for sync range coverage (Property 1)
    - **Property 1: Sync ranges always cover the requested window**
    - Generate a random asset and a random `[from, to]` window; call `syncPrices` with Yahoo mocked to return an empty array; assert the union of `asset_price_sync_ranges` in the DB ⊇ `[from, to]`
    - Use `fast-check` with at least 100 iterations
    - **Validates: Requirements 7.4, 7.5**

  - [x] 5.3 Write property test for sync idempotency (Property 3)
    - **Property 3: Sync idempotency**
    - Generate a random asset and timeframe; call `syncPrices` twice with identical arguments (Yahoo mocked to deterministic data); assert DB state after the second call equals DB state after the first call (no duplicate price rows, no duplicate sync range records)
    - Use `fast-check` with at least 100 iterations
    - **Validates: Requirements 7.3, 7.6, 9.3**

- [x] 6. Checkpoint — Ensure all algorithm tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement the Search API route
  - [x] 7.1 Create `apps/web/app/api/financial-products/search/route.ts`
    - Export `dynamic = "force-dynamic"`
    - Declare `searchQuerySchema` with `z.string().min(1).max(200)` for the `q` param
    - `GET` handler: parse + validate query params (400 on `ZodError`), call `yahooFinance.search()`, map results to `AssetSearchResult` (omit any `quoteType` that doesn't map to one of the five `AssetType` values), return 200 JSON array
    - On Yahoo error: return 502 `{ error: "Failed to search assets" }`
    - Export `OPTIONS` handler returning 405 with `Allow: GET, OPTIONS`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 10.1, 10.2, 10.5, 10.6_

  - [x] 7.2 Write unit tests for the Search API route
    - Test 400 on empty query, 400 on query > 200 characters, 400 on absent `q` param
    - Test successful response shape (ticker, name, asset_type, exchange present)
    - Test that unrecognised `quoteType` values are omitted from the response
    - Test 502 when Yahoo throws
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 8. Implement the Assets API routes
  - [x] 8.1 Create `apps/web/app/api/financial-products/assets/route.ts`
    - Export `dynamic = "force-dynamic"`
    - Declare `createAssetSchema` with Zod (ticker max 10, name max 100, asset_type enum, price_frequency enum, currency length 3, isin optional/nullable)
    - `GET` handler: return all `Asset` records ordered by `name ASC`; return 200 with empty array when none exist
    - `POST` handler: validate body (400 on `ZodError`); upsert by ticker — if ticker already exists return 200 with existing record; otherwise insert and return 200 with the new record
    - Export `OPTIONS` handler returning 405 with `Allow: GET, POST, OPTIONS`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 10.1, 10.2, 10.5, 10.6_

  - [x] 8.2 Create `apps/web/app/api/financial-products/assets/[id]/route.ts`
    - Export `dynamic = "force-dynamic"`
    - `DELETE` handler: parse `id` param as integer; look up asset (404 if not found); delete asset (cascade removes prices + sync ranges via Prisma); return 204 with no body
    - Export `OPTIONS` handler returning 405 with `Allow: DELETE, OPTIONS`
    - _Requirements: 2.6, 2.7, 9.7, 10.4, 10.5, 10.6_

  - [x] 8.3 Write unit tests for the Assets API routes
    - `GET /assets`: returns empty array, returns list ordered by name
    - `POST /assets`: 400 on missing required fields, 400 on invalid `asset_type` enum, 400 on `currency` length ≠ 3, 200 idempotent re-track (returns existing record without duplicate)
    - `DELETE /assets/[id]`: 404 on unknown id, 204 on success
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 2.7, 3.1_

- [x] 9. Implement the Prices API route
  - [x] 9.1 Create `apps/web/app/api/financial-products/prices/route.ts`
    - Export `dynamic = "force-dynamic"`
    - Declare `pricesQuerySchema` with `z.coerce.number().int().positive()` for `assetId` and `z.enum([...all 8 timeframes...])` for `timeframe`
    - `GET` handler steps: (1) validate params — 400 on `ZodError`; (2) load asset from DB — 404 if not found; (3) call `deriveGranularity`; (4) call `syncPrices` — 502 if Yahoo throws; (5) query `asset_prices` filtered by `asset_id`, `granularity`, and `timestamp BETWEEN from AND to` ordered by `timestamp ASC`; (6) return 200 with `PricePoint[]`
    - Implement the error precedence order: 400 → 404 → 502 → 500
    - Export `OPTIONS` handler returning 405 with `Allow: GET, OPTIONS`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 10.1, 10.2, 10.5, 10.6_

  - [x] 9.2 Write unit tests for the Prices API route
    - 400 when `assetId` is non-numeric
    - 400 when `timeframe` is absent or not a valid enum value
    - 404 when `assetId` is numeric but no asset exists
    - 502 when `syncPrices` propagates a Yahoo error
    - 200 with empty array when asset exists but no price rows in range
    - _Requirements: 5.5, 5.6, 5.7, 5.8, 5.9, 5.10_

  - [x] 9.3 Write property test for price query window isolation (Property 5)
    - **Property 5: Price query only returns rows in the requested granularity and window**
    - Seed an asset with `AssetPrice` rows spanning multiple granularities and a wider timestamp range; call `GET /prices?assetId=X&timeframe=Y`; assert every `PricePoint` in the response has a `timestamp` within `[from, to]` and matches the expected granularity for that timeframe; assert no rows from a different granularity tier appear
    - Use `fast-check` with at least 100 iterations
    - **Validates: Requirements 5.3, 5.4**

- [x] 10. Checkpoint — Ensure all API route tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implement the `/financial-products` page and `FinancialProductsView`
  - [x] 11.1 Create `apps/web/app/financial-products/page.tsx`
    - Async RSC; server-side fetches tracked assets from `GET /api/financial-products/assets`
    - On server-fetch failure renders with `initialAssets={[]}` and displays an error banner visible to the user
    - Passes `initialAssets` to `FinancialProductsView`
    - _Requirements: 3.2_

  - [x] 11.2 Create `apps/web/components/financial-products/FinancialProductsView.tsx`
    - Mark `'use client'`
    - Holds state: `selectedAsset: Asset | null`, `timeframe: Timeframe` (default `"1M"`), `trackedAssets: Asset[]` (initialised from `initialAssets` prop)
    - Renders `AssetSearch`, `TrackedAssetList`, `TimeframeSelector`, and `PriceChart` in a layout grid using TailwindCSS
    - Passes correct callbacks: `onAssetAdded` adds to `trackedAssets` and sets `selectedAsset`; `onSelect` sets `selectedAsset`; `onDeleted` removes from `trackedAssets` and clears `selectedAsset` if deleted asset was selected; `onChange` updates `timeframe`
    - _Requirements: 3.2, 4.4_

- [x] 12. Implement `TimeframeSelector`
  - [x] 12.1 Create `apps/web/components/financial-products/TimeframeSelector.tsx`
    - Mark `'use client'`
    - Render exactly eight buttons: `Today`, `1W`, `1M`, `3M`, `6M`, `1Y`, `5Y`, `All`
    - Visually distinguish active timeframe using at least two visual properties (e.g. background colour + font weight) — do not rely on colour alone for accessibility
    - Call `onChange(timeframe)` only when user selects a timeframe that differs from the current value
    - Use shadcn/ui `Button` or Radix primitives; style with TailwindCSS v4
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 13. Implement `TrackedAssetList`
  - [x] 13.1 Create `apps/web/components/financial-products/TrackedAssetList.tsx`
    - Mark `'use client'`
    - Render the list of tracked assets; highlight the row whose `id` matches `selectedAssetId`
    - Clicking an asset row calls `onSelect(asset)`
    - Each row has a delete button (Lucide `Trash2` icon); clicking it calls `DELETE /api/financial-products/assets/[id]`; on success calls `onDeleted(assetId)`
    - On delete failure: re-enable the delete button and display a visible, dismissible error notification for at least 3 seconds (use a shadcn/ui `Toast` or inline error)
    - _Requirements: 2.6, 2.7, 2.8, 3.3, 3.4_

- [x] 14. Implement `AssetSearch`
  - [x] 14.1 Create `apps/web/components/financial-products/AssetSearch.tsx`
    - Mark `'use client'`
    - Debounced input: wait 300 ms after last keystroke before calling `GET /api/financial-products/search?q=...`; cancel pending request if new keystroke arrives before 300 ms elapses
    - Render a dropdown list of `AssetSearchResult` items; show "No results found" when the array is empty
    - On API failure (network error or error HTTP status): hide the dropdown and show an inline error message below the input; auto-dismiss the error when the user types a new character
    - Selecting an untracked result calls `POST /api/financial-products/assets`; on success calls `onAssetAdded(asset)`; on failure shows inline error and does NOT call `onAssetAdded`
    - _Requirements: 1.7, 1.8, 1.9, 2.5, 2.9_

- [x] 15. Implement `PriceChart`
  - [x] 15.1 Create `apps/web/components/financial-products/PriceChart.tsx`
    - Mark `'use client'`
    - When `asset` is `null`: render a placeholder panel with a prompt to select an asset; make no API request
    - When `asset` or `timeframe` changes: fetch `GET /api/financial-products/prices?assetId=X&timeframe=Y`; show a loading indicator while fetching; do NOT render stale chart data during the fetch
    - On fetch error: render `<p className="text-destructive">Failed to load price data.</p>`
    - On empty `PricePoint[]`: render "No price data available" message
    - On success: initialise ECharts via `useRef` + `echarts.init()` + `useEffect`, following the `MetricsBalanceLinesChart` pattern; configure time-based x-axis, value-based y-axis with currency label formatter using `asset.currency`, tooltip, and grid exactly as specified in the design
    - Clean up ECharts instance on unmount
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 16. Add navigation link and README TODO comment
  - [x] 16.1 Add a navigation link to `/financial-products` in the app's root layout or nav component (`apps/web/app/layout.tsx` or equivalent nav component)
    - Use a Lucide icon appropriate for financial products (e.g. `TrendingUp`)
    - Follow the existing nav link pattern in the layout

  - [x] 16.2 Add a TODO comment to the repo `README.md` describing the future cron job
    - Comment should note: future background sync at `/api/internal/jobs/sync-financial-products` that incrementally refreshes all tracked assets on a schedule

- [x] 17. Property test for tracked asset list consistency (Property 6)
  - [x] 17.1 Write property test for `GET /assets` consistency after add/delete operations (Property 6)
    - **Property 6: Tracked asset list is consistent after add/delete**
    - Generate an arbitrary sequence of track (`POST /assets`) and untrack (`DELETE /assets/[id]`) operations; execute the sequence; call `GET /assets`; assert the response contains exactly the assets that were tracked and not subsequently deleted, in name-ascending order
    - Use `fast-check` with at least 100 iterations
    - **Validates: Requirements 2.1, 2.5, 3.1**

- [x] 18. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The design already uses TypeScript throughout — no language selection was needed
- Property tests use `fast-check` with Vitest; mock Yahoo Finance for all property tests (no real network access)
- Unit tests and property tests are complementary — both should pass before moving to the next phase
- `syncPrices` and `mergeSyncRange` must use the Prisma singleton from `@repo/db`
- `resolveTimeframeDates` must use `getEuropeMadridDateParts()` from `@repo/utils` for the `TODAY` from-date
- The `MetricsBalanceLinesChart` component is the reference pattern for ECharts integration in `PriceChart`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "2"] },
    { "id": 1, "tasks": ["3.1"] },
    { "id": 2, "tasks": ["3.2"] },
    { "id": 3, "tasks": ["3.3", "3.4", "4.1"] },
    { "id": 4, "tasks": ["4.2", "4.3", "4.4"] },
    { "id": 5, "tasks": ["4.5", "5.1"] },
    { "id": 6, "tasks": ["5.2", "5.3", "7.1", "8.1", "8.2"] },
    { "id": 7, "tasks": ["7.2", "8.3", "9.1"] },
    { "id": 8, "tasks": ["9.2", "9.3", "11.1"] },
    { "id": 9, "tasks": ["11.2"] },
    { "id": 10, "tasks": ["12.1", "13.1"] },
    { "id": 11, "tasks": ["14.1"] },
    { "id": 12, "tasks": ["15.1"] },
    { "id": 13, "tasks": ["16.1", "16.2", "17.1"] }
  ]
}
```
