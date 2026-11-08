# Spec Delta

## MODIFIED Requirements

### Requirement: LED-002 Create an Expense

The system SHALL create expenses scoped to an account and month, classified by
kind, applying the balance effect immediately for the current or a past month
and deferring it for a future month. When no explicit analytics value is given,
the system SHALL set `analytics_amount` equal to `amount`.

#### Scenario: Current or past month expense

- **WHEN** the user submits an expense for the current month or a past month
- **THEN** the system creates an Expense with status COMPLETED
- **AND** decrements the account balance by the amount
- **AND** sets processed_at
- **AND** recalculates the MonthSnapshot for that account and month

#### Scenario: Future month expense

- **WHEN** the user submits an expense for a future month
- **THEN** the system creates an Expense with status PENDING
- **AND** does not modify the account balance

#### Scenario: Default analytics value

- **WHEN** an expense is created without an explicit analytics value
- **THEN** the system sets `analytics_amount` equal to `amount`

#### Scenario: Creation route

- **WHEN** an expense is created
- **THEN** the system accepts it via the account-scoped route `POST /api/accounts/[id]/expenses`

### Requirement: LED-013 Canonical Ledger Endpoints

The system SHALL expose a canonical set of ledger endpoints with consistent
validation and method handling, and SHALL NOT expose unused top-level ledger
routes.

#### Scenario: Canonical surface

- **WHEN** a client interacts with the ledger API
- **THEN** per-account create and paginated listing are available at `/api/accounts/[id]/{incomes,expenses,transactions}`
- **AND** detail read/edit/delete are available at `/api/{incomes,expenses,transactions}/[id]`
- **AND** transfer creation is available at `POST /api/transactions`

#### Scenario: Validation and method conventions

- **WHEN** a ledger request is received
- **THEN** the system validates the request body with Zod and returns 400 with details on invalid input
- **AND** returns 404 for a missing item on detail routes
- **AND** exposes an OPTIONS handler returning 405 with an Allow header

#### Scenario: Unused top-level routes removed

- **WHEN** a client requests `GET /api/incomes`, `GET /api/expenses`, `POST /api/expenses`, or `GET /api/transactions`
- **THEN** the system does not expose those routes
