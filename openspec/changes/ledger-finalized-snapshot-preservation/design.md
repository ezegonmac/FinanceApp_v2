# Design

## Context

`recalculateMonthSnapshot` upserts a MonthSnapshot with `is_final` defaulting to
`false` (and `closed_at` null) unless an `isFinal` option is passed. Ledger
create/edit/delete call it without that option, so recomputing a previously
finalized month silently downgrades it to provisional. The daily job sets
`is_final = true` on previous months via `finalizeMonthSnapshots`.

## Approach

- When recomputing, determine whether the existing snapshot for that
  account+month was already finalized; if so, preserve `is_final = true` (and
  retain `closed_at`) instead of resetting to provisional.
- Likely implementation: have `recalculateMonthSnapshot` read the current
  snapshot's `is_final` and default to preserving it when no explicit `isFinal`
  option is supplied, rather than hard-defaulting to `false`. The exact approach
  is an implementation detail to settle during implementation.

## Scope boundaries

- Does not change whether past-month writes are allowed (they remain allowed).
- Does not change the daily job's finalization of previous months.
- Does not add a hard lock or an audit/correction log (explicitly out of scope).
- No database schema change.

## Risks / notes

- Must not accidentally finalize a **current** (provisional) month: only
  *preserve* an already-true `is_final`; never set it true for a month that was
  not finalized.
- `closed_at` handling should be consistent with preserving finalized status.
