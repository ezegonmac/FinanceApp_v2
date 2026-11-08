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

> **Granularity note.** Ledger (`LED`) has been analyzed in detail, so its IDs
> are at the **requirement** level and match `.kiro/specs/ledger/requirements.md`
> exactly (preserved verbatim — not renumbered). Other areas have not yet had
> detailed functional analysis, so they are registered here at the **feature /
> backlog-item** level from the Functional Inventory. Those items keep their IDs
> when later decomposed into finer requirements.

---

## Ledger (`LED`)

IDs preserved verbatim from `.kiro/specs/ledger/requirements.md`. The
**implemented** baseline is now the canonical spec at
`openspec/specs/ledger/spec.md`. The `Proposed` items are tracked as OpenSpec
change(s); `LED-016` is a `Candidate` only (not approved). Status below reflects
the requirements document's per-requirement tags.

| ID | Item | Status | Source |
|---|---|---|---|
| LED-001 | Create an Income | Implemented | ledger/requirements.md |
| LED-002 | Create an Expense | Partially implemented (002.3 analytics default is Proposed) | ledger/requirements.md |
| LED-003 | Create a Transaction (Transfer) | Implemented | ledger/requirements.md |
| LED-004 | Amount validation (> 0) | Proposed (edit done; create to align) | ledger/requirements.md |
| LED-005 | Expense kind required | Proposed (edit done; create to align) | ledger/requirements.md |
| LED-006 | Account existence & self-transfer validation | Proposed | ledger/requirements.md |
| LED-007 | Edit a ledger item (balance reversal) | Implemented | ledger/requirements.md |
| LED-008 | Delete a ledger item | Implemented | ledger/requirements.md |
| LED-009 | Process pending items via daily job | Implemented | ledger/requirements.md |
| LED-010 | Balance mutation semantics | Implemented | ledger/requirements.md |
| LED-011 | MonthSnapshot aggregation | Implemented | ledger/requirements.md |
| LED-012 | Edits to finalized months (re-finalize) | Partially implemented (012.2 re-finalize is Proposed) | ledger/requirements.md |
| LED-013 | Supported ledger endpoints (remove dead routes) | Partially implemented (013.2 removal is Proposed) | ledger/requirements.md |
| LED-014 | Analytics-adjusted expense value (expense-only) | Implemented | ledger/requirements.md |
| LED-015 | Prevent accidental duplicate submission | Proposed | ledger/requirements.md |
| LED-016 | Soft delete via CANCELLED | Candidate (not approved for implementation) | ledger/requirements.md |

## Accounts (`ACC`)

| ID | Item | Status | Source |
|---|---|---|---|
| ACC-001 | Create / list / edit account | Implemented (untested) | assessment inventory, README |
| ACC-002 | Live balance tracking | Unverified | assessment inventory |
| ACC-003 | Account icon | Unverified | README "Design" |
| ACC-004 | Enable / disable account | Planned | README 🟨 |

## Recurrent Items (`REC`)

| ID | Item | Status | Source |
|---|---|---|---|
| REC-001 | Recurrent incomes | Implemented (untested) | assessment inventory, README |
| REC-002 | Recurrent expenses | Implemented (untested) | assessment inventory, README |
| REC-003 | Recurrent transactions | Implemented (untested) | assessment inventory, README |
| REC-004 | Recurrent investments | Implemented (untested) | assessment inventory, README |
| REC-005 | No-end-date recurrences | Implemented (untested) | README ✅ |
| REC-006 | Delete recurrent with associated items | Unverified | README ✅ |
| REC-007 | Pause / resume recurrent items | Partially implemented | README 🟨 |
| REC-008 | Modify start/end dates and frequency | Planned | README 🟨 |

## Monthly Model & Snapshots (`MON`)

| ID | Item | Status | Source |
|---|---|---|---|
| MON-001 | Month model & detail view | Implemented (untested) | assessment inventory, README |
| MON-002 | Monthly budget | Implemented (untested) | assessment inventory, README |
| MON-003 | Month snapshots (aggregation) | Implemented (untested) | assessment inventory |
| MON-004 | Snapshot finalization lifecycle | Unverified | README (documented) |
| MON-005 | Monthly splits (planned + real) | Planned | README 🟨 |

## Market Data & Assets (`MKT`)

| ID | Item | Status | Source |
|---|---|---|---|
| MKT-001 | Asset catalog & tracking | Implemented & tested | assessment inventory, specs |
| MKT-002 | Provider mapping (ISIN) | Implemented & tested | assets-provider.md |
| MKT-003 | Price history storage & sync | Implemented & tested | financial-product-data.md |
| MKT-004 | Asset search | Implemented & tested | financial-product-data.md |
| MKT-005 | Price charts & timeframes | Implemented & tested | README ✅ |
| MKT-006 | Asset comparison | Implemented & tested | asset-comparison.md |
| MKT-007 | Sparklines | Implemented | sparklines.md |
| MKT-008 | Contribution-history markers (chart overlay) | Implemented (untested) | contribution-history.md |
| MKT-009 | Currency conversion on asset plots | Partially implemented (bug) | README 🟨 |

## Investments & Positions (`INV`)

| ID | Item | Status | Source |
|---|---|---|---|
| INV-001 | Buy/Sell operations | Implemented & tested | investments.md |
| INV-002 | Positions per account | Implemented & tested | investments.md |
| INV-003 | Price check on create | Implemented | investments.md |
| INV-004 | Pending investment processing | Implemented & tested | investments.md |
| INV-005 | Sell-units validation | Unverified | investments.md |

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

| ID | Item | Status | Source |
|---|---|---|---|
| MET-001 | Balances | Implemented (untested) | assessment inventory |
| MET-002 | Monthly summary | Implemented (untested) | assessment inventory |
| MET-003 | Account balance series | Implemented (untested) | assessment inventory |
| MET-004 | Expenses by kind (+ budget) | Implemented (untested) | assessment inventory |
| MET-005 | Year analytics | Planned | README 🟨 |

## Todos (`TOD`)

| ID | Item | Status | Source |
|---|---|---|---|
| TOD-001 | Todo list & lifecycle (manual workflow) | Partially implemented | README 🟨, assessment inventory |

## Financial Milestones (`MIL`)

| ID | Item | Status | Source |
|---|---|---|---|
| MIL-001 | Milestone tracking (invested, net worth, portfolio, expense coverage) | Planned | financial-milestones.md 🟨 |

## Authentication & Access Control (`AUT`)

| ID | Item | Status | Source |
|---|---|---|---|
| AUT-001 | Route protection (401 API / redirect pages) | Implemented (untested) | basic-authentification.md, middleware.ts |
| AUT-002 | Credential login (env-var user) | Implemented (untested) | basic-authentification.md |
| AUT-003 | Internal job Bearer bypass | Implemented (untested) | basic-authentification.md, README |

## Scheduled / Background Jobs (`JOB`)

| ID | Item | Status | Source |
|---|---|---|---|
| JOB-001 | Daily "apply pending" job | Implemented (partially tested) | README, assessment inventory |
| JOB-002 | Job run log (idempotent per job/day) | Unverified | README |
| JOB-003 | Dedicated price-sync cron | Planned | assets-background-sync.md (stub) |
| JOB-004 | Server cron automation (ops) | Planned | README 🟨 |

## Administration & Debug (`ADM`)

| ID | Item | Status | Source |
|---|---|---|---|
| ADM-001 | Admin panel: trigger daily job | Implemented (untested) | README ✅ |
| ADM-002 | Job run history view | Implemented (untested) | README ✅ |
| ADM-003 | Debug mode (extra columns) | Implemented (untested) | README ✅ |
| ADM-004 | Admin exposure re-sync | Implemented & tested | portfolio-exposure.md (also PFA-004) |

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
