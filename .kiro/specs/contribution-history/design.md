# Design Document

## Overview

The Contribution History feature overlays BUY/SELL transaction markers onto the existing asset price chart in the Financial Products page. It introduces a new API endpoint that returns completed investments for a given asset (across all accounts) filtered by timeframe, a pure grouping function that merges overlapping markers based on pixel proximity, and ECharts scatter series integration to render individual and grouped markers with tooltips. A visibility toggle allows the user to show or hide markers without refetching data.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ apps/web/components/financial-products/FinancialProductsView.tsx (client)    │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  State: selectedAsset, timeframe, contributions, showMarkers          │  │
│  │                                                                       │  │
│  │  ┌─────────────────────────────────┐  ┌────────────────────────────┐  │  │
│  │  │  <TimeframeSelector />          │  │ <ContributionToggle />     │  │  │
│  │  └─────────────────────────────────┘  └────────────────────────────┘  │  │
│  │                                                                       │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │  <PriceChart                                                    │  │  │
│  │  │    asset, timeframe,                                            │  │  │
│  │  │    contributions,   ← ContributionMarker[]                      │  │  │
│  │  │    showMarkers      ← boolean                                   │  │  │
│  │  │  />                                                             │  │  │
│  │  │                                                                 │  │  │
│  │  │  Internally:                                                    │  │  │
│  │  │  - groupMarkers(contributions, priceData, chartWidth)           │  │  │
│  │  │  - findNearestPrice(timestamp, priceData)                       │  │  │
│  │  │  - BUY scatter series (green ▲)                                 │  │  │
│  │  │  - SELL scatter series (red ▼)                                  │  │  │
│  │  │  - GROUP scatter series (neutral ●)                             │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  API                                                                         │
│  GET /api/financial-products/assets/[assetId]/investments?timeframe=<tf>     │
│  → { data: ContributionMarker[] }                                            │
│                                                                              │
│  Reuses: resolveTimeframeDates() from priceSyncAlgorithm.ts                  │
│  Queries: Investment table (status=COMPLETED, asset_id, processed_at range)  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Contribution API Route

**File:** `apps/web/app/api/financial-products/assets/[assetId]/investments/route.ts`
**Directive:** `export const dynamic = "force-dynamic"`

A new API endpoint returning completed investments for an asset, filtered by timeframe.

**Validation Schema (Zod):**

```typescript
const investmentsQuerySchema = z.object({
  assetId: z.coerce.number().int().positive(),
  timeframe: z.enum(["TODAY", "1W", "1M", "3M", "6M", "1Y", "5Y", "ALL"]),
});
```

**GET handler logic:**

1. Extract `assetId` from route params and `timeframe` from query string.
2. Validate with Zod — ZodError → 400 with `error` and `details`.
3. Lookup asset by ID — not found → 404 with `{ error: "Asset not found" }`.
4. Call `resolveTimeframeDates(timeframe)` to get `{ from, to }`.
5. Query `Investment` table: `WHERE asset_id = :assetId AND status = 'COMPLETED' AND processed_at >= :from AND processed_at <= :to`, ordered by `processed_at ASC`.
6. Map each row to `ContributionMarker` shape.
7. Return `{ data: ContributionMarker[] }` with status 200.

**Error responses:**
- 400: Invalid parameters (ZodError)
- 404: Asset not found
- 500: Unexpected error (catch-all)
- OPTIONS → 405 with `Allow: GET, OPTIONS`

### PriceChart (Modified)

**File:** `apps/web/components/financial-products/PriceChart.tsx`
**Directive:** `'use client'`

Extended to accept contribution data and render scatter series.

**New props:**

```typescript
type Props = {
  asset: Asset | null;
  timeframe: Timeframe;
  contributions?: ContributionMarker[];
  showMarkers?: boolean;
};
```

**New internal logic:**

1. When `priceData` and `contributions` are both available, and `showMarkers` is true:
   - Call `groupMarkers(contributions, priceData, chartWidth)` to produce `MarkerOrGroup[]`.
   - Split results into: individual BUY markers, individual SELL markers, and groups.
   - For each individual marker, compute y-value via `findNearestPrice(marker.processed_at, priceData)`.
   - For each group, use the average timestamp position and the nearest price for y-value.
2. Add up to 3 additional scatter series to the ECharts option:
   - **BUY series**: green upward triangles (`symbol: 'triangle'`, `symbolRotate: 0`)
   - **SELL series**: red downward triangles (`symbol: 'triangle'`, `symbolRotate: 180`)
   - **GROUP series**: neutral gray circles with `symbolSize` scaled by count
3. Configure per-series tooltip formatters.
4. On resize, recalculate grouping by reading the chart container's `clientWidth`.

### ContributionToggle

**File:** `apps/web/components/financial-products/ContributionToggle.tsx`
**Directive:** `'use client'`

A simple checkbox component that controls marker visibility.

```typescript
type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
};
```

Renders a labeled checkbox. Hidden entirely when there are no contributions (controlled by parent).

### FinancialProductsView (Modified)

**File:** `apps/web/components/financial-products/FinancialProductsView.tsx`

**New state:**
- `contributions: ContributionMarker[] | null` — fetched marker data
- `showMarkers: boolean` — defaults to `true`

**New behavior:**
- When `selectedAsset` or `timeframe` changes, fetch contributions from `GET /api/financial-products/assets/:assetId/investments?timeframe=<tf>`.
- If fetch fails, set `contributions` to `null` (silent degradation — no error shown).
- Pass `contributions` and `showMarkers` to `PriceChart`.
- Render `ContributionToggle` only when `contributions` is non-null and has length > 0.

### groupMarkers (Pure Function)

**File:** `apps/web/lib/groupMarkers.ts`

The core grouping algorithm as a pure, testable function.

```typescript
export function groupMarkers(
  markers: ContributionMarker[],
  priceData: PricePoint[],
  chartWidth: number,
  threshold: number = 20,
): MarkerOrGroup[]
```

**Algorithm:**

1. If `markers` is empty or `priceData` is empty or `chartWidth <= 0`, return `[]`.
2. Determine the chart time range: `minTime = priceData[0].timestamp`, `maxTime = priceData[last].timestamp`.
3. For each marker, compute pixel x-position: `x = ((markerTime - minTime) / (maxTime - minTime)) * chartWidth`.
4. Sort markers by pixel x-position ascending.
5. Iterate sorted markers, greedily grouping: if the current marker's x-position is within `threshold` pixels of the group's anchor x-position, add it to the current group. Otherwise, finalize the current group and start a new one.
6. For each finalized group:
   - If it contains 1 marker → emit as `SingleMarker` with `kind: "single"`.
   - If it contains 2+ markers → emit as `MarkerGroup` with `kind: "group"`, compute aggregate fields.
7. For y-position of each emitted item, use `findNearestPrice()` with the anchor timestamp.

### findNearestPrice (Pure Function)

**File:** `apps/web/lib/groupMarkers.ts` (co-located)

Binary search on the sorted `priceData` array to find the closest price point to a given timestamp.

```typescript
export function findNearestPrice(
  timestamp: string,  // ISO timestamp
  priceData: PricePoint[],
): number
```

**Algorithm:**

1. If `priceData` is empty, return `0`.
2. Convert `timestamp` to milliseconds.
3. Binary search for the insertion point in the sorted array.
4. Compare distances to the element before and after the insertion point.
5. Return the `price` of the closest element.
6. Edge cases: if timestamp is before all prices, return first price; if after all, return last price.

## Data Models

### ContributionMarker (API response item)

```typescript
type ContributionMarker = {
  id: number;
  type: "BUY" | "SELL";
  units: string;         // Decimal string (e.g. "10.500000")
  unit_price: string;    // Decimal string (e.g. "45.230000")
  total_amount: string;  // Decimal string (e.g. "475.42")
  description: string | null;
  processed_at: string;  // ISO 8601 timestamp
};
```

### MarkerGroup

```typescript
type MarkerGroup = {
  kind: "group";
  markers: ContributionMarker[];
  position: { x: string; y: number };  // anchor timestamp (ISO), nearest price value
  count: number;
  totalAmount: number;
  buyCount: number;
  sellCount: number;
};
```

### SingleMarker

```typescript
type SingleMarker = {
  kind: "single";
  marker: ContributionMarker;
  position: { x: string; y: number };  // marker timestamp, nearest price value
};
```

### MarkerOrGroup

```typescript
type MarkerOrGroup = MarkerGroup | SingleMarker;
```

### PricePoint (existing, referenced)

```typescript
type PricePoint = {
  timestamp: string;
  price: number;
};
```

### API Response Envelope

```typescript
// GET /api/financial-products/assets/:assetId/investments response
interface ContributionResponse {
  data: ContributionMarker[];
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: API returns only COMPLETED investments within timeframe

*For any* set of investments with varying statuses (PENDING, COMPLETED, CANCELLED), accounts, and timestamps, the Contribution_API filtering logic SHALL return only investments where `status === "COMPLETED"` and `processed_at` falls within the `[from, to]` date range derived from the given timeframe.

**Validates: Requirements 1.1**

### Property 2: API validation rejects all invalid parameter combinations

*For any* request where `assetId` is not a positive integer OR `timeframe` is not one of the valid enum values, the Contribution_API validation SHALL reject the input (produce a validation error).

**Validates: Requirements 1.3**

### Property 3: API response contains all required fields for every item

*For any* valid investment record returned by the Contribution_API, the response item SHALL contain the fields `id`, `type`, `units`, `unit_price`, `total_amount`, `description`, and `processed_at`, with `type` being either "BUY" or "SELL" and `processed_at` being a valid ISO timestamp string.

**Validates: Requirements 1.4**

### Property 4: API response is ordered by processed_at ascending

*For any* set of completed investments returned by the Contribution_API, for every consecutive pair of items `(items[i], items[i+1])`, the `processed_at` timestamp of `items[i]` SHALL be less than or equal to the `processed_at` timestamp of `items[i+1]`.

**Validates: Requirements 1.5**

### Property 5: Nearest price lookup returns the closest price point

*For any* sorted price data array and any target timestamp, the `findNearestPrice` function SHALL return the price of the element whose timestamp has the minimum absolute time distance to the target. If the target is before all prices, it returns the first price; if after all prices, it returns the last price.

**Validates: Requirements 2.2, 2.4**

### Property 6: Marker visibility matches showMarkers flag

*For any* non-empty contribution data and a `showMarkers` boolean, the generated ECharts scatter series SHALL be present (non-empty data arrays) when `showMarkers` is `true`, and SHALL have empty data arrays (or be omitted) when `showMarkers` is `false`.

**Validates: Requirements 3.2, 3.3**

### Property 7: Single marker tooltip contains all required details

*For any* valid `ContributionMarker`, the single-marker tooltip formatter SHALL produce output containing the transaction type, units, unit_price, total_amount, and processed_at date. If the marker has a non-null description, the output SHALL also contain the description text.

**Validates: Requirements 4.1, 4.3**

### Property 8: Group marker tooltip contains aggregated details

*For any* valid `MarkerGroup` containing 2 or more markers, the group tooltip formatter SHALL produce output containing the total transaction count, the combined total_amount, and the individual BUY and SELL counts.

**Validates: Requirements 4.2**

### Property 9: Grouping ensures no two ungrouped markers are within threshold

*For any* set of markers, price data, chart width, and threshold, after applying `groupMarkers`, no two items in the result with `kind: "single"` SHALL have pixel x-positions within `threshold` of each other. Additionally, every `MarkerGroup` SHALL have `count` equal to `markers.length`, and `count >= 2`.

**Validates: Requirements 5.1, 5.2**

## Error Handling

| Scenario | Component | Behavior |
|----------|-----------|----------|
| Invalid assetId or timeframe | API Route | 400 with Zod validation details |
| Asset not found in DB | API Route | 404 with `{ error: "Asset not found" }` |
| Unexpected DB/server error | API Route | 500 with `{ error: "Internal server error" }` |
| Contribution fetch fails | FinancialProductsView | Sets `contributions` to `null`; chart renders without markers silently |
| Contribution fetch returns empty array | FinancialProductsView | Hides toggle checkbox; chart renders price line only |
| Price data is empty/null | PriceChart | Does not render any scatter series regardless of contributions |
| Unrecognized investment type | PriceChart | Renders with neutral/generic marker style (same as group style) |
| Chart width is 0 or negative | groupMarkers | Returns empty array (no markers rendered) |

## Testing Strategy

**Property-Based Tests (via fast-check):**

Property-based testing is appropriate here because the core logic involves pure functions with well-defined universal properties (filtering, sorting, binary search, grouping algorithms). These functions accept varied inputs and must maintain invariants across all of them.

- Each correctness property maps to a single property-based test
- Minimum 100 iterations per property test
- Tag format: `Feature: contribution-history, Property N: <title>`
- Library: `fast-check` (already used in the project for other property tests)

**Unit Tests (example-based):**

- API route: 404 for non-existent asset, 400 for malformed params, 200 for valid request
- Visual differentiation: BUY series uses green triangle, SELL uses red inverted triangle, groups use gray circle
- Toggle defaults to checked when contributions exist
- Toggle hidden when contributions array is empty
- Chart renders no markers when priceData is null/empty
- Timeframe change triggers re-fetch of contributions

**Integration Tests:**

- Full API round-trip: create investments via the investments API, then query via the contribution API and verify correct results
- End-to-end chart rendering with real price and contribution data

## File Structure

```
apps/web/app/api/financial-products/assets/[assetId]/investments/
├── route.ts                          # New — Contribution API endpoint

apps/web/components/financial-products/
├── FinancialProductsView.tsx         # Modified — adds contribution fetch + toggle state
├── PriceChart.tsx                    # Modified — accepts contributions, renders scatter series
├── ContributionToggle.tsx            # New — checkbox for marker visibility

apps/web/lib/
├── groupMarkers.ts                   # New — pure grouping logic + findNearestPrice
├── groupMarkers.test.ts             # New — property tests for grouping + nearest price
```
