# Product Backlog

Central functional backlog and **registry of requirement/backlog IDs** for the
project. Every sufficiently defined functional item has a unique, permanent ID
here.

- **ID rules:** see `.kiro/steering/documentation-principles.md` (always-on) and
  `docs/project-documentation-and-sdd-plan.md` §5.2 for the full conventions.
- **Key principles:** IDs are permanent and never reused; they are assigned on
  definition (even before approval); the prefix reflects the item's *original*
  classification, not its final implementation location; reclassify instead of
  renumbering.
- **Functional areas / prefixes** (from `docs/current-state-assessment.md` →
  Recommended Structure):

| Prefix | Area | | Prefix | Area |
|---|---|---|---|---|
| `ACC` | Accounts | | `PFA` | Portfolio Analytics |
| `LED` | Ledger (Incomes/Expenses/Transactions) | | `MET` | Metrics & Reporting |
| `REC` | Recurrent Items | | `TOD` | Todos |
| `MON` | Monthly Model & Snapshots | | `MIL` | Financial Milestones |
| `MKT` | Market Data & Assets | | `AUT` | Authentication & Access Control |
| `INV` | Investments & Positions | | `JOB` | Scheduled / Background Jobs |
| | | | `ADM` | Administration & Debug |
| `GEN` | Cross-cutting / area not yet known | | | |

**Status legend:** `Implemented` · `Partially implemented` · `Planned` ·
`Unverified` · `Candidate` (idea kept, not approved for implementation) ·
`Proposed` (agreed target, not yet built).

> **Granularity note.** Analyzed areas have their canonical, requirement-level
> IDs in the OpenSpec specs under `openspec/specs/<area>/spec.md` (Ledger and
> Accounts so far). Areas not yet analyzed are registered here at the **feature /
> backlog-item** level from the Functional Inventory; those items keep their IDs
> when later decomposed into finer requirements in OpenSpec.
>
> **Workflow note.** The intermediate `.kiro/specs/<area>/requirements.md` step
> has been dropped. The canonical EARS requirements live in OpenSpec; the
> readable functional analysis lives in `docs/current-state-assessment.md`.

---

## Ledger (`LED`)

Canonical requirements live at `openspec/specs/ledger/spec.md` (implemented
baseline) and the `ledger-*` OpenSpec changes (`Proposed` items). `LED-016` is a
`Candidate` only (not approved). Statuses below summarize those sources.

| ID | Item | Status | Source |
|---|---|---|---|
| LED-001 | Create an Income | Implemented | openspec specs/changes |
| LED-002 | Create an Expense | Partially implemented (002.3 analytics default is Proposed) | openspec specs/changes |
| LED-003 | Create a Transaction (Transfer) | Implemented | openspec specs/changes |
| LED-004 | Amount validation (> 0) | Proposed (edit done; create to align) | openspec specs/changes |
| LED-005 | Expense kind required | Proposed (edit done; create to align) | openspec specs/changes |
| LED-006 | Account existence & self-transfer validation | Proposed | openspec specs/changes |
| LED-007 | Edit a ledger item (balance reversal) | Implemented | openspec specs/changes |
| LED-008 | Delete a ledger item | Implemented | openspec specs/changes |
| LED-009 | Process pending items via daily job | Implemented | openspec specs/changes |
| LED-010 | Balance mutation semantics | Implemented | openspec specs/changes |
| LED-011 | MonthSnapshot aggregation | Implemented | openspec specs/changes |
| LED-012 | Edits to finalized months (re-finalize) | Partially implemented (012.2 re-finalize is Proposed) | openspec specs/changes |
| LED-013 | Supported ledger endpoints (remove dead routes) | Partially implemented (013.2 removal is Proposed) | openspec specs/changes |
| LED-014 | Analytics-adjusted expense value (expense-only) | Implemented | openspec specs/changes |
| LED-015 | Prevent accidental duplicate submission | Proposed | openspec specs/changes |
| LED-016 | Soft delete via CANCELLED | Candidate (not approved for implementation) | product-backlog |

## Accounts (`ACC`)

| ID | Item | Status | Source |
|---|---|---|---|
Canonical requirements live at `openspec/specs/accounts/spec.md` and the
`accounts-*` OpenSpec changes. IDs below are the requirement-level ACC IDs from
that spec.

| ID | Item | Status | Source |
|---|---|---|---|
| ACC-001 | Create an Account | Implemented (untested) | openspec specs |
| ACC-002 | List Accounts (exclude inactive by default — Proposed) | Partially implemented (002 default-filter is Proposed) | openspec specs/changes |
| ACC-003 | Read a Single Account | Implemented (untested) | openspec specs |
| ACC-004 | Edit Account Details | Implemented (untested) | openspec specs |
| ACC-005 | Enable or Disable an Account | Implemented (untested) — corrected from Planned | openspec specs |
| ACC-006 | Balance derived; accounts retained (no delete) | Implemented (untested) | openspec specs |
| ACC-007 | Validation Error Reporting (error.errors fix — Proposed) | Partially implemented (007 details fix is Proposed) | openspec specs/changes |

## Recurrent Items (`REC`)

Canonical requirements live at `openspec/specs/recurrent-items/spec.md`. Covers
all four types (income, expense, transaction, investment). Lifecycle edits
(pause/resume, modify dates/frequency, status transitions) are genuinely
**Planned** — no API path exists.

| ID | Item | Status | Source |
|---|---|---|---|
| REC-001 | Create a recurrent item (all 4 types) | Implemented (untested) | openspec specs |
| REC-002 | Backfill on creation (automated applies; non-automated → Todos) | Implemented (untested) | openspec specs |
| REC-003 | Apply recurrent items via the daily job | Implemented (untested) | openspec specs |
| REC-004 | Open-ended (no end date) recurrences | Implemented (untested) | openspec specs |
| REC-005 | Delete a recurrent item (cascade + balance revert) | Implemented (untested) | openspec specs |
| REC-006 | Run log (per-month APPLIED/FAILED) | Implemented (untested) | openspec specs |
| REC-007 | Pause / resume recurrent items | Planned (no API path) | README 🟨 |
| REC-008 | Modify start/end dates and frequency | Planned (no API path) | README 🟨 |
| REC-009 | Status transitions after creation (incl. CANCELLED) | Planned (no API path) | assessment (Area C analysis) |

## Monthly Model & Snapshots (`MON`)

Canonical requirements live at `openspec/specs/monthly-model/spec.md` and the
`monthly-model-*` OpenSpec changes.

| ID | Item | Status | Source |
|---|---|---|---|
| MON-001 | Month entity (list + upsert) | Implemented (untested; Allow-header fix Proposed) | openspec specs/changes |
| MON-002 | Month detail read | Implemented (untested; side-effect-free read Proposed) | openspec specs/changes |
| MON-003 | Monthly budget | Implemented (untested) | openspec specs |
| MON-004 | Month snapshots (aggregation + read) | Implemented (untested) | openspec specs |
| MON-005 | Snapshot finalization lifecycle | Implemented (untested) | openspec specs |
| MON-006 | Month-scoped item reads | Implemented (untested) | openspec specs |
| MON-007 | Monthly splits (planned + real) | Planned | README 🟨 (not yet specified) |

## Market Data & Assets (`MKT`)

Canonical requirements live at `openspec/specs/market-data/spec.md`.

| ID | Item | Status | Source |
|---|---|---|---|
| MKT-001 | Asset catalog + provider mapping (ISIN dedup) | Implemented & tested | openspec specs |
| MKT-002 | Price history storage & sync | Implemented & tested | openspec specs |
| MKT-003 | Asset search | Implemented & tested | openspec specs |
| MKT-004 | Timeframe price queries | Implemented & tested | openspec specs |
| MKT-005 | Asset comparison | Implemented & tested | openspec specs |
| MKT-006 | Sparklines | Implemented (untested) | openspec specs |
| MKT-007 | Contribution markers (chart overlay) | Implemented (untested) | openspec specs |
| MKT-008 | Currency conversion on asset plots | Partially implemented (bug) | README 🟨 (defect; future change) |

## Investments & Positions (`INV`)

Canonical requirements live at `openspec/specs/investments/spec.md`.

| ID | Item | Status | Source |
|---|---|---|---|
| INV-001 | Create a BUY or SELL (manual / amount mode) | Implemented & tested | openspec specs |
| INV-002 | Operation lifecycle and balance effect | Implemented & tested | openspec specs |
| INV-003 | Sell unit validation | Implemented & tested | openspec specs |
| INV-004 | Cancel an operation (balance reversal) | Implemented & tested | openspec specs |
| INV-005 | Process pending investments via daily job | Implemented & tested | openspec specs |
| INV-006 | View positions per account | Implemented & tested | openspec specs |
| INV-007 | List operations (paginated, asset filter) | Implemented (untested) | openspec specs |

## Portfolio Analytics (`PFA`)

| ID | Item | Status | Source |
|---|---|---|---|
| PFA-001 | Portfolio performance (P&L, TWR, value over time) | Implemented & tested | portfolio-performance.md |
| PFA-002 | Portfolio exposure (sector/country) | Implemented & tested | portfolio-exposure.md |
| PFA-003 | Exposure monthly sync | Implemented & tested | portfolio-exposure.md |
| PFA-005 | Allocation drift | Planned | portfolio-drift.md 🟨 |

> Admin exposure re-sync has the single canonical ID **ADM-004** (Administration
> & Debug). It serves Portfolio Analytics but is classified as an admin
> operation. PFA-004 is intentionally not assigned to avoid reusing an ID for a
> different item.

## Metrics & Reporting (`MET`)

Canonical requirements live at `openspec/specs/metrics/spec.md`.

| ID | Item | Status | Source |
|---|---|---|---|
| MET-001 | Account balances | Implemented (untested) | openspec specs |
| MET-002 | Monthly summary | Implemented (untested) | openspec specs |
| MET-003 | Account balance series | Implemented (untested) | openspec specs |
| MET-004 | Expenses by kind (+ budget) | Implemented (untested) | openspec specs |
| MET-005 | Year analytics | Planned | README 🟨 (not yet specified) |

## Todos (`TOD`)

Canonical requirements live at `openspec/specs/todos/spec.md`. Fully implemented
(corrected from the README's 🟨 "pending").

| ID | Item | Status | Source |
|---|---|---|---|
| TOD-001 | List todos (filtered, due-gated, paginated) | Implemented (untested) | openspec specs |
| TOD-002 | Complete a todo (performs ledger movement, idempotent) | Implemented (untested) | openspec specs |
| TOD-003 | Skip and reopen a todo | Implemented (untested) | openspec specs |

## Financial Milestones (`MIL`)

Confirmed **not implemented** (no model/route/UI). No OpenSpec baseline spec;
when approved it enters via an OpenSpec change introducing a `milestones`
capability. See legacy proposal `specs/financial-milestones.md`.

| ID | Item | Status | Source |
|---|---|---|---|
| MIL-001 | Milestone tracking (invested, net worth, portfolio, expense coverage) | Planned (not implemented) | specs/financial-milestones.md 🟨 |

## Authentication & Access Control (`AUT`)

Canonical requirements live at `openspec/specs/authentication/spec.md`.

| ID | Item | Status | Source |
|---|---|---|---|
| AUT-001 | Credential login (single env-var user, JWT) | Implemented (untested) | openspec specs |
| AUT-002 | Route protection (401 API / redirect pages) | Implemented (untested) | openspec specs |
| AUT-003 | Access bypass list (login, auth, internal, static) | Implemented (untested) | openspec specs |
| AUT-004 | Internal job Bearer authorization | Implemented (untested) | openspec specs |

## Scheduled / Background Jobs (`JOB`)

Canonical requirements live at `openspec/specs/scheduled-jobs/spec.md`.

| ID | Item | Status | Source |
|---|---|---|---|
| JOB-001 | Daily job endpoint (Bearer authorized) | Implemented (untested) | openspec specs |
| JOB-002 | Daily orchestration (recurrents, pending, exposure, snapshots) | Implemented (partially tested) | openspec specs |
| JOB-003 | Idempotent daily run (one per job/day) | Implemented (untested) | openspec specs |
| JOB-004 | Run record (status + counts) | Implemented (untested) | openspec specs |
| JOB-005 | Dedicated price-sync cron | Planned | assets-background-sync.md (stub) |
| JOB-006 | Server cron automation (ops) | Planned | README 🟨 |

## Administration & Debug (`ADM`)

Canonical requirements live at `openspec/specs/admin/spec.md`.

| ID | Item | Status | Source |
|---|---|---|---|
| ADM-001 | Trigger the daily job (admin panel) | Implemented (untested) | openspec specs |
| ADM-002 | View job run history | Implemented (untested) | openspec specs |
| ADM-003 | Debug mode (extra columns, per-browser) | Implemented (untested) | openspec specs |
| ADM-004 | Admin exposure re-sync | Implemented & tested | openspec specs (serves Portfolio Analytics) |

## Cross-cutting / Unclassified (`GEN`)

Items whose functional area is not yet determined. None currently assigned.

| ID | Item | Status | Source |
|---|---|---|---|
| — | — | — | — |

---

## Maintenance notes

- This file is the **single source of truth for IDs**. When adding an item,
  take the next free number for its prefix (or `GEN` if the area is unknown).
- When an item is reclassified, **keep its ID**, change its area/section note,
  and record the move rather than renumbering.
- Non-`LED` items are at feature granularity; when an area gets detailed EARS
  analysis, its items may be decomposed into finer requirements that **retain**
  the parent ID lineage (e.g. the feature ID stays valid; new sub-requirements
  get new numbers under the same prefix).
- Statuses mirror `docs/current-state-assessment.md`; update both together.
