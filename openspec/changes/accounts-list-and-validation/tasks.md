# Tasks

> Not started. Implementation plan for the approved change; do not begin until
> implementation is authorized.

## 1. List excludes inactive by default (ACC-002)

- [ ] 1.1 Add an optional `includeInactive` query parameter to
  `GET /api/accounts`; default filters to `active: true`, opt-in returns all.
- [ ] 1.2 Update `AccountsTable` to request inactive accounts (pass
  `includeInactive`) so it continues to show the Active/Inactive status badge.

## 2. Fix validation-error reporting (ACC-007)

- [ ] 2.1 Replace `error.errors` in `POST /api/accounts` with the correct
  validation-error accessor for the installed Zod version; align with how other
  routes report validation errors.

## 3. Verification

- [ ] 3.1 Add tests: default list returns only active accounts; `includeInactive`
  returns all; invalid account create returns 400 with proper details.
- [ ] 3.2 Run the web app test suite and type-check; confirm the `error.errors`
  type error in this route is resolved and the accounts table still shows
  inactive accounts.
- [ ] 3.3 Verify behavior matches ACC-002 and ACC-007.
