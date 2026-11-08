# Tasks

> Not started. Implementation plan for the approved change; do not begin until
> implementation is authorized.

## 1. Client-side guard (primary) (LED-015)

- [ ] 1.1 In the ledger add forms (income, expense, transaction), disable the
  submit control after first click and re-enable on response/error so a single
  user action cannot submit the create request more than once.

## 2. Optional server-side soft check (LED-015)

- [ ] 2.1 (Optional) Add a short-window soft check that flags an identical
  `account + month + amount + description` create within a few seconds as a
  likely duplicate and warns/confirms — never hard-rejects.

## 3. Verification

- [ ] 3.1 Add tests: repeated submission from one action does not create a
  duplicate; two intentionally identical items are still both created.
- [ ] 3.2 Run the web app test suite and type-check; confirm no regressions.
- [ ] 3.3 Verify behavior matches LED-015 (guard accidental duplicates without
  blocking intentional identical items).
