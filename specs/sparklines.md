# Feature Name

> Backlog entry: ` - Add sparklines (miniature plots) next to the different assets [spec:sparklines] 🟨`

## Goal

Display a small price trend plot next to each asset for quick visualization. These miniature plots are called sparklines.

## Requirements

- The system shall display a sparkline next to each asset.
- The system shall use the last 1 month of DAILY price data.
- The system shall normalize prices as percentage change from the first available price.
- The system shall return a maximum of approximately 30 points per sparkline.
- The system shall support fetching sparklines for multiple assets in a single request.
- When price coverage is missing, the system shall use the existing price synchronization flow to retrieve the required data.
- If insufficient price data is available, the system shall display the asset without a sparkline.
- The system shall priorityze the asset names. The sparklines will lazyload to prevent them slowdown the page. A flat line will show as a default.

## Acceptance Criteria

```
Given an asset with at least 1 month of price history
When the asset is displayed in an asset list
Then a sparkline representing its 1-month price trend is displayed
```

```
Given multiple assets are displayed
When sparkline data is requested
Then the system retrieves the required price data in a single batch operation
```

```
Given an asset has missing historical price coverage
When its sparkline is requested
Then the missing price range is synchronized before generating the sparkline
```

## Edge Cases

- An asset has no historical price data.
- An asset has only one price point.
- An asset has fewer than 30 price points.
- Price synchronization fails or the market data provider returns no data.

## Out of Scope

- User-selectable sparkline timeframes.
- Intraday sparklines.
- Axes, labels, grids, or interactive tooltips.
- Persisting precomputed sparkline data.

## Notes

- Sparklines are a projection of `asset_prices`; no additional database table is required.
- Use DAILY prices for the last 1 month.
- Normalize each point using `((price / firstPrice) - 1) * 100`.
- Consider a batch service method such as `getAssetSparklines(assetIds[])`.
- Sparkline rendering should remain lightweight and visually minimal.
- The sparkline trend may be used to indicate positive or negative period performance.