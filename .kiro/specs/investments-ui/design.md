# Design Document

## Overview

The Investments UI feature adds a client-side domain section to the account detail page that displays a paginated table of investment operations (BUY/SELL) and provides a dialog form to create new investments. It follows the established View → Table → Form component pattern used by expenses, incomes, and transactions. The section consumes the existing backend API at `/api/accounts/:id/investments` and `/api/financial-products/assets`.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│ apps/web/app/accounts/[id]/page.tsx  (RSC)                          │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  <AccountInvestmentsView accountId={id} />  (client)          │  │
│  │                                                               │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │  <InvestmentsTable />                                   │  │  │
│  │  │  - Defines columns with ColumnDef<InvestmentRow>        │  │  │
│  │  │  - Renders via <ListTable />                            │  │  │
│  │  │  - Cancel action per row (status != CANCELLED)          │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  │                                                               │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │  <AddInvestmentForm />  (inside Dialog)                 │  │  │
│  │  │  - Asset dropdown (fetches from /api/.../assets)        │  │  │
│  │  │  - Type toggle (BUY/SELL)                               │  │  │
│  │  │  - Units, unit price, description, month inputs         │  │  │
│  │  │  - Client-side validation + POST on submit              │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Backend API (already implemented)                                   │
│  GET  /api/accounts/:id/investments      → { data, total, nextCursor}│
│  POST /api/accounts/:id/investments      → Investment (201)          │
│  PATCH /api/accounts/:id/investments     → Investment (200, cancel)  │
│  GET  /api/financial-products/assets     → Asset[]                   │
└─────────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### AccountInvestmentsView

**File:** `apps/web/components/investments/AccountInvestmentsView.tsx`
**Directive:** `'use client'`

The top-level domain view component. Manages data fetching, state, dialog visibility, refresh, cursor-based pagination prefetch, and cancel actions.

```typescript
type Props = {
  accountId: number;
};
```

**State:**
- `allData: InvestmentRow[]` — accumulated investment records from API
- `total: number` — server-reported total count
- `nextCursor: number | null` — cursor for next chunk fetch
- `loading: boolean` — initial/refresh loading state
- `error: string | null` — error message from fetch or cancel
- `isDialogOpen: boolean` — controls add-investment dialog
- `refreshKey: number` — incremented to trigger re-fetch

**Behavior:**
- On mount and when `refreshKey` changes, fetches `GET /api/accounts/{accountId}/investments?limit=30`
- "Refresh" button increments `refreshKey`
- "Add investment" button opens dialog with `AddInvestmentForm`
- On successful add (`onAdded` callback): closes dialog, increments `refreshKey`
- On page change near end of loaded data with `nextCursor != null`: prefetch next chunk silently
- Cancel action: sends `PATCH` with `{ investment_id, action: "cancel" }`, then refreshes on success or sets error on failure

### InvestmentsTable

**File:** `apps/web/components/investments/InvestmentsTable.tsx`
**Directive:** `'use client'`

Defines column definitions and renders data via the shared `ListTable` component.

```typescript
type InvestmentRow = {
  id: number;
  type: "BUY" | "SELL";
  units: number | string;
  unit_price: number | string;
  total_amount: number | string;
  description: string | null;
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  created_at: string;
  asset: { id: number; ticker: string; name: string };
  month: { year: number; month: number };
};

type Props = {
  investments: InvestmentRow[];
  loading?: boolean;
  error?: string | null;
  pageSize?: number;
  totalCount?: number;
  resetKey?: unknown;
  onPageChange?: (pageIndex: number) => void;
  onCancel?: (id: number) => void;
};
```

**Columns:**
| Column | Source | Notes |
|--------|--------|-------|
| Asset | `asset.ticker` | Font-medium |
| Type | `type` | Badge — BUY: `info` variant, SELL: `warning` variant |
| Units | `units` | Numeric formatting (tabular-nums) |
| Unit Price | `unit_price` | EUR currency format |
| Total | `total_amount` | EUR currency format |
| Status | `status` | Badge — COMPLETED: `success`, PENDING: `warning`, CANCELLED: `destructive` |
| Month | `month.year`, `month.month` | Formatted with `formatYearMonth()` |
| Description | `description` | Truncated if long |
| Actions | — | Cancel action (visible when status ≠ CANCELLED) |

**Pagination:** Client-side via `ListTable` with `pageSize={10}`.

### AddInvestmentForm

**File:** `apps/web/components/investments/AddInvestmentForm.tsx`
**Directive:** `'use client'`

A dialog-hosted form for creating BUY/SELL operations using local state and fetch.

```typescript
type Props = {
  accountId: number;
  onAdded: () => void;
  onCancel?: () => void;
};
```

**State:**
- `assetId: number | null` — selected asset ID
- `type: "BUY" | "SELL"` — defaults to `"BUY"`
- `units: string` — text input (parsed as number on submit)
- `unitPrice: string` — text input (parsed as number on submit)
- `description: string` — optional text input
- `month: number` — defaults to current month
- `year: number` — defaults to current year
- `submitting: boolean` — loading state during POST
- `error: string | null` — error message from API or validation
- `assets: Asset[]` — fetched asset list
- `assetsLoading: boolean` — loading state for asset fetch
- `assetsError: string | null` — error state for asset fetch

**Client-side validation (before submit):**
1. `assetId` must be selected (not null)
2. `units` must parse to a positive number
3. `unitPrice` must parse to a positive number

**Submit flow:**
1. Validate locally → set error if invalid, return early
2. Set `submitting = true`, clear error
3. `POST /api/accounts/{accountId}/investments` with `{ asset_id, type, units, unit_price, description, year, month }`
4. If `response.status === 201`: reset all fields, call `onAdded()`, call `onCancel?.()`
5. If error response: parse error message from body, set `error`
6. Finally: set `submitting = false`

**Asset fetch:** On mount, fetches `GET /api/financial-products/assets`. Populates dropdown options with `ticker — name` display format. Shows loading placeholder while fetching. Shows error message if fetch fails.

## Interfaces

### API Response Types (consumed)

```typescript
// GET /api/accounts/:id/investments response
interface InvestmentsListResponse {
  data: InvestmentRow[];
  total: number;
  nextCursor: number | null;
}

// GET /api/financial-products/assets response
type Asset = {
  id: number;
  ticker: string;
  name: string;
  asset_type: string;
  currency: string;
};

// POST /api/accounts/:id/investments request body
interface CreateInvestmentPayload {
  asset_id: number;
  type: "BUY" | "SELL";
  units: number;
  unit_price: number;
  description?: string;
  year: number;
  month: number;
}

// PATCH /api/accounts/:id/investments request body
interface CancelInvestmentPayload {
  investment_id: number;
  action: "cancel";
}
```

## Data Models

### InvestmentRow (Client-side type)

Represents a single investment record as received from the API and rendered in the table:

```typescript
type InvestmentRow = {
  id: number;
  type: "BUY" | "SELL";
  units: number | string;
  unit_price: number | string;
  total_amount: number | string;
  description: string | null;
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  created_at: string;
  asset: { id: number; ticker: string; name: string };
  month: { year: number; month: number };
};
```

### Asset (Client-side type)

Represents an asset option for the dropdown:

```typescript
type Asset = {
  id: number;
  ticker: string;
  name: string;
  asset_type: string;
  currency: string;
};
```

### Form State Model

The form manages the following local state that maps to the `CreateInvestmentPayload`:

```typescript
// Local state → API payload mapping
{
  assetId: number | null      → asset_id: number
  type: "BUY" | "SELL"        → type: "BUY" | "SELL"
  units: string               → units: number (parseFloat)
  unitPrice: string           → unit_price: number (parseFloat)
  description: string         → description: string | undefined
  year: number                → year: number
  month: number               → month: number
}
```

## Data Flow

### Initial Load
1. RSC `page.tsx` renders `<AccountInvestmentsView accountId={id} />`
2. Component mounts → `useEffect` fetches investments with `limit=30`
3. Sets `allData`, `total`, `nextCursor` from response
4. `InvestmentsTable` renders first 10 rows (client-side pagination)

### Pagination Prefetch
1. User navigates to a page where `pageIndex >= loadedPages - 2`
2. If `nextCursor` exists and not already loading more: fetch next chunk with `cursor` param
3. Append new data to `allData`, update `nextCursor`

### Add Investment
1. User clicks "Add investment" → dialog opens with `AddInvestmentForm`
2. Form fetches assets on mount for dropdown
3. User fills form, clicks submit
4. Client validation passes → POST to API
5. On 201: form resets, `onAdded()` → parent closes dialog and refreshes

### Cancel Investment
1. User clicks cancel action on a non-CANCELLED row
2. Confirm dialog (optional: using `confirm()`)
3. PATCH request with `{ investment_id, action: "cancel" }`
4. On success: refresh table data
5. On failure: display error

## Error Handling

| Scenario | Component | Behavior |
|----------|-----------|----------|
| Investments fetch fails | AccountInvestmentsView | Shows error message via `ErrorMessage` component |
| Assets fetch fails | AddInvestmentForm | Shows "Could not load assets" in dropdown area |
| Client-side validation fails | AddInvestmentForm | Shows inline error, prevents submit |
| API returns 400 (validation/insufficient units) | AddInvestmentForm | Displays API error message |
| API returns 404/500 | AddInvestmentForm | Displays generic "Failed to create investment" |
| Cancel request fails | AccountInvestmentsView | Shows error message |
| Empty investment list | InvestmentsTable | Shows "No investments available." message |

## File Structure

```
apps/web/components/investments/
├── AccountInvestmentsView.tsx    # Client view (state, fetch, dialog, cancel)
├── InvestmentsTable.tsx          # Column defs + ListTable render
└── AddInvestmentForm.tsx         # Dialog form (asset dropdown, type toggle, inputs)

apps/web/app/accounts/[id]/
└── page.tsx                      # RSC — add <AccountInvestmentsView /> import and render
```

## Integration with Account Detail Page

The account detail page (`page.tsx`) will be updated to:
1. Import `AccountInvestmentsView` from `@/components/investments/AccountInvestmentsView`
2. Render it below the transactions section inside a full-width card section:

```typescript
<section className="rounded-lg border bg-card p-4 text-card-foreground">
  <AccountInvestmentsView accountId={accountId} />
</section>
```

This matches the existing pattern used by `AccountTransactionsView`.

## Testing Strategy

- **Property tests**: Validate universal invariants — column completeness for any row data, pagination math, visual differentiation mapping, form payload construction, client-side validation rejection, form reset behavior, asset dropdown display, and cancel action visibility rules
- **Example tests**: Verify specific interactions — initial data fetch on mount, refresh button re-fetch, dialog open/close flow, loading states, error states, prefetch trigger on page navigation, cancel request flow, and successful submit integration
- **Integration tests**: End-to-end browser tests for full form submission flow and table rendering with real API responses

Property tests target the pure rendering and state-transition logic (column definitions, validation functions, badge mappings). Example tests cover specific user interactions and API integration points.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Table column completeness

For any valid investment row data, the rendered `InvestmentsTable` SHALL produce output containing the asset ticker, type, units, unit price, total amount, status, month, and description columns.

**Validates: Requirements 3.2**

### Property 2: Pagination splits data at page size boundary

For any list of N investment rows where N > 10, the `InvestmentsTable` with `pageSize=10` SHALL display exactly `min(10, remaining)` rows per page, and the total number of pages SHALL equal `ceil(N / 10)`.

**Validates: Requirements 3.3**

### Property 3: Visual differentiation for type and status

For any investment row, the rendered type badge SHALL use a distinct variant for BUY versus SELL (never the same), and the rendered status badge SHALL use a distinct variant for each of PENDING, COMPLETED, and CANCELLED (all three different from each other).

**Validates: Requirements 3.5, 3.6**

### Property 4: Form payload construction from valid state

For any valid form state where an asset is selected, units is a positive number, unit price is a positive number, and a month/year is set, the constructed POST payload SHALL contain `asset_id` matching the selected asset, `type` matching the toggle value, `units` as a positive number, `unit_price` as a positive number, and `year`/`month` as integers.

**Validates: Requirements 4.4**

### Property 5: Form validation rejects invalid input

For any form state where asset is not selected, OR units is not a positive number, OR unit price is not a positive number, the form SHALL prevent submission and display a validation error message.

**Validates: Requirements 4.8**

### Property 6: Form reset after successful submission

For any successful form submission (API returns 201), all form fields SHALL return to their initial state (asset unselected, type = BUY, units empty, unit price empty, description empty, month = current month).

**Validates: Requirements 4.7**

### Property 7: Asset dropdown displays ticker and name

For any list of assets returned by the API, the Asset_Dropdown SHALL render each asset option displaying both the ticker and the name.

**Validates: Requirements 5.2**

### Property 8: Cancel action visibility by investment status

For any investment row with status PENDING or COMPLETED, the cancel action SHALL be visible. For any investment row with status CANCELLED, the cancel action SHALL NOT be visible.

**Validates: Requirements 6.1**
