# Product: Precision Ledger (Finance App)

A personal finance management web application for tracking accounts, income, expenses, and transfers across multiple bank accounts. Designed for a single user (no authentication).

## Core Features

- **Accounts** — Multiple accounts with live balance tracking
- **Expenses & Incomes** — One-off or recurrent, scoped per account and month
- **Transactions** — Account-to-account transfers (one-off or recurrent)
- **Recurrent Items** — Scheduled expenses, incomes, and transfers with ACTIVE/PAUSED/CANCELLED state; runs are tracked in join tables
- **Monthly Model** — All financial items belong to a `Month` (year + month). A `MonthSnapshot` aggregates totals per account/month for fast metrics
- **Todos** — Workflow layer for non-automated recurrent items that require manual user action
- **Metrics** — Balance over time, monthly summaries, account balance series (charts via ECharts)
- **Admin Panel** — Manually trigger the daily cron job, view job run history, toggle debug mode

## Key Business Rules

- Items created for the current or a past month are immediately `COMPLETED` and the account balance is updated atomically
- Items for future months are created as `PENDING`
- After any mutation, `recalculateMonthSnapshot()` is called to keep snapshots current
- Previous months' snapshots are finalized (locked) after the daily job runs
- All "current date" logic uses `Europe/Madrid` timezone via `getEuropeMadridDateParts()` from `@repo/utils`
- The daily background job is idempotent: one `JobRun` per `(job_name, madrid_date)` — already-run jobs are skipped
- All monetary amounts use `Decimal(18,2)` precision
