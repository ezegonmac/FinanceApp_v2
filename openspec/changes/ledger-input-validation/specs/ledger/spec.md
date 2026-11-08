# Spec Delta

## MODIFIED Requirements

### Requirement: LED-004 Reject Invalid Input

The system SHALL reject invalid ledger input with a client error rather than
creating an item, and SHALL reject any ledger item whose amount is not greater
than zero on both creation and edit.

#### Scenario: Validation failure

- **WHEN** a ledger create or edit request fails validation
- **THEN** the system returns a 400 status with error details
- **AND** does not create or modify the item

#### Scenario: Non-positive amount on create

- **WHEN** the user submits a ledger item whose amount is not greater than zero
- **THEN** the system rejects it with a 400 status
- **AND** does not create the item

#### Scenario: Non-positive amount on edit

- **WHEN** the user edits a ledger item to an amount that is not greater than zero
- **THEN** the system rejects it with a 400 status
- **AND** does not modify the item

## ADDED Requirements

### Requirement: LED-005 Expense Kind

The system SHALL require every expense to specify a kind of FIXED or VARIABLE,
on both creation and edit.

#### Scenario: Missing kind on create

- **WHEN** the user submits an expense without a kind
- **THEN** the system rejects it with a 400 status
- **AND** does not create the expense

#### Scenario: Kind provided

- **WHEN** the user submits an expense with a kind of FIXED or VARIABLE
- **THEN** the system accepts the kind and creates the expense

### Requirement: LED-006 Account and Self-Transfer Validation

The system SHALL reject ledger items that reference a non-existent account, and
SHALL reject a transfer whose source and destination accounts are the same.

#### Scenario: Non-existent account

- **WHEN** a ledger create request references an account that does not exist
- **THEN** the system rejects the operation with a 404 (or 400) status instead of a server error

#### Scenario: Self-transfer on create

- **WHEN** the user submits a transfer whose source and destination accounts are the same
- **THEN** the system rejects the operation with a 400 status
