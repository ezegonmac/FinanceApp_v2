# Investments & Positions Specification

## Purpose

Records buy and sell operations of tracked assets per account, applying their
cash impact to the account balance under the same monthly PENDING→COMPLETED
lifecycle as the ledger. Positions (net units held, amount invested, current
value) are derived per account and asset.

## Requirements

### Requirement: INV-001 Create a BUY or SELL Operation

The system SHALL create an investment operation via
`POST /api/accounts/[id]/investments`, accepting either manual mode (units and
unit price) or amount mode (total amount with an execution date whose price is
looked up), after verifying the account and asset exist.

#### Scenario: Manual mode

- **WHEN** the user submits units and a unit price
- **THEN** the system records the operation with total amount equal to units times unit price

#### Scenario: Amount mode

- **WHEN** the user submits a total amount and an execution date
- **THEN** the system derives the units and unit price from the asset's price at that date

#### Scenario: Unknown account or asset

- **WHEN** the operation references an account or asset that does not exist
- **THEN** the system returns a 404 status

### Requirement: INV-002 Operation Lifecycle and Balance Effect

The system SHALL apply the balance effect of an operation in the current or a
past month immediately and defer a future-month operation as pending.

#### Scenario: Current or past month BUY

- **WHEN** a BUY is created for the current month or a past month
- **THEN** the system records it as completed, decrements the account balance by the total amount, and recalculates the month snapshot

#### Scenario: Current or past month SELL

- **WHEN** a SELL is created for the current month or a past month
- **THEN** the system records it as completed, increments the account balance by the total amount, and recalculates the month snapshot

#### Scenario: Future month operation

- **WHEN** an operation is created for a future month
- **THEN** the system records it as pending without changing the balance

### Requirement: INV-003 Sell Unit Validation

The system SHALL reject a SELL whose units exceed the net units held for that
asset in that account.

#### Scenario: Oversized sell

- **WHEN** a SELL requests more units than the net completed BUY-minus-SELL units held
- **THEN** the system rejects it with a 400 status

### Requirement: INV-004 Cancel an Operation

The system SHALL cancel an operation via `PATCH /api/accounts/[id]/investments`,
reversing the balance effect for a completed operation.

#### Scenario: Cancel a pending operation

- **WHEN** the user cancels a pending operation
- **THEN** the system marks it cancelled without changing the balance

#### Scenario: Cancel a completed operation

- **WHEN** the user cancels a completed operation
- **THEN** the system marks it cancelled, reverses its balance effect, and recalculates the month snapshot

#### Scenario: Already cancelled

- **WHEN** the user cancels an operation that is already cancelled
- **THEN** the system returns a 400 status

### Requirement: INV-005 Process Pending Investments via the Daily Job

The system SHALL apply pending investments when their month becomes current
during the daily job, once each.

#### Scenario: Apply a pending investment

- **WHEN** the daily job processes a pending investment for the current month
- **THEN** the system completes it, applies the balance effect, and does not apply it twice

### Requirement: INV-006 View Positions

The system SHALL return aggregated positions per asset for an account via
`GET /api/accounts/[id]/investments/positions`.

#### Scenario: Read positions

- **WHEN** the user requests positions for an account
- **THEN** the system returns, per asset, the net units held, amount invested, and current value from the latest price, excluding assets with zero net units

### Requirement: INV-007 List Operations

The system SHALL list an account's investment operations via
`GET /api/accounts/[id]/investments`, paginated and optionally filtered by asset.

#### Scenario: List operations

- **WHEN** the user requests the investment list for an account
- **THEN** the system returns the operations ordered by month and creation date, paginated, optionally filtered by asset
