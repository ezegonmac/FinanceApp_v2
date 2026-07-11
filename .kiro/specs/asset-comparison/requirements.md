# Requirements Document

## Introduction

A multi-asset percentage performance comparison chart that allows the user to select 2–5 assets and compare their returns over a chosen timeframe. All asset price series are normalized to 0% at a common start date, enabling direct visual comparison of relative performance regardless of absolute price levels. The comparison reuses existing price synchronization, coverage detection, and display granularity infrastructure.

## Glossary

- **Comparison_Service**: The server-side service method (e.g., `compareAssets(assetIds[], timeframe)`) responsible for orchestrating price synchronization, determining the effective common start date, and computing normalized series for each asset.
- **Comparison_Chart**: The ECharts multi-line chart component that renders all normalized asset series on a shared y-axis (percentage) and x-axis (time).
- **Asset_Selector**: The UI component that allows the user to pick between 2 and 5 assets for comparison.
- **Timeframe**: A user-selected date range label. Supported values: TODAY, 1W, 1M, 3M, 6M, 1Y, 5Y, ALL, or CUSTOM (user-specified start and end dates).
- **Custom_Date_Range**: A user-specified explicit start date and end date pair that overrides the preset Timeframe labels. When active, the Timeframe is considered CUSTOM.
- **Effective_Common_Start_Date**: The latest `first available price date` among all selected assets within the resolved timeframe window — the date at which all assets have data and normalization begins.
- **Normalized_Series**: A time series of percentage change values for a single asset, computed as `((price / firstPrice) - 1) * 100` where `firstPrice` is the price at the Effective_Common_Start_Date.
- **Period_Return**: The final value in a Normalized_Series, representing the total percentage gain or loss for that asset over the displayed timeframe.
- **Display_Granularity**: The time resolution (FIFTEEN_MIN, HOURLY, DAILY, WEEKLY) at which prices are shown on the chart, derived from the selected Timeframe and the asset's price frequency via the existing `TIMEFRAME_CONFIG` mapping.
- **Price_Sync**: The existing `syncPrices` algorithm that detects missing price coverage via `computeMissingRanges` and fetches data from Yahoo Finance for any gaps.

## Requirements

### Requirement 1: Select Assets for Comparison

**User Story:** As a user, I want to select multiple assets for comparison, so that I can evaluate their relative performance side by side.

#### Acceptance Criteria

1. THE Asset_Selector SHALL allow the user to select a minimum of 2 and a maximum of 5 assets for comparison.
2. WHEN the user attempts to select fewer than 2 assets and requests a comparison, THE Asset_Selector SHALL prevent the comparison from being generated and indicate that at least 2 assets are required.
3. WHEN the user attempts to select more than 5 assets, THE Asset_Selector SHALL prevent adding beyond 5 and indicate that the maximum has been reached.
4. THE Asset_Selector SHALL allow the user to deselect a previously selected asset, and IF deselection reduces the count below 2, THE comparison SHALL not be generated until the minimum is met again.
5. THE Asset_Selector SHALL prevent selecting the same asset more than once.

### Requirement 2: Select Comparison Timeframe

**User Story:** As a user, I want to select a timeframe for the comparison — either a preset period or a custom date range — so that I can evaluate performance over my desired period.

#### Acceptance Criteria

1. THE Comparison_Chart SHALL support the following Timeframe values: 1W, 1M, 3M, 6M, 1Y, 5Y, ALL, with 1Y selected by default.
2. WHEN the user selects a preset Timeframe, THE Comparison_Service SHALL resolve the date window using the existing `resolveTimeframeDates` function.
3. THE Comparison_Service SHALL derive the Display_Granularity for each asset using the existing `deriveGranularity` function based on the selected Timeframe and the asset's price frequency.
4. IF a Timeframe value outside the supported set (excluding CUSTOM) is submitted to the Comparison_Service, THEN THE Comparison_Service SHALL reject the request with an error indicating the provided timeframe is not supported.
5. THE Comparison_Chart SHALL visually indicate which Timeframe is currently active, deactivating all preset buttons when a Custom_Date_Range is active.
6. THE TimeframeSelector SHALL provide a custom date range picker that allows the user to specify an explicit start date and end date.
7. WHEN the user selects a Custom_Date_Range, THE Comparison_Service SHALL use the provided start and end dates directly as the timeframe window instead of resolving from a preset label.
8. IF the user specifies a Custom_Date_Range where the start date is equal to or after the end date, THEN THE TimeframeSelector SHALL prevent the request and indicate that the start date must be before the end date.
9. WHEN a Custom_Date_Range is active and the user selects a preset Timeframe button, THE system SHALL clear the custom date range and switch to the preset timeframe.
10. THE custom date range functionality SHALL also be applied to the existing Portfolio page (FinancialProductsView) TimeframeSelector, providing the same date picker behavior for single-asset price charts.

### Requirement 3: Determine Effective Common Start Date

**User Story:** As a user, I want all compared assets to start from the same reference point, so that the percentage comparison is meaningful and fair.

#### Acceptance Criteria

1. WHEN selected assets have different first available price dates within the resolved timeframe window, THE Comparison_Service SHALL use the latest first available price date among all selected assets as the Effective_Common_Start_Date.
2. WHEN all selected assets have prices available from the start of the resolved timeframe window, THE Comparison_Service SHALL use the resolved timeframe start date as the Effective_Common_Start_Date.
3. THE Comparison_Service SHALL determine the Effective_Common_Start_Date after Price_Sync has completed for all selected assets.
4. IF the Effective_Common_Start_Date results in fewer than 2 data points at the asset's Display_Granularity for any selected asset (including zero data points), THEN THE Comparison_Service SHALL return an error indicating insufficient data and identifying which asset(s) have fewer than 2 data points. This check takes precedence over the no-data check in AC5.
5. IF no selected asset has any price data within the resolved timeframe window after synchronization and AC4 has not already triggered, THEN THE Comparison_Service SHALL return an error indicating that none of the selected assets have price data for the requested timeframe.

### Requirement 4: Synchronize Missing Price Data

**User Story:** As a user, I want missing price data to be fetched automatically, so that I can compare assets without manual intervention.

#### Acceptance Criteria

1. WHEN a selected asset has missing price coverage for the resolved timeframe window, THE Comparison_Service SHALL invoke the existing Price_Sync algorithm to fetch the missing ranges before computing the Normalized_Series.
2. THE Comparison_Service SHALL synchronize each asset independently using the Display_Granularity derived for that asset, such that a failure in one asset's synchronization does not prevent other assets from completing their synchronization.
3. IF Price_Sync fails for any asset (the upstream provider throws a network or API error), THEN THE Comparison_Service SHALL abort the comparison and return an error that always identifies which specific asset or assets could not be synchronized along with failure details.
4. IF an asset has zero price rows in the asset_prices table for the resolved timeframe window after synchronization completes, THEN THE Comparison_Service SHALL return an error indicating that the asset has no historical price data for the requested timeframe.

### Requirement 5: Normalize Price Series

**User Story:** As a user, I want all assets normalized to 0% at the start, so that I can compare relative performance regardless of absolute price differences.

#### Acceptance Criteria

1. THE Comparison_Service SHALL compute the Normalized_Series for each asset using the formula `((price / firstPrice) - 1) * 100`, where `firstPrice` is the price at the Effective_Common_Start_Date, rounding each resulting value to 2 decimal places.
2. THE Comparison_Service SHALL produce each Normalized_Series starting at exactly 0.00% at the Effective_Common_Start_Date.
3. THE Comparison_Service SHALL use the existing price data from the `asset_prices` table without inserting synthetic values to align trading calendars.
4. WHEN an asset has missing data points within the series due to non-trading days, THE Comparison_Service SHALL carry forward the last known normalized value at the display/transformation layer for chart alignment.
5. IF the price at the Effective_Common_Start_Date for any asset is zero or null, THEN THE Comparison_Service SHALL return an error indicating that normalization cannot be performed for that asset.

### Requirement 6: Display Comparison Chart

**User Story:** As a user, I want to see all assets on one chart with percentage y-axis, so that I can visually identify which assets outperformed or underperformed.

#### Acceptance Criteria

1. THE Comparison_Chart SHALL display all selected assets (2 to 5) as separate lines on a single chart with a shared percentage y-axis normalized to 0% at the effective common start date and a shared time x-axis.
2. THE Comparison_Chart SHALL assign each asset line a visually distinct color and include a legend mapping each color to its asset name.
3. THE Comparison_Chart SHALL display the Period_Return value (total % gain/loss over the period, formatted to two decimal places) for each selected asset within the legend.
4. WHEN the user changes the selected Timeframe, THE Comparison_Chart SHALL recompute and re-render the comparison with the new timeframe parameters.
5. IF a selected asset has no price data point at a given display interval, THEN THE Comparison_Chart SHALL carry forward the last known normalized value for that asset rather than leaving a gap in the line.
6. WHILE the Comparison_Chart is recomputing after a Timeframe change, THE Comparison_Chart SHALL display a loading indicator until the new data is ready to render.

### Requirement 7: Apply Display Granularity Downsampling

**User Story:** As a user, I want long timeframes to use coarser data resolution, so that the chart loads quickly and remains readable.

#### Acceptance Criteria

1. THE Comparison_Service SHALL use the existing TIMEFRAME_CONFIG mapping to determine the Display_Granularity and Yahoo interval for each Timeframe, and SHALL query the `asset_prices` table filtering by the derived granularity value for each asset.
2. WHEN the selected Timeframe maps to WEEKLY granularity (5Y, ALL), THE Comparison_Service SHALL query and display weekly price data points (one data point per calendar week).
3. IF an asset has price frequency DAILY and the selected Timeframe maps to FIFTEEN_MIN or HOURLY granularity (TODAY or 1W), THEN THE Comparison_Service SHALL fall back to DAILY granularity with interval "1d" using the existing `deriveGranularity` logic.
4. WHEN multiple assets are compared and their price frequencies differ, THE Comparison_Service SHALL derive the Display_Granularity independently for each asset based on its own price_frequency, allowing assets within the same comparison to use different granularities.
5. WHEN a Custom_Date_Range is active, THE Comparison_Service SHALL determine the Display_Granularity based on the span of the custom range (number of days between start and end) using the same thresholds as the preset timeframes (e.g., ≤7 days → same as 1W, ≤31 days → same as 1M, ≤365 days → same as 1Y, >365 days → same as 5Y).

