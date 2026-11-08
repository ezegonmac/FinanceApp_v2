# Proposal

## Why

Ledger create endpoints validate input more loosely than the edit endpoints,
and some invalid input fails as a server error instead of a clean client error.
This lets meaningless or malformed items into the ledger (zero amounts,
expenses without a kind, items referencing non-existent accounts, and
self-transfers), and produces confusing 500s. Aligning create-time validation
with the stricter edit behavior makes the API consistent and matters more for
the planned mobile/direct-API client, which has no UI dropdowns to constrain
input.

## What Changes

- Reject any ledger item whose amount is not greater than zero, on **create**
  (edit already does this). Create currently accepts `0` via `nonnegative`.
- Require an expense to specify its `kind` (FIXED or VARIABLE) on **create**
  (edit already requires it). Create currently defaults a missing kind to FIXED.
- Reject a ledger item that references a **non-existent account** with a
  404/400 instead of a caught 500.
- Reject a **self-transfer** (source account equals destination) on transaction
  **create** with a 400 (edit already enforces this).

These changes tighten validation only; they do not change how valid items are
created, applied to balances, or aggregated.

## Capabilities

### New Capabilities

<!-- None. This change modifies the existing ledger capability. -->

### Modified Capabilities

- `ledger`: strengthen create-time input validation — amount must be > 0
  (LED-004), expense kind required (LED-005), account existence validated and
  self-transfer rejected (LED-006).

## Impact

- **Affected routes (create paths):** `POST /api/accounts/[id]/incomes`,
  `POST /api/accounts/[id]/expenses`, `POST /api/transactions`.
- **Validation:** Zod schemas on those routes; add account-existence checks and
  a same-account check on transfer create.
- **No change** to edit/delete routes, the daily job, balance mutation, or
  snapshot aggregation.
- **No database schema change.** No change to tests in this change (tests to be
  added when the change is implemented).
- **Requirement IDs:** preserves LED-004, LED-005, LED-006 (and their original
  acceptance criteria); no IDs invented or renumbered.
