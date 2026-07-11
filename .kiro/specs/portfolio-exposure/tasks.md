# Implementation Plan: Portfolio Exposure

## Overview

Provide look-through exposure analysis of the user's investment portfolio by aggregating asset-level sector and country breakdowns weighted by current position values. Implementation proceeds in waves: database schema first, then pure business logic (normalizer, Yahoo fetcher, calculator), then the sync processor integration, API endpoints, seed data, and finally UI components. Property tests validate correctness properties at each wave boundary.

## Tasks

- [x] 1. Database schema and migration
  - [x] 1.1 Add ExposureType enum, ExposureCategory, ExposureCategoryMapping, and AssetExposureSnapshot models to `packages/db/prisma/schema.prisma`
    - Add `ExposureType` enum with values `SECTOR` and `COUNTRY`
    - Add `ExposureCategory` model with `id`, `exposure_type`, `canonical_key`, `display_name`, `created_at`, unique constraint on `[exposure_type, canonical_key]`
    - Add `ExposureCategoryMapping` model with `id`, `provider`, `provider_label`, `category_id`, `created_at`, unique constraint on `[provider, provider_label, category_id]`, index on `[provider, provider_label]`
    - Add `AssetExposureSnapshot` model with `id`, `asset_id`, `period`, `exposure_type`, `category_id`, `percentage`, `provider`, `synced_at`, unique constraint on `[asset_id, period, exposure_type, category_id]`, index on `[asset_id, period, exposure_type]`
    - Add `exposureSnapshots AssetExposureSnapshot[]` relation to the `Asset` model
    - Run `npm run db:migrate` from `packages/db` to generate and apply the migration
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.5_

- [x] 2. Core business logic
  - [x] 2.1 Create `apps/web/app/api/_lib/exposure/normalizer.ts`
    - Implement `resolveCanonicalCategory(provider, providerLabel, exposureType)` that checks ExposureCategoryMapping for existing mapping, returns `category_id` if found
    - On cache miss: generate `canonicalKey` from label (lowercase, spaces to dashes), upsert ExposureCategory, create ExposureCategoryMapping, return new `category_id`
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 2.2 Create `apps/web/app/api/_lib/exposure/yahooFetcher.ts`
    - Implement `fetchExposureFromYahoo(asset)` that retrieves exposure data from Yahoo Finance
    - For STOCK type: use `quoteSummary(symbol, { modules: ["assetProfile"] })`, extract sector and country, return 100% allocation for each
    - For ETF/FUND/ETP type: use `quoteSummary(symbol, { modules: ["topHoldings"] })`, extract sector weightings and country breakdown
    - Return `null` when no provider mapping exists or no data is available
    - Define `ExposureData` type: `{ sectors: Array<{label, percentage}>, countries: Array<{label, percentage}> }`
    - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.2, 5.3_

  - [x] 2.3 Create `apps/web/app/api/_lib/exposure/calculator.ts`
    - Implement `computePortfolioExposure(positions, snapshots, totalPortfolioValue, type)` as a pure computation function
    - For each position: look up snapshots for the asset, weight each category percentage by `positionValue / totalPortfolioValue`
    - Sum weighted percentages per canonical category across all assets
    - Compute `coveragePercentage` and `uncoveredValue`
    - Return `{ data: Array<{categoryId, categoryName, percentage, value}>, coveragePercentage, uncoveredValue, totalPortfolioValue }`
    - _Requirements: 1.1, 1.3, 1.6, 7.1, 7.2, 7.4_

- [x] 3. Checkpoint - Core logic complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Property tests for core logic
  - [x] 4.1 Write property test for weighted exposure calculation
    - Create `apps/web/app/api/_lib/exposure/calculator.property.test.ts`
    - **Property 1: Weighted exposure calculation**
    - Generate arbitrary positions with values and per-category percentages; assert each category result equals sum of `(assetCategoryPercentage × positionValue) / totalPortfolioValue`
    - **Validates: Requirements 1.1, 1.3**

  - [x] 4.2 Write property test for account filtering consistency
    - **Property 2: Account filtering consistency**
    - Generate multi-account position sets; assert filtered exposure uses only the filtered account's positions, and unfiltered total equals sum of all accounts
    - **Validates: Requirements 1.4, 1.5**

  - [x] 4.3 Write property test for exposure percentages bounded by coverage
    - **Property 3: Exposure percentages bounded by coverage**
    - Generate portfolios with some assets lacking snapshots; assert sum of category percentages ≤ coveragePercentage
    - **Validates: Requirements 1.6**

  - [x] 4.4 Write property test for coverage and uncovered value calculation
    - **Property 4: Coverage and uncovered value calculation**
    - Generate arbitrary portfolios; assert `coveragePercentage = coveredValue / totalPortfolioValue × 100`, `uncoveredValue = totalPortfolioValue - coveredValue`, and `0 ≤ coveragePercentage ≤ 100`
    - **Validates: Requirements 7.1, 7.2, 7.4**

  - [x] 4.5 Write property test for category normalization idempotency
    - Create `apps/web/app/api/_lib/exposure/normalizer.property.test.ts`
    - **Property 5: Category normalization idempotency**
    - Mock Prisma; generate arbitrary provider labels; assert resolving the same label multiple times always returns the same `category_id`
    - **Validates: Requirements 3.1, 3.3**

  - [ ] 4.6 Write property test for individual equities 100% assignment
    - Create `apps/web/app/api/_lib/exposure/yahooFetcher.property.test.ts`
    - **Property 6: Individual equities assigned 100% to their category**
    - Generate STOCK assets with arbitrary sector/country; assert exactly one snapshot per type with percentage = 100
    - **Validates: Requirements 4.1, 4.2, 4.3**

  - [ ] 4.7 Write property test for ETF/Fund snapshot count
    - **Property 7: ETF/Fund entries produce one snapshot per category**
    - Generate ETF/FUND assets with N sector and M country entries; assert exactly N sector snapshots and M country snapshots
    - **Validates: Requirements 5.2**

  - [ ] 4.8 Write property test for unclassified remainder computation
    - **Property 8: Unclassified remainder computation**
    - Generate category percentages summing to less than 100%; assert "Other" bucket equals `100% - sum(percentages)`; when sum = 100%, no "Other" bucket
    - **Validates: Requirements 6.1, 11.5**

  - [ ] 4.9 Write property test for raw percentages stored without normalization
    - **Property 9: Raw percentages stored without normalization**
    - Generate provider data with percentages summing to less than 100%; assert stored values exactly match raw provider values
    - **Validates: Requirements 6.2**

- [x] 5. Exposure sync processor
  - [x] 5.1 Create `apps/web/app/api/_lib/jobs/processors/exposureSync.ts`
    - Implement `syncExposureData(jobRunId)` returning `ProcessCounts`
    - Determine current period from `getEuropeMadridDateParts()`
    - Query all assets with active positions (units > 0 across all COMPLETED investments)
    - For each asset: skip if snapshots already exist for the period, else fetch from Yahoo Finance, normalize labels, create AssetExposureSnapshot records
    - On per-asset failure: increment `failed` count, continue processing remaining assets
    - _Requirements: 2.1, 2.4, 8.1, 8.3, 8.4_

  - [x] 5.2 Integrate exposure sync into the daily job pipeline in `apps/web/app/api/_lib/jobs/applyPendingTransactions.ts`
    - Import `syncExposureData` from `./processors/exposureSync`
    - Call `syncExposureData(jobRun.id)` after `applyPendingInvestmentsForMonth` and before snapshot recalculation
    - Add its counts to the aggregated `counts` using `addCounts()`
    - _Requirements: 8.1, 8.2_

- [x] 6. API endpoints
  - [x] 6.1 Create `apps/web/app/api/investments/exposure/route.ts`
    - Export `dynamic = "force-dynamic"`
    - Define Zod schema for query params: `type` (enum SECTOR/COUNTRY), optional `period` (regex YYYY-MM), optional `accountId` (coerce positive int)
    - Validate query params → 400 on ZodError
    - Default `period` to current month via `getEuropeMadridDateParts()`
    - Compute positions (reuse position computation pattern from existing positions route): if `accountId` provided, filter to that account; otherwise aggregate all accounts
    - Compute `totalPortfolioValue` from position values
    - Fetch AssetExposureSnapshot records for each position's asset, period, and type
    - Call `computePortfolioExposure()` from calculator.ts
    - Return response with `data`, `coveragePercentage`, `uncoveredValue`, `totalPortfolioValue`, `period`, `type`
    - Export `OPTIONS()` returning 405 with `Allow: GET, OPTIONS`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 7.1, 7.2, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

  - [x] 6.2 Create `apps/web/app/api/admin/exposure-resync/route.ts`
    - Export `dynamic = "force-dynamic"`
    - Define Zod schema for request body: `assetId` (positive int), `period` (regex YYYY-MM)
    - Validate body → 400 on ZodError
    - Verify asset exists → 404 if not
    - Fetch fresh exposure data from Yahoo Finance via `fetchExposureFromYahoo()`
    - On fetch failure → 502 without modifying existing records
    - Delete existing AssetExposureSnapshot records for that asset + period (both SECTOR and COUNTRY)
    - Insert new snapshots with normalized categories
    - Return 200 with `{ assetId, period, sectorsCreated, countriesCreated }`
    - Export `OPTIONS()` returning 405 with `Allow: POST, OPTIONS`
    - _Requirements: 9.1, 9.2, 9.3_

- [x] 7. Checkpoint - Backend complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Property tests for sync and API
  - [x] 8.1 Write property test for sync skip behavior
    - Create `apps/web/app/api/_lib/jobs/processors/exposureSync.property.test.ts`
    - **Property 10: Sync skips already-synced assets**
    - Generate assets with existing snapshot records; assert sync does not modify or create new records for those assets
    - **Validates: Requirements 2.4**

  - [x] 8.2 Write property test for sync fault tolerance
    - **Property 11: Sync fault tolerance**
    - Generate a set of assets where a subset of Yahoo Finance calls fail; assert non-failing assets still get snapshots and failed count is correct
    - **Validates: Requirements 8.3**

  - [x] 8.3 Write property test for re-sync overwrite behavior
    - Create `apps/web/app/api/admin/exposure-resync/resync.property.test.ts`
    - **Property 12: Re-sync overwrites existing snapshots**
    - Generate assets with pre-existing snapshots; assert post re-sync only new data exists
    - **Validates: Requirements 9.2**

  - [x] 8.4 Write property test for failed re-sync preserving records
    - **Property 13: Failed re-sync preserves existing records**
    - Generate assets with existing snapshots; simulate Yahoo Finance failure; assert records remain unchanged
    - **Validates: Requirements 9.3**

  - [x] 8.5 Write property test for invalid input rejection
    - Create `apps/web/app/api/investments/exposure/exposure.property.test.ts`
    - **Property 14: Invalid input rejection**
    - Generate invalid `type` values and malformed `period` strings; assert API returns 400 with validation details
    - **Validates: Requirements 10.5, 10.6**

- [x] 9. Seed data for common Yahoo Finance labels
  - [x] 9.1 Create a Prisma seed script or migration data file with pre-seeded ExposureCategoryMapping records
    - Create `packages/db/prisma/seeds/exposureCategories.ts` with canonical categories and mappings for common Yahoo Finance sector labels (Technology, Healthcare, Financial Services, Consumer Cyclical, Communication Services, Industrials, Consumer Defensive, Energy, Real Estate, Basic Materials, Utilities)
    - Include common country labels (United States, China, Japan, United Kingdom, Germany, France, etc.)
    - Wire into the existing seed mechanism or create a standalone script callable via `npx tsx`
    - _Requirements: 3.4_

- [x] 10. UI components
  - [x] 10.1 Create `apps/web/components/investments/ExposureTypeToggle.tsx`
    - Client component with `'use client'` directive
    - Accept props: `value: "SECTOR" | "COUNTRY"`, `onChange: (type) => void`
    - Render toggle/button group switching between SECTOR and COUNTRY views
    - Use shadcn/ui primitives (e.g., ToggleGroup or Button)
    - _Requirements: 11.2, 11.3_

  - [x] 10.2 Create `apps/web/components/investments/CoverageIndicator.tsx`
    - Client component displaying coverage percentage with a visual indicator
    - Accept props: `coveragePercentage: number`, `uncoveredValue: number`
    - Show percentage value and an optional progress bar or badge
    - _Requirements: 7.3, 11.4_

  - [x] 10.3 Create `apps/web/components/investments/ExposurePieChart.tsx`
    - Client component using ECharts to render a donut chart
    - Accept props: `data: Array<{categoryName, percentage, value}>`, `type: "SECTOR" | "COUNTRY"`
    - Configure ECharts pie/donut series with labels showing category name and percentage
    - Handle empty data state gracefully
    - _Requirements: 11.2, 11.3_

  - [x] 10.4 Create `apps/web/components/investments/ExposureTable.tsx`
    - Client component using TanStack Table (DataTable pattern) to display category breakdown
    - Accept props: `data: Array<{categoryName, percentage, value}>`, `type: "SECTOR" | "COUNTRY"`
    - Columns: Category Name, Percentage (formatted), Monetary Value (formatted with €)
    - Sort by percentage descending by default
    - _Requirements: 11.2, 11.3_

  - [x] 10.5 Create `apps/web/components/investments/ExposurePage.tsx`
    - Client component managing state: selected type (SECTOR/COUNTRY), exposure data, loading state
    - Fetch data from `GET /api/investments/exposure?type={type}` on mount and type change
    - Compose ExposureTypeToggle, CoverageIndicator, ExposurePieChart, and ExposureTable
    - Compute "Other / Unclassified" bucket client-side when category percentages sum to less than 100% of the covered portion
    - Handle loading and empty states
    - _Requirements: 6.1, 6.3, 11.2, 11.3, 11.4, 11.5_

  - [x] 10.6 Create `apps/web/app/investments/exposure/page.tsx`
    - Server component page at `/investments/exposure`
    - Render `<ExposurePage />` client component
    - _Requirements: 11.1_

- [ ] 11. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Use `fast-check` for property-based tests (already used in the project)
- The existing positions route pattern (`apps/web/app/api/accounts/[id]/investments/positions/route.ts`) serves as the reference for computing positions in the exposure API
- The sync processor follows the same `ProcessCounts` pattern as other processors in the daily job pipeline
- Category normalization auto-creates unknown labels, so seed data covers only common cases
- The "Other / Unclassified" bucket is computed client-side by the ExposurePage component, not stored in the database

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3"] },
    { "id": 2, "tasks": ["4.1", "4.2", "4.3", "4.4", "4.5", "4.6", "4.7", "4.8", "4.9"] },
    { "id": 3, "tasks": ["5.1", "9.1"] },
    { "id": 4, "tasks": ["5.2"] },
    { "id": 5, "tasks": ["6.1", "6.2"] },
    { "id": 6, "tasks": ["8.1", "8.2", "8.3", "8.4", "8.5"] },
    { "id": 7, "tasks": ["10.1", "10.2", "10.3", "10.4"] },
    { "id": 8, "tasks": ["10.5"] },
    { "id": 9, "tasks": ["10.6"] }
  ]
}
```
