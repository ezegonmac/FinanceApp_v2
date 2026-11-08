# Todos Specification

## Purpose

Todos are the manual-action workflow for non-automated recurrent items and
manual one-offs. Each todo represents a pending expense or transfer that the
user must confirm; completing it performs the real ledger movement. Todos are
listed with due-date gating and can be completed, skipped, or reopened.

## Requirements

### Requirement: TOD-001 List Todos

The system SHALL list todos via `GET /api/todos`, filtered by status (open by
default, with an option to include done), gated to those due in the current
month or earlier, ordered by due date, and paginated.

#### Scenario: List open todos

- **WHEN** the user requests todos without options
- **THEN** the system returns open todos due in the current month or earlier, ordered by due date, with a total count

#### Scenario: Include completed todos

- **WHEN** the user requests todos with the include-done option
- **THEN** the system also returns completed todos

### Requirement: TOD-002 Complete a Todo

The system SHALL complete an open todo via `POST /api/todos/[id]/complete`,
performing the corresponding ledger movement exactly once.

#### Scenario: Complete an expense todo

- **GIVEN** an open expense todo with an amount and account
- **WHEN** the user completes it
- **THEN** the system marks it done, creates a completed expense, decrements the account balance, and recalculates the month snapshot

#### Scenario: Complete a transaction todo

- **GIVEN** an open transaction todo with an amount and both accounts
- **WHEN** the user completes it
- **THEN** the system marks it done, creates a completed transfer, moves the balance between accounts, and recalculates both snapshots

#### Scenario: Idempotent completion

- **WHEN** a completion request loses the status-guarded claim (already not open)
- **THEN** the system does not perform the movement again and reports a conflict

#### Scenario: Completing a previously reopened todo

- **GIVEN** a todo that was completed before and later reopened
- **WHEN** it is completed again
- **THEN** the system marks it done without creating a second ledger movement

#### Scenario: Not open

- **WHEN** the user completes a todo that does not exist or is not open
- **THEN** the system returns a 404 status

### Requirement: TOD-003 Skip and Reopen a Todo

The system SHALL allow skipping an open todo (with a reason) and reopening a todo
via `POST /api/todos/[id]/skip` and `POST /api/todos/[id]/reopen`.

#### Scenario: Skip a todo

- **WHEN** the user skips an open todo
- **THEN** the system records it as skipped without performing a ledger movement

#### Scenario: Reopen a todo

- **WHEN** the user reopens a todo
- **THEN** the system returns it to the open state
