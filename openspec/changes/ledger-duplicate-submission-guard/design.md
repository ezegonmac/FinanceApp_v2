# Design

## Context

The daily job uses a status-guarded claim and is idempotent, but the synchronous
create paths (`POST /api/accounts/[id]/incomes`,
`POST /api/accounts/[id]/expenses`, `POST /api/transactions`) have no guard — a
repeated submission of one user action creates duplicate items and doubles the
balance effect. The guard must not reject genuinely distinct identical entries.

## Approach

- **Primary — client-side:** in the ledger add forms, disable the submit control
  on first click and re-enable on response/error so a double-click or impatient
  retry cannot fire the request twice. Catches the common case and never blocks
  a deliberate second entry.
- **Optional — server-side soft check:** if additional protection is wanted
  (e.g. for the future mobile/direct-API client), detect an identical
  `account + month + amount + description` create within a short window (a few
  seconds) and warn/confirm rather than hard-reject. True idempotency keys
  (per-submit token) are the most correct form but add the most plumbing and are
  deferred.

## Scope boundaries

- **Excluded:** hard content-based deduplication and mandatory idempotency keys
  (false-positive risk on genuine duplicates; complexity unjustified for a
  single-user tracker).
- No database schema change.
- Independent of the other three ledger changes.

## Risks / notes

- The soft server check, if implemented, must warn rather than reject, to honor
  "allow distinct identical items" (LED-015).
- Primary mitigation is client-side; the server soft check is optional and can
  be deferred without blocking the change's core intent.
