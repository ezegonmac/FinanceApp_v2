# Requirements Document

## Introduction

The Investments feature enables a user to buy and sell units of tracked assets from any account in the personal finance app. Each operation reflects the cash impact on the account balance. Positions are tracked per account, showing units held, total invested, and current market value derived from the latest asset price. The feature follows the existing lifecycle model: operations for the current or past months complete immediately, while future-month operations remain pending until processed by the daily job.

## Glossary

- **Investment_System**: The backend subsystem responsible for creating, processing, cancelling, and querying investment operations and positions.
- **Investment**: A single buy or sell operation of asset units linked to an account, an asset, and a month.
- **Position**: An aggregated view of all completed buy and sell operations for a specific asset within a specific account, showing total units held, total amount invested, and current market value.
- **Account**: A financial account with a tracked balance.
- **Asset**: A tracked financial product (fund, ETF, stock, crypto) with historical price data.
- **AssetPrice**: A price record for an asset at a specific timestamp and granularity.
- **MonthSnapshot**: A per-account, per-month aggregate of financial totals used for fast metrics.
- **Daily_Job**: The scheduled background process that transitions pending items to completed status and updates account balances.
- **Current_Month**: The month matching today's date in the Europe/Madrid timezone.
- **Future_Month**: Any month after the current month.
- **Past_Month**: Any month before the current month.

## Requirements

### Requirement 1: Create a BUY Investment

**User Story:** As a user, I want to buy units of an asset from an account, so that the purchase is recorded and my account balance reflects the cash outflow.

#### Acceptance Criteria

1. WHEN the user submits a BUY operation for the current month or a past month, THE Investment_System SHALL create an Investment record with status COMPLETED, deduct the total_amount from the Account balance, and recalculate the MonthSnapshot for that account and month.
2. WHEN the user submits a BUY operation for a future month, THE Investment_System SHALL create an Investment record with status PENDING without modifying the Account balance.
3. THE Investment_System SHALL allow a BUY operation regardless of the current Account balance, permitting negative balances.
4. THE Investment_System SHALL compute total_amount as units multiplied by unit_price, rounded to two decimal places.

### Requirement 2: Create a SELL Investment

**User Story:** As a user, I want to sell units of an asset I hold in an account, so that the sale is recorded and my account balance reflects the cash inflow.

#### Acceptance Criteria

1. WHEN the user submits a SELL operation for the current month or a past month, THE Investment_System SHALL create an Investment record with status COMPLETED, add the total_amount to the Account balance, and recalculate the MonthSnapshot for that account and month.
2. WHEN the user submits a SELL operation for a future month, THE Investment_System SHALL create an Investment record with status PENDING without modifying the Account balance.
3. WHEN the user submits a SELL operation and the total completed BUY units minus total completed SELL units for that asset in that account is less than the requested sell units, THE Investment_System SHALL reject the operation with a validation error.
4. THE Investment_System SHALL compute total_amount as units multiplied by unit_price, rounded to two decimal places.

### Requirement 3: Cancel an Investment

**User Story:** As a user, I want to cancel an investment operation, so that I can reverse a mistake or remove a planned operation.

#### Acceptance Criteria

1. WHEN the user cancels an Investment with status PENDING, THE Investment_System SHALL set the Investment status to CANCELLED without modifying the Account balance.
2. WHEN the user cancels an Investment with status COMPLETED and type BUY, THE Investment_System SHALL set the Investment status to CANCELLED, add the total_amount back to the Account balance, and recalculate the MonthSnapshot for that account and month.
3. WHEN the user cancels an Investment with status COMPLETED and type SELL, THE Investment_System SHALL set the Investment status to CANCELLED, deduct the total_amount from the Account balance, and recalculate the MonthSnapshot for that account and month.
4. IF the user attempts to cancel an Investment that is already CANCELLED, THEN THE Investment_System SHALL reject the operation with a validation error.

### Requirement 4: Process Pending Investments via Daily Job

**User Story:** As the system operator, I want pending investments to be processed automatically when their month becomes current, so that account balances update without manual intervention.

#### Acceptance Criteria

1. WHEN the Daily_Job runs for a given date, THE Investment_System SHALL process all PENDING Investment records whose month matches the current month by setting status to COMPLETED, updating the Account balance (decrement for BUY, increment for SELL), and recording the processed_at timestamp.
2. IF an error occurs while processing a PENDING Investment, THEN THE Investment_System SHALL record the processing error and continue processing remaining investments.
3. THE Investment_System SHALL link each processed Investment to the corresponding JobRun record.

### Requirement 5: List Investment Operations

**User Story:** As a user, I want to view all investment operations for an account, so that I can review my buy and sell history.

#### Acceptance Criteria

1. WHEN the user requests the investments list for an account, THE Investment_System SHALL return all Investment records for that account ordered by month descending and creation date descending.
2. WHERE the user provides an asset_id filter, THE Investment_System SHALL return only Investment records matching that asset.
3. THE Investment_System SHALL support cursor-based pagination on the investments list endpoint.

### Requirement 6: View Positions per Account

**User Story:** As a user, I want to see my current holdings per asset in an account, so that I can understand my portfolio allocation and performance.

#### Acceptance Criteria

1. WHEN the user requests positions for an account, THE Investment_System SHALL return an aggregated list of positions per asset, where each position includes: total units held, total amount invested, and current market value.
2. THE Investment_System SHALL compute total units held as the sum of completed BUY units minus the sum of completed SELL units for each asset in that account.
3. THE Investment_System SHALL compute total amount invested as the sum of total_amount from completed BUY operations for each asset in that account.
4. THE Investment_System SHALL compute current market value as total units held multiplied by the latest AssetPrice for that asset.
5. IF no AssetPrice exists for an asset, THEN THE Investment_System SHALL return the position with a null current value and include only units held and total invested.
6. THE Investment_System SHALL exclude positions where total units held equals zero from the active positions response.

### Requirement 7: MonthSnapshot Integration

**User Story:** As a user, I want my monthly financial summaries to include investment cash flows, so that I have a complete picture of money movement.

#### Acceptance Criteria

1. THE Investment_System SHALL add a total_investments_out field to MonthSnapshot representing the sum of total_amount from completed BUY investments for that account and month.
2. THE Investment_System SHALL add a total_investments_in field to MonthSnapshot representing the sum of total_amount from completed SELL investments for that account and month.
3. WHEN an Investment is created with status COMPLETED or cancelled from status COMPLETED, THE Investment_System SHALL recalculate the MonthSnapshot for the affected account and month.

### Requirement 8: API Route Structure

**User Story:** As a developer, I want investment endpoints to follow the existing nested account pattern, so that the API remains consistent.

#### Acceptance Criteria

1. THE Investment_System SHALL expose investment operations at the route path /api/accounts/[id]/investments following the existing nested resource pattern.
2. THE Investment_System SHALL expose position aggregation at the route path /api/accounts/[id]/investments/positions.
3. THE Investment_System SHALL validate all request bodies using Zod schemas and return a 400 status with error details for invalid input.
4. THE Investment_System SHALL return a 404 status when the referenced account does not exist.
5. THE Investment_System SHALL return a 404 status when the referenced asset does not exist during a BUY or SELL operation.
