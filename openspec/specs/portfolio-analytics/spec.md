# Portfolio Analytics Specification

## Purpose

Derives read-only, cross-account insight from investment positions and prices:
portfolio performance (gains/losses, returns, value over time) and exposure
(sector and country look-through with coverage). The area owns no write path of
its own except persisting exposure snapshots.

## Requirements

### Requirement: PFA-001 Portfolio Performance Summary

The system SHALL return a cross-account performance summary via
`GET /api/investments/performance`, including per-position cost basis, current
value, unrealized gain/loss, weight, and portfolio totals with a time-weighted
return.

#### Scenario: Performance with active positions

- **WHEN** the user requests portfolio performance with active positions
- **THEN** the system returns each position's invested amount, current value, unrealized gain/loss (amount and percent), and weight, plus portfolio totals and a time-weighted return

#### Scenario: No active positions

- **WHEN** the user requests performance with no active positions
- **THEN** the system returns a zeroed summary with no positions

### Requirement: PFA-002 Portfolio Value History

The system SHALL return the portfolio value over time with a cumulative invested
baseline for a selected timeframe via `GET /api/investments/performance/history`.

#### Scenario: Value history

- **WHEN** the user requests the value history for a timeframe
- **THEN** the system returns the portfolio value series and the cumulative invested baseline over that timeframe

### Requirement: PFA-003 Per-Asset Performance

The system SHALL return the performance of a single asset's position over time
via `GET /api/investments/performance/asset/[assetId]`.

#### Scenario: Per-asset performance

- **WHEN** the user requests performance for one asset
- **THEN** the system returns the position value over time, the cost-basis line, the operations, and a per-asset summary

### Requirement: PFA-004 Portfolio Exposure

The system SHALL return sector or country exposure aggregated across owned
positions, weighted by current value, with a coverage percentage, via
`GET /api/investments/exposure`.

#### Scenario: Exposure by category

- **WHEN** the user requests exposure for a type and period
- **THEN** the system returns each category's percentage and monetary value, the portfolio coverage percentage, and per-asset coverage

#### Scenario: Incomplete provider data

- **WHEN** an owned asset has no exposure data
- **THEN** the system excludes it from classified categories and reflects it in the coverage percentage

### Requirement: PFA-005 Monthly Exposure Synchronization

The system SHALL store monthly per-asset exposure snapshots, normalizing
provider labels to canonical categories.

#### Scenario: Monthly exposure sync

- **WHEN** exposure is synchronized for an owned asset
- **THEN** the system stores its sector and country percentages for the period, mapping provider labels to canonical categories
