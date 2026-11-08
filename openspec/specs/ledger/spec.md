# Ledger Specification

## Purpose

The Ledger capability records one-off financial movements across accounts —
**incomes** (money into an account), **expenses** (money out of an account), and
**transactions** (transfers between two accounts) — and applies their effect to
account balances and monthly snapshots. Each item belongs to a `Month` (year +
month). Whether an item takes effect immediately or waits for the daily job is
decided by comparing its month to the current Europe/Madrid month: current or
past → applied immediately (`COMPLETED`); future → `PENDING` until the daily job
processes it.

## Requirements

### Requirement: LED-001 Create an Income

The system SHALL create incomes scoped to an account and month, applying the
balance effect immediately for the current or a past month and deferring it for
a future month.

#### Scenario: Current or past month income

- **WHEN** the user submits an income for the current month or a past month
- **THEN** the system creates an Income with status COMPLETED
- **AND** increments the account balance by the amount
- **AND** sets processed_at
- **AND** recalculates the MonthSnapshot for that account and month

#### Scenario: Future month income

- **WHEN** the user submits an income for a future month
- **THEN** the system creates an Income with status PENDING
- **AND** does not modify the account balance

#### Scenario: Creation route

- **WHEN** an income is created
- **THEN** the system accepts it via the account-scoped route `POST /api/accounts/[id]/incomes`

### Requirement: LED-002 Create an Expense

The system SHALL create expenses scoped to an account and month, classified by
kind, applying the balance effect immediately for the current or a past month
and deferring it for a future month.

#### Scenario: Current or past month expense

- **WHEN** the user submits an expense for the current month or a past month
- **THEN** the system creates an Expense with status COMPLETED
- **AND** decrements the account balance by the amount
- **AND** sets processed_at
- **AND** recalculates the MonthSnapshot for that account and month

#### Scenario: Future month expense

- **WHEN** the user submits an expense for a future month
- **THEN** the system creates an Expense with status PENDING
- **AND** does not modify the account balance

#### Scenario: Creation route

- **WHEN** an expense is created
- **THEN** the system accepts it via the account-scoped route `POST /api/accounts/[id]/expenses`

### Requirement: LED-003 Create a Transaction (Transfer)

The system SHALL create transfers between two accounts, applying both balance
effects atomically for the current or a past month and deferring them for a
future month.

#### Scenario: Current or past month transfer

- **GIVEN** a source account and a destination account
- **WHEN** the user submits a transfer for the current month or a past month
- **THEN** the system creates a Transaction with status COMPLETED
- **AND** decrements the source balance and increments the destination balance by the amount in a single atomic operation
- **AND** recalculates the MonthSnapshot for both accounts

#### Scenario: Future month transfer

- **WHEN** the user submits a transfer for a future month
- **THEN** the system creates a Transaction with status PENDING
- **AND** does not modify either account balance

#### Scenario: Creation route

- **WHEN** a transfer is created
- **THEN** the system accepts it via `POST /api/transactions`, because a transfer is not owned by a single account

### Requirement: LED-004 Reject Invalid Input

The system SHALL reject invalid ledger input with a client error rather than
creating an item.

> Note: the current amount constraint is `nonnegative` (≥ 0) on creation and
> `positive` (> 0) on edit. Tightening creation to `> 0` is an agreed change
> tracked outside this baseline.

#### Scenario: Validation failure

- **WHEN** a ledger create or edit request fails validation
- **THEN** the system returns a 400 status with error details
- **AND** does not create or modify the item

### Requirement: LED-007 Edit a Ledger Item

The system SHALL allow editing a ledger item, reversing any prior balance effect
and applying the new one atomically, and recalculating all affected snapshots.

#### Scenario: Editing a COMPLETED item

- **WHEN** the user edits a ledger item that is currently COMPLETED
- **THEN** the system reverses the item's prior balance effect before applying the new values, within a single atomic operation

#### Scenario: Edit remains effective

- **WHEN** an edit results in an effective status of COMPLETED (target month is current or past)
- **THEN** the system applies the new balance effect and sets processed_at

#### Scenario: Edit moved to a future month

- **WHEN** an edit moves a COMPLETED item into a future month
- **THEN** the system sets the item to PENDING
- **AND** leaves no residual balance effect

#### Scenario: Snapshot recalculation on edit

- **WHEN** an edit changes the affected account(s) and/or month
- **THEN** the system recalculates the MonthSnapshot for every affected account and month, including both the original and the new month when they differ

#### Scenario: Edit route

- **WHEN** a ledger item is edited
- **THEN** the system accepts it via `PUT /api/{incomes,expenses,transactions}/[id]`

### Requirement: LED-008 Delete a Ledger Item

The system SHALL allow deleting a ledger item, reversing its balance effect when
it was applied, and preserving linked recurrent-run records.

#### Scenario: Deleting a COMPLETED item

- **WHEN** the user deletes a ledger item that is COMPLETED
- **THEN** the system reverses its balance effect within a single atomic operation
- **AND** recalculates the affected MonthSnapshot(s)

#### Scenario: Deleting a PENDING item

- **WHEN** the user deletes a ledger item that is PENDING
- **THEN** the system removes it without any balance change

#### Scenario: Detaching a recurrent-run link

- **WHEN** a ledger item linked to a recurrent run is deleted
- **THEN** the system detaches the recurrent-run link (sets it to null) rather than deleting the run record

#### Scenario: Delete route

- **WHEN** a ledger item is deleted
- **THEN** the system accepts it via `DELETE /api/{incomes,expenses,transactions}/[id]`

### Requirement: LED-009 Process Pending Items via the Daily Job

The system SHALL apply pending items when the daily job runs, using a
status-guarded claim that prevents double application, and continuing past
per-item errors.

#### Scenario: Applying a pending item

- **WHEN** the daily job runs
- **THEN** the system processes each PENDING item for the current month using a status-guarded claim that transitions PENDING→COMPLETED only if still PENDING
- **AND** applies its balance effect, sets processed_at, and links it to the JobRun

#### Scenario: Already-processed item

- **WHEN** a pending item's status-guarded claim does not succeed because it is no longer PENDING
- **THEN** the system skips it without reapplying its balance effect

#### Scenario: Error during processing

- **WHEN** an error occurs while processing a pending item
- **THEN** the system records the processing error on that item
- **AND** continues processing the remaining items

### Requirement: LED-010 Balance Mutation Semantics

The system SHALL keep account balances as the net of completed movements,
mutating them only for COMPLETED items and always atomically with the row write.

#### Scenario: Only completed items affect balance

- **WHEN** a ledger item is created, reversed, edited, or deleted
- **THEN** the system modifies the account balance only for items in the COMPLETED state

#### Scenario: Atomic mutation

- **WHEN** a balance mutation occurs
- **THEN** the system performs it together with its corresponding row write in a single atomic database transaction

#### Scenario: Negative balances permitted

- **WHEN** an expense or outgoing transfer would drive the account balance negative
- **THEN** the system permits the operation

### Requirement: LED-011 MonthSnapshot Aggregation

The system SHALL compute monthly snapshots from completed ledger activity only,
and recalculate them when completed totals change.

#### Scenario: Aggregating completed items

- **WHEN** a MonthSnapshot is computed for an account and month
- **THEN** the system aggregates only COMPLETED items (incomes, expenses, transfers in, transfers out)

#### Scenario: Excluding non-completed items

- **WHEN** a MonthSnapshot is computed
- **THEN** the system excludes non-COMPLETED items from the totals

#### Scenario: Recalculation trigger

- **WHEN** a change alters an account and month's completed totals
- **THEN** the system recalculates that MonthSnapshot

### Requirement: LED-012 Edits in Current and Past Months

The system SHALL allow ledger writes in the current month and any past month.

> Note: current behavior recalculates a previously finalized snapshot and, as a
> side effect, marks it provisional again. Preserving finalized status on
> recalculation is an agreed change tracked outside this baseline.

#### Scenario: Writing to a past month

- **WHEN** the user creates, edits, or deletes a ledger item in the current month or a past month
- **THEN** the system allows the operation and applies the corresponding balance and snapshot effects

### Requirement: LED-013 Canonical Ledger Endpoints

The system SHALL expose a canonical set of ledger endpoints with consistent
validation and method handling.

> Note: some unused top-level routes currently also exist
> (`GET /api/incomes`, `GET /api/expenses`, `POST /api/expenses`,
> `GET /api/transactions`); their removal is an agreed change tracked outside
> this baseline.

#### Scenario: Canonical surface

- **WHEN** a client interacts with the ledger API
- **THEN** per-account create and paginated listing are available at `/api/accounts/[id]/{incomes,expenses,transactions}`
- **AND** detail read/edit/delete are available at `/api/{incomes,expenses,transactions}/[id]`
- **AND** transfer creation is available at `POST /api/transactions`

#### Scenario: Validation and method conventions

- **WHEN** a ledger request is received
- **THEN** the system validates the request body with Zod and returns 400 with details on invalid input
- **AND** returns 404 for a missing item on detail routes
- **AND** exposes an OPTIONS handler returning 405 with an Allow header

### Requirement: LED-014 Analytics-Adjusted Expense Value

The system SHALL support a separate analytics value for expenses only, which
never affects balances or snapshot totals.

#### Scenario: Analytics value is expense-only

- **WHEN** reporting uses item values
- **THEN** the system supports analytics_amount for expenses only
- **AND** incomes and transactions use their actual amount for all reporting

#### Scenario: Analytics value excluded from accounting

- **WHEN** the system mutates an account balance or computes MonthSnapshot totals
- **THEN** it uses amount, never analytics_amount

#### Scenario: Reporting fallback

- **WHEN** a reporting surface configured to use analytics values reads an expense
- **THEN** the system uses the expense's analytics_amount, falling back to amount when it is absent

### Requirement: LED-015 Allow Distinct Identical Items

The system SHALL NOT prevent the user from intentionally creating distinct
ledger items that share identical details.

> Note: a guard against *accidental* duplicate submission is an agreed change
> tracked outside this baseline.

#### Scenario: Two legitimate identical entries

- **WHEN** the user creates two ledger items with identical account, month, amount, and description
- **THEN** the system creates both as distinct items
