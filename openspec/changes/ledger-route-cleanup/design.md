# Design

## Context

Four top-level ledger routes have no caller (verified by full-source search
excluding build artifacts). `POST /api/expenses` is additionally the only path
that stores a NULL `analytics_amount`. Removing the dead routes and guaranteeing
the analytics default are tightly coupled, so they are handled together.

## Approach

- **Remove dead routes (LED-013):**
  - Delete `GET /api/incomes` (`app/api/incomes/route.ts`).
  - Delete `GET` and `POST` from `app/api/expenses/route.ts` (remove the file if
    nothing else remains in it).
  - Delete `GET /api/transactions` from `app/api/transactions/route.ts`, keeping
    the `POST /api/transactions` handler (the canonical transfer-create route).
- **Analytics default (LED-002):** the surviving expense-creation path
  (`POST /api/accounts/[id]/expenses`) and the expense edit path already set
  `analytics_amount = analytics_amount ?? amount`. Once `POST /api/expenses`
  (the NULL-producing path) is removed, defaulting-to-`amount` is the only
  behavior. Confirm no remaining create path can persist NULL.

## Scope boundaries

- Does not change validation rules (that is `ledger-input-validation`).
- Does not change snapshot finalization (that is
  `ledger-finalized-snapshot-preservation`).
- No database schema change; `analytics_amount` stays nullable in the schema
  (a later migration to NOT NULL is optional and out of scope).

## Risks / notes

- Low risk: the removed routes have no callers. Confirm again at implementation
  time with a fresh search in case new usage was added.
- Keep `POST /api/transactions` intact when editing
  `app/api/transactions/route.ts`.
