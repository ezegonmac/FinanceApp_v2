# Design

## Context

Validation currently differs between create and edit routes, and referential
errors surface as caught 500s. This change aligns create-time validation with
the stricter edit behavior. It is validation-only: no change to balance
mutation, snapshot aggregation, the daily job, or the data model.

## Approach

- **Amount > 0 (LED-004):** change the create Zod schemas from `nonnegative` to
  `positive` for income, expense, and transaction amounts, matching the edit
  schemas. No change needed on the edit paths (already `positive`).
- **Expense kind required (LED-005):** make `kind` required (enum FIXED |
  VARIABLE) in the expense create schema; remove the implicit `?? "FIXED"`
  default so a missing kind is a 400. The UI already always sends a kind.
- **Account existence (LED-006.1):** before mutating balances, verify the
  referenced account(s) exist; return 404 (or 400) rather than letting the
  Prisma update throw into the generic 500 handler. Applies to income, expense,
  and both transfer accounts.
- **Self-transfer (LED-006.2):** on transfer create, reject when
  `from_account_id === to_account_id` with a 400, mirroring the existing check
  in the transaction edit route.

## Scope boundaries

- Applies to create paths only: `POST /api/accounts/[id]/incomes`,
  `POST /api/accounts/[id]/expenses`, `POST /api/transactions`. Edit paths
  already satisfy these rules.
- The unused top-level `POST /api/expenses` route is **out of scope** here; it
  is handled by the separate `ledger-route-cleanup` change.
- No database schema change.

## Risks / notes

- Low risk: stricter input rejection only; valid requests are unaffected.
- The ordering of the existence check relative to the `month.upsert` should
  avoid creating a `Month` for a request that will be rejected; the
  implementation should validate accounts before side effects.
