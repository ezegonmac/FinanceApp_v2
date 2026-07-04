# Contribution History

> Backlog entry: `- Contribution history. When viewing an asset chart, overlay small markers showing when you bought [spec:contribution-history] 🟨`

## Goal

Display transaction markers on an asset price chart so the user can visualize when portfolio activity occurred relative to the asset's price history.

## Requirements

- The system shall display transaction markers on an asset price chart.
- The system shall support all transaction types associated with the asset.
- The system shall visually differentiate marker types, such as buys and sells.
- The system shall only display transactions within the currently visible chart timeframe.
- The system shall allow transaction markers to be shown or hidden using a checkbox or similar control.
- The system shall display transaction details when interacting with a marker.
- When multiple transactions occur on the same day or near the same chart position, the system shall group them to avoid overlapping markers.
- When the price chart is downsampled, transaction markers shall preserve their original transaction timestamps.
- If a transaction timestamp does not match a price point, the marker shall be positioned using the nearest available chart price.

## Acceptance Criteria

```
Given an asset with transaction history
When the asset price chart is displayed
Then transaction markers are displayed for transactions within the selected timeframe
```

```
Given transaction markers are visible
When the user disables the transaction marker control
Then all transaction markers are hidden from the chart
```

```
Given multiple transactions occur near the same chart position
When the chart is rendered
Then the transactions are grouped into a single visual marker
```

```
Given a transaction marker is displayed
When the user interacts with the marker
Then the transaction type, amount, quantity, date, and original currency are displayed
```

## Edge Cases

- An asset has no transaction history.
- Multiple transactions occur at the same timestamp.
- A transaction occurs on a date with no market price.
- A transaction exists outside the currently selected chart timeframe.
- A large number of transactions would cause overlapping markers.
- A transaction type is not explicitly recognized by the chart UI.
- Price data synchronization fails while loading the chart.

## Out of Scope

- Editing transactions directly from chart markers.
- Creating transactions from the chart.
- Currency conversion for transaction marker values.
- Persisting grouped marker data.
- Modifying historical price data to align transactions.

## Notes

- Transaction markers are derived from `transactions`; no additional database table is required.
- Marker grouping is a display-layer concern and should not modify transaction data.
- Transaction markers should not be downsampled together with price data.
- Use the original transaction timestamp when filtering markers by timeframe.
- Map markers to the nearest available chart price only for visual positioning.
- Group nearby markers dynamically based on chart density and visible timeframe.
- A grouped marker should expose the number of transactions and aggregated amount where meaningful.
- Marker styling should be based on transaction type.
- Unknown or future transaction types should use a generic marker style.
- Consider returning price data and transaction markers in the same asset chart response.
- The transaction marker visibility preference may initially remain local UI state and does not need to be persisted.