# Implementation Plan: Investments

## Overview

Implement the Investments feature following the existing ledger pattern: Prisma model with status lifecycle, nested API routes under `/api/accounts/[id]/investments`, MonthSnapshot integration for investment cash flows, and a daily job processor for pending items. The implementation builds incrementally from schema → shared services → API routes → wiring.

## Tasks

- [x] 1. Add Investment model and enums to Prisma schema
  - [x] 1.1 Add InvestmentType enum (BUY, SELL), InvestmentStatus enum (PENDING, COMPLETED, CANCELLED), and the Investment model with all fields and indexes to `packages/db/prisma/schema.prisma`
    - Add `investments Investment[]` relation to Account, Asset, Month, and JobRun models
    - Add `total_investments_out` and `total_investments_in` Decimal fields (default 0) to MonthSnapshot
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 7.1, 7.2, 8.1_

  - [x] 1.2 Generate and apply the Prisma migration
    - Run `npx prisma migrate dev --name add_investments` from `packages/db`
    - Run `npm run db:generate` to regenerate the Prisma client
    - _Requirements: 1.1, 7.1, 7.2_

- [x] 2. Extend MonthSnapshot recalculation with investment aggregation
  - [x] 2.1 Extend `recalculateMonthSnapshot` in `apps/web/app/api/_lib/snapshots/recalculateMonthSnapshot.ts`
    - Add two new aggregate queries for COMPLETED BUY (total_investments_out) and COMPLETED SELL (total_investments_in) to the existing `Promise.all`
    - Include the new fields in the upsert create/update data
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 2.2 Extend `recalculateAllSnapshotsForMonth` to include accounts with investment activity
    - Query distinct account_ids from Investment where month_id and status COMPLETED, add them to the accountIds set
    - _Requirements: 7.3_

- [x] 3. Implement the investments API route (GET, POST, PATCH)
  - [x] 3.1 Create `apps/web/app/api/accounts/[id]/investments/route.ts` with POST handler for creating BUY/SELL investments
    - Define Zod schema for request validation (asset_id, type, units, unit_price, description, year, month)
    - Verify account exists (404), verify asset exists (404)
    - Compute total_amount = round(units × unit_price, 2)
    - Upsert Month record, classify as current/past or future
    - For SELL: validate sufficient units held (sum completed BUY units − sum completed SELL units ≥ requested units) → 400 if insufficient
    - Current/past month: create COMPLETED in $transaction, update balance, call recalculateMonthSnapshot
    - Future month: create PENDING, no balance change
    - Return 201 with created Investment
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 8.1, 8.3, 8.4, 8.5_

  - [x] 3.2 Add PATCH handler for cancelling investments to the same route file
    - Define Zod cancel schema (investment_id, action: "cancel")
    - Find investment, verify belongs to account → 404
    - Already CANCELLED → 400 error
    - PENDING: set CANCELLED, no balance change
    - COMPLETED: in $transaction set CANCELLED and reverse balance (increment for BUY, decrement for SELL), then recalculateMonthSnapshot
    - Return 200 with updated Investment
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 8.3_

  - [x] 3.3 Add GET handler for listing investments with cursor-based pagination
    - Accept query params: asset_id (optional filter), cursor, limit (default 30, max 100)
    - Order by month.year DESC, month.month DESC, created_at DESC, id DESC
    - Return { data, total, nextCursor }
    - Include month and asset relations in response
    - _Requirements: 5.1, 5.2, 5.3, 8.1_

  - [x] 3.4 Add OPTIONS handler returning 405 with Allow: "GET, POST, PATCH"
    - _Requirements: 8.1_

  - [x] 3.5 Write property tests for investment creation and cancellation
    - **Property 1: Total amount computation** — verify round(units × unit_price, 2) for arbitrary positive decimals
    - **Property 2: Current/past month operations complete immediately with correct balance change**
    - **Property 3: Future month operations are pending with no balance change**
    - **Property 4: SELL is rejected when insufficient units**
    - **Property 5: Cancellation reverses balance for COMPLETED, preserves balance for PENDING**
    - **Validates: Requirements 1.1, 1.2, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4**

- [x] 4. Implement the positions API route
  - [x] 4.1 Create `apps/web/app/api/accounts/[id]/investments/positions/route.ts` with GET handler
    - Query all COMPLETED investments for the account, group by asset_id
    - Compute total_units = sum(BUY units) − sum(SELL units), exclude zero positions
    - Compute total_invested = sum(BUY total_amount)
    - Fetch latest AssetPrice per asset
    - Compute current_value = total_units × latest_price (null if no price)
    - Return response with asset details (ticker, name, asset_type, currency)
    - Add OPTIONS handler returning 405 with Allow: "GET"
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 8.2_

  - [x] 4.2 Write property tests for position computation
    - **Property 6: Position units held equals BUY minus SELL**
    - **Property 7: Position market value computation**
    - **Validates: Requirements 6.2, 6.4, 6.5, 6.6**

- [x] 5. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement the daily job processor for pending investments
  - [x] 6.1 Create `apps/web/app/api/_lib/jobs/processors/pendingInvestments.ts`
    - Export `applyPendingInvestmentsForMonth(monthId, jobRunId)` following the same claim-update-balance pattern as `pendingItems.ts`
    - For each PENDING investment in the month: claim via updateMany, update balance (decrement for BUY, increment for SELL), set processed_at and job_run_id
    - On error: record processing_error, increment failed count
    - Return ProcessCounts { processed, failed, skipped }
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 6.2 Wire the new processor into the daily job orchestrator
    - Import and invoke `applyPendingInvestmentsForMonth` alongside existing pending item processors
    - Snapshot recalculation after all processors (existing behavior) will pick up investment data via the extended recalculateMonthSnapshot
    - _Requirements: 4.1, 4.3_

  - [x] 6.3 Write unit tests for the pending investments processor
    - Test successful processing transitions PENDING → COMPLETED with correct balance
    - Test error recording continues processing remaining items
    - Test skipped count when concurrent claim fails
    - **Property 8: MonthSnapshot investment totals** — after processing, snapshot totals match sum of completed investments
    - **Validates: Requirements 4.1, 4.2, 7.1, 7.2**

- [x] 7. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The implementation language is TypeScript (Next.js API routes + Prisma)
- Follow the exact patterns from the existing `expenses/route.ts` and `pendingItems.ts` processors

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["2.1", "2.2"] },
    { "id": 3, "tasks": ["3.1", "4.1", "6.1"] },
    { "id": 4, "tasks": ["3.2", "3.3", "3.4", "6.2"] },
    { "id": 5, "tasks": ["3.5", "4.2", "6.3"] }
  ]
}
```
