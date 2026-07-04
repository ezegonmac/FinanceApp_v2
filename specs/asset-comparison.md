# Feature Name

> Backlog entry: `- Asset comparison mode [spec:asset-comparison] 🟨`

## Goal

Display a chart where the user can select 2–5 assets and compare their percentage performance over a selected timeframe. All assets are normalized to 0% at a common start date.


## Requirements

- The system shall allow selecting between 2 and 5 assets.
- The system shall allow selecting a supported timeframe.
- The system shall normalize each asset to 0% at the effective common start date.
- The system shall display all selected assets on the same chart.
- The system shall reuse the existing price synchronization and coverage logic.
- The system shall use the existing timeframe and display granularity mapping.
- The system shall display the period return for each selected asset.
- When assets have different available historical ranges, the system shall use the latest first available date as the effective common start date.
- If price data is missing, the system shall synchronize the required missing ranges before generating the comparison.

## Acceptance Criteria

```
Given 2–5 assets with available price history
When the user selects a timeframe
Then all assets are displayed on the same chart and normalized to 0% at the effective common start date
```

```
Given selected assets with different historical start dates
When the comparison is generated
Then the latest first available date is used as the common start date for all assets
```

```
Given an asset has missing price coverage
When the comparison is requested
Then the missing price range is synchronized before generating the comparison
```

```
Given a comparison is displayed
When the price series are normalized
Then the period return for each asset is displayed
```

## Edge Cases

- An asset has no historical price data.
- Fewer than 2 assets are selected.
- More than 5 assets are selected.
- Selected assets have different trading calendars or missing dates.
- Price synchronization fails or the market data provider returns no data.
- The effective common start date leaves insufficient data for comparison.

## Out of Scope

- FX-adjusted performance comparison.
- Risk or volatility metrics.
- Benchmark-specific comparison logic.
- Persisting normalized comparison data.
- Comparing more than 5 assets.

## Notes

- Normalize prices using `((price / firstPrice) - 1) * 100`.
- Comparison data is derived from `asset_prices` and should not require an additional database table.
- Reuse the existing logic, price coverage, and synchronization logic.
- Long timeframes should be downsampled using the existing display granularity mapping.
- Do not insert synthetic prices into `asset_prices` to align trading calendars.
- If aligned timestamps are required by the chart, use the last known value at the display/transformation layer.
- Native currency performance is used for v1.
- Consider a service method such as `compareAssets(assetIds[], timeframe)`.
