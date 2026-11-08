# Spec Delta

## MODIFIED Requirements

### Requirement: LED-012 Edits in Current and Past Months

The system SHALL allow ledger writes in the current month and any past month.
When such a write recomputes a MonthSnapshot that was previously finalized
(`is_final = true`), the system SHALL recompute the snapshot totals while keeping
the snapshot finalized.

#### Scenario: Writing to a past month

- **WHEN** the user creates, edits, or deletes a ledger item in the current month or a past month
- **THEN** the system allows the operation and applies the corresponding balance and snapshot effects

#### Scenario: Recomputing a finalized snapshot

- **GIVEN** a MonthSnapshot that is finalized (`is_final = true`)
- **WHEN** a ledger write recomputes that snapshot
- **THEN** the system recomputes the totals
- **AND** keeps the snapshot finalized (`is_final` remains true)
