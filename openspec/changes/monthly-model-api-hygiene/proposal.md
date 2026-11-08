# Proposal

## Why

Two small API-hygiene issues in the month endpoints: (1)
`GET /api/months/[year]/[month]` upserts the month as a side effect, so a plain
read can materialize a Month row; and (2) the `OPTIONS` handlers advertise
inaccurate `Allow` headers (`/api/months` advertises only `POST` though `GET`
exists; `/api/months/[year]/[month]` advertises only `GET`). Reads should not
mutate, and `Allow` headers should reflect the real supported methods.

## What Changes

- `GET /api/months/[year]/[month]` returns the month without creating it; when
  the month does not exist it returns a 404 rather than upserting. Month
  creation remains available via `POST /api/months` (and the existing lazy
  upsert on write paths is unchanged).
- Correct the `Allow` headers: `/api/months` → `GET, POST`;
  `/api/months/[year]/[month]` → `GET`.

## Capabilities

### New Capabilities

<!-- None. This change modifies the existing monthly-model capability. -->

### Modified Capabilities

- `monthly-model`: month detail read is side-effect-free (MON-002); accurate
  Allow headers (MON-001, MON-002).

## Impact

- **Affected routes:** `GET /api/months/[year]/[month]` (no upsert, 404 when
  missing); `OPTIONS` of `/api/months` and `/api/months/[year]/[month]`.
- **Consumers:** any caller relying on GET auto-creating a month must create it
  via `POST /api/months` (or a write path) instead. Write paths already upsert
  the month, so normal flows are unaffected.
- **No database schema change.**
- **Requirement IDs:** preserves MON-001 and MON-002; no IDs invented or
  renumbered.
