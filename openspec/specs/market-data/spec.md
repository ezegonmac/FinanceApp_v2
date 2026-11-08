# Market Data & Assets Specification

## Purpose

Catalogs tracked financial products (funds, ETFs, ETPs, stocks, crypto) and
maintains their historical price data from an external provider (Yahoo Finance).
Asset identity is de-duplicated by ISIN, with provider-specific symbols stored
separately. Provides asset search, timeframe price queries with on-demand
synchronization, asset comparison, sparklines, and transaction markers on price
charts.

## Requirements

### Requirement: MKT-001 Asset Catalog and Provider Mapping

The system SHALL track assets de-duplicated by ISIN, storing provider symbols in
separate mappings, via `POST /api/financial-products/assets`.

#### Scenario: New asset

- **WHEN** a new asset with an unused ISIN and provider symbol is tracked
- **THEN** the system creates the asset and its provider mapping

#### Scenario: Existing ISIN

- **WHEN** a tracked asset's ISIN already exists
- **THEN** the system returns the existing asset and adds the provider mapping if missing, rather than creating a duplicate

#### Scenario: Existing provider symbol

- **WHEN** the provider symbol is already mapped to an asset
- **THEN** the system returns that existing asset

### Requirement: MKT-002 Price History and Synchronization

The system SHALL store historical prices with a granularity, track synced ranges,
and fetch only missing ranges from the provider.

#### Scenario: Fetch missing ranges

- **WHEN** prices are requested for a range not fully covered
- **THEN** the system fetches only the missing sub-ranges and stores them

#### Scenario: Idempotent coverage

- **WHEN** a range has already been synced
- **THEN** the system does not re-fetch it, even on non-trading days with no price rows

### Requirement: MKT-003 Asset Search

The system SHALL allow searching the provider for trackable assets via
`GET /api/financial-products/search`.

#### Scenario: Search

- **WHEN** the user searches for an asset
- **THEN** the system returns matching provider candidates

### Requirement: MKT-004 Timeframe Price Queries

The system SHALL return an asset's prices for a selected timeframe, synchronizing
missing data first and downsampling long ranges.

#### Scenario: Timeframe query

- **WHEN** the user requests an asset's prices for a timeframe
- **THEN** the system synchronizes any missing data and returns the prices at the appropriate granularity

### Requirement: MKT-005 Asset Comparison

The system SHALL compare the normalized performance of 2–5 assets over a
timeframe via `GET /api/financial-products/compare`.

#### Scenario: Compare assets

- **WHEN** the user compares 2–5 assets over a timeframe
- **THEN** the system normalizes each to 0% at a common start date and returns their series and period returns

### Requirement: MKT-006 Sparklines

The system SHALL return compact one-month normalized price trends for assets via
`GET /api/financial-products/assets/sparklines`.

#### Scenario: Sparklines

- **WHEN** sparklines are requested for assets
- **THEN** the system returns a compact normalized one-month series per asset

### Requirement: MKT-007 Contribution Markers on Price Charts

The system SHALL overlay buy and sell markers from investment operations on an
asset's price chart, grouping dense markers.

#### Scenario: Show markers

- **WHEN** an asset chart is displayed with transaction markers enabled
- **THEN** the system overlays buy and sell markers for operations in the visible timeframe, grouping those that would overlap
