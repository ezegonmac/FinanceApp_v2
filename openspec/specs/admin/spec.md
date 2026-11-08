# Administration & Debug Specification

## Purpose

Operational surface for the single user to run and inspect the daily job,
re-sync portfolio exposure data for a specific asset and period, and toggle a
debug UI mode that reveals additional table columns. This is a cross-cutting
operational concern behind the application's session authentication.

## Requirements

### Requirement: ADM-001 Trigger the Daily Job

The system SHALL allow an administrator to run the daily job from the admin panel
and report its outcome.

#### Scenario: Run the job from admin

- **WHEN** the administrator triggers the daily job
- **THEN** the system runs the same daily orchestration as the scheduled endpoint and reports processed, failed, and skipped counts (and whether it had already run)

### Requirement: ADM-002 View Job Run History

The system SHALL display the history of daily job runs in the admin panel.

#### Scenario: View job runs

- **WHEN** the administrator opens the admin panel
- **THEN** the system displays past job runs with their status and counts

### Requirement: ADM-003 Debug Mode

The system SHALL provide a client-side debug mode that, when enabled, reveals
additional diagnostic columns in data tables, persisted per browser.

#### Scenario: Toggle debug mode

- **WHEN** the user enables debug mode
- **THEN** the system reveals additional diagnostic columns and remembers the setting for that browser

### Requirement: ADM-004 Admin Exposure Re-sync

The system SHALL allow an administrator to re-sync portfolio exposure data for a
specific asset and period, overwriting the existing exposure snapshot with fresh
provider data, via `POST /api/admin/exposure-resync`.

#### Scenario: Re-sync exposure

- **WHEN** the administrator triggers a re-sync for an asset and period
- **THEN** the system fetches fresh exposure data and overwrites that asset's exposure snapshot for the period

#### Scenario: Provider has no data

- **WHEN** the provider returns no exposure data for the asset
- **THEN** the system reports the failure without overwriting with empty data
