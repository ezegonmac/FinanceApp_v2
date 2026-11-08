# Monthly Model & Snapshots Specification

## Purpose

The monthly model anchors every financial item to a `Month` (year + month) and
maintains per-account monthly aggregates (`MonthSnapshot`) and an optional
spending target (`MonthBudget`). Snapshots are derived from completed ledger and
investment activity and have a finalized lifecycle: the current month is kept
provisional and refreshed live, while previous months are finalized (locked).

## Requirements

### Requirement: MON-001 Month Entity

The system SHALL represent each period as a unique `Month` identified by year and
month, and SHALL return months via `GET /api/months` and upsert a month via
`POST /api/months`.

#### Scenario: List months

- **WHEN** the user requests the month list
- **THEN** the system returns months ordered newest first

#### Scenario: Upsert a month

- **WHEN** the user submits a (year, month)
- **THEN** the system returns the existing month or creates it if absent

### Requirement: MON-002 Month Detail Read

The system SHALL return a single month by year and month via
`GET /api/months/[year]/[month]`, validating the path values.

#### Scenario: Read a month

- **WHEN** the user requests a month by year and month
- **THEN** the system returns the corresponding month

#### Scenario: Invalid year or month

- **WHEN** the year or month path value is not a number
- **THEN** the system returns a 400 status

### Requirement: MON-003 Monthly Budget

The system SHALL store an optional spending target per month and allow reading
and upserting it via `GET`/`PUT /api/months/[year]/[month]/budget`.

#### Scenario: Set a budget

- **WHEN** the user submits a non-negative budget amount for a month
- **THEN** the system stores it as that month's budget

#### Scenario: Read a budget that is not set

- **WHEN** the user requests a budget for a month that has none
- **THEN** the system returns a null budget

#### Scenario: Reject a negative budget

- **WHEN** the user submits a negative budget amount
- **THEN** the system rejects the request with a 400 status

### Requirement: MON-004 Month Snapshots

The system SHALL maintain one snapshot per account and month aggregating
completed totals (incomes, expenses, transfers in/out, investments in/out), and
SHALL return them via `GET /api/months/[year]/[month]/snapshots`.

#### Scenario: Read snapshots

- **WHEN** the user requests snapshots for a month
- **THEN** the system returns the per-account snapshot totals for that month

#### Scenario: Current month is refreshed on read

- **WHEN** the user requests snapshots for the current month
- **THEN** the system recalculates active-account snapshots before returning them

### Requirement: MON-005 Snapshot Finalization Lifecycle

The system SHALL keep the current month's snapshots provisional and finalize a
previous month's snapshots (marking them final and recording a closed timestamp)
when the daily job runs.

#### Scenario: Current month provisional

- **WHEN** the daily job recalculates the current month
- **THEN** the resulting snapshots are not finalized

#### Scenario: Previous month finalized

- **WHEN** the daily job runs
- **THEN** the previous month's snapshots are marked finalized with a closed timestamp

### Requirement: MON-006 Month-Scoped Item Reads

The system SHALL provide month-scoped read endpoints for the items belonging to a
month.

#### Scenario: Read month items

- **WHEN** the user requests incomes, expenses, or transactions for a month
- **THEN** the system returns the items belonging to that month
