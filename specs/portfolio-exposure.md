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


## Edge Cases

- An owned asset has no exposure data.
- Exposure data is available for sectors but not countries, or vice versa.
- Exposure percentages returned by the provider do not total exactly 100%.
- An asset has no current market value.
- The market data provider fails during monthly synchronization.
- Multiple provider exposure labels represent the same sector or country.
- A monthly exposure snapshot already exists for the asset and period.

## Out of Scope

- Real-time exposure synchronization.
- Daily or intraday exposure history.
- Manual exposure editing.
- FX-adjusted exposure calculations.
- Underlying company / holding look-through analysis.
- Region, currency, market-cap, or asset-class exposure analysis.
- Exposure-based investment recommendations or automatic rebalancing.

## Notes

- Portfolio exposure should be derived from asset exposure snapshots and current or monthly portfolio positions.
- Exposure data should be stored monthly rather than synchronized with asset prices.
- Reuse the existing monthly snapshot lifecycle where possible.
- Consider an `asset_exposure_snapshots` model containing `asset_id`, `period`, `exposure_type`, `exposure_key`, `percentage`, and `provider`.
- Initial exposure types are `SECTOR` and `COUNTRY`.
- Normalize provider-specific labels before storing them to avoid duplicate categories such as `Technology` and `technology`.
- Portfolio exposure percentage should be calculated against the entire portfolio value, not only the classified portion.
- Display an exposure coverage percentage to communicate how much of the portfolio has available classification data.
- Exposure snapshots should be immutable historical data once the monthly period is finalized.
- Yahoo Finance `quoteSummary` fund data can be used as the initial exposure source through the existing market data provider abstraction.
