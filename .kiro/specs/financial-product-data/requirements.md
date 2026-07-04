# Requirements Document

## Introduction

This document captures the functional and non-functional requirements for the **Financial Product Data** feature of Precision Ledger. The feature lets the user search for financial assets (ETFs, funds, stocks, ETPs, crypto) via Yahoo Finance, track specific ones locally, and view their historical price charts across multiple timeframes.

Price data is fetched on-demand from Yahoo Finance (`yahoo-finance2`) and stored in MariaDB to avoid redundant API calls. A smart sync algorithm tracks downloaded date ranges and only fetches what is missing, so subsequent chart loads are fast. Storing the user's actual investment positions is explicitly out of scope.

---

## Glossary

- **Asset**: A financial product that can be tracked. Has a unique ticker symbol, a name, an asset type, a price frequency, and a currency.
- **AssetType**: One of `FUND`, `ETF`, `ETP`, `STOCK`, `CRYPTO`.
- **PriceFrequency**: Either `DAILY` (funds — one NAV per trading day) or `INTRADAY` (ETFs, ETPs, stocks, crypto — sub-daily prices available).
- **Granularity**: The resolution at which prices are stored. One of `FIFTEEN_MIN`, `HOURLY`, `DAILY`, `WEEKLY`.
- **Timeframe**: A user-facing chart window. One of `TODAY`, `1W`, `1M`, `3M`, `6M`, `1Y`, `5Y`, `ALL`.
- **SyncRange**: A record in `asset_price_sync_ranges` that marks a fully downloaded `[from, to]` interval for a given asset and granularity.
- **PricePoint**: A single `{ timestamp, price }` tuple returned by the prices API.
- **Yahoo Finance**: The external data provider accessed via the `yahoo-finance2` npm package.
- **Sync Algorithm**: The server-side logic (`priceSyncAlgorithm.ts`) that computes missing ranges, fetches them from Yahoo Finance, upserts prices, and merges sync range records.
- **System**: The Precision Ledger web application (`apps/web`).
- **Prices_API**: The route handler at `GET /api/financial-products/prices`.
- **Assets_API**: The route handlers at `GET /api/financial-products/assets`, `POST /api/financial-products/assets`, and `DELETE /api/financial-products/assets/[id]`.
- **Search_API**: The route handler at `GET /api/financial-products/search`.
- **PriceChart**: The `PriceChart` client component that renders the ECharts line chart.
- **AssetSearch**: The `AssetSearch` client component with debounced search input and result dropdown.
- **TrackedAssetList**: The `TrackedAssetList` client component that renders the list of tracked assets.
- **TimeframeSelector**: The `TimeframeSelector` client component that renders the eight timeframe buttons.
- **DB**: The MariaDB database accessed via Prisma.

---

## Requirements

### Requirement 1: Asset Search

**User Story:** As a user, I want to search for financial assets by name or ticker, so that I can discover assets to track.

#### Acceptance Criteria

1. WHEN a user submits a search query of 1–200 characters, THE Search_API SHALL proxy the query to Yahoo Finance and return a list of `AssetSearchResult` objects, each containing `ticker`, `name`, `asset_type`, and `exchange`.
2. WHEN Yahoo Finance returns results, THE Search_API SHALL map each result's `quoteType` field to the corresponding `AssetType` enum value (`FUND`, `ETF`, `ETP`, `STOCK`, or `CRYPTO`). IF a `quoteType` value cannot be mapped to any of those five types, THE Search_API SHALL omit that result from the response.
3. IF the search query is empty, absent, or composed entirely of whitespace, THEN THE Search_API SHALL return HTTP 400 with `{ "error": "Invalid request data" }` and Zod error details without calling Yahoo Finance.
4. IF the search query exceeds 200 characters, THEN THE Search_API SHALL return HTTP 400 with `{ "error": "Invalid request data" }` and Zod error details without calling Yahoo Finance.
5. IF Yahoo Finance throws an error during search, THEN THE Search_API SHALL return HTTP 502 with `{ "error": "Failed to search assets" }`.
6. THE Search_API SHALL NOT write any data to the DB during a search request.
7. WHEN AssetSearch receives user input, THE AssetSearch component SHALL wait 300 milliseconds after the last keystroke before sending a request to the Search_API. IF a new keystroke arrives before the 300 ms elapses, THE previous pending request SHALL be cancelled and the timer reset.
8. IF the Search_API returns an empty result list, THEN THE AssetSearch component SHALL display a "No results found" message in the dropdown instead of hiding it.
9. IF the Search_API request fails on the client (network error or an error HTTP status code such as 400, 500, or 502), THEN THE AssetSearch component SHALL hide the dropdown and display an inline error message below the input field. THE error message SHALL be dismissed automatically when the user types a new character.

---

### Requirement 2: Track and Untrack Assets

**User Story:** As a user, I want to track specific financial assets, so that I can monitor their price history over time.

#### Acceptance Criteria

1. WHEN a valid asset payload is submitted to the Assets_API, THE Assets_API SHALL create a new `Asset` record in the DB and return HTTP 200 with the created asset.
2. THE Assets_API SHALL require the following fields in the POST body: `ticker` (non-empty string, max 10 characters), `name` (non-empty string, max 100 characters), `asset_type` (one of `FUND`, `ETF`, `ETP`, `STOCK`, `CRYPTO`), `price_frequency` (one of `DAILY`, `INTRADAY`), and `currency` (exactly 3 characters, ISO 4217). The `isin` field is optional and may be null or omitted.
3. IF the POST body is missing a required field, contains an invalid enum value, or violates any structural constraint defined in criterion 2, THEN THE Assets_API SHALL return HTTP 400 with `{ "error": "Invalid request data" }` and Zod error details without performing any DB write.
4. WHEN a POST request is made with a `ticker` that already exists in the DB, THE Assets_API SHALL return HTTP 200 with the existing `Asset` record without creating a duplicate.
5. WHEN a user selects an untracked search result in AssetSearch, THE AssetSearch component SHALL call POST `/api/financial-products/assets` and invoke `onAssetAdded(asset)` to update the parent state.
6. WHEN a DELETE request is made for a valid asset ID, THE Assets_API SHALL remove the `Asset`, all associated `AssetPrice` rows, and all associated `AssetPriceSyncRange` rows, and return HTTP 204 with no response body.
7. IF a DELETE request is made for an asset ID that does not exist in the DB, THEN THE Assets_API SHALL return HTTP 404 with `{ "error": "Asset not found" }`.
8. IF a DELETE request fails on the client, THEN THE TrackedAssetList component SHALL re-enable the delete button and display a visible, dismissible error notification for at least 3 seconds.
9. IF the POST `/api/financial-products/assets` call fails on the client, THEN THE AssetSearch component SHALL not invoke `onAssetAdded`, SHALL display an inline error message below the search input, and SHALL leave the asset unselected.

---

### Requirement 3: List Tracked Assets

**User Story:** As a user, I want to see the list of assets I am tracking, so that I can select one to view its price chart.

#### Acceptance Criteria

1. WHEN a GET request is made to the Assets_API, THE Assets_API SHALL return the complete list of tracked `Asset` records ordered by `name` ascending. IF no assets are tracked, THE Assets_API SHALL return HTTP 200 with an empty array.
2. WHEN the `/financial-products` page component renders on the server, THE System SHALL pre-fetch the tracked asset list from the Assets_API and pass it as `initialAssets` to `FinancialProductsView`. IF the server-side fetch fails, THE page SHALL render with an empty `initialAssets` array and display an error banner visible to the user.
3. WHEN a user clicks an asset row in TrackedAssetList, THE TrackedAssetList component SHALL invoke `onSelect(asset)` with the full `Asset` object to update the selected asset in the parent state.
4. WHEN a delete operation completes successfully in TrackedAssetList, THE TrackedAssetList component SHALL invoke `onDeleted(assetId)` with the numeric ID of the removed asset to remove it from the parent state.

---

### Requirement 4: Timeframe Selection

**User Story:** As a user, I want to select a timeframe for the price chart, so that I can view historical data across different periods.

#### Acceptance Criteria

1. THE TimeframeSelector component SHALL display exactly eight selectable options: `Today`, `1W`, `1M`, `3M`, `6M`, `1Y`, `5Y`, and `All`.
2. WHEN a user selects a timeframe that differs from the currently active timeframe, THE TimeframeSelector component SHALL invoke `onChange(timeframe)` to update the active timeframe in the parent state.
3. THE TimeframeSelector component SHALL visually distinguish the currently active timeframe from inactive ones using a combination of at least two visual properties (e.g., background colour and font weight), not colour alone, so the distinction is accessible.
4. WHEN the `/financial-products` page first loads, THE System SHALL initialise the selected timeframe to `1M` without invoking `onChange`.

---

### Requirement 5: Price Data Retrieval and Caching

**User Story:** As a user, I want to view historical price data for a tracked asset, so that I can analyse its performance.

#### Acceptance Criteria

1. WHEN a valid GET request is made to the Prices_API with `assetId` and `timeframe`, THE Prices_API SHALL return HTTP 200 with a `PricePoint[]` array where each element contains `timestamp` (ISO 8601 string) and `price` (number), ordered by `timestamp` ascending.
2. WHEN parameter validation and asset lookup both succeed, THE Prices_API SHALL invoke the Sync Algorithm before querying `asset_prices`, so that any missing price data for the requested window is fetched and persisted first.
3. WHEN the Prices_API responds, every `PricePoint` in the response SHALL have a `timestamp` within the resolved `[from, to]` date window for the requested timeframe.
4. WHEN the Prices_API responds, every `PricePoint` in the response SHALL have been stored in the DB with the granularity derived for the requested timeframe: `TODAY` → `FIFTEEN_MIN`; `1W` → `HOURLY`; `1M`, `3M`, `6M`, `1Y` → `DAILY`; `5Y`, `ALL` → `WEEKLY`. WHEN the asset has `price_frequency = DAILY` and the timeframe is `TODAY` or `1W`, THE effective granularity SHALL be `DAILY` instead.
5. IF the `assetId` parameter is non-numeric, THEN THE Prices_API SHALL return HTTP 400 with `{ "error": "Invalid request data" }` before evaluating any other parameters.
6. IF the `assetId` parameter is numeric but the `timeframe` parameter is absent or not one of `TODAY`, `1W`, `1M`, `3M`, `6M`, `1Y`, `5Y`, `ALL`, THEN THE Prices_API SHALL return HTTP 400 with `{ "error": "Invalid request data" }`.
7. IF all parameters are valid but the `assetId` does not correspond to a tracked asset, THEN THE Prices_API SHALL return HTTP 404 with `{ "error": "Asset not found" }`.
8. IF all parameters are valid and the asset exists but Yahoo Finance throws an error while fetching missing price data, THEN THE Prices_API SHALL return HTTP 502 with `{ "error": "Failed to fetch price data from Yahoo Finance" }`.
9. WHEN the Prices_API returns a successful response and the DB contains no price rows for the resolved window, THE Prices_API SHALL return HTTP 200 with an empty array.
10. THE Prices_API SHALL evaluate errors in the following precedence order: (1) parameter validation errors → HTTP 400, (2) asset-not-found → HTTP 404, (3) upstream Yahoo Finance failure → HTTP 502, (4) unexpected server/DB failure → HTTP 500.

---

### Requirement 6: Price Chart Rendering

**User Story:** As a user, I want to see a line chart of an asset's price history, so that I can visually analyse trends.

#### Acceptance Criteria

1. WHEN `assetId` or `timeframe` changes in PriceChart, THE PriceChart component SHALL fetch `GET /api/financial-products/prices?assetId=X&timeframe=Y` and render an ECharts line chart with the returned `PricePoint[]` data.
2. WHILE PriceChart is fetching price data, THE PriceChart component SHALL display a loading indicator and SHALL NOT render a chart from stale data.
3. IF the price data fetch fails, THEN THE PriceChart component SHALL display an error message styled with the `text-destructive` CSS class. The message SHALL read `"Failed to load price data."`.
4. IF no asset is selected, THEN THE PriceChart component SHALL render a placeholder state (e.g., empty panel with a prompt to select an asset) without making any API request.
5. WHEN the Prices_API returns an empty `PricePoint[]` array, THE PriceChart component SHALL display a "No price data available" message instead of rendering an empty chart.
6. THE PriceChart component SHALL use a time-based x-axis and a value-based y-axis. THE y-axis labels SHALL be formatted using the selected asset's `currency` field as the currency code.

---

### Requirement 7: Price Sync Algorithm

**User Story:** As a developer, I want a smart sync algorithm that detects missing price ranges and only fetches what is needed, so that the system avoids redundant Yahoo Finance API calls.

#### Acceptance Criteria

1. WHEN the Sync Algorithm is invoked for a `[from, to]` window, THE Sync Algorithm SHALL query the `asset_price_sync_ranges` table to determine which sub-intervals of `[from, to]` are already covered for the given asset and granularity.
2. WHEN the Sync Algorithm determines missing sub-intervals, THE Sync Algorithm SHALL fetch only those missing ranges from Yahoo Finance, not the full `[from, to]` window.
3. WHEN the Sync Algorithm has fetched price data for a missing range, THE Sync Algorithm SHALL upsert the returned rows into `asset_prices` using the composite unique key `(asset_id, timestamp, granularity)`, updating `price` if a matching row already exists.
4. WHEN the Sync Algorithm has fetched a missing range from Yahoo Finance, THE Sync Algorithm SHALL record the full requested sub-interval as covered in `asset_price_sync_ranges`, regardless of how many rows Yahoo Finance actually returned.
5. IF Yahoo Finance returns zero price rows for a requested range (e.g. the range falls entirely on weekends or holidays), THEN THE Sync Algorithm SHALL still mark that range as synced in `asset_price_sync_ranges` without inserting any price rows.
6. WHEN a new sync range is recorded, THE Sync Algorithm SHALL merge it with any existing `AssetPriceSyncRange` records for the same asset and granularity whose `from_timestamp` or `until_timestamp` overlaps with, or touches exactly at a boundary of, the new range. THE merged result SHALL be a single record spanning the minimum `from_timestamp` and maximum `until_timestamp` of all collapsed records.
7. WHEN the Sync Algorithm determines that the full `[from, to]` window is already covered by existing sync ranges, THE Sync Algorithm SHALL skip all Yahoo Finance calls and proceed directly to querying `asset_prices`.
8. WHEN the full `[from, to]` window is already covered, THE Sync Algorithm SHALL NOT insert or update any `asset_price_sync_ranges` records.
9. IF Yahoo Finance `historical()` throws an error for a missing range, THEN THE Sync Algorithm SHALL propagate the error to its caller and SHALL NOT record a sync range entry for that range.

---

### Requirement 8: Granularity and Timeframe Mapping

**User Story:** As a developer, I want a deterministic mapping from timeframe and asset price frequency to granularity and Yahoo interval, so that the correct data resolution is always used.

#### Acceptance Criteria

1. THE System SHALL map each of the eight timeframes to a default granularity and Yahoo interval as follows: `TODAY` → `FIFTEEN_MIN` / `15m`; `1W` → `HOURLY` / `1h`; `1M` → `DAILY` / `1d`; `3M` → `DAILY` / `1d`; `6M` → `DAILY` / `1d`; `1Y` → `DAILY` / `1d`; `5Y` → `WEEKLY` / `1wk`; `ALL` → `WEEKLY` / `1wk`.
2. IF `deriveGranularity` is called with `price_frequency = DAILY` and a timeframe that maps to `FIFTEEN_MIN` or `HOURLY` (i.e., `TODAY` or `1W`), THEN THE System SHALL return `{ granularity: "DAILY", interval: "1d" }`. IF `deriveGranularity` is called with `price_frequency = INTRADAY`, THEN THE System SHALL return the default mapping from criterion 1 without modification.
3. WHEN `deriveGranularity` is called for any timeframe, THE System SHALL resolve the `from` date as follows: `TODAY` → start of the current calendar day in Europe/Madrid timezone (00:00:00 Madrid time); `1W` → current time minus 7 days; `1M` → current time minus 1 calendar month (if the resulting month has fewer days, use the last day of that month); `3M` → current time minus 3 calendar months; `6M` → current time minus 6 calendar months; `1Y` → current time minus 1 calendar year; `5Y` → current time minus 5 calendar years; `ALL` → Unix epoch (`new Date(0)`).
4. WHEN `deriveGranularity` is called for any timeframe, THE System SHALL set the `to` date to the current timestamp at the moment of the call.
5. IF an unrecognised timeframe value is passed to `deriveGranularity`, THEN THE function SHALL throw a runtime error rather than returning a default mapping.

---

### Requirement 9: Data Model and Persistence

**User Story:** As a developer, I want a well-defined database schema for assets, prices, and sync ranges, so that data is stored efficiently and queries are fast.

#### Acceptance Criteria

1. THE DB SHALL contain an `assets` table with columns: `id` (auto-increment integer PK), `ticker` (unique, max 50 characters), `isin` (nullable string), `name` (max 255 characters), `asset_type` (enum: `FUND`, `ETF`, `ETP`, `STOCK`, `CRYPTO`), `price_frequency` (enum: `DAILY`, `INTRADAY`), `currency` (3-character ISO 4217 string), `created_at` (timestamp, set at insert).
2. THE DB SHALL contain an `asset_prices` table with columns: `asset_id` (FK to `assets.id`), `timestamp` (date-time), `price` (`Decimal(18,6)`), `granularity` (enum: `DAILY`, `HOURLY`, `FIFTEEN_MIN`, `WEEKLY`). This table has no surrogate primary key; identity is enforced by the unique constraint in criterion 3.
3. THE `asset_prices` table SHALL enforce a unique constraint on `(asset_id, timestamp, granularity)` to prevent duplicate price rows.
4. THE `asset_prices` table SHALL have an index on `(asset_id, timestamp)` to support efficient chart queries.
5. THE DB SHALL contain an `asset_price_sync_ranges` table with columns: `id` (auto-increment integer PK), `asset_id` (FK to `assets.id`), `granularity` (enum: `DAILY`, `HOURLY`, `FIFTEEN_MIN`, `WEEKLY`), `from_timestamp` (date-time), `until_timestamp` (date-time), `synced_at` (timestamp, set at insert time only and not updated on subsequent syncs).
6. THE `asset_price_sync_ranges` table SHALL have an index on `(asset_id, granularity)` to support efficient range lookups.
7. WHEN an `Asset` record is deleted, THE DB SHALL cascade-delete all related `AssetPrice` and `AssetPriceSyncRange` records atomically.

---

### Requirement 10: API Error Handling and Validation

**User Story:** As a developer, I want all API routes to follow consistent error handling patterns, so that clients receive predictable, actionable error responses.

#### Acceptance Criteria

1. THE System SHALL validate all API request inputs (query parameters and request body, as applicable to each method) using Zod before performing any DB access.
2. IF a Zod validation error occurs in any API route, THEN THE System SHALL return HTTP 400 with `{ "error": "Invalid request data", "details": <array of Zod validation issue objects> }`.
3. IF an unexpected error occurs in any API route (excluding `ZodError` and deliberate 404 cases), THEN THE System SHALL return HTTP 500 with `{ "error": "Internal server error" }` and log the full error server-side. THE response body SHALL NOT include stack traces or internal details.
4. WHEN a DB lookup by ID finds no matching record in any API route, THE System SHALL return HTTP 404 with `{ "error": "<ResourceName> not found" }` where `<ResourceName>` is the human-readable name of the resource (e.g., `"Asset not found"`).
5. EVERY API route file SHALL export an `OPTIONS` handler that returns HTTP 405 with an `Allow` header listing every HTTP method handler exported by that route file, separated by commas (e.g., `"GET, POST, OPTIONS"`).
6. EVERY API route file SHALL export `export const dynamic = "force-dynamic"` to satisfy the Prisma requirement for dynamic rendering.
