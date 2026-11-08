# Scheduled / Background Jobs Specification

## Purpose

A single daily background job performs end-of-day processing for the current
Europe/Madrid month: applying recurrent and pending items, syncing exposure
data, recalculating current-month snapshots, and finalizing the previous month.
The job is idempotent per day and tracked by a run record. This is a
cross-cutting orchestration concern; the behavior of each processed domain is
owned by its own area.

## Requirements

### Requirement: JOB-001 Daily Job Endpoint

The system SHALL expose the daily job at
`POST /api/internal/jobs/apply-pending-transactions`, authorized by a Bearer
secret.

#### Scenario: Authorized trigger

- **WHEN** the endpoint is called with the correct Bearer secret
- **THEN** the system runs the daily job and returns its result

#### Scenario: Unauthorized trigger

- **WHEN** the endpoint is called without the correct Bearer secret
- **THEN** the system returns a 401 status

### Requirement: JOB-002 Daily Orchestration

The system SHALL, within a single run, apply recurrent items, apply pending
items, sync exposure data, recalculate the current month's snapshots as
provisional, and finalize the previous month's snapshots.

#### Scenario: Full daily run

- **WHEN** the daily job runs for the current Madrid month
- **THEN** the system applies due recurrent and pending items, syncs exposure, recalculates current-month snapshots without finalizing them, and finalizes the previous month's snapshots

#### Scenario: Per-item error isolation

- **WHEN** processing an individual item fails during the run
- **THEN** the system records the failure and continues processing the remaining items

### Requirement: JOB-003 Idempotent Daily Run

The system SHALL run the daily job at most once to completion per job name and
Madrid date, using a run record.

#### Scenario: Already completed today

- **WHEN** the job is triggered again after it has completed for the same Madrid date
- **THEN** the system does not reprocess and reports the run as already completed

#### Scenario: Retry after failure

- **WHEN** the job is triggered after a failed run for the same Madrid date
- **THEN** the system resets the run and processes it again

#### Scenario: Concurrent trigger

- **WHEN** a second trigger races to create a run for the same Madrid date
- **THEN** the system treats the second as already running and does not duplicate processing

### Requirement: JOB-004 Run Record

The system SHALL record each daily run with its status and processed, failed, and
skipped counts.

#### Scenario: Recording a completed run

- **WHEN** the daily job completes
- **THEN** the system marks the run completed with its processed, failed, and skipped counts
