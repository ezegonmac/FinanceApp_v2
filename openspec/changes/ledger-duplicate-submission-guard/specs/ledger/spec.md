# Spec Delta

## MODIFIED Requirements

### Requirement: LED-015 Allow Distinct Identical Items

The system SHALL guard against accidental duplicate submission of a ledger
create request, and SHALL NOT prevent the user from intentionally creating
distinct ledger items that share identical details.

#### Scenario: Two legitimate identical entries

- **WHEN** the user creates two ledger items with identical account, month, amount, and description
- **THEN** the system creates both as distinct items

#### Scenario: Accidental duplicate submission

- **WHEN** the same ledger create request is submitted repeatedly from a single user action (for example, a double-click or retry)
- **THEN** the system guards against creating a duplicate item from the repeated submission
