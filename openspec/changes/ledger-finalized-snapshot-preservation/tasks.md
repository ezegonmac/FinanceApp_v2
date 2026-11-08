# Tasks

> Not started. Implementation plan for the approved change; do not begin until
> implementation is authorized.

## 1. Preserve finalized status on recalculation (LED-012)

- [ ] 1.1 Update the snapshot recalculation so that, when the existing snapshot
  for an account+month is already finalized (`is_final = true`), a ledger-write
  recalculation recomputes totals and preserves `is_final = true` (and retains
  `closed_at`).
- [ ] 1.2 Ensure a non-finalized (current/provisional) month is never
  accidentally marked finalized — only preserve an existing true value.

## 2. Verification

- [ ] 2.1 Add tests: editing an item in a finalized past month recomputes totals
  and leaves `is_final = true`; editing in the current month leaves it
  provisional.
- [ ] 2.2 Run the web app test suite and type-check; confirm the daily job's
  finalization behavior is unchanged.
- [ ] 2.3 Verify behavior matches LED-012.
