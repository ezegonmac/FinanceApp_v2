# Accounts Specification

## Purpose

Accounts are the root entity of the application: every ledger item, investment,
and monthly snapshot attaches to an account. This capability covers creating,
listing, reading, editing, and enabling/disabling accounts. An account's balance
is derived from completed ledger and investment activity (plus an initial value
set at creation) and is never edited directly; accounts are retired by disabling
them, not deleted.

## Requirements

### Requirement: ACC-001 Create an Account

The system SHALL create an account with a name, optional description, optional
icon, and an initial balance, via `POST /api/accounts`.

#### Scenario: Create with an initial balance

- **WHEN** the user creates an account with a name and an initial balance
- **THEN** the system creates the account with that balance and `active = true`

#### Scenario: Create without a balance

- **WHEN** the user creates an account without specifying a balance
- **THEN** the system creates the account with a balance of 0

#### Scenario: Name is required

- **WHEN** the user submits an account without a non-empty name
- **THEN** the system rejects the request with a 400 status

#### Scenario: Negative initial balance rejected

- **WHEN** the user submits a negative initial balance
- **THEN** the system rejects the request with a 400 status

### Requirement: ACC-002 List Accounts

The system SHALL return the list of accounts via `GET /api/accounts`.

#### Scenario: Listing accounts

- **WHEN** the user requests the account list
- **THEN** the system returns the accounts

### Requirement: ACC-003 Read a Single Account

The system SHALL return a single account by id via `GET /api/accounts/[id]`,
with clear errors for bad or missing ids.

#### Scenario: Read an existing account

- **WHEN** the user requests an existing account by id
- **THEN** the system returns that account

#### Scenario: Non-numeric id

- **WHEN** the requested id is not a number
- **THEN** the system returns a 400 status

#### Scenario: Missing account

- **WHEN** no account exists with the requested id
- **THEN** the system returns a 404 status

### Requirement: ACC-004 Edit Account Details

The system SHALL update any provided subset of name, description, and icon via
`PATCH /api/accounts/[id]`, and SHALL NOT allow editing the balance through the
account API.

#### Scenario: Edit details

- **WHEN** the user submits changes to name, description, and/or icon
- **THEN** the system updates only the provided fields

#### Scenario: Empty name rejected

- **WHEN** the user submits a name that is empty or whitespace-only
- **THEN** the system rejects the request with a 400 status

#### Scenario: Balance not editable

- **WHEN** the user attempts to edit the balance through the account API
- **THEN** the system does not change the balance

### Requirement: ACC-005 Enable or Disable an Account

The system SHALL enable or disable an account by updating its `active` flag via
`PATCH /api/accounts/[id]`.

#### Scenario: Disable an account

- **GIVEN** an active account
- **WHEN** the user sets it inactive
- **THEN** the account's `active` flag becomes false
- **AND** it is excluded from active balance aggregates

#### Scenario: Re-enable an account

- **GIVEN** an inactive account
- **WHEN** the user sets it active
- **THEN** the account's `active` flag becomes true

### Requirement: ACC-006 Balance Is Derived and Accounts Are Retained

The system SHALL change an account's balance only via its initial value at
creation and via completed ledger and investment activity, and SHALL NOT provide
an account deletion operation.

#### Scenario: No direct balance edit

- **WHEN** a balance change is requested outside of ledger or investment activity
- **THEN** the system provides no account-level operation to perform it

#### Scenario: No deletion

- **WHEN** a client attempts to delete an account
- **THEN** the system provides no deletion operation; retiring is done by disabling

### Requirement: ACC-007 Validation Error Reporting

The system SHALL return a 400 status with error details when an account create
or edit request fails validation.

#### Scenario: Validation failure

- **WHEN** an account create or edit request fails validation
- **THEN** the system returns a 400 status with error details
