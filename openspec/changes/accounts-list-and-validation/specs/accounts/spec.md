# Spec Delta

## MODIFIED Requirements

### Requirement: ACC-002 List Accounts

The system SHALL return the list of accounts via `GET /api/accounts`, excluding
inactive accounts by default and including them only when the caller explicitly
opts in.

#### Scenario: Listing accounts

- **WHEN** the user requests the account list without opting in to inactive accounts
- **THEN** the system returns only active accounts

#### Scenario: Including inactive accounts

- **WHEN** the user requests the account list with the inactive opt-in (e.g. `includeInactive`)
- **THEN** the system returns both active and inactive accounts

### Requirement: ACC-007 Validation Error Reporting

The system SHALL return a 400 status with correctly constructed error details
when an account create or edit request fails validation.

#### Scenario: Validation failure

- **WHEN** an account create or edit request fails validation
- **THEN** the system returns a 400 status with error details built from the correct validation-error structure
