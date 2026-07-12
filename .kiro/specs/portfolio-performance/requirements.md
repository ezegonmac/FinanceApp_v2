# Requirements Document

## Introduction

The Portfolio Performance feature provides a dedicated page where the user can view how their investments have performed overall and per position. The app currently tracks buy/sell operations and can show current value via the latest price, but lacks a unified view showing gains/losses, returns, or historical portfolio value evolution. This feature fills that gap by computing aggregated performance metrics, per-position breakdowns, time-weighted returns, daily change indicators, and historical value charts.

## Glossary

- **Performance_Page**: The new page at `/investments/performance` that displays portfolio performance data.
- **Performance_API**: The backend endpoint at `/api/investments/performance` that computes and returns portfolio performance data.
- **History_API**: The backend endpoint at `/api/investments/performance/history` that returns historical portfolio value series.
- **Asset_Performance_API**: The backend endpoint at `/api/investments/performance/asset/:assetId` that returns historical position value series for a single asset.
- **Position**: A derived record representing the user's current holding in a specific asset, computed from COMPLETED BUY and SELL operations across all accounts.
- **Portfolio**: The collection of all active positions across all user accounts.
- **Cost_Basis**: The net amount invested in a position (sum of BUY amounts for remaining units, adjusted for sells using average cost method).
- **TWR**: Time-Weighted Return — a performance measure that adjusts for the timing and size of cash flows, computed using the modified Dietz method.
- **Daily_Change**: The difference between the current portfolio or position value and the previous trading day's value.
- **Timeframe**: A user-selectable date range filter for charts: 1M, 3M, 6M, 1Y, YTD, or ALL.
- **Active_Position**: A position where net units held (total bought minus total sold) is greater than zero.
- **Stale_Price**: A price whose timestamp is more than 24 hours old.
- **Portfolio_Chart**: The ECharts area chart showing total portfolio value over time with a total invested baseline.
- **Asset_Chart**: The ECharts area chart showing a single position's value over time with cost basis overlay.
- **Positions_Table**: The TanStack DataTable displaying per-position performance metrics with sortable columns.

## Requirements

### Requirement 1: Aggregated Portfolio Summary

**User Story:** As a user, I want to see a summary of my total portfolio performance at a glance, so that I can quickly understand my overall investment results.

#### Acceptance Criteria

1. WHEN the user visits the Performance_Page, THE Performance_API SHALL compute total invested as the sum of `total_amount` for all COMPLETED BUY operations minus the sum of `total_amount` for all COMPLETED SELL operations across all accounts.
2. WHEN the user visits the Performance_Page, THE Performance_API SHALL compute total current value as the sum of (units held × latest price) for each Active_Position.
3. WHEN the user visits the Performance_Page, THE Performance_Page SHALL display summary cards showing: total invested, total current value, total unrealized gain/loss in EUR, total unrealized gain/loss as a percentage, TWR, and Daily_Change as a badge.
4. THE Performance_API SHALL compute total unrealized gain/loss in EUR as `total_current_value - total_invested`.
5. THE Performance_API SHALL compute total unrealized gain/loss percentage as `(total_current_value - total_invested) / total_invested × 100`.
6. THE Performance_API SHALL aggregate positions across all user accounts into a single global portfolio view.

### Requirement 2: Daily Change Computation

**User Story:** As a user, I want to see how much my portfolio changed today, so that I can track short-term performance.

#### Acceptance Criteria

1. THE Performance_API SHALL compute Daily_Change by comparing the current portfolio value against the previous trading day's portfolio value, using the most recent two days with price data available.
2. WHEN the Daily_Change is computed, THE Performance_Page SHALL display it as a badge formatted as "+€X.XX (+Y.YY%) today" using green for positive values and red for negative values.
3. IF no previous day price data is available, THEN THE Performance_Page SHALL display "—" for the Daily_Change badge.
4. THE Performance_API SHALL compute per-position Daily_Change as the difference between the position's current value and its value at the previous trading day's price.

### Requirement 3: Per-Position Performance Table

**User Story:** As a user, I want to see detailed performance metrics for each of my positions, so that I can evaluate individual asset performance.

#### Acceptance Criteria

1. WHEN the user visits the Performance_Page, THE Positions_Table SHALL display one row per Active_Position showing: asset name, ticker, asset type, total units held, average cost per unit, current price, current value, unrealized gain/loss in EUR, unrealized gain/loss as a percentage, weight in portfolio, and Daily_Change.
2. THE Performance_API SHALL compute average cost per unit as `total_invested_in_asset / total_units_held`, using average cost method for sell adjustments.
3. THE Performance_API SHALL compute position weight as `(position_current_value / total_portfolio_value) × 100`.
4. THE Positions_Table SHALL sort positions by current value descending by default.
5. THE Positions_Table SHALL allow sorting by any column.
6. THE Positions_Table SHALL display positive returns in green and negative returns in red.

### Requirement 4: Portfolio Value Over Time Chart

**User Story:** As a user, I want to see how my portfolio value evolved over time, so that I can understand long-term trends and growth.

#### Acceptance Criteria

1. WHEN the user visits the Performance_Page, THE Portfolio_Chart SHALL display a time-series area chart showing total portfolio value over time.
2. THE History_API SHALL compute portfolio value at each date as the sum of (units held at that date × price at that date) for each asset.
3. THE Portfolio_Chart SHALL overlay a "total invested" reference line showing cumulative cost basis at each point in time.
4. THE Portfolio_Chart SHALL support selectable Timeframes: 1M, 3M, 6M, 1Y, YTD, and ALL.
5. THE History_API SHALL use existing AssetPrice data and the chronological sequence of COMPLETED BUY/SELL operations to compute historical portfolio values.
6. WHEN a date has no price data for an asset, THE History_API SHALL carry forward the last known price for that asset.
7. WHEN a BUY or SELL operation occurs on a given date, THE History_API SHALL use the end-of-day position (post-transaction units × that day's price) for computing portfolio value on that date.

### Requirement 5: Per-Asset Performance Chart

**User Story:** As a user, I want to drill into a specific position and see its value history with buy/sell markers, so that I can understand how individual holdings evolved.

#### Acceptance Criteria

1. WHEN the user expands a position row in the Positions_Table, THE Asset_Chart SHALL display the position value over time (units held at each date × price at that date).
2. THE Asset_Chart SHALL overlay a cost basis line showing cumulative invested amount in that asset at each point in time.
3. THE Asset_Chart SHALL shade the area between the position value line and the cost basis line in green where value exceeds cost and in red where cost exceeds value.
4. THE Asset_Chart SHALL display buy and sell markers on the timeline at the dates of each operation.
5. THE Asset_Chart SHALL support the same selectable Timeframes as the Portfolio_Chart: 1M, 3M, 6M, 1Y, YTD, and ALL.
6. WHEN a position row is expanded, THE Performance_Page SHALL display per-asset summary stats above the chart: units held, average cost, current price, unrealized gain/loss in EUR and percentage, and Daily_Change for that specific position.
7. THE Asset_Performance_API SHALL return the list of BUY/SELL operations for the asset with date, type, units, and total amount.

### Requirement 6: Time-Weighted Return Calculation

**User Story:** As a user, I want to see a return metric that fairly reflects portfolio performance independent of when I added or removed money, so that I can evaluate my investment decisions.

#### Acceptance Criteria

1. THE Performance_API SHALL compute TWR using the modified Dietz method with daily sub-periods between cash flow events.
2. THE Performance_API SHALL treat each COMPLETED BUY or SELL operation as a cash flow event that defines sub-period boundaries.
3. THE Performance_API SHALL compute each sub-period return as `(V_end - V_start) / V_start`, where V_start and V_end are portfolio values at the sub-period boundaries.
4. THE Performance_API SHALL compute the total TWR as `(product of (1 + R_i) for all sub-periods) - 1`, expressed as a percentage.

### Requirement 7: Empty and Edge States

**User Story:** As a user, I want clear feedback when there is no data to display, so that I understand the current state and what actions to take.

#### Acceptance Criteria

1. IF the user has no Active_Positions, THEN THE Performance_Page SHALL display an empty state message: "No active positions. Buy some assets to track performance."
2. IF an asset has no price data available, THEN THE Performance_Page SHALL display "Price unavailable" for that position, show only units held and invested amount, and exclude the position from portfolio value totals.
3. IF an asset's latest price timestamp is more than 24 hours old, THEN THE Performance_Page SHALL display the price_updated_at timestamp and a visual indicator warning the user the price may be stale.
4. THE Performance_API SHALL exclude PENDING and CANCELLED investments from all performance calculations.

### Requirement 8: API Endpoints

**User Story:** As a developer, I want well-defined API endpoints for performance data, so that the frontend can fetch and display portfolio metrics efficiently.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/investments/performance`, THE Performance_API SHALL return a JSON response containing a summary object (total_invested, total_current_value, total_pnl, total_pnl_pct, twr, daily_change, daily_change_pct, previous_value) and an array of position objects.
2. WHEN a GET request is made to `/api/investments/performance/history` with a `timeframe` query parameter, THE History_API SHALL return a JSON response containing a series array of objects with date, portfolio_value, and total_invested fields, and a timeframe field.
3. WHEN a GET request is made to `/api/investments/performance/asset/:assetId` with a `timeframe` query parameter, THE Asset_Performance_API SHALL return a JSON response containing the asset metadata, a summary object with position metrics and daily_change, a series array with date, position_value, and cost_basis fields, an operations array, and a timeframe field.
4. IF an invalid or unsupported timeframe value is provided, THEN THE History_API SHALL default to "1Y".
5. THE Performance_API SHALL validate route parameters using Zod schemas and return HTTP 400 for invalid input.

### Requirement 9: Navigation Integration

**User Story:** As a user, I want to access the performance page from the existing investments navigation, so that I can find it alongside related investment views.

#### Acceptance Criteria

1. THE Performance_Page SHALL be accessible at the route `/investments/performance` alongside the existing `/investments/compare` and `/investments/exposure` routes.
2. THE Performance_Page SHALL be linked from the investments navigation as a "Performance" tab or link.

### Requirement 10: Cost Basis Calculation for Sells

**User Story:** As a user, I want sells to correctly reduce my cost basis using average cost, so that my gain/loss calculations are accurate.

#### Acceptance Criteria

1. WHEN units are sold, THE Performance_API SHALL reduce the cost basis using the average cost method: cost basis reduction = units sold × average cost per unit at time of sale.
2. THE Performance_API SHALL compute average cost per unit as `total_invested / total_units` at the time of each sell operation.
3. THE Performance_API SHALL use only COMPLETED operations when computing cost basis.
