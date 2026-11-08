# Design

## Context

`GET /api/accounts` currently returns all accounts unconditionally;
`POST /api/accounts` constructs its 400 body with `details: error.errors`, a
property that does not exist on the installed Zod version's `ZodError` (the
repo-wide type-check flags this). Both are small, co-located fixes in the
accounts routes.

## Approach

- **List filtering (ACC-002):** add an optional `includeInactive` query
  parameter to `GET /api/accounts`. Default behavior filters to `active: true`;
  when `includeInactive` is set, return all accounts. Update `AccountsTable` to
  request inactive accounts (e.g. pass `includeInactive`) so it can keep showing
  the Active/Inactive status badge; otherwise it would list active-only.
- **Validation error (ACC-007):** replace `error.errors` with the correct
  accessor for the installed Zod version (e.g. `error.issues`, or
  `error.flatten()` / `z.treeifyError`), so the 400 response carries real
  details and the type-check passes.

## Scope boundaries

- Only `GET`/`POST /api/accounts` and the `AccountsTable` consumer are affected.
- No database schema change. No change to create/edit/disable semantics.

## Risks / notes

- Default-excluding inactive is technically a response-shape change; the app's
  own consumers already filter to active, and `AccountsTable` will be updated to
  opt in, so user-visible behavior is preserved.
- Confirm the exact Zod v4 accessor during implementation and align with how
  other routes report validation errors for consistency.
