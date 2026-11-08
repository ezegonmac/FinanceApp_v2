# Proposal

## Why

The daily job finalizes a previous month's snapshots (`is_final = true`,
`closed_at` set) to lock historical metrics. But when a user later creates,
edits, or deletes a ledger item in that past month, the resulting snapshot
recalculation defaults `is_final` to `false`, silently downgrading a finalized
month back to provisional. Legitimate corrections must still flow through (the
running account balance absorbs them regardless), but a corrected closed month
should remain closed rather than quietly reopening.

## What Changes

- When a ledger write recomputes a MonthSnapshot that was previously finalized
  (`is_final = true`), recompute the totals but keep the snapshot finalized
  (preserve `is_final = true`).
- Past-month edits remain allowed (no hard lock); only the finalized flag's
  preservation changes.

## Capabilities

### New Capabilities

<!-- None. This change modifies the existing ledger capability. -->

### Modified Capabilities

- `ledger`: preserve finalized snapshot status on recalculation triggered by a
  ledger write (LED-012).

## Impact

- **Affected logic:** the snapshot recalculation invoked by ledger
  create/edit/delete (`recalculateMonthSnapshot`), specifically how `is_final`
  is set when the existing snapshot was already finalized.
- **Unchanged:** the daily job's own finalization of previous months; balance
  mutation; the allowance of past-month writes.
- **No database schema change** (the `is_final` / `closed_at` fields already
  exist).
- **Requirement IDs:** preserves LED-012 and its acceptance criteria; no IDs
  invented or renumbered.
- **Relationship:** independent of the other three changes.
