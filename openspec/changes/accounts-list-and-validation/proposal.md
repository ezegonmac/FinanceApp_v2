# Proposal

## Why

Two small gaps in the Accounts API: (1) `GET /api/accounts` returns all accounts
including inactive ones, pushing the active/inactive filtering onto every
consumer; and (2) `POST /api/accounts` builds its 400 response from a
non-existent property on the validation error (`error.errors`), so the
validation-error branch is malformed under the installed Zod version. Both are
contained to the accounts routes and worth fixing together.

## What Changes

- `GET /api/accounts` excludes inactive accounts by default, and includes them
  only when the caller explicitly opts in (e.g. an `includeInactive` query
  parameter). **BREAKING** for any consumer relying on inactive accounts being
  returned by default (the app's own consumers already filter to active).
- Fix the validation-error details construction in `POST /api/accounts` to use
  the correct validation-error structure, so a 400 response carries proper
  details.

## Capabilities

### New Capabilities

<!-- None. This change modifies the existing accounts capability. -->

### Modified Capabilities

- `accounts`: list excludes inactive by default with opt-in (ACC-002); correct
  validation-error reporting on create (ACC-007).

## Impact

- **Affected routes:** `GET /api/accounts` (filtering + opt-in param);
  `POST /api/accounts` (error details).
- **Consumers:** the accounts page and snapshot queries already filter
  `active: true`, so default-excluding inactive aligns the API with existing
  usage; `AccountsTable` currently lists all accounts and shows a status badge —
  it would need `includeInactive` to keep showing inactive ones.
- **No database schema change.**
- **Requirement IDs:** preserves ACC-002 and ACC-007; no IDs invented or
  renumbered.
