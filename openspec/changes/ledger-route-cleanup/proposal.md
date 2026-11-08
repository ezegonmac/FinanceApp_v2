# Proposal

## Why

Four top-level ledger routes exist but have no caller anywhere in the codebase
(`GET /api/incomes`, `GET /api/expenses`, `POST /api/expenses`,
`GET /api/transactions`). One of them, `POST /api/expenses`, is also the only
code path that creates an expense with a NULL `analytics_amount`, diverging from
every other expense-creation path (which default it to `amount`). Removing the
dead routes eliminates the inconsistency and the only source of the NULL
analytics defect in one focused change.

## What Changes

- Remove the four unused top-level routes: `GET /api/incomes`,
  `GET /api/expenses`, `POST /api/expenses`, `GET /api/transactions`.
- Ensure `analytics_amount` always defaults to `amount` when an expense is
  created without an explicit analytics value. After removing
  `POST /api/expenses`, the remaining expense-creation path already does this;
  this change makes the defaulting the single, guaranteed behavior.

Usage was verified by a full-source search (excluding build artifacts): only the
route handlers themselves and no callers reference these paths.

## Capabilities

### New Capabilities

<!-- None. This change modifies the existing ledger capability. -->

### Modified Capabilities

- `ledger`: remove the unused top-level routes (LED-013) and guarantee the
  `analytics_amount`-defaults-to-`amount` behavior on expense creation
  (LED-002).

## Impact

- **Removed routes:** `app/api/incomes/route.ts` (GET),
  `app/api/expenses/route.ts` (GET, POST), `app/api/transactions/route.ts` (GET
  only — the `POST /api/transactions` handler in that file is the canonical
  transfer-create route and is retained).
- **Retained:** all account-scoped routes, all `/[id]` detail routes, and
  `POST /api/transactions`.
- **No database schema change.** No change to balance, snapshot, or job logic.
- **Requirement IDs:** preserves LED-002 and LED-013 (and their acceptance
  criteria); no IDs invented or renumbered.
- **Relationship:** depends on nothing; complements `ledger-input-validation`
  (which deliberately left `POST /api/expenses` out of scope so it is removed
  here).
