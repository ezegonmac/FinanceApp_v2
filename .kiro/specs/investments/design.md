# Design Document

## Overview

The Investments feature extends the existing financial ledger with asset buy/sell operations. It follows the same architecture as expenses, incomes, and transactions: a Prisma model with a status lifecycle, API routes under the nested account pattern, MonthSnapshot integration, and a daily job processor for pending items.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ apps/web                                                        │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ API Routes                                               │   │
│  │  /api/accounts/[id]/investments        (GET, POST, PATCH)│   │
│  │  /api/accounts/[id]/investments/positions (GET)          │   │
│  └──────────────┬───────────────────────────────────────────┘   │
│                 │                                                │
│  ┌──────────────▼───────────────────────────────────────────┐   │
│  │ Business Logic                                           │   │
│  │  • Zod validation schemas                                │   │
│  │  • Month upsert + temporal classification                │   │
│  │  • Position computation (aggregate BUY-SELL)             │   │
│  │  • Balance update in $transaction                        │   │
│  └──────────────┬───────────────────────────────────────────┘   │
│                 │                                                │
│  ┌──────────────▼───────────────────────────────────────────┐   │
│  │ Shared Services                                          │   │
│  │  • recalculateMonthSnapshot (extended with investments)  │   │
│  │  • Daily Job: applyPendingInvestmentsForMonth            │   │
│  └──────────────┬───────────────────────────────────────────┘   │
│                 │                                                │
├─────────────────┼───────────────────────────────────────────────┤
│ packages/db     │                                               │
│  ┌──────────────▼───────────────────────────────────────────┐   │
│  │ Prisma Schema                                            │   │
│  │  • Investment model                                      │   │
│  │  • InvestmentType enum (BUY, SELL)                       │   │
│  │  • InvestmentStatus enum (PENDING, COMPLETED, CANCELLED) │   │
│  │  • MonthSnapshot (+ total_investments_in/out fields)     │   │
│  │  • Relations: Account, Asset, Month, JobRun              │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### API Route: /api/accounts/[id]/investments/route.ts

Handles GET (list operations), POST (create BUY/SELL), and PATCH (cancel) for investment operations scoped to an account.

### API Route: /api/accounts/[id]/investments/positions/route.ts

Handles GET for aggregated positions per asset within an account.

### Service: recalculateMonthSnapshot (extended)

Extended to aggregate `total_investments_out` (BUY) and `total_investments_in` (SELL) alongside existing income/expense/transaction totals.

### Processor: applyPendingInvestmentsForMonth

Daily job processor that transitions PENDING investments to COMPLETED when their month becomes current. Follows the same claim-update-balance pattern as existing processors.

## Data Models

### New Model: Investment

```prisma
model Investment {
  id               Int              @id @default(autoincrement())
  account_id       Int
  asset_id         Int
  month_id         Int
  job_run_id       Int?
  type             InvestmentType
  units            Decimal          @db.Decimal(18, 6)
  unit_price       Decimal          @db.Decimal(18, 6)
  total_amount     Decimal          @db.Decimal(18, 2)
  description      String?
  status           InvestmentStatus @default(PENDING)
  created_at       DateTime         @default(now())
  processed_at     DateTime?
  processing_error String?

  account Account @relation(fields: [account_id], references: [id])
  asset   Asset   @relation(fields: [asset_id], references: [id])
  month   Month   @relation(fields: [month_id], references: [id])
  job_run JobRun? @relation(fields: [job_run_id], references: [id])

  @@index([account_id, asset_id, status])
  @@index([month_id, status])
  @@index([job_run_id])
}

enum InvestmentType {
  BUY
  SELL
}

enum InvestmentStatus {
  PENDING
  COMPLETED
  CANCELLED
}
```

### Modified Model: MonthSnapshot

Add two new fields:

```prisma
model MonthSnapshot {
  // ... existing fields ...
  total_investments_out Decimal @default(0) @db.Decimal(18,2)
  total_investments_in  Decimal @default(0) @db.Decimal(18,2)
}
```

### Modified Model: Account

Add relation:

```prisma
model Account {
  // ... existing relations ...
  investments Investment[]
}
```

### Modified Model: Asset

Add relation:

```prisma
model Asset {
  // ... existing relations ...
  investments Investment[]
}
```

### Modified Model: Month

Add relation:

```prisma
model Month {
  // ... existing relations ...
  investments Investment[]
}
```

### Modified Model: JobRun

Add relation:

```prisma
model JobRun {
  // ... existing relations ...
  investments Investment[]
}
```

## API Design

### POST /api/accounts/[id]/investments

Creates a BUY or SELL investment operation.

**Request Body (Zod Schema):**

```typescript
const investmentSchema = z.object({
  asset_id: z.number().int().positive(),
  type: z.enum(["BUY", "SELL"]),
  units: z.number().positive(),
  unit_price: z.number().positive(),
  description: z.string().optional(),
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
});
```

**Logic Flow:**

1. Validate request body with Zod → 400 on failure
2. Verify account exists → 404 if not
3. Verify asset exists → 404 if not
4. Compute `total_amount = round(units * unit_price, 2)`
5. Upsert the Month record
6. Classify month as current/past or future
7. **If SELL:** validate sufficient units held (sum completed BUY units − sum completed SELL units ≥ requested units) → 400 if insufficient
8. **If current/past month:**
   - Create Investment with status COMPLETED in a `$transaction`
   - Update Account balance (decrement for BUY, increment for SELL)
   - After transaction: `recalculateMonthSnapshot(accountId, monthId)`
9. **If future month:**
   - Create Investment with status PENDING (no balance change)
10. Return 201 with the created Investment record

**Response:** `201 Created` with Investment JSON

### PATCH /api/accounts/[id]/investments

Cancels an existing investment operation.

**Request Body:**

```typescript
const cancelSchema = z.object({
  investment_id: z.number().int().positive(),
  action: z.literal("cancel"),
});
```

**Logic Flow:**

1. Validate request body → 400 on failure
2. Find the investment, verify it belongs to the account → 404 if not found
3. If already CANCELLED → 400 validation error
4. **If status is PENDING:** set to CANCELLED, no balance change
5. **If status is COMPLETED:**
   - In a `$transaction`: set status to CANCELLED, reverse balance (increment for BUY, decrement for SELL)
   - After transaction: `recalculateMonthSnapshot(accountId, monthId)`
6. Return 200 with updated Investment record

### GET /api/accounts/[id]/investments

Lists investment operations for an account with optional filters and cursor-based pagination.

**Query Params:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `asset_id` | number | — | Filter by asset |
| `cursor` | number | — | Last seen investment ID |
| `limit` | number | 30 | Max items per page (capped at 100) |

**Response:**

```typescript
{
  data: Investment[],      // includes month and asset relations
  total: number,
  nextCursor: number | null
}
```

**Ordering:** month.year DESC, month.month DESC, created_at DESC, id DESC

### GET /api/accounts/[id]/investments/positions

Returns aggregated positions for the account.

**Logic Flow:**

1. Query all COMPLETED investments grouped by asset_id
2. For each asset: compute `total_units = sum(BUY units) - sum(SELL units)`
3. Exclude assets where `total_units === 0`
4. Compute `total_invested = sum(BUY total_amount)`
5. For each remaining asset, fetch the latest AssetPrice
6. Compute `current_value = total_units * latest_price` (or null if no price)

**Response:**

```typescript
{
  data: Array<{
    asset_id: number;
    asset: { id: number; ticker: string; name: string; asset_type: string; currency: string };
    total_units: string;        // Decimal as string
    total_invested: string;     // Decimal as string
    current_value: string | null;
    latest_price: string | null;
    latest_price_at: string | null;  // ISO timestamp
  }>
}
```

## MonthSnapshot Recalculation Extension

The existing `recalculateMonthSnapshot` function is extended to aggregate investment amounts:

```typescript
// Added to the existing Promise.all in recalculateMonthSnapshot:
const [investOutAgg, investInAgg] = await Promise.all([
  prisma.investment.aggregate({
    where: {
      account_id: accountId,
      month_id: monthId,
      status: "COMPLETED",
      type: "BUY",
    },
    _sum: { total_amount: true },
  }),
  prisma.investment.aggregate({
    where: {
      account_id: accountId,
      month_id: monthId,
      status: "COMPLETED",
      type: "SELL",
    },
    _sum: { total_amount: true },
  }),
]);

const totalInvestmentsOut = investOutAgg._sum.total_amount ?? 0;
const totalInvestmentsIn = investInAgg._sum.total_amount ?? 0;
```

These values are included in the upsert create/update for the MonthSnapshot.

## Daily Job Processor

A new processor `applyPendingInvestmentsForMonth` is added to `apps/web/app/api/_lib/jobs/processors/`:

```typescript
// apps/web/app/api/_lib/jobs/processors/pendingInvestments.ts

export async function applyPendingInvestmentsForMonth(
  monthId: number,
  jobRunId: number
): Promise<ProcessCounts> {
  const counts: ProcessCounts = { processed: 0, failed: 0, skipped: 0 };

  const pendingInvestments = await prisma.investment.findMany({
    where: { month_id: monthId, status: "PENDING" },
    orderBy: { id: "asc" },
  });

  for (const pending of pendingInvestments) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const claimResult = await tx.investment.updateMany({
          where: { id: pending.id, status: "PENDING" },
          data: {
            status: "COMPLETED",
            processed_at: new Date(),
            processing_error: null,
            job_run_id: jobRunId,
          },
        });

        if (claimResult.count === 0) return "skipped" as const;

        if (pending.type === "BUY") {
          await tx.account.update({
            where: { id: pending.account_id },
            data: { balance: { decrement: pending.total_amount } },
          });
        } else {
          await tx.account.update({
            where: { id: pending.account_id },
            data: { balance: { increment: pending.total_amount } },
          });
        }

        return "processed" as const;
      });

      if (result === "processed") counts.processed += 1;
      else counts.skipped += 1;
    } catch (error) {
      counts.failed += 1;
      await prisma.investment.updateMany({
        where: { id: pending.id, status: "PENDING" },
        data: { processing_error: getErrorMessage(error) },
      });
    }
  }

  return counts;
}
```

This processor is invoked from the daily job orchestrator alongside existing processors, and snapshot recalculation occurs after all processors complete (existing behavior).

## Position Computation Strategy

Positions are computed on-the-fly via SQL aggregation rather than a materialized table:

```sql
SELECT
  asset_id,
  SUM(CASE WHEN type = 'BUY' AND status = 'COMPLETED' THEN units ELSE 0 END)
    - SUM(CASE WHEN type = 'SELL' AND status = 'COMPLETED' THEN units ELSE 0 END) AS total_units,
  SUM(CASE WHEN type = 'BUY' AND status = 'COMPLETED' THEN total_amount ELSE 0 END) AS total_invested
FROM Investment
WHERE account_id = ? AND status = 'COMPLETED'
GROUP BY asset_id
HAVING total_units > 0
```

In Prisma, this is achieved via `groupBy` with conditional aggregation or a raw query for optimal performance.

## SELL Validation

Before creating a SELL, the system computes available units:

```typescript
const position = await prisma.investment.aggregate({
  where: {
    account_id: accountId,
    asset_id: assetId,
    status: "COMPLETED",
  },
  _sum: { units: true },
});

// Separate BUY and SELL sums for accuracy
const buyUnits = await prisma.investment.aggregate({
  where: { account_id: accountId, asset_id: assetId, status: "COMPLETED", type: "BUY" },
  _sum: { units: true },
});
const sellUnits = await prisma.investment.aggregate({
  where: { account_id: accountId, asset_id: assetId, status: "COMPLETED", type: "SELL" },
  _sum: { units: true },
});

const availableUnits = (buyUnits._sum.units ?? 0) - (sellUnits._sum.units ?? 0);

if (availableUnits < requestedUnits) {
  return NextResponse.json(
    { error: "Insufficient units", available: availableUnits.toString() },
    { status: 400 }
  );
}
```

## Error Handling

| Scenario | HTTP Status | Response |
|----------|-------------|----------|
| Invalid request body (Zod) | 400 | `{ error, details: ZodError }` |
| Account not found | 404 | `{ error: "Account not found" }` |
| Asset not found | 404 | `{ error: "Asset not found" }` |
| Insufficient units for SELL | 400 | `{ error: "Insufficient units", available }` |
| Cancel already-cancelled | 400 | `{ error: "Investment is already cancelled" }` |
| Investment not found | 404 | `{ error: "Investment not found" }` |
| Internal error | 500 | `{ error: "Failed to ..." }` |

## File Structure

```
apps/web/app/api/accounts/[id]/investments/
├── route.ts                    # GET (list), POST (create), PATCH (cancel)
└── positions/
    └── route.ts                # GET (positions aggregation)

apps/web/app/api/_lib/
├── jobs/processors/
│   └── pendingInvestments.ts   # Daily job processor
└── snapshots/
    └── recalculateMonthSnapshot.ts  # Extended with investment aggregation

packages/db/prisma/
└── schema.prisma               # Investment model + enums + relations
```

## Testing Strategy

- **Unit tests**: Verify specific scenarios (cancel already-cancelled, 404 for missing account/asset, daily job error recording, position with no price data)
- **Property tests**: Validate universal invariants across generated inputs (total_amount computation, balance changes, position aggregation, snapshot totals, ordering, filtering, validation rejection)
- **Integration tests**: Verify end-to-end route behavior with real DB (cursor pagination, daily job orchestration)

Property tests target the pure computation and state-transition logic. Unit tests cover edge cases and error paths. Integration tests verify wiring.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Total amount computation

For any valid `units` (positive decimal) and `unit_price` (positive decimal), the computed `total_amount` SHALL equal `round(units × unit_price, 2)`.

**Validates: Requirements 1.4, 2.4**

### Property 2: Current/past month operations complete immediately with correct balance change

For any investment (BUY or SELL) created for the current or a past month, the Investment status SHALL be COMPLETED and the Account balance SHALL change by exactly `-total_amount` for BUY or `+total_amount` for SELL.

**Validates: Requirements 1.1, 2.1**

### Property 3: Future month operations are pending with no balance change

For any investment (BUY or SELL) created for a future month, the Investment status SHALL be PENDING and the Account balance SHALL remain unchanged.

**Validates: Requirements 1.2, 2.2**

### Property 4: SELL is rejected when insufficient units

For any SELL operation where the requested units exceed the available units (sum of completed BUY units minus sum of completed SELL units for that asset in that account), the system SHALL reject the operation.

**Validates: Requirements 2.3**

### Property 5: Cancellation reverses balance for COMPLETED, preserves balance for PENDING

For any PENDING investment that is cancelled, the Account balance SHALL remain unchanged. For any COMPLETED investment that is cancelled, the Account balance SHALL change by `+total_amount` for BUY or `-total_amount` for SELL (the reverse of the original operation).

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 6: Position units held equals BUY minus SELL

For any account and asset combination, the position's `total_units` SHALL equal the sum of `units` from all COMPLETED BUY investments minus the sum of `units` from all COMPLETED SELL investments. Positions with zero total units SHALL be excluded from the active positions response.

**Validates: Requirements 6.2, 6.6**

### Property 7: Position market value computation

For any position with a non-null latest AssetPrice, the `current_value` SHALL equal `total_units × latest_price`. If no AssetPrice exists, `current_value` SHALL be null.

**Validates: Requirements 6.4, 6.5**

### Property 8: MonthSnapshot investment totals

For any account and month, the MonthSnapshot's `total_investments_out` SHALL equal the sum of `total_amount` from all COMPLETED BUY investments for that account and month, and `total_investments_in` SHALL equal the sum of `total_amount` from all COMPLETED SELL investments for that account and month.

**Validates: Requirements 7.1, 7.2**

### Property 9: Investment list ordering

For any investments list response, items SHALL be ordered by month descending (year DESC, month DESC), then by creation date descending, such that no item appears before an item from a later month.

**Validates: Requirements 5.1**

### Property 10: Investment list asset filtering

For any investments list filtered by `asset_id`, every returned Investment record SHALL have an `asset_id` matching the filter parameter.

**Validates: Requirements 5.2**

### Property 11: Zod validation rejects invalid input

For any request body that does not conform to the investment Zod schema (missing required fields, wrong types, non-positive numbers), the system SHALL return HTTP 400 with error details.

**Validates: Requirements 8.3**
