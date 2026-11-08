# Design

## Context

`GET /api/months/[year]/[month]` currently uses `prisma.month.upsert`, so a read
creates the month if missing. Two `OPTIONS` handlers also advertise inaccurate
`Allow` headers. These are small, low-risk API-hygiene fixes.

## Approach

- **Side-effect-free read (MON-002):** change the month detail GET from `upsert`
  to `findUnique`; return 404 when the month does not exist. Keep path-value
  validation (400 on non-numeric). Write paths that need a month continue to
  upsert it (unchanged).
- **Allow headers (MON-001/MON-002):** `/api/months` OPTIONS → `GET, POST`;
  `/api/months/[year]/[month]` OPTIONS → `GET`.

## Scope boundaries

- Only the month `GET` detail route and the two `OPTIONS` handlers change.
- No change to budget, snapshots, or the month-scoped item reads.
- No database schema change.

## Risks / notes

- Confirm no caller depends on GET auto-creating a month; write paths already
  upsert, and `POST /api/months` remains for explicit creation.
