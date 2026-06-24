# Feature Name

> Backlog entry: `- Plot data related with different financial products [spec:financial-product-data] 🟨`

## Goal

I want to be able to have historical data from different financial products as ETFs, funds, stocks, ETPs... 

## Requirements

- The system shall retrieve the historical data from a certain API
- The system shall store the historical data locally to prevent requesting the same information multiple times and reducing the wait times
- The system shall allow you to plot different financial product prices.
- The system shall have certain time frames available for filtering these plots. 

## Acceptance Criteria

```
Given [context]
When  [action]
Then  [expected outcome]
```

```
Given [context]
When  [action]
Then  [expected outcome]
```

## Edge Cases

- What happens when ...
- What happens if ...

## Out of Scope

- Things explicitly not covered by this feature.

## Notes

Use Yahoo Finance as the primary source (probably yahoo-finance2)

Benefits:
- Free
- Covers most ETFs, funds, stocks and ETPs
- Provides historical data
- Good enough for a personal project

---

Key decisions

Store historical prices locally in MySQL.
Use a single asset_prices table.
Add a granularity field.
Use Yahoo Finance only for synchronization and missing data.
Keep all historical data under your control.

---

Examples:
Funds
- Fidelity MSCI World (IE00BYX5NX33)
- Vanguard Emerging Markets (IE0031786696)
ETP
- iShares Bitcoin ETP (XS2940466316)

= Funds vs ETFs / ETPs: 
== Funds
Typically provide:

Daily NAV
No meaningful intraday pricing

Recommended storage:
1 price point per day

= ETFs / ETPs
Can provide:

Intraday prices
Hourly updates
Higher-frequency data if desired

Recommended storage:
Hourly intervals at the beggining

---

Suggested Database Design:

assets
------
id
isin
name
asset_type
price_frequency
ticker
currency

Examples:
FUND
ETF
ETP
STOCK
CRYPTO

asset_prices
------------
asset_id
timestamp
price
granularity

Examples of granularity:
DAILY
HOURLY
15MIN

---

Why a Single Price Table?

At first it feels strange to mix:

Daily fund prices
Hourly ETF prices

But ultimately every price record is simply:

asset_id
timestamp
price

Advantages:

Simpler schema
Less conditional logic
Easier querying
Easier future expansion

---

Price Synchronization

asset_price_sync
----------------
asset_id
historical_loaded_until
last_daily_sync
last_intraday_sync

Purpose:

Track downloaded history
Avoid unnecessary API calls
Know when assets were last updated

---

Historical Data Strategy

When a user opens a chart:

Open chart
↓
Do we already have history?
↓
No
↓
Download requested amount of time -> Download last X amount of time (configurable)
↓
Store in MySQL
↓
Render chart


After that:

Incremental updates only instead of repeatedly fetching the entire history.

---

Recommended Indexes
INDEX(asset_id, timestamp)
UNIQUE(asset_id, timestamp, granularity)

Benefits:

Prevent duplicate entries
Fast chart queries
Efficient historical lookups

---

For future features to track the specific investments

Additional Schemas:
assets

investments

asset_prices

asset_price_sync

portfolio_snapshots