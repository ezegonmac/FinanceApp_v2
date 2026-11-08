# Metrics & Reporting Specification

## Purpose

Account- and month-centric financial reporting derived from account balances and
monthly snapshots. All endpoints are read-only aggregations; the area holds no
state of its own and performs no writes.

## Requirements

### Requirement: MET-001 Account Balances

The system SHALL return the current balances of active accounts and their total
via `GET /api/metrics/balances`.

#### Scenario: Read balances

- **WHEN** the user requests balances
- **THEN** the system returns each active account's balance and the overall total

### Requirement: MET-002 Monthly Summary

The system SHALL return a per-month summary of income, expense, and net change
from month snapshots, with a running total anchored to the current total
balance, via `GET /api/metrics/monthly-summary`.

#### Scenario: Read monthly summary

- **WHEN** the user requests the monthly summary
- **THEN** the system returns per-month income, expense, net change, and running total, plus totals and averages

### Requirement: MET-003 Account Balance Series

The system SHALL return each active account's balance over time, reconstructed
from the current balance and each month's snapshot net, via
`GET /api/metrics/account-balance-series`.

#### Scenario: Read balance series

- **WHEN** the user requests the account balance series
- **THEN** the system returns, per account, a balance value for each month with snapshot activity

### Requirement: MET-004 Expenses by Kind

The system SHALL return per-month fixed and variable expense totals (using the
analytics-adjusted value) and the month budget via
`GET /api/metrics/expenses-by-kind`.

#### Scenario: Read expenses by kind

- **WHEN** the user requests expenses by kind
- **THEN** the system returns per-month fixed and variable totals and the month's budget
