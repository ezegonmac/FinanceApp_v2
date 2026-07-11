# Portfolio Exposure Analysis

> Backlog entry: `- Portfolio exposure analysis [spec:portfolio-exposure] 🟨`

## Goal

Provide a look-through analysis of the portfolio to show the user's effective exposure across categories such as sectors and countries, based on the composition of the assets they own.

## Requirements

- The system shall calculate portfolio exposure using the current value and exposure percentages of each owned asset.
- The system shall support sector and country exposure analysis.
- The system shall display both the percentage and monetary value of each portfolio exposure.
- The system shall store monthly asset exposure snapshots for historical analysis.
- The system shall retrieve available exposure data from the configured market data provider.
- The system shall display the percentage of the portfolio covered by available exposure data.
- When a new monthly snapshot is created, the system shall synchronize the latest available exposure data for owned assets.
- If exposure data is unavailable for an asset, the system shall exclude the asset from classified exposure categories and reflect it in the exposure coverage percentage.
- The system shall normalize provider-specific labels using a canonical mapping table stored in the database (`ExposureCategory` model) to avoid duplicate categories.
- For individual equities (stocks), the system shall assign 100% exposure to the stock's own sector and country (derived from the provider's asset profile data).
- For ETFs and funds, the system shall use the provider's breakdown data (e.g., Yahoo Finance `quoteSummary` fund data).
- Exposure calculations shall use the position held at the time the monthly snapshot job runs (snapshot-time position).
- When provider exposure percentages do not total 100%, the system shall store raw percentages as-is and display an "Other / Unclassified" bucket for the remainder.
- The system shall allow admin-triggered re-sync of exposure data for a specific asset and period, overwriting the existing snapshot.

## API Surface

- `GET /api/investments/exposure` — Portfolio-level (cross-account) exposure endpoint.
  - Query params: `type` (SECTOR | COUNTRY), `period` (YYYY-MM, optional — defaults to current month).
  - Returns: array of `{ category, percentage, monetaryValue }` + `coveragePercentage` + `uncoveredValue`.

## UI

- Dedicated page at `/investments/exposure`.
- Displays sector and country breakdowns with percentage and monetary values.
- Shows portfolio exposure coverage percentage (how much of the portfolio has classification data).
- Displays an "Other / Unclassified" bucket when provider data doesn't sum to 100%.

## Acceptance Criteria

Given a portfolio containing assets with sector exposure data
When the portfolio exposure analysis is calculated
Then the system displays the portfolio percentage and monetary value allocated to each sector

Given a portfolio containing assets with country exposure data
When the country exposure analysis is displayed
Then the system aggregates country exposure across all owned assets

Given an owned asset with no available sector exposure data
When the sector exposure analysis is calculated
Then the asset is excluded from classified sectors and the portfolio exposure coverage reflects the missing data

Given a new monthly snapshot is created
When exposure data is available from the market data provider
Then the latest asset exposure percentages are stored for that monthly period

Given an individual equity (stock) in the portfolio
When the exposure analysis is calculated
Then the stock is assigned 100% to its own sector and country

Given provider exposure percentages that do not sum to 100%
When the exposure analysis is displayed
Then the remainder is shown as an "Other / Unclassified" category

Given an admin triggers a re-sync for a specific asset and period
When the re-sync completes
Then the existing exposure snapshot for that asset and period is overwritten with fresh data

## Edge Cases

- An owned asset has no exposure data from any provider.
- Exposure data is available for sectors but not countries, or vice versa.
- Exposure percentages returned by the provider do not total exactly 100% — store raw values, display "Other" bucket.
- An asset has no current market value (excluded from calculation, reflected in coverage).
- The market data provider fails during monthly synchronization — partial sync is acceptable, failed assets are retried on next run.
- Multiple provider exposure labels represent the same sector or country — resolved via the canonical `ExposureCategory` mapping table.
- A monthly exposure snapshot already exists for the asset and period — overwritten only via admin re-sync, otherwise skipped.
- An individual equity has no sector/country in its provider profile — treated as "no exposure data available".

## Out of Scope

- Real-time exposure synchronization.
- Daily or intraday exposure history.
- Manual exposure editing (except admin re-sync).
- FX-adjusted exposure calculations.
- Underlying company / holding look-through analysis.
- Region, currency, market-cap, or asset-class exposure analysis.
- Exposure-based investment recommendations or automatic rebalancing.

## Data Model Notes

- **`ExposureCategory`** — Canonical mapping table for normalized category labels.
  - Fields: `id`, `exposure_type` (SECTOR | COUNTRY), `canonical_key` (normalized slug), `display_name`, `created_at`.
  - Provider-specific labels are mapped to canonical keys during sync.

- **`AssetExposureSnapshot`** — Monthly exposure data per asset.
  - Fields: `id`, `asset_id`, `period` (YYYY-MM or year+month), `exposure_type` (SECTOR | COUNTRY), `category_id` (FK to `ExposureCategory`), `percentage` (Decimal), `provider`, `synced_at`, `created_at`.
  - Composite unique: `[asset_id, period, exposure_type, category_id]`.

- **`ExposureCategoryMapping`** — Maps raw provider labels to canonical categories.
  - Fields: `id`, `provider`, `provider_label`, `category_id` (FK to `ExposureCategory`), `created_at`.
  - Composite unique: `[provider, provider_label, category_id]`.

## Implementation Notes

- Portfolio exposure is calculated by aggregating `AssetExposureSnapshot` records weighted by each asset's current value in the portfolio.
- Exposure coverage percentage = (sum of values for assets with exposure data) / (total portfolio value) × 100.
- Portfolio exposure percentage is calculated against the entire portfolio value, not only the classified portion.
- Reuse the existing monthly snapshot lifecycle — exposure sync runs as part of (or immediately after) the daily job.
- For individual equities, use Yahoo Finance `assetProfile` / `summaryProfile` to get sector and country.
- For funds/ETFs, use Yahoo Finance `quoteSummary` fund breakdown data.
- Exposure snapshots are immutable historical data once finalized, but an admin re-sync can overwrite data for a specific asset + period.
- Initial exposure types are `SECTOR` and `COUNTRY` (extensible via the enum).
