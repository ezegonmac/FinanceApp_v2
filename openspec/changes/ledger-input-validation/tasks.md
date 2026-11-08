# Tasks

> Not started. These tasks are the implementation plan for the approved change;
> do not begin until implementation is authorized.

## 1. Amount must be greater than zero (LED-004)

- [ ] 1.1 Change income create schema amount from `nonnegative` to `positive`
  (`POST /api/accounts/[id]/incomes`).
- [ ] 1.2 Change expense create schema amount from `nonnegative` to `positive`
  (`POST /api/accounts/[id]/expenses`).
- [ ] 1.3 Change transaction create schema amount from `nonnegative` to
  `positive` (`POST /api/transactions`).
- [ ] 1.4 Confirm edit schemas already enforce `positive` (no change expected).

## 2. Expense kind required (LED-005)

- [ ] 2.1 Make `kind` required (enum FIXED | VARIABLE) in the expense create
  schema and remove the implicit `?? "FIXED"` default.

## 3. Account existence validation (LED-006.1)

- [ ] 3.1 In income/expense create, verify the account exists before any side
  effect (including `month.upsert`); return 404 (or 400) if not.
- [ ] 3.2 In transfer create, verify both source and destination accounts exist;
  return 404 (or 400) if either is missing.

## 4. Self-transfer rejection (LED-006.2)

- [ ] 4.1 In transfer create, reject `from_account_id === to_account_id` with a
  400, mirroring the existing transaction edit check.

## 5. Verification

- [ ] 5.1 Add tests covering: amount = 0 rejected on create (all three types);
  expense missing kind rejected; non-existent account rejected with 404/400;
  self-transfer rejected with 400; and that valid requests still succeed.
- [ ] 5.2 Run the web app test suite and type-check; confirm no regressions.
- [ ] 5.3 Verify the implemented behavior matches LED-004, LED-005, and LED-006.
