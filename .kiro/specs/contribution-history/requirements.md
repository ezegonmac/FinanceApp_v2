# Requirements Document

## Introduction

Display transaction markers (BUY/SELL) on the asset price chart in the Financial Products page, so the user can visualize when portfolio activity occurred relative to the asset's price history. This feature overlays investment data onto the existing ECharts line chart, providing temporal context for buy/sell decisions against price movements.

## Glossary

- **Price_Chart**: The ECharts line chart component (`PriceChart.tsx`) that renders historical price data for a selected asset over a given timeframe.
- **Transaction_Marker**: A visual indicator (scatter point) placed on the Price_Chart representing a completed investment (BUY or SELL) at the timestamp it occurred.
- **Marker_Group**: A single visual element that represents multiple Transaction_Markers that overlap or are too close together on the chart's pixel space.
- **Contribution_API**: The API endpoint (`GET /api/financial-products/assets/:assetId/investments`) that returns completed investments for a given asset across all accounts, filtered by timeframe.
- **Timeframe**: The user-selected date range for the Price_Chart (e.g., 1W, 1M, 3M, 6M, 1Y, 5Y, ALL).
- **Investment**: A database record representing a BUY or SELL operation for an asset, scoped to an account and month, with status COMPLETED.
- **Chart_Controls**: The UI area above or near the Price_Chart where the user can toggle marker visibility.

## Requirements

### Requirement 1: Fetch Asset Investments

**User Story:** As a user, I want the system to retrieve all my completed investments for a selected asset regardless of which account they belong to, so that I can see my full transaction history on the chart.

#### Acceptance Criteria

1. WHEN the Contribution_API receives a request with a valid asset ID and timeframe, THE Contribution_API SHALL return all Investments with status COMPLETED for that asset across all accounts, filtered to the timeframe date range.
2. WHEN the Contribution_API receives a request with an invalid or non-existent asset ID, THE Contribution_API SHALL return a 404 error response.
3. WHEN the Contribution_API receives a request with missing or invalid parameters, THE Contribution_API SHALL return a 400 error response with validation details.
4. THE Contribution_API SHALL return each Investment with its id, type (BUY or SELL), units, unit_price, total_amount, description, and processed_at timestamp.
5. THE Contribution_API SHALL order results by processed_at timestamp in ascending order.

### Requirement 2: Display Transaction Markers on Chart

**User Story:** As a user, I want to see BUY and SELL markers on the price chart, so that I can understand when I made investment decisions relative to price movements.

#### Acceptance Criteria

1. WHEN the Price_Chart renders with contribution data available, THE Price_Chart SHALL display a Transaction_Marker for each investment at the corresponding timestamp on the x-axis.
2. THE Price_Chart SHALL position each Transaction_Marker at the y-value of the nearest available price point for the marker's timestamp.
3. THE Price_Chart SHALL visually differentiate BUY markers from SELL markers using distinct colors and shapes.
4. WHEN an Investment has a processed_at timestamp that does not match any price point exactly, THE Price_Chart SHALL position the marker at the nearest available chart price.
5. WHEN the selected timeframe changes, THE Price_Chart SHALL display only Transaction_Markers whose processed_at timestamp falls within the new timeframe boundaries.

### Requirement 3: Toggle Marker Visibility

**User Story:** As a user, I want to show or hide transaction markers with a checkbox, so that I can view the clean price chart when markers are not needed.

#### Acceptance Criteria

1. THE Chart_Controls SHALL display a checkbox labeled to indicate transaction marker visibility.
2. WHEN the user unchecks the visibility checkbox, THE Price_Chart SHALL hide all Transaction_Markers and Marker_Groups from the chart.
3. WHEN the user checks the visibility checkbox, THE Price_Chart SHALL display all Transaction_Markers and Marker_Groups for the current timeframe.
4. THE Chart_Controls SHALL default the checkbox to checked (markers visible) when contribution data is available.

### Requirement 4: Show Transaction Details on Interaction

**User Story:** As a user, I want to see transaction details when I interact with a marker, so that I can understand the specifics of each investment.

#### Acceptance Criteria

1. WHEN the user hovers over or clicks a Transaction_Marker, THE Price_Chart SHALL display a tooltip showing the transaction type, units, unit_price, total_amount, and processed_at date.
2. WHEN the user hovers over or clicks a Marker_Group, THE Price_Chart SHALL display a tooltip showing the number of grouped transactions, the combined total_amount, and a breakdown of BUY versus SELL counts.
3. IF a Transaction_Marker has a description, THEN THE tooltip SHALL include the description text.

### Requirement 5: Group Overlapping Markers

**User Story:** As a user, I want overlapping markers to be grouped into a single indicator, so that the chart remains readable even with many transactions.

#### Acceptance Criteria

1. WHEN two or more Transaction_Markers would render within a configurable pixel-distance threshold of each other, THE Price_Chart SHALL merge them into a single Marker_Group.
2. THE Marker_Group SHALL display a count indicator showing how many transactions it represents.
3. THE Marker_Group SHALL use a neutral visual style distinct from individual BUY or SELL markers.
4. WHEN the timeframe or chart size changes, THE Price_Chart SHALL recalculate grouping based on the new pixel density.

### Requirement 6: Handle Edge Cases

**User Story:** As a user, I want the chart to behave gracefully when there are no transactions, unrecognized types, or other boundary conditions, so that the experience remains stable.

#### Acceptance Criteria

1. WHEN an asset has no completed investments within the selected timeframe, THE Price_Chart SHALL render the price line without any Transaction_Markers and hide the visibility checkbox.
2. IF the Contribution_API returns an error, THEN THE Price_Chart SHALL render the price line without markers and not display an error to the user.
3. WHEN an Investment has an unrecognized type value, THE Price_Chart SHALL render it with a generic neutral marker style.
4. WHEN the price chart has no price data at all, THE Price_Chart SHALL not attempt to render any Transaction_Markers.
