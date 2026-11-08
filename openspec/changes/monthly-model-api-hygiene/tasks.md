# Tasks

> Not started. Implementation plan for the approved change; do not begin until
> implementation is authorized.

## 1. Side-effect-free month read (MON-002)

- [ ] 1.1 Change `GET /api/months/[year]/[month]` from `upsert` to `findUnique`;
  return 404 when the month does not exist; keep 400 on non-numeric path values.
- [ ] 1.2 Confirm no consumer relies on GET auto-creating a month (write paths
  upsert; `POST /api/months` creates explicitly).

## 2. Accurate Allow headers (MON-001, MON-002)

- [ ] 2.1 `/api/months` OPTIONS → `Allow: GET, POST`.
- [ ] 2.2 `/api/months/[year]/[month]` OPTIONS → `Allow: GET`.

## 3. Verification

- [ ] 3.1 Add tests: reading a missing month returns 404 and does not create it;
  OPTIONS responses advertise the correct methods.
- [ ] 3.2 Run the web app test suite and type-check; confirm no regressions.
- [ ] 3.3 Verify behavior matches MON-001 and MON-002.
