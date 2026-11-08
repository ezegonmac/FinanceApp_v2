# Tasks

> Not started. Implementation plan for the approved change; do not begin until
> implementation is authorized.

## 1. Remove unused top-level routes (LED-013)

- [ ] 1.1 Re-confirm (fresh full-source search, excluding build artifacts) that
  `GET /api/incomes`, `GET /api/expenses`, `POST /api/expenses`, and
  `GET /api/transactions` still have no callers.
- [ ] 1.2 Remove `GET /api/incomes` (`app/api/incomes/route.ts`).
- [ ] 1.3 Remove `GET` and `POST` from `app/api/expenses/route.ts` (remove the
  file if empty afterward).
- [ ] 1.4 Remove `GET /api/transactions` from `app/api/transactions/route.ts`,
  retaining `POST /api/transactions`.

## 2. Guarantee analytics default (LED-002)

- [ ] 2.1 Confirm the surviving expense create path defaults
  `analytics_amount` to `amount`; verify no create path persists NULL.

## 3. Verification

- [ ] 3.1 Add/adjust tests: removed routes no longer resolve; expense created
  without an analytics value stores `analytics_amount == amount`.
- [ ] 3.2 Run the web app test suite and type-check; confirm no regressions
  (especially that no component referenced the removed routes).
- [ ] 3.3 Verify behavior matches LED-002 and LED-013.
