# Portfolio Performance

> Backlog entry: `- Portfolio performance [spec:portfolio-performance] 🟨`

## Goal

Provide a dedicated page where the user can see how their investments have performed overall and per position. Currently the app tracks buy/sell operations and can show current value via the latest price, but there is no unified view showing gains/losses, returns, or historical portfolio value evolution. This feature fills that gap.

## Requirements

### Aggregated Portfolio Summary

- The system shall display a summary card at the top of the page with:
  - **Total Invested** — sum of `total_amount` for all COMPLETED BUY operations minus the `total_amount` of all COMPLETED SELL operations (net cost basis).
  - **Total Current Value** — sum of (units held × latest price) across all active positions.
  - **Total Unrealized Gain/Loss (€)** — `current_value - total_invested` per position, summed.
  - **Total Unrealized Gain/Loss (%)** — `(total_current_value - total_invested) / total_invested × 100`.
  - **Daily Change (€ and %)** — difference between today's portfolio value and yesterday's portfolio value. Displayed as a badge like "+€150 (+0.8%) today" in green/red.
- The system shall compute the daily change by comparing the current portfolio value against the previous trading day's value (using the most recent two days with price data available).
- If no previous day data is available (e.g., first day of tracking), the daily change shall display "—".
- The system shall aggregate positions across all accounts (global portfolio view).
- The system shall show a secondary breakdown by account if the user holds positions in multiple accounts.

### Per-Position Performance Table

- The system shall display a table with one row per active position (asset with units > 0), showing:
  - Asset name and ticker
  - Asset type (ETF, Fund, Stock, etc.)
  - Total units held
  - Average cost per unit (total invested in that asset ÷ total units bought, adjusted for sells via cost-basis reduction)
  - Current price (latest `AssetPrice`)
  - Current value (units × current price)
  - Unrealized gain/loss in € (`current_value - cost_basis`)
  - Unrealized gain/loss in % (`(current_price - avg_cost) / avg_cost × 100`)
  - Weight in portfolio (% of total portfolio value)
- The system shall sort positions by current value descending by default.
- The system shall allow sorting by any column.
- The system shall visually distinguish positive (green) and negative (red) returns.

### Portfolio Value Over Time (Chart)

- The system shall display a time-series chart showing the total portfolio value over time.
- The portfolio value at any given date is computed as: `Σ (units_held_at_date × price_at_date)` for each asset.
- The chart shall support selectable timeframes: 1M, 3M, 6M, 1Y, YTD, ALL.
- The chart shall overlay a "total invested" reference line so the user can visually see when their portfolio was above or below their cost basis.
- The system shall compute historical portfolio value using existing `AssetPrice` data and the chronological sequence of BUY/SELL operations.

### Per-Asset Performance Chart

- The system shall allow the user to click/expand a position row to see a dedicated performance chart for that asset.
- The per-asset chart shall plot the **position value over time** (units held at each date × price at that date), not just the raw asset price.
- The chart shall overlay a **cost basis line** showing cumulative invested amount in that asset at each point in time.
- The area between the position value line and the cost basis line shall be shaded green (profit) or red (loss).
- The chart shall show buy/sell markers on the timeline (reuse existing contribution markers pattern).
- The chart shall support the same timeframe selector as the portfolio chart (1M, 3M, 6M, 1Y, YTD, ALL).
- The system shall display per-asset summary stats above the chart: units held, avg cost, current price, P&L (€ and %), simple return, and **daily change** (€ and %) for that specific position.

### Portfolio Returns

- The system shall calculate and display:
  - **Simple return**: `(current_value - total_invested) / total_invested × 100`
  - **Time-weighted return (TWR)**: adjusts for the timing and size of cash flows (deposits/withdrawals), giving a performance measure independent of when money was added or removed.
- TWR shall be computed using the modified Dietz method (daily sub-periods between cash flow events).

## Data Model

No new database models are required. All data is derived from:

- `Investment` (BUY/SELL operations with `units`, `unit_price`, `total_amount`, `executed_at`, `status`)
- `AssetPrice` (historical prices per asset, timestamped)
- `Asset` (metadata: ticker, name, type, currency)

### Derived Computations (API-side)

```
Position {
  asset_id         Int
  asset            { ticker, name, asset_type, currency }
  total_units      Decimal       — net units held (buys - sells)
  total_invested   Decimal       — cost basis (sum of BUY amounts for remaining units)
  avg_cost         Decimal       — total_invested / total_units
  current_price    Decimal       — latest AssetPrice
  current_value    Decimal       — total_units × current_price
  unrealized_pnl   Decimal       — current_value - total_invested
  unrealized_pct   Decimal       — unrealized_pnl / total_invested × 100
  weight           Decimal       — current_value / portfolio_total_value × 100
  price_updated_at DateTime      — timestamp of latest price
}

PortfolioSummary {
  total_invested      Decimal
  total_current_value Decimal
  total_pnl           Decimal
  total_pnl_pct       Decimal
  twr                 Decimal     — time-weighted return
  positions           Position[]
}

PortfolioValuePoint {
  date             String        — YYYY-MM-DD
  portfolio_value  Decimal       — sum of (units_at_date × price_at_date)
  total_invested   Decimal       — cumulative cost basis at that date
}
```

## API Endpoints

### GET `/api/investments/performance`

Returns the full portfolio performance summary with positions.

**Response:**
```json
{
  "summary": {
    "total_invested": "12500.00",
    "total_current_value": "14230.50",
    "total_pnl": "1730.50",
    "total_pnl_pct": "13.84",
    "twr": "15.2",
    "daily_change": "150.30",
    "daily_change_pct": "1.07",
    "previous_value": "14080.20"
  },
  "positions": [
    {
      "asset_id": 1,
      "asset": { "ticker": "VWCE", "name": "Vanguard FTSE All-World", "asset_type": "ETF", "currency": "EUR" },
      "total_units": "25.500000",
      "total_invested": "8500.00",
      "avg_cost": "333.33",
      "current_price": "365.20",
      "current_value": "9312.60",
      "unrealized_pnl": "812.60",
      "unrealized_pct": "9.56",
      "weight": "65.44",
      "price_updated_at": "2026-07-11T00:00:00.000Z"
    }
  ]
}
```

### GET `/api/investments/performance/history?timeframe=1Y`

Returns the historical portfolio value series for charting.

**Query params:**
- `timeframe` — `1M`, `3M`, `6M`, `1Y`, `YTD`, `ALL` (default: `1Y`)

**Response:**
```json
{
  "series": [
    { "date": "2025-07-11", "portfolio_value": "10200.00", "total_invested": "10000.00" },
    { "date": "2025-07-12", "portfolio_value": "10350.00", "total_invested": "10000.00" }
  ],
  "timeframe": "1Y"
}
```

### GET `/api/investments/performance/asset/:assetId?timeframe=1Y`

Returns the historical position value series for a single asset.

**Query params:**
- `timeframe` — `1M`, `3M`, `6M`, `1Y`, `YTD`, `ALL` (default: `1Y`)

**Response:**
```json
{
  "asset": { "id": 1, "ticker": "VWCE", "name": "Vanguard FTSE All-World", "asset_type": "ETF" },
  "summary": {
    "total_units": "15.000000",
    "total_invested": "1550.00",
    "avg_cost": "103.33",
    "current_price": "120.00",
    "current_value": "1800.00",
    "unrealized_pnl": "250.00",
    "unrealized_pct": "16.13",
    "daily_change": "30.00",
    "daily_change_pct": "1.69"
  },
  "series": [
    { "date": "2025-07-11", "position_value": "1200.00", "cost_basis": "1000.00" },
    { "date": "2025-07-12", "position_value": "1210.00", "cost_basis": "1000.00" }
  ],
  "operations": [
    { "date": "2025-03-15", "type": "BUY", "units": "10.000000", "total_amount": "1000.00" },
    { "date": "2025-06-01", "type": "BUY", "units": "5.000000", "total_amount": "550.00" }
  ],
  "timeframe": "1Y"
}
```

## UI Layout

```
/investments/performance
├── Summary Cards (total invested, current value, P&L €, P&L %, TWR, daily change badge)
├── Portfolio Value Chart (ECharts area chart with invested baseline)
│   └── Timeframe selector (1M, 3M, 6M, 1Y, YTD, ALL)
└── Positions Table (DataTable with sortable columns, gain/loss badges, daily change column)
    └── Expandable row → Per-Asset Performance Detail
        ├── Asset summary stats (units, avg cost, current price, P&L, daily change)
        ├── Position Value Chart (ECharts area, green/red shading vs cost basis)
        │   ├── Timeframe selector
        │   └── Buy/Sell markers on timeline
        └── Operations history (mini-table of BUY/SELL for this asset)
```

## Acceptance Criteria

```
Given a user with 2 BUY operations: 10 units of VWCE at €100 and 5 units of VWCE at €110
And   the latest price of VWCE is €120
When  the user visits /investments/performance
Then  the position shows: 15 units, avg cost €103.33, current value €1800, P&L +€250 (+16.13%)
And   the summary shows total invested €1550, current value €1800, total P&L +€250 (+16.13%)
```

```
Given a user with positions in 3 different assets across 2 accounts
When  the user visits /investments/performance
Then  positions are aggregated globally (not per account)
And   each position shows its weight as percentage of total portfolio value
```

```
Given a user with investment history spanning 8 months
When  the user selects the "1Y" timeframe on the chart
Then  the chart displays daily portfolio value points from the earliest investment date
And   a dashed line shows the cumulative invested amount over the same period
```

```
Given an asset whose latest price is more than 24 hours old
When  the position is displayed
Then  the price_updated_at timestamp is shown
And   a visual indicator warns the user the price may be stale
```

```
Given a user with no active positions (all units sold)
When  the user visits /investments/performance
Then  the page shows a friendly empty state: "No active positions. Buy some assets to track performance."
```

```
Given a user's portfolio was worth €14,080 yesterday and is worth €14,230 today
When  the user visits /investments/performance
Then  the summary cards display "+€150.00 (+1.07%) today" in green
And   each position row also shows its individual daily change
```

```
Given a user with one position where the current price is below the average cost
When  the position is displayed
Then  the unrealized P&L is shown in red with a negative value
```

```
Given a user who clicks on a VWCE position row with 2 BUY operations (10u at €100 on March 15, 5u at €110 on June 1)
When  the per-asset chart expands
Then  the chart shows position value starting at €1000 on March 15 (10 × price)
And   on June 1 the line jumps to reflect 15 units × price
And   the cost basis line steps from €1000 to €1550 on June 1
And   buy markers appear on March 15 and June 1
And   the area between the lines is shaded green where value > cost and red where value < cost
```

## Edge Cases

- What happens when an asset has no price data at all — show the position with "Price unavailable", display only units and invested amount, exclude from portfolio value total.
- What happens when the user has positions across multiple currencies — for now, assume all positions are EUR-denominated (per existing spec). Flag as a future enhancement.
- What happens when a SELL reduces units but the user bought at different prices — use average cost basis (total invested ÷ total units) rather than FIFO/LIFO.
- What happens when there are PENDING investments — exclude them from performance calculations (only COMPLETED operations count).
- What happens for the historical chart on days with no price data — carry forward the last known price for that asset.
- What happens on a day a BUY/SELL occurs — the portfolio value uses the end-of-day position (post-transaction units × that day's price).

## Out of Scope

- Realized P&L (tracking gains from completed sells vs. their cost basis).
- Tax lot selection (FIFO, LIFO, specific ID).
- Multi-currency conversion and FX impact.
- Dividend/distribution tracking.
- Benchmark comparison (e.g., vs S&P 500).
- Per-account performance view (only global aggregation for now).
- Portfolio rebalancing suggestions.

## Notes

- The historical portfolio value computation is the most expensive part. It requires iterating over all price points in the selected timeframe and computing units held at each date. This can be optimized by:
  - Sampling daily (one point per day) rather than every price tick.
  - Caching the chronological list of BUY/SELL events and walking forward.
  - For INTRADAY assets, using the last price of each day for the daily series.
- The TWR calculation uses sub-periods between cash flow dates. A cash flow is any BUY or SELL operation. Between flows, the return is `(V_end - V_start) / V_start`. The TWR is the product of `(1 + R_i)` across all sub-periods minus 1.
- The existing `/api/accounts/[id]/investments/positions` endpoint already computes per-account positions. The new performance endpoint aggregates across all accounts and adds the return metrics.
- This page should be accessible from the investments navigation (add a "Performance" tab/link alongside the existing ones).
- Use ECharts for the area chart consistent with the rest of the app.
- Use the `DataTable` component for the positions table, consistent with other tables in the app.
