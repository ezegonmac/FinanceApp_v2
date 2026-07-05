# Requirements Document

## Introduction

The Investments UI feature adds a frontend section to the account detail page (`apps/web/app/accounts/[id]/page.tsx`) that displays a table of investment operations (BUY/SELL) and provides a dialog form to create new investments. The section is placed below the existing transactions section and follows the same domain component patterns used throughout the application. This iteration covers operations listing and creation only — positions summary is out of scope.

## Glossary

- **Investments_Section**: The full-width UI section rendered below the transactions section on the account detail page, containing the investments table and add-investment dialog trigger.
- **Investments_Table**: A DataTable (TanStack Table v8) component that renders investment operation rows with pagination.
- **Add_Investment_Form**: A dialog-hosted form for creating new BUY or SELL investment operations using local useState and fetch.
- **Account_Investments_View**: A client component (`'use client'`) that manages data fetching, state, dialog visibility, and refresh logic for the investments domain.
- **Asset_Dropdown**: A select input populated with the list of tracked assets fetched from the backend.
- **Type_Toggle**: A two-option toggle selector (BUY/SELL) matching the existing button-group pattern used for expense types.
- **DataTable**: The shared data table component at `components/ui/data-table.tsx` based on TanStack Table v8.

## Requirements

### Requirement 1: Investments Section Placement

**User Story:** As a user, I want to see my investment operations on the account detail page, so that I can review BUY/SELL activity alongside my other financial movements.

#### Acceptance Criteria

1. THE Investments_Section SHALL render below the transactions section on the account detail page as a full-width block.
2. THE Investments_Section SHALL use the same card styling as the transactions section (rounded-lg border, bg-card, padding, text-card-foreground).
3. THE Investments_Section SHALL display a heading of "Investments" and a subheading describing the section purpose.

### Requirement 2: Account Investments View Component

**User Story:** As a user, I want the investments section to load data automatically and provide controls to refresh and add entries, so that I can interact with my investments without navigating away.

#### Acceptance Criteria

1. THE Account_Investments_View SHALL be a client component that accepts an accountId prop.
2. WHEN the Account_Investments_View mounts, THE Account_Investments_View SHALL fetch investment operations from `/api/accounts/{accountId}/investments` with a default limit of 30.
3. THE Account_Investments_View SHALL display a "Refresh" button that re-fetches data when clicked.
4. THE Account_Investments_View SHALL display an "Add investment" button that opens the Add_Investment_Form inside a dialog.
5. WHILE data is loading, THE Account_Investments_View SHALL display a loading indicator text.
6. IF the fetch request fails, THEN THE Account_Investments_View SHALL display an error message.
7. WHEN an investment is successfully created via the Add_Investment_Form, THE Account_Investments_View SHALL close the dialog and refresh the table data.

### Requirement 3: Investments Table Display

**User Story:** As a user, I want to see my investment operations in a paginated table with relevant details, so that I can quickly scan my BUY/SELL activity.

#### Acceptance Criteria

1. THE Investments_Table SHALL use the shared DataTable component with TanStack Table v8.
2. THE Investments_Table SHALL display columns for: asset ticker, type (BUY/SELL), units, unit price, total amount, status, month (year-month), and description.
3. THE Investments_Table SHALL support client-side pagination with a configurable page size of 10 rows.
4. WHEN the user navigates to a page near the end of loaded data and more data is available (nextCursor is not null), THE Account_Investments_View SHALL prefetch the next chunk of operations from the API.
5. THE Investments_Table SHALL display the investment type with visual differentiation (distinct styling for BUY versus SELL).
6. THE Investments_Table SHALL display the investment status with visual differentiation for PENDING, COMPLETED, and CANCELLED states.

### Requirement 4: Add Investment Form

**User Story:** As a user, I want to create a new BUY or SELL investment operation from the account detail page, so that I can record asset purchases and sales.

#### Acceptance Criteria

1. THE Add_Investment_Form SHALL contain inputs for: asset selection (Asset_Dropdown), type (Type_Toggle), units (number), unit price (number), description (text, optional), and month (month picker for year and month).
2. THE Asset_Dropdown SHALL be populated by fetching the list of tracked assets from the backend when the form mounts.
3. THE Type_Toggle SHALL default to BUY and allow switching between BUY and SELL.
4. WHEN the user submits the form with valid data, THE Add_Investment_Form SHALL send a POST request to `/api/accounts/{accountId}/investments` with the form payload.
5. WHILE the form submission is in progress, THE Add_Investment_Form SHALL disable all inputs and the submit button and display a loading state on the submit button.
6. IF the API returns an error response, THEN THE Add_Investment_Form SHALL display the error message to the user.
7. WHEN the API returns a successful response (201), THE Add_Investment_Form SHALL reset all fields and invoke the onAdded callback.
8. THE Add_Investment_Form SHALL validate that asset is selected, units is a positive number, and unit price is a positive number before submitting.

### Requirement 5: Asset Dropdown Behavior

**User Story:** As a user, I want to select an asset from a dropdown when creating an investment, so that I can associate the operation with a specific tracked asset.

#### Acceptance Criteria

1. WHEN the Add_Investment_Form mounts, THE Asset_Dropdown SHALL fetch the list of assets from the backend API.
2. THE Asset_Dropdown SHALL display each asset with its ticker and name.
3. IF the assets fetch fails, THEN THE Asset_Dropdown SHALL display a fallback error state indicating assets could not be loaded.
4. WHILE assets are loading, THE Asset_Dropdown SHALL display a loading placeholder.

### Requirement 6: Cancel Investment Action

**User Story:** As a user, I want to cancel an existing investment operation from the table, so that I can reverse or remove erroneous entries.

#### Acceptance Criteria

1. THE Investments_Table SHALL display a cancel action for each investment row where the status is not CANCELLED.
2. WHEN the user triggers the cancel action for an investment, THE Account_Investments_View SHALL send a PATCH request to `/api/accounts/{accountId}/investments` with the investment_id and action "cancel".
3. WHEN the cancel request succeeds, THE Account_Investments_View SHALL refresh the table data.
4. IF the cancel request fails, THEN THE Account_Investments_View SHALL display an error message.

### Requirement 7: Component File Structure

**User Story:** As a developer, I want the investments UI components to follow the established project conventions, so that the codebase remains consistent and maintainable.

#### Acceptance Criteria

1. THE Account_Investments_View SHALL be located at `apps/web/components/investments/AccountInvestmentsView.tsx`.
2. THE Investments_Table SHALL be located at `apps/web/components/investments/InvestmentsTable.tsx`.
3. THE Add_Investment_Form SHALL be located at `apps/web/components/investments/AddInvestmentForm.tsx`.
4. THE Account_Investments_View SHALL be imported and rendered in the account detail page RSC at `apps/web/app/accounts/[id]/page.tsx`.
