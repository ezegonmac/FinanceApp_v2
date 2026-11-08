# Proposal

## Why

The synchronous ledger create paths have no guard against accidental duplicate
submission. A single intended action — a double-click, a retry on a flaky
connection, or a re-render — can submit the same create request twice, producing
two ledger items and applying the balance effect twice. The daily job already
protects against double application, but the interactive create paths do not.
The fix must stop the accident without blocking a user who genuinely wants two
items with identical details (e.g. two real €3.50 coffees the same day).

## What Changes

- Guard against accidental duplicate submission of a ledger create request (for
  example, by preventing repeated submission of the same request from the
  client).
- Explicitly preserve the ability to create distinct items that share identical
  details (no hard content-based dedup, no mandatory idempotency keys).

## Capabilities

### New Capabilities

<!-- None. This change modifies the existing ledger capability. -->

### Modified Capabilities

- `ledger`: add an accidental-duplicate-submission guard while preserving
  intentional identical items (LED-015).

## Impact

- **Primary (client):** prevent repeated submission of the same create request
  from the ledger add forms (e.g. disable the submit control after first click,
  re-enable on response/error).
- **Optional (server, soft):** a short-window soft check that treats an
  identical `account + month + amount + description` create within a few seconds
  as a likely duplicate and warns/confirms rather than hard-rejecting.
- **No database schema change.** No change to balance, snapshot, or job logic.
- **Deliberately excluded:** hard content-based deduplication and mandatory
  server-side idempotency keys.
- **Requirement IDs:** preserves LED-015 and its acceptance criteria; no IDs
  invented or renumbered.
- **Relationship:** independent of the other three changes; lowest priority.
