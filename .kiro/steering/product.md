# Product: Finance App

A personal finance management web application for tracking accounts, income, expenses, and transfers across multiple bank accounts, plus investments and portfolio analysis. Designed for a single user.

> The canonical product name is not yet decided; this file uses neutral terms ("the application", "the project") where a definitive name would otherwise be required.

## Access

- Single-user, credential-based authentication (Auth.js / NextAuth v5) protects the application. Credentials are configured via environment variables (`AUTH_USER_EMAIL`, `AUTH_USER_PASSWORD`); see `.kiro/steering/tech.md` for the full list.
- The internal cron endpoint (`/api/internal/jobs/*`) is authorized separately via a Bearer `CRON_SECRET` rather than a user session.

## Core Features

- **Accounts** — Multiple accounts with balance tracking
- **Expenses & Incomes** — One-off or recurrent, scoped per account and month
- **Transactions** — Account-to-account transfers (one-off or recurrent)
- **Recurrent Items** — Scheduled expenses, incomes, transfers, and investments with ACTIVE/PAUSED/CANCELLED state; runs are tracked in join tables
- **Investments & Portfolio** — Buy/sell operations against tracked assets, positions per account, and portfolio analysis (performance, exposure, comparison, sparklines). Backed by `Investment` / `RecurrentInvestment` models and the `investments/` and `financial-products/` areas.
- **Market Data / Assets** — Tracked financial products (funds, ETFs, ETPs, stocks, crypto) with historical price storage and provider mappings, sourced from Yahoo Finance
- **Monthly Model** — Financial items belong to a `Month` (year + month). A `MonthSnapshot` aggregates per-account/month totals for metrics
- **Todos** — Workflow layer for non-automated recurrent items that require manual user action
- **Metrics** — Balance over time, monthly summaries, account balance series (charts via ECharts)
- **Admin Panel** — Manually trigger the daily cron job, view job run history, toggle debug mode

## Key Business Rules

Confirmed from the data model (`packages/db/prisma/schema.prisma`):

- Recurrent items use `ACTIVE` / `PAUSED` / `CANCELLED` status enums.
- All monetary amounts use `Decimal(18,2)` precision.
- The monthly model is anchored on the `Month` and `MonthSnapshot` models; the daily job is tracked via the `JobRun` model.

Documented intended behavior (described in the README and specs; **not yet verified against the implementation** in this project's discovery — do not treat as confirmed):

- Items created for the current or a past month are immediately `COMPLETED` and the account balance is updated; items for future months are created as `PENDING` and applied later by the daily job.
- `MonthSnapshot` totals are recalculated after mutations, and previous months' snapshots are finalized (locked) after the daily job runs.
- The daily job is idempotent, running once per `(job_name, madrid_date)`.
- "Current date" logic uses the `Europe/Madrid` timezone via `getEuropeMadridDateParts()` from `@repo/utils`.
