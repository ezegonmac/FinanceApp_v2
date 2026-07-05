# Implementation Plan: Investments UI

## Overview

Implement the investments domain UI following the established View → Table → Form pattern. Create three client components (`AccountInvestmentsView`, `InvestmentsTable`, `AddInvestmentForm`) in `apps/web/components/investments/`, then wire the view into the account detail page. The backend API is already implemented at `/api/accounts/:id/investments` and `/api/financial-products/assets`.

## Tasks

- [x] 1. Create InvestmentsTable component
  - [x] 1.1 Create `apps/web/components/investments/InvestmentsTable.tsx`
    - Define the `InvestmentRow` type matching the API response shape (id, type, units, unit_price, total_amount, description, status, created_at, asset, month)
    - Define `ColumnDef<InvestmentRow>[]` with columns: Asset (ticker, font-medium), Type (Badge — BUY: `info`, SELL: `warning`), Units (tabular-nums), Unit Price (EUR currency), Total (EUR currency), Status (Badge — COMPLETED: `success`, PENDING: `warning`, CANCELLED: `destructive`), Month (formatYearMonth), Description (truncated), Actions (cancel dropdown item, visible when status ≠ CANCELLED)
    - Render via `<ListTable>` from `@/components/ui/list-table` with `enablePagination`, `pageSize={10}`, `totalCount`, `resetKey`, `onPageChange` props
    - Show loading text, error via `<ErrorMessage>`, and empty state "No investments available."
    - Accept `onCancel` prop to trigger cancel flow from parent
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6, 6.1_

  - [ ]* 1.2 Write property test for table column completeness
    - **Property 1: Table column completeness**
    - **Validates: Requirements 3.2**

  - [ ]* 1.3 Write property test for type and status visual differentiation
    - **Property 3: Visual differentiation for type and status**
    - **Validates: Requirements 3.5, 3.6**

  - [ ]* 1.4 Write property test for cancel action visibility
    - **Property 8: Cancel action visibility by investment status**
    - **Validates: Requirements 6.1**

- [x] 2. Create AddInvestmentForm component
  - [x] 2.1 Create `apps/web/components/investments/AddInvestmentForm.tsx`
    - Accept props: `accountId: number`, `onAdded: () => void`, `onCancel?: () => void`
    - Manage local state: assetId, type (default BUY), units, unitPrice, description, month, year, submitting, error, assets list, assetsLoading, assetsError
    - On mount fetch `GET /api/financial-products/assets` to populate Asset dropdown showing "ticker — name" format
    - Show loading placeholder while assets fetch, error message if fetch fails
    - Type toggle (BUY/SELL) using two Button elements with active variant styling
    - Number inputs for units and unit price, text input for description (optional), month/year inputs defaulting to current month
    - Client-side validation: asset selected, units > 0, unitPrice > 0; display error and prevent submit if invalid
    - On submit: POST to `/api/accounts/{accountId}/investments` with either manual mode `{ asset_id, type, units, unit_price, description, year, month }` or amount mode `{ asset_id, type, total_amount, executed_at?, description, year, month }`
    - On 201: reset all fields, call `onAdded()` and `onCancel?.()`
    - On error: parse and display error message
    - Disable all inputs and submit button while submitting
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 5.1, 5.2, 5.3, 5.4_

  - [ ]* 2.2 Write property test for form payload construction
    - **Property 4: Form payload construction from valid state**
    - **Validates: Requirements 4.4**

  - [ ]* 2.3 Write property test for form validation rejection
    - **Property 5: Form validation rejects invalid input**
    - **Validates: Requirements 4.8**

  - [ ]* 2.4 Write property test for form reset after submission
    - **Property 6: Form reset after successful submission**
    - **Validates: Requirements 4.7**

  - [ ]* 2.5 Write property test for asset dropdown display
    - **Property 7: Asset dropdown displays ticker and name**
    - **Validates: Requirements 5.2**

- [x] 3. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Create AccountInvestmentsView and integrate into page
  - [x] 4.1 Create `apps/web/components/investments/AccountInvestmentsView.tsx`
    - Accept `accountId: number` prop, use `'use client'` directive
    - State: allData, total, nextCursor, loading, error, isDialogOpen, refreshKey
    - On mount and refreshKey change: fetch `GET /api/accounts/{accountId}/investments?limit=30`, populate allData/total/nextCursor
    - Render header with "Investments" title, description text, Refresh button, and "Add investment" button opening a Dialog
    - Dialog wraps `<AddInvestmentForm>` with `onAdded` callback that closes dialog and increments refreshKey
    - Prefetch: on page change near end of loaded data with nextCursor present, fetch next chunk and append to allData
    - Cancel: on `onCancel(id)` from table, send `PATCH /api/accounts/{accountId}/investments` with `{ investment_id: id, action: "cancel" }`, refresh on success, show error on failure
    - Pass allData, loading, error, total, resetKey, onPageChange, onCancel to `<InvestmentsTable>`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 3.4, 6.2, 6.3, 6.4_

  - [x] 4.2 Update `apps/web/app/accounts/[id]/page.tsx`
    - Import `AccountInvestmentsView` from `@/components/investments/AccountInvestmentsView`
    - Render below the transactions section inside a `<section className="rounded-lg border bg-card p-4 text-card-foreground">` wrapper
    - _Requirements: 1.1, 1.2, 7.4_

  - [ ]* 4.3 Write property test for pagination boundary
    - **Property 2: Pagination splits data at page size boundary**
    - **Validates: Requirements 3.3**

- [x] 5. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- The backend API is already implemented — no server-side changes are needed
- Follow the existing pattern established by `AccountExpensesView` / `ExpensesTable` / `AddExpenseForm`
- Use `ListTable` from `@/components/ui/list-table` (not `DataTable`) as that's the pattern used by domain tables
- Use `formatYearMonth` from `@repo/utils` for month column formatting
- Use `Badge` variants for type and status columns consistent with the expenses table pattern

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4", "2.2", "2.3", "2.4", "2.5"] },
    { "id": 2, "tasks": ["4.1"] },
    { "id": 3, "tasks": ["4.2", "4.3"] }
  ]
}
```
