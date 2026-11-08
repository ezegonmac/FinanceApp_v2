# Requirements Document — Area B: Ledger (`LED`)

## Introduction

The Ledger area records one-off financial movements across accounts: **incomes**
(money into an account), **expenses** (money out of an account), and
**transactions** (transfers between two accounts). Each item belongs to a
`Month` (year + month) and has a lifecycle status. Whether an item takes effect
immediately or waits for the daily job is decided by comparing its month to the
current Europe/Madrid month: current or past → applied immediately
(`COMPLETED`); future → `PENDING` until the daily job processes it.

This document is the EARS requirements baseline for the Ledger area. It records
the **currently observed behavior** (traced from source) plus the **agreed
target behavior** resolved with the project owner. Each requirement is tagged so
the baseline stays honest about what is implemented today versus what is an
agreed change not yet built.

> **Scope note.** This file is part of the Phase 4 functional-specification
> baseline. When OpenSpec is adopted (Phase 5), these requirements map to
> `openspec/specs/ledger/spec.md`, preserving the `LED` prefix and IDs. It does
> not modify the legacy `specs/` feature notes.

### Requirement ID convention

- Identifiers use the stable prefix **`LED-NNN`**.
- IDs are unique and stable; retired IDs are not reused; edits that preserve the
  underlying behavior keep the same ID.

### Status legend (per requirement)

- **[Implemented]** — verified present in current source.
- **[Target — not yet implemented]** — agreed behavior that differs from current
  code; a follow-up code change is required.
- **[Future]** — an agreed future feature, intentionally not in the current
  baseline.

## Glossary

- **Ledger_System**: The backend subsystem that creates, edits, deletes, lists,
  and processes incomes, expenses, and transactions, and applies their effect to
  account balances.
- **Income**: Money received into a single account.
- **Expense**: Money paid out of a single account; carries a `kind`
  (FIXED or VARIABLE) and an analytics-adjusted value.
- **Transaction**: A transfer of money from one account (source) to another
  (destination).
- **Ledger_Item**: Any income, expense, or transaction.
- **Account**: A financial account with a tracked `balance`.
- **Month**: A (year, month) entity that every ledger item is attached to.
- **MonthSnapshot**: A per-account, per-month aggregate of completed totals used
  for metrics; may be provisional or finalized.
- **Daily_Job**: The scheduled background process that transitions PENDING items
  to COMPLETED, updates balances, and finalizes previous-month snapshots.
- **Current_Month**: The month matching today's date in Europe/Madrid.
- **Past_Month**: Any month before the current month.
- **Future_Month**: Any month after the current month.
- **analytics_amount**: An expense-only value used for spend analytics,
  independent of the actual cash amount.

## Requirements

### Requirement LED-001: Create an Income

**User Story:** As a user, I want to add income to an account for a given month,
so that the account balance reflects the money received.

#### Acceptance Criteria

1. WHEN the user submits an income for the Current_Month or a Past_Month, THE Ledger_System SHALL create an Income with status COMPLETED, increment the Account balance by the amount, set processed_at, and recalculate the MonthSnapshot for that account and month. **[Implemented]**
2. WHEN the user submits an income for a Future_Month, THE Ledger_System SHALL create an Income with status PENDING without modifying the Account balance. **[Implemented]**
3. THE Ledger_System SHALL create incomes via the account-scoped route `POST /api/accounts/[id]/incomes`. **[Implemented]**

#### Scenario: Current-month income

- GIVEN an account with balance 1000.00
- WHEN the user adds an income of 200.00 for the current month
- THEN an Income is created with status COMPLETED
- AND the account balance becomes 1200.00
- AND the MonthSnapshot for that account and month is recalculated

### Requirement LED-002: Create an Expense

**User Story:** As a user, I want to add an expense to an account, so that the
account balance reflects the money spent and the expense is classified for
analytics.

#### Acceptance Criteria

1. WHEN the user submits an expense for the Current_Month or a Past_Month, THE Ledger_System SHALL create an Expense with status COMPLETED, decrement the Account balance by the amount, set processed_at, and recalculate the MonthSnapshot. **[Implemented]**
2. WHEN the user submits an expense for a Future_Month, THE Ledger_System SHALL create an Expense with status PENDING without modifying the Account balance. **[Implemented]**
3. WHEN an expense is created without an explicit analytics value, THE Ledger_System SHALL set analytics_amount equal to amount. **[Target — not yet implemented]** (the account-scoped route and edit route do this; the unused top-level `POST /api/expenses` leaves it NULL and is slated for removal under LED-013.)
4. THE Ledger_System SHALL create expenses via the account-scoped route `POST /api/accounts/[id]/expenses`. **[Implemented]**

### Requirement LED-003: Create a Transaction (Transfer)

**User Story:** As a user, I want to transfer money between two accounts, so that
both balances reflect the movement.

#### Acceptance Criteria

1. WHEN the user submits a transfer for the Current_Month or a Past_Month, THE Ledger_System SHALL create a Transaction with status COMPLETED, decrement the source Account balance and increment the destination Account balance by the amount in a single atomic operation, and recalculate the MonthSnapshot for both accounts. **[Implemented]**
2. WHEN the user submits a transfer for a Future_Month, THE Ledger_System SHALL create a Transaction with status PENDING without modifying either balance. **[Implemented]**
3. THE Ledger_System SHALL create transfers via `POST /api/transactions`; a top-level route is used because a transfer is not owned by a single account. **[Implemented]**

#### Scenario: Current-month transfer

- GIVEN account A with balance 500.00 and account B with balance 100.00
- WHEN the user transfers 150.00 from A to B for the current month
- THEN A becomes 350.00 and B becomes 250.00 atomically
- AND the MonthSnapshot for both A and B is recalculated

### Requirement LED-004: Amount Validation

**User Story:** As a user, I want invalid amounts rejected, so that the ledger
only contains meaningful entries.

#### Acceptance Criteria

1. THE Ledger_System SHALL reject any Ledger_Item whose amount is not greater than zero, on both creation and edit. **[Target — not yet implemented]** (create currently accepts 0 via `nonnegative`; edit already requires `positive`.)
2. WHEN validation fails, THE Ledger_System SHALL return a 400 status with error details. **[Implemented]**

### Requirement LED-005: Expense Kind

**User Story:** As a user, I want each expense classified as fixed or variable,
so that spend analytics are accurate.

#### Acceptance Criteria

1. THE Ledger_System SHALL require every Expense to specify a kind of FIXED or VARIABLE, on both creation and edit. **[Target — not yet implemented]** (create currently defaults a missing kind to FIXED; edit already requires it.)

### Requirement LED-006: Account and Self-Transfer Validation

**User Story:** As a user, I want clear errors when an item references a bad
account or a transfer targets one account, so that mistakes fail cleanly.

#### Acceptance Criteria

1. IF a Ledger_Item references an account that does not exist, THEN THE Ledger_System SHALL reject the operation with a 404 (or 400) status instead of a server error. **[Target — not yet implemented]** (currently surfaces as a caught 500.)
2. IF a transfer's source and destination accounts are the same, THEN THE Ledger_System SHALL reject the operation with a 400 status. **[Target — not yet implemented]** (transaction edit enforces this; transaction create does not.)

### Requirement LED-007: Edit a Ledger Item

**User Story:** As a user, I want to edit an existing ledger item, so that
corrections are reflected in balances and metrics.

#### Acceptance Criteria

1. WHEN the user edits a Ledger_Item that is currently COMPLETED, THE Ledger_System SHALL reverse the item's prior balance effect before applying the new values, within a single atomic operation. **[Implemented]**
2. WHEN an edit results in an effective status of COMPLETED (target month is current or past), THE Ledger_System SHALL apply the new balance effect and set processed_at. **[Implemented]**
3. WHEN an edit moves a COMPLETED item into a Future_Month, THE Ledger_System SHALL set the item to PENDING and leave no residual balance effect. **[Implemented]**
4. THE Ledger_System SHALL recalculate the MonthSnapshot for every affected account and month, including both the original and the new month when they differ. **[Implemented]**
5. THE Ledger_System SHALL edit items via `PUT /api/{incomes,expenses,transactions}/[id]`. **[Implemented]**

#### Scenario: Correcting a past-month expense

- GIVEN a COMPLETED expense of 50.00 in a past month
- WHEN the user edits its amount to 65.00
- THEN the account balance decreases by an additional 15.00 net
- AND the snapshot for that past month is recalculated

### Requirement LED-008: Delete a Ledger Item

**User Story:** As a user, I want to delete a ledger item, so that an erroneous
entry is removed and balances are corrected.

#### Acceptance Criteria

1. WHEN the user deletes a Ledger_Item that is COMPLETED, THE Ledger_System SHALL reverse its balance effect within a single atomic operation and then recalculate the affected MonthSnapshot(s). **[Implemented]**
2. WHEN the user deletes a Ledger_Item that is PENDING, THE Ledger_System SHALL remove it without any balance change. **[Implemented]**
3. WHEN a Ledger_Item that is linked to a recurrent run is deleted, THE Ledger_System SHALL detach the recurrent-run link (set it to null) rather than deleting the run record. **[Implemented]**
4. THE Ledger_System SHALL delete items via `DELETE /api/{incomes,expenses,transactions}/[id]`. **[Implemented]**

### Requirement LED-009: Process Pending Items via the Daily Job

**User Story:** As the system operator, I want pending items applied
automatically when their month becomes current, so that balances update without
manual action.

#### Acceptance Criteria

1. WHEN the Daily_Job runs, THE Ledger_System SHALL process each PENDING item for the current month using a status-guarded claim (transitioning PENDING→COMPLETED only if still PENDING), apply its balance effect, set processed_at, and link it to the JobRun. **[Implemented]**
2. IF a PENDING item's claim does not succeed (already processed), THEN THE Ledger_System SHALL skip it without reapplying its balance effect. **[Implemented]**
3. IF an error occurs while processing a PENDING item, THEN THE Ledger_System SHALL record the processing error on that item and continue processing the remaining items. **[Implemented]**

### Requirement LED-010: Balance Mutation Semantics

**User Story:** As a user, I want the account balance to always reflect the net
of completed movements, so that it is trustworthy.

#### Acceptance Criteria

1. THE Ledger_System SHALL modify Account balance only for items in the COMPLETED state (on completion, reversal, edit, or deletion). **[Implemented]**
2. THE Ledger_System SHALL perform each balance mutation together with its corresponding row write in a single atomic database transaction. **[Implemented]**
3. THE Ledger_System SHALL permit an expense or outgoing transfer even when it drives the Account balance negative. **[Implemented]**

### Requirement LED-011: MonthSnapshot Aggregation

**User Story:** As a user, I want monthly summaries to reflect only completed
ledger activity, so that metrics are consistent.

#### Acceptance Criteria

1. THE Ledger_System SHALL compute a MonthSnapshot by aggregating only COMPLETED items for that account and month (incomes, expenses, transfers in, transfers out). **[Implemented]**
2. THE Ledger_System SHALL exclude non-COMPLETED items (PENDING, and any future CANCELLED items) from MonthSnapshot totals. **[Implemented]**
3. THE Ledger_System SHALL recalculate the MonthSnapshot after any change that alters an account+month's completed totals. **[Implemented]**

### Requirement LED-012: Edits to Finalized Months

**User Story:** As a user, I want to correct past entries even after a month is
closed, without losing the fact that the month was finalized.

#### Acceptance Criteria

1. THE Ledger_System SHALL allow creating, editing, and deleting Ledger_Items in the Current_Month or any Past_Month. **[Implemented]**
2. WHEN a ledger write recomputes a MonthSnapshot that was previously finalized (`is_final = true`), THE Ledger_System SHALL recompute the snapshot totals while keeping the snapshot finalized. **[Target — not yet implemented]** (currently a recalculation silently downgrades the snapshot to provisional.)

### Requirement LED-013: Supported Ledger Endpoints

**User Story:** As a developer, I want a single, consistent set of ledger
endpoints, so that unused routes don't cause inconsistent behavior.

#### Acceptance Criteria

1. THE Ledger_System SHALL support, as the canonical ledger surface: per-account create and paginated listing at `/api/accounts/[id]/{incomes,expenses,transactions}`; detail read/edit/delete at `/api/{incomes,expenses,transactions}/[id]`; and transfer creation at `POST /api/transactions`. **[Implemented]**
2. THE Ledger_System SHALL NOT expose the unused top-level routes `GET /api/incomes`, `GET /api/expenses`, `POST /api/expenses`, and `GET /api/transactions`. **[Target — not yet implemented]** (these handlers currently exist but have no caller and are slated for removal.)
3. THE Ledger_System SHALL validate all request bodies with Zod and return 400 with details on invalid input; return 404 for a missing item on detail routes; and expose an OPTIONS handler returning 405 with an Allow header. **[Implemented]**

### Requirement LED-014: Analytics-Adjusted Expense Value

**User Story:** As a user, I want to record a separate analytics value for an
expense, so that reports can use an adjusted figure without changing the cash
amount.

#### Acceptance Criteria

1. THE Ledger_System SHALL support analytics_amount for expenses only; incomes and transactions SHALL use their actual amount for all reporting. **[Implemented]**
2. THE Ledger_System SHALL NOT use analytics_amount when mutating Account balance or when computing MonthSnapshot totals; those SHALL always use amount. **[Implemented]**
3. WHERE a reporting surface is configured to use analytics values, THE Ledger_System SHALL use an expense's analytics_amount, falling back to amount when it is absent. **[Implemented]**

### Requirement LED-015: Prevent Accidental Duplicate Submission

**User Story:** As a user, I want protection against accidentally submitting the
same item twice, without being blocked from creating genuinely distinct items.

#### Acceptance Criteria

1. THE Ledger_System SHALL guard against accidental duplicate submission of a create request (for example, by preventing repeated submission of the same request from the client). **[Target — not yet implemented]**
2. THE Ledger_System SHALL NOT prevent the user from intentionally creating distinct Ledger_Items that happen to share identical details. **[Implemented]** (no dedup currently blocks this.)

### Requirement LED-016: Soft Delete via CANCELLED (Future)

**User Story:** As a user, I want to cancel a ledger item while keeping its
record, and restore it later, so that I can undo without losing history.

#### Acceptance Criteria

1. WHEN the user cancels a COMPLETED Ledger_Item, THE Ledger_System SHALL reverse its balance effect, set status to CANCELLED, and recalculate the MonthSnapshot (re-finalizing a closed month per LED-012). **[Future]**
2. WHEN the user cancels a PENDING Ledger_Item, THE Ledger_System SHALL set status to CANCELLED without a balance change. **[Future]**
3. THE Ledger_System SHALL clearly mark cancelled items in listings rather than hiding them, and SHALL keep soft-cancel available alongside hard delete. **[Future]**
4. WHEN the user restores a CANCELLED Ledger_Item, THE Ledger_System SHALL reactivate it and re-apply its balance effect if it falls in an effective (current or past) month. **[Future]**

## Traceability Notes

- **[Implemented]** requirements are verified from the Ledger route handlers,
  `pendingItems.ts`, and `recalculateMonthSnapshot.ts`.
- **[Target — not yet implemented]** requirements (LED-002.3, LED-004.1,
  LED-005.1, LED-006, LED-012.2, LED-013.2, LED-015.1) correspond to the agreed
  resolutions of Ledger open questions 1–6; each implies a follow-up code change
  to be scheduled separately.
- **[Future]** requirement LED-016 corresponds to open question 7 (soft delete)
  and belongs on the roadmap, not the current baseline.
- There are currently **no automated tests** for the Ledger area; these
  requirements are the intended basis for that test suite.
