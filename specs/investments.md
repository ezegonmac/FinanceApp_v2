# Investments

> Backlog entry: `- Investments 🟨 [spec:investments]`

## Goal

Allow the user to buy and sell units of tracked assets from any account, reflecting the cash impact on the account balance. Positions are tracked per account.

## Requirements

- The system shall store each investment operation (buy or sell) as an individual record linked to an account and an asset.
- Each investment record shall capture: units purchased/sold, unit price at execution, and total cash amount.
- The system shall support two input modes for creating investments:
  - **Manual mode:** user provides `units` + `unit_price` → system computes `total_amount = units × unit_price`
  - **Amount mode:** user provides `total_amount` (and optionally `executed_at`) → system looks up the asset price at the given date to derive `units` and `unit_price`
- When a BUY is created for the current or a past month, the system shall immediately deduct `total_amount` from the account balance.
- When a SELL is created for the current or a past month, the system shall immediately add `total_amount` to the account balance.
- The system shall allow a BUY even if the account balance is insufficient (negative balances are permitted).
- The system shall prevent a SELL if the user does not hold enough units of that asset in that account (sum of BUY units − sum of SELL units ≥ requested sell units).
- The system shall allow viewing the current position per asset per account (aggregated from individual operations): total units held and total amount invested.
- The system shall calculate the current value of a position using the latest `AssetPrice` for the asset (no realized P&L tracking for now).
- The system shall support listing all investment operations for a given account, filterable by asset.
- The system shall recalculate `MonthSnapshot` after any investment operation that affects account balance.
- Investments for future months follow the same PENDING → COMPLETED lifecycle via the daily job, consistent with transactions.

## Data Model

```
Investment
──────────
id              Int                PK, autoincrement
account_id      Int                FK → Account
asset_id        Int                FK → Asset
month_id        Int                FK → Month
type            InvestmentType     BUY | SELL
units           Decimal(18,6)      number of shares/units
unit_price      Decimal(18,6)      price per unit at execution time
total_amount    Decimal(18,2)      cash impact on account (units × unit_price, rounded)
description     String?
status          InvestmentStatus   PENDING | COMPLETED | CANCELLED
created_at      DateTime
processed_at    DateTime?

enum InvestmentType { BUY, SELL }
enum InvestmentStatus { PENDING, COMPLETED, CANCELLED }
```

### Design Decisions

- `units` and `unit_price` use `Decimal(18,6)` for precision (fractional shares, crypto).
- `total_amount` uses `Decimal(18,2)` to match the rest of the ledger (euros/cents).
- `month_id` ties the operation to the monthly model, consistent with transactions.
- `status` follows the same PENDING/COMPLETED/CANCELLED pattern as transactions.
- PENDING investments (future months) do not affect account balance until processed by the daily job.
- Positions are per-account — the same asset held in two accounts has independent positions.

## Acceptance Criteria

```
Given an account with balance 1000.00
When  the user creates a BUY of 10 units at 50.00 for the current month
Then  an investment record is created with total_amount 500.00 and status COMPLETED
And   the account balance is reduced to 500.00
And   the MonthSnapshot is recalculated
```

```
Given an account with balance 200.00
When  the user creates a BUY of 10 units at 50.00 for the current month
Then  the operation is allowed (balance goes to -300.00)
```

```
Given an account holding 10 units of asset X (from previous buys)
When  the user creates a SELL of 5 units at 60.00 for the current month
Then  an investment record is created with total_amount 300.00 and status COMPLETED
And   the account balance is increased by 300.00
And   the MonthSnapshot is recalculated
```

```
Given an account holding 3 units of asset X
When  the user attempts to SELL 5 units
Then  the system rejects the operation with a validation error
```

```
Given a BUY investment is created for a future month
When  the daily job processes that month
Then  the investment status changes to COMPLETED and the account balance is updated
```

```
Given an account with 2 BUY operations (10 units at 50, 5 units at 60)
When  the user views the position for that asset in that account
Then  the system shows: 15 total units, total invested 800.00, current value based on latest asset price
```

## Edge Cases

- What happens when a PENDING investment is cancelled — mark as CANCELLED, no balance change.
- What happens when the asset has no recent price data — show position with "price unavailable", display only units held and total invested.
- What happens when a user sells all units — position becomes 0, still visible in history but not shown as an active holding.
- What happens if the asset is deleted — investments remain for historical record; cascade only on provider mappings and prices (already defined in Asset model).

## Out of Scope

- Realized P&L / gain-loss tracking on sells.
- Dividends and distributions tracking.
- Automatic rebalancing or recurring investment plans.
- Tax lot selection strategies (FIFO, LIFO).
- Multi-currency conversion (investments assumed in the same currency as the account for now).
- Integration with the recurrent items system (no recurring buys).

## Notes

- The API routes should follow the existing nested pattern: `/api/accounts/[id]/investments` for account-scoped operations.
- A derived "portfolio" view can be built later by aggregating positions across all accounts grouped by asset — no separate Portfolio model needed.
- The daily job should process PENDING investments the same way it handles transactions for the target month.
- Consider adding an `Investment[]` relation to `JobRun` if investments are processed by the cron.
