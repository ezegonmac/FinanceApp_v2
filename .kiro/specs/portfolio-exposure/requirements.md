# Requirements Document

## Introduction

Provide a look-through exposure analysis of the user's investment portfolio, aggregating asset-level exposure data (sector and country) weighted by current position values. The system stores monthly exposure snapshots, normalizes provider-specific labels via a canonical mapping table, and exposes the data through an API endpoint and a dedicated UI page. Exposure sync runs as part of the existing daily job pipeline.

## Glossary

- **Exposure_System**: The subsystem responsible for calculating, storing, and serving portfolio exposure data across sectors and countries.
- **Exposure_API**: The API endpoint (`GET /api/investments/exposure`) that returns aggregated portfolio-level exposure breakdowns.
- **Exposure_Page**: The dedicated UI page at `/investments/exposure` displaying sector and country breakdowns.
- **ExposureCategory**: The canonical mapping table that stores normalized exposure category labels (e.g., "Technology", "United States") with a unique `canonical_key` per `exposure_type`.
- **AssetExposureSnapshot**: A record storing the percentage allocation of a specific asset to a specific category for a given monthly period.
- **ExposureCategoryMapping**: A record mapping a raw provider label (e.g., Yahoo Finance's "Technology Services") to a canonical ExposureCategory.
- **Exposure_Sync**: The process that fetches exposure data from the market data provider and stores it as AssetExposureSnapshot records for the current period.
- **Coverage_Percentage**: The ratio of the total portfolio value that has exposure data available, expressed as a percentage.
- **Position_Value**: The current monetary value of a held position (units × current price) for a given asset within an account.
- **Daily_Job**: The existing `apply-pending-transactions` background job that processes scheduled financial items daily.
- **Yahoo_Finance_Provider**: The external market data provider used to retrieve asset exposure breakdowns.

## Requirements

### Requirement 1: Portfolio Exposure Calculation

**User Story:** As a user, I want to see my portfolio's effective exposure to sectors and countries, so that I can understand my diversification across categories.

#### Acceptance Criteria

1. WHEN the Exposure_API receives a request with a valid `type` parameter, THE Exposure_System SHALL calculate portfolio exposure by summing each asset's category percentage weighted by its Position_Value relative to the total portfolio value.
2. THE Exposure_System SHALL support `SECTOR` and `COUNTRY` as valid exposure type values.
3. THE Exposure_System SHALL return both a percentage and a monetary value for each exposure category in the response.
4. WHEN the Exposure_API receives a request with an `accountId` parameter, THE Exposure_System SHALL calculate exposure using only positions from the specified account.
5. WHEN the Exposure_API receives a request without an `accountId` parameter, THE Exposure_System SHALL aggregate exposure across all accounts.
6. THE Exposure_System SHALL calculate portfolio exposure percentages against the entire portfolio value, including assets without exposure data.

### Requirement 2: Monthly Exposure Snapshot Storage

**User Story:** As a user, I want my exposure data captured monthly, so that I can track how my portfolio composition changes over time.

#### Acceptance Criteria

1. WHEN the Exposure_Sync executes for a given period, THE Exposure_System SHALL store AssetExposureSnapshot records for each owned asset that has exposure data available from the Yahoo_Finance_Provider.
2. THE Exposure_System SHALL store each AssetExposureSnapshot with the asset identifier, period (YYYY-MM), exposure type, category reference, percentage, provider name, and sync timestamp.
3. THE Exposure_System SHALL enforce a unique constraint on the combination of asset, period, exposure type, and category within AssetExposureSnapshot records.
4. WHEN an AssetExposureSnapshot already exists for an asset and period, THE Exposure_System SHALL skip that asset during regular sync execution.

### Requirement 3: Canonical Category Normalization

**User Story:** As a user, I want exposure categories displayed consistently regardless of how different providers label them, so that my analysis is not fragmented by duplicate categories.

#### Acceptance Criteria

1. THE Exposure_System SHALL normalize all provider-specific labels to canonical ExposureCategory records during sync.
2. THE Exposure_System SHALL use ExposureCategoryMapping records to resolve provider labels to canonical categories.
3. WHEN the Exposure_Sync encounters a provider label with no existing ExposureCategoryMapping, THE Exposure_System SHALL auto-create a new ExposureCategory and corresponding ExposureCategoryMapping for that label.
4. THE Exposure_System SHALL ship with pre-seeded ExposureCategoryMapping records for common Yahoo Finance labels.
5. THE Exposure_System SHALL enforce a unique constraint on the combination of provider, provider_label, and category_id within ExposureCategoryMapping records.

### Requirement 4: Individual Equity Exposure Assignment

**User Story:** As a user, I want individual stocks to reflect their own sector and country as their full exposure, so that they contribute accurately to my portfolio breakdown.

#### Acceptance Criteria

1. WHEN the Exposure_Sync processes an individual equity (STOCK type), THE Exposure_System SHALL assign 100% sector exposure to the stock's sector as reported by the Yahoo_Finance_Provider asset profile.
2. WHEN the Exposure_Sync processes an individual equity (STOCK type), THE Exposure_System SHALL assign 100% country exposure to the stock's country as reported by the Yahoo_Finance_Provider asset profile.
3. IF an individual equity has no sector or country data in its provider profile, THEN THE Exposure_System SHALL treat that asset as having no exposure data available for the missing type.

### Requirement 5: ETF and Fund Exposure Breakdown

**User Story:** As a user, I want ETFs and funds to show their underlying sector and country composition, so that I can understand what I am actually exposed to through these products.

#### Acceptance Criteria

1. WHEN the Exposure_Sync processes an ETF or FUND type asset, THE Exposure_System SHALL retrieve the provider's breakdown data (sector and country holdings percentages) from the Yahoo_Finance_Provider quoteSummary.
2. THE Exposure_System SHALL store each breakdown entry as a separate AssetExposureSnapshot record with its corresponding percentage and canonical category.
3. IF the Yahoo_Finance_Provider does not return breakdown data for an ETF or FUND, THEN THE Exposure_System SHALL treat that asset as having no exposure data available for the missing type.

### Requirement 6: Unclassified Exposure Bucket

**User Story:** As a user, I want to see how much of each asset's reported exposure is unclassified, so that I have a complete picture even when provider data is incomplete.

#### Acceptance Criteria

1. WHEN the sum of an asset's stored exposure percentages for a given type is less than 100%, THE Exposure_Page SHALL display the remainder as an "Other / Unclassified" category.
2. THE Exposure_System SHALL store raw provider percentages as-is without normalizing them to 100%.
3. THE Exposure_API SHALL return sufficient data for the client to compute the "Other / Unclassified" remainder.

### Requirement 7: Exposure Coverage Reporting

**User Story:** As a user, I want to see what percentage of my portfolio has exposure data available, so that I can assess how complete my analysis is.

#### Acceptance Criteria

1. THE Exposure_API SHALL return a `coveragePercentage` value representing the proportion of total portfolio value that has exposure data.
2. THE Exposure_API SHALL return an `uncoveredValue` representing the monetary amount of the portfolio that lacks exposure data.
3. THE Exposure_Page SHALL display the coverage percentage to the user.
4. THE Exposure_System SHALL calculate coverage as the sum of Position_Values for assets with exposure data divided by the total portfolio value, multiplied by 100.

### Requirement 8: Exposure Sync Within Daily Job

**User Story:** As a user, I want exposure data refreshed automatically each month, so that I do not have to manually trigger updates.

#### Acceptance Criteria

1. THE Exposure_Sync SHALL execute as an additional step within the existing Daily_Job (`apply-pending-transactions`) pipeline.
2. THE Exposure_Sync SHALL run within the same JobRun record as the other Daily_Job processors.
3. IF the Yahoo_Finance_Provider fails during sync for a specific asset, THEN THE Exposure_System SHALL skip that asset and continue processing remaining assets.
4. WHEN the Exposure_Sync processes assets, THE Exposure_System SHALL use the position held at the time the job runs (snapshot-time position).

### Requirement 9: Admin Re-Sync Capability

**User Story:** As an admin, I want to re-sync exposure data for a specific asset and period, so that I can fix stale or incorrect data without waiting for the next monthly cycle.

#### Acceptance Criteria

1. WHEN an admin triggers a re-sync for a specific asset and period, THE Exposure_System SHALL fetch fresh exposure data from the Yahoo_Finance_Provider for that asset.
2. WHEN the re-sync completes, THE Exposure_System SHALL overwrite all existing AssetExposureSnapshot records for the specified asset and period with the new data.
3. IF the re-sync fails to retrieve data from the Yahoo_Finance_Provider, THEN THE Exposure_System SHALL return an error response without modifying existing records.

### Requirement 10: Exposure API Endpoint

**User Story:** As a user, I want to query my portfolio exposure by type and period, so that I can view analysis for different time periods and categories.

#### Acceptance Criteria

1. THE Exposure_API SHALL accept a `type` query parameter with values `SECTOR` or `COUNTRY`.
2. THE Exposure_API SHALL accept an optional `period` query parameter in `YYYY-MM` format.
3. WHEN the `period` parameter is omitted, THE Exposure_API SHALL default to the current month.
4. THE Exposure_API SHALL accept an optional `accountId` query parameter to filter exposure to a single account.
5. WHEN the Exposure_API receives an invalid `type` value, THE Exposure_API SHALL return a 400 error response with validation details.
6. WHEN the Exposure_API receives an invalid `period` format, THE Exposure_API SHALL return a 400 error response with validation details.
7. THE Exposure_API SHALL return an array of objects containing category name, percentage, and monetary value, along with coveragePercentage and uncoveredValue.

### Requirement 11: Exposure UI Page

**User Story:** As a user, I want a dedicated page showing my portfolio exposure breakdowns, so that I can visualize my diversification at a glance.

#### Acceptance Criteria

1. THE Exposure_Page SHALL be accessible at the path `/investments/exposure`.
2. THE Exposure_Page SHALL display sector exposure breakdown with percentage and monetary value per category.
3. THE Exposure_Page SHALL display country exposure breakdown with percentage and monetary value per category.
4. THE Exposure_Page SHALL display the portfolio Coverage_Percentage.
5. WHEN provider exposure percentages do not sum to 100% for the displayed breakdown, THE Exposure_Page SHALL display an "Other / Unclassified" bucket with the remainder percentage and monetary value.
