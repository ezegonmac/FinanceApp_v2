# Recurrent Items Specification

## Purpose

Recurrent items are templates that generate concrete ledger and investment
entries over time (recurrent incomes, expenses, transactions, and investments).
Each template has a status, an automated flag, an optional active window, and
next-run tracking; each application is recorded in a per-month run log linked to
the generated item. Automated templates are applied by the daily job and
backfilled on creation; non-automated templates generate manual Todos instead.

## Requirements

### Requirement: REC-001 Create a Recurrent Item

The system SHALL create a recurrent template (income, expense, transaction, or
investment) with an amount, optional description, automated flag, status, and an
optional start/end month window, via `POST /api/accounts/[id]/recurrent-<type>`.

#### Scenario: Create a recurrent template

- **WHEN** the user submits a valid recurrent item
- **THEN** the system creates the template with status ACTIVE and automated true by default

#### Scenario: Reject an inverted window

- **WHEN** the user submits an end month earlier than the start month
- **THEN** the system rejects the request with a 400 status

### Requirement: REC-002 Backfill on Creation

The system SHALL apply or schedule a newly created recurrent item for each due
month from its start up to the current month.

#### Scenario: Automated backfill

- **GIVEN** a new automated recurrent item with a start month in the past
- **WHEN** it is created
- **THEN** the system applies it for each due month up to the current month, mutating balances and recording each application in the run log
- **AND** recalculates the affected month snapshots

#### Scenario: Non-automated backfill creates Todos

- **GIVEN** a new non-automated recurrent item
- **WHEN** it is created
- **THEN** the system creates an open Todo for each due month instead of applying it

### Requirement: REC-003 Apply Recurrent Items via the Daily Job

The system SHALL apply due active automated recurrent items when the daily job
runs, once per month per template, advancing next-run tracking.

#### Scenario: Apply a due recurrent item

- **GIVEN** an active, automated recurrent item whose account is active and whose window and next-run are due
- **WHEN** the daily job runs
- **THEN** the system creates the corresponding item as completed, mutates the balance, records the run as applied, and advances the next-run tracking

#### Scenario: Idempotent application

- **WHEN** a recurrent item has already been applied for a month
- **THEN** the system skips it without applying it again

#### Scenario: Error isolation

- **WHEN** applying one recurrent item fails
- **THEN** the system records the run as failed with the error and continues with the remaining items

### Requirement: REC-004 Open-Ended Recurrences

The system SHALL support recurrent items with no end month, applying them
indefinitely while active.

#### Scenario: No end month

- **WHEN** a recurrent item has no end month
- **THEN** the system continues to apply it each due month while it is active

### Requirement: REC-005 Delete a Recurrent Item

The system SHALL delete a recurrent template and its generated history via
`DELETE /api/recurrent-<type>/[id]`, reverting balances for completed children.

#### Scenario: Delete with generated children

- **WHEN** the user deletes a recurrent item
- **THEN** the system reverts the balance effect of its completed child items, deletes the child items and run records, deletes the template, and recalculates the affected snapshots

#### Scenario: Delete a missing template

- **WHEN** the user deletes a recurrent item that does not exist
- **THEN** the system returns a 404 status

### Requirement: REC-006 Run Log

The system SHALL record each application attempt of a recurrent item in a
per-month run log linked to the generated item, with an applied or failed status.

#### Scenario: Recording an application

- **WHEN** a recurrent item is applied for a month
- **THEN** the system records a run for that template and month marked applied and linked to the generated item
