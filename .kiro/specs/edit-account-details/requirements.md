# Requirements Document

## Introduction

This feature enables editing of existing account details (name, icon, and active status) in the Precision Ledger personal finance application. The user should be able to modify an account's metadata from the account detail page, following the same editing patterns established for expenses and incomes. The account balance is not directly editable since it is derived from completed financial items.

## Glossary

- **Account**: A financial account entity with a name, icon, balance, active status, and creation date. Accounts hold incomes, expenses, and participate in transactions.
- **Edit_Account_Form**: A client-side form component that allows the user to modify editable account fields.
- **Account_API**: The API route handler at `/api/accounts/[id]` that processes account update requests.
- **Account_Detail_Page**: The page at `/accounts/[id]` that displays full account information and related financial items.
- **Icon_Picker**: An existing component that provides a visual grid for selecting account icons from a predefined set.

## Requirements

### Requirement 1: Edit account details via API

**User Story:** As a user, I want to update an account's name, icon, and active status through an API endpoint, so that my changes are persisted to the database.

#### Acceptance Criteria

1. WHEN a PATCH request is received at `/api/accounts/[id]` with valid fields, THE Account_API SHALL update the account record and return the updated account as JSON with a 200 status
2. WHEN a PATCH request contains an invalid or missing account ID, THE Account_API SHALL return a 400 error response with a descriptive message
3. WHEN a PATCH request targets a non-existent account, THE Account_API SHALL return a 404 error response
4. WHEN a PATCH request contains invalid field values, THE Account_API SHALL return a 400 error response with Zod validation details
5. THE Account_API SHALL validate that the name field is a non-empty string when provided
6. THE Account_API SHALL validate that the icon field is either a string or null when provided
7. THE Account_API SHALL validate that the active field is a boolean when provided
8. WHEN a PATCH request contains only a subset of editable fields, THE Account_API SHALL update only the provided fields and leave others unchanged

### Requirement 2: Edit account form component

**User Story:** As a user, I want a modal edit form accessible from the account detail page, so that I can modify account details in a focused overlay without navigating away.

#### Acceptance Criteria

1. WHEN the user clicks an edit button on the account detail page, THE Edit_Account_Form SHALL open as a modal dialog with the current account name, icon, balance, and active status pre-populated
2. WHEN the user modifies fields and clicks save, THE Edit_Account_Form SHALL send a PATCH request to `/api/accounts/[id]` with only the changed fields
3. WHEN the save operation succeeds, THE Edit_Account_Form SHALL close the modal and refresh the page to display updated data
4. WHEN the user clicks cancel or the dialog close button, THE Edit_Account_Form SHALL close the modal without making any changes
5. WHILE the save operation is in progress, THE Edit_Account_Form SHALL disable all form inputs and buttons to prevent duplicate submissions
6. IF the save operation fails, THEN THE Edit_Account_Form SHALL display an error message to the user and re-enable the form

### Requirement 3: Account name validation

**User Story:** As a user, I want clear feedback when I provide an invalid account name, so that I can correct mistakes before saving.

#### Acceptance Criteria

1. WHEN the user attempts to save with an empty or whitespace-only name, THE Edit_Account_Form SHALL prevent submission and display a validation error
2. THE Account_API SHALL reject name values that are empty strings or contain only whitespace characters

### Requirement 4: Integration with account detail page

**User Story:** As a user, I want the edit functionality accessible from the account detail page header, so that editing is discoverable and convenient.

#### Acceptance Criteria

1. THE Account_Detail_Page SHALL display an edit button in the account summary section
2. WHEN the edit button is clicked, THE Account_Detail_Page SHALL open the Edit_Account_Form as a modal dialog
3. WHEN the account is successfully updated, THE Account_Detail_Page SHALL reflect the new account details immediately
