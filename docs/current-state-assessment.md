# Current State Assessment

> **Status:** Working discovery report (Phase 1 — Initial Documentation Review).
> This document is progressively updated as analysis continues. It records the
> state of the project **as described in existing documentation only**. It does
> **not** reflect verified source-code behavior yet.
>
> **Scope of this review:** `README.md`, all Markdown files under `specs/`, and
> `docs/project-documentation-and-sdd-plan.md`. No source code, tests, or
> configuration were analyzed at this stage.
>
> **Convention used below:**
> - **[Documented]** — stated explicitly in a reviewed file.
> - **[Assumption]** — inferred, not directly stated.
> - **[Open question]** — cannot be determined from the reviewed files.
> - Status markers from the README: ✅ Completed, 🟨 Pending, 🔷 Ongoing.
> - Source files are referenced in parentheses, e.g. `(README.md)`,
>   `(specs/investments.md)`.

---

## 1. Project Overview

**[Documented]** FinanceApp (also referred to as "FinanceApp_v2" / "Precision
Ledger" in workspace steering) is a personal finance management web application
for tracking money across multiple bank accounts (`README.md`). The stated
motivation is that people commonly hold several accounts for different purposes
(investing, saving, daily use), which makes money hard to track; keeping
everything in one place supports planning and reduces aimless movement of funds
(`README.md`).

**[Documented]** Core capabilities described in the README:
- Managing multiple bank accounts, investments, and transfers in one place.
- Tracking incomes, expenses, transactions (account-to-account transfers), and
  recurrent versions of each.
- A monthly model with per-month snapshots and metrics.
- Investment tracking against market data (Yahoo Finance) with portfolio
  analysis features.

**[Documented]** Tech stack (`README.md`): Next.js (frontend + backend), Prisma
ORM, MariaDB, Tailwind CSS (+ shadcn/ui), Turborepo monorepo, TypeScript.
Prerequisites listed: Node.js v20, Docker 20.10, Turborepo 11.10.0.

**[Documented]** Single-user application: authentication is implemented via a
single credential pair stored in environment variables, with a documented future
path to multi-user (`specs/basic-authentification.md`).

**Note:** The workspace steering files describe the product as "Precision Ledger"
with a richer feature set (Todos, admin panel, debug mode). The README calls it
"FinanceApp". **[Open question]** which name is canonical.

---

## 2. Documented Features

### 2.1 From the README backlog

The README's **Features** section is explicitly designated as "the project
backlog and single source of truth for feature status" (`README.md`). Features
are grouped as follows (status markers preserved):

**Configuration / Infrastructure**
- Monorepo (web + db), Next.js, Prisma, MariaDB, Tailwind + shadcn/ui,
  TypeScript ✅
- Docker setup 🟨, fix Prisma console 🟨
- New packages planned: `mobile`, `shared`, `api` 🟨
- Deploy prod version 🟨

**Create & List**
- Accounts ✅ (disabled accounts 🟨)
- Incomes ✅, Expenses ✅
- Recurrent expenses (fixed and variable) ✅, recurrent incomes ✅,
  recurrent transactions ✅
- Transactions between accounts ✅
- Monthly Budget per month ✅
- Monthly Splits across accounts 🟨
- Investments in different products ✅ `[spec:investments]`
- Recurrent investments 🟨 (status glyph rendered as a replacement char in the
  source — see Documentation Issues)

**View**
- Account details ✅, current month ✅, past months with old account state ✅,
  month details ✅, current amount per account ✅
- Metrics page with basic data ✅
- Monthly splits (planned and real) 🟨
- Investment performance ✅
- Todo tab for pending non-automated recurrent items 🟨
- Sort/filter/search accounts, transactions, incomes, expenses 🟨
- Sort/filter/paginate incomes, expenses, transactions by month ✅
- Plot financial product data ✅ `[spec:financial-product-data]`

**Actions**
- Select account (instead of account id) when creating transactions/incomes ✅
- Pause/resume recurrent incomes 🟨, pause/resume recurrent expenses 🟨
- Delete recurrent incomes/expenses with associated items ✅
- Modify recurrent income/expense/transaction start & end dates 🟨
- Allow recurrent incomes/expenses/transactions with no end date ✅
- Enable/disable account 🟨, edit account details ✅
- Edit income/expense details ✅, edit transaction details ✅
- Delete individual transactions/incomes/expenses ✅
- Modify recurrent frequency 🟨

**Scheduled Job**
- API endpoint for applying pending items at end of day ✅
- Automate with server cron 🟨

**Analytics / Misc behavior**
- "Adjust for analytics" — differentiate actual expense value from the value used
  for metrics ✅
- Admin debug mode (extra table columns) ✅
- Hide "Adjust for analytics" field when not needed ✅
- Year analytics (yearly totals) 🟨

**Bugs (from README)**
- Account transactions showed only the "to" column ✅ (fixed)
- Assets provider ✅ `[spec:assets-provider]`
- Shift+click row in Accounts table doesn't open a new tab 🟨
- Current month not active in navbar ✅ (fixed)
- Duplicate tracked asset caused frontend errors ✅ (fixed)
- Asset plots always show `$`, ignoring initial currency conversion 🟨

**Design**
- Account icon ✅; prioritize icons/visual cues 🟨; improve UI cleanliness 🟨;
  calendar for date visualization 🟨

**Misc / larger items**
- Migrate tables to data-driven + list-styled components ✅
- AI-integrated development workflow ✅
- Upload ERD dbdocs file / update `erd.png` 🟨
- Example database data for testing ✅
- Native authentication ✅ `[spec:basic-authentication]`
- Covering test suite 🟨
- Sparklines ✅ `[spec:sparklines]`
- Portfolio allocation drift 🟨 `[spec:portfolio-drift]`
- Asset comparison mode ✅ `[spec:asset-comparison]`
- Financial milestones 🟨 `[spec:financial-milestones]`
- Contribution history ✅ `[spec:contribution-history]`
- Assets background sync 🟨 `[spec:assets-background-sync]`
- Portfolio exposure analysis ✅ `[spec:portfolio-exposure]`
- Portfolio performance ✅ `[spec:portfolio-performance]`

> **[Open question]** README statuses are self-reported and have not been
> verified against the implementation in this review. Several items marked ✅ with
> linked specs are still written as forward-looking proposals in those specs (see
> Documentation Issues).

### 2.2 From the spec files

There are 13 files under `specs/` (one is a template, one is a TODO stub). Each
documented spec and its structure:

| Spec file | Goal (summary) | README status | Structure completeness |
|---|---|---|---|
| `_example.md` | Template for new specs | n/a | Template only (placeholders) |
| `basic-authentification.md` | Session-based auth (Auth.js v5, credentials, JWT) for single owner; extensible to multi-user | ✅ | Full (Goal, Requirements, AC, Edge Cases, Out of Scope, Notes) |
| `investments.md` | Buy/sell units of tracked assets per account, cash impact on balance, positions | ✅ | Full + Data Model + Design Decisions |
| `financial-product-data.md` | Fetch/store/plot historical asset prices (Yahoo Finance), searchable tracked assets | ✅ | Partial — AC section left as empty template placeholders |
| `assets-provider.md` | Separate asset identity (ISIN) from provider symbols via `AssetProviderMapping` | ✅ | Full |
| `sparklines.md` | Miniature 1-month price trend plots next to assets | ✅ | Full |
| `asset-comparison.md` | Compare 2–5 assets' % performance over a timeframe, normalized to 0% | ✅ | Full |
| `contribution-history.md` | Overlay buy/sell markers on asset price charts | ✅ | Full |
| `portfolio-exposure.md` | Look-through sector/country exposure; monthly snapshots; coverage % | ✅ | Full + API/UI/Data Model/Impl Notes |
| `portfolio-performance.md` | Dedicated performance page: summary, positions table, value-over-time charts, TWR | ✅ | Full + API + UI layout |
| `portfolio-drift.md` | Target vs current allocation, drift, contribution suggestions (no selling) | 🟨 | Full |
| `financial-milestones.md` | Track milestones (invested, net worth, portfolio value, expense coverage) | 🟨 | Full (missing top-level `# Title` heading and backlog ref) |
| `assets-background-sync.md` | Cron job to incrementally refresh asset prices | 🟨 | Stub only — an HTML TODO comment, not a real spec |

**[Documented]** The standard spec structure (from `_example.md`) is: **Goal,
Requirements, Acceptance Criteria (Given/When/Then), Edge Cases, Out of Scope,
Notes.** Most specs follow it; the investment/portfolio specs extend it with Data
Model, API Surface/Endpoints, UI layout, and Implementation Notes sections.

---

## 3. Proposed Functional Areas (Draft)

> **Status:** Provisional. This replaces the earlier "Potential Functional
> Areas" list and groups functionality by **business responsibility**, not by
> source-code directory. Boundaries were validated with targeted inspection of
> the route tree (`apps/web/app`, `apps/web/app/api`), the server-logic grouping
> (`apps/web/app/api/_lib/{exposure,financialProducts,jobs,performance,snapshots}`),
> the daily-job processors (`apps/web/app/api/_lib/jobs/processors/`), and the
> Prisma models (`packages/db/prisma/schema.prisma`). Remaining items are subject
> to human review (see Open Decisions).
>
> **Decisions confirmed by human review (this round):**
> 1. Investments (F) and Portfolio Analytics (G) are kept **separate**.
> 2. The Ledger (B) stays a **single** area (not split by type).
> 3. **Milestones promoted to its own area** (Area J — Financial Milestones),
>    moved out of Portfolio Analytics. Marked leaning-standalone; final
>    confirmation still pending ("not sure").
> 4. Asset comparison and sparklines stay in Market Data (E).
> 5. Monthly splits belong to the Monthly Model & Snapshots area (D).
> 6. Auth, Jobs, and Admin confirmed as cross-cutting concerns. Whether
>    cross-cutting concerns receive requirement IDs is **still open**.
> 7. Prefix scheme and overall granularity confirmed (now 10 core + 3
>    cross-cutting).
>
> Evidence confirmed during this pass:
> - Portfolio analytics (`exposure`, `performance`) is co-located under
>   `api/investments/` and `_lib/{exposure,performance}` — **separate** from the
>   account/month `api/metrics/` group (`balances`, `monthly-summary`,
>   `account-balance-series`, `expenses-by-kind`). This resolves the earlier open
>   question: metrics and portfolio analytics are distinct areas.
> - Market data lives under `api/financial-products/` (`assets`, `prices`,
>   `search`, `compare`) and `_lib/financialProducts/` — distinct from investment
>   operations (`api/accounts/[id]/investments`, `api/investments`).
> - The daily job (`_lib/jobs/processors/`) spans pending items, recurrent
>   expenses/incomes/investments/transactions, and exposure sync — confirming it
>   is a cross-cutting orchestrator rather than a domain of its own.

### Area A — Accounts

- **Purpose:** Manage bank accounts and their balances; the root entity every
  other financial item attaches to.
- **Included functionality:** Create/list/edit accounts; live balance tracking;
  enable/disable (pending); account icon (design). Account-scoped sub-resources
  are exposed under nested routes.
- **Evidence:** `Account` model; `app/accounts/`, `app/api/accounts/` (incl.
  nested `[id]/{expenses,incomes,transactions,investments,recurrent-*}`);
  README "Create & List" / "Actions" / "Design".
- **Interactions:** Owns the balance mutated by Ledger, Recurrent, and
  Investment operations; source of per-account aggregates in Monthly Model and
  Metrics.
- **Open questions:** Whether "disabled accounts" is a first-class state or a
  simple flag; no schema evidence reviewed for a disabled/enabled column.

### Area B — Ledger (Incomes, Expenses, Transactions)

- **Purpose:** One-off financial movements: money in, money out, and transfers
  between accounts.
- **Included functionality:** Create/list/edit/delete incomes, expenses, and
  account-to-account transactions; expense "kind" (fixed/variable); the
  "Adjust for analytics" separation between actual value and the value used for
  metrics; per-month filtering/pagination.
- **Evidence:** `Income`, `Expense`, `Transaction` models and their status
  enums (`PENDING`/`COMPLETED`); `app/{expenses,incomes,transactions}/[id]`;
  `app/api/{expenses,incomes,transactions}`; README "Create & List" / "Actions".
- **Interactions:** Mutates Account balances; belongs to the Monthly Model;
  feeds Metrics; processed when PENDING by Scheduled Jobs; can surface as Todos
  (see Todo).
- **Open questions:** Whether the three types are one area or should be split
  later; they share lifecycle and UI patterns, so one area is proposed.

### Area C — Recurrent Items

- **Purpose:** Scheduled, repeating financial items that generate concrete
  ledger/investment entries over time.
- **Included functionality:** Recurrent incomes, expenses, transactions, and
  investments; `ACTIVE`/`PAUSED`/`CANCELLED` lifecycle; no-end-date support;
  per-run tracking via `*Run` join tables; pause/resume, date and frequency
  modification (several pending).
- **Evidence:** `RecurrentIncome(Run)`, `RecurrentExpense(Run)`,
  `RecurrentTransaction(Run)`, `RecurrentInvestment(Run)` models and their
  status enums; `app/recurrent/`; `app/api/recurrent-{expenses,incomes,
  transactions,investments}`; `_lib/jobs/processors/recurrent*.ts`; README
  "Create & List" / "Actions".
- **Interactions:** Applied by Scheduled Jobs, which create Ledger/Investment
  entries that then affect Accounts and the Monthly Model; non-automated
  recurrent items feed Todos.
- **Open questions:** Whether recurrent investments are fully implemented
  (README shows a corrupted/pending glyph) despite the models existing.

### Area D — Monthly Model & Snapshots

- **Purpose:** Anchor all financial items to a month and maintain per-account
  monthly aggregates for fast, stable reporting.
- **Included functionality:** `Month` (year+month) entity; month detail
  breakdown; monthly budget target; `MonthSnapshot` aggregation and its
  provisional→finalized lifecycle; monthly splits (planned vs real, pending).
- **Evidence:** `Month`, `MonthSnapshot`, `MonthBudget` models; `app/months/`
  (`current/`, `[year]/[month]/`); `app/api/months/`; `_lib/snapshots/`; README
  "View".
- **Interactions:** Consumes Ledger/Investment data; snapshot recalculation is
  invoked after mutations and finalized by Scheduled Jobs; Metrics read from it.
- **Decision:** Monthly splits are assigned to this area (confirmed by human
  review) and treated as a **single feature with two facets** (planned vs real),
  not two features. Area D owns it; execution depends on Recurrent Items (C),
  since the README describes planned splits as recurrent transactions.
- **Evidence note:** No "split" implementation exists in the codebase yet (a
  repository search found only `String.split(...)` and an unrelated budget
  surplus/deficit chart). Monthly splits remains a spec/backlog idea (🟨), so its
  internal shape is not constrained by existing code.
- **Open questions:** Snapshot finalization behavior is documented but not
  implementation-verified.

### Area E — Market Data & Assets

- **Purpose:** Catalog tracked financial products and maintain their historical
  price data from an external provider.
- **Included functionality:** Asset catalog (funds/ETFs/ETPs/stocks/crypto);
  ISIN identity with provider-symbol mapping; price history storage, sync, and
  missing-range detection; asset search and tracking; timeframe-based price
  queries; asset comparison; sparklines; contribution-history markers overlaid
  on the asset price chart (marker **data** comes from Investments, Area F).
- **Evidence:** `Asset`, `AssetProviderMapping`, `AssetPrice`,
  `AssetPriceSyncRange` models and `AssetType`/`PriceFrequency`/`Granularity`/
  `AssetProvider` enums; `app/financial-products/`,
  `app/api/financial-products/{assets,prices,search,compare}`;
  `_lib/financialProducts/`; specs `financial-product-data.md`,
  `assets-provider.md`, `asset-comparison.md`, `assets-background-sync.md`
  (stub); `yahoo-finance2` dependency.
- **Interactions:** Prices consumed by Investments (valuation) and Portfolio
  Analytics; price sync invoked on-demand (price routes) and by Scheduled Jobs;
  comparison, sparklines, and contribution markers are projections rendered on
  this area's price chart. Contribution markers read BUY/SELL records from
  Investments (Area F).
- **Decision:** Comparison, sparklines, and contribution-history all assigned to
  this area (confirmed by human review). The asset price chart
  (`components/financial-products/PriceChart.tsx`) is the shared surface for all
  three; contribution markers are a display overlay with no analytics of their
  own.
- **Open questions:** None outstanding for this area's boundary.

### Area F — Investments & Positions

- **Purpose:** Record buy/sell operations against tracked assets and derive
  holdings per account.
- **Included functionality:** BUY/SELL operations with cash impact on account
  balance; per-account positions; PENDING→COMPLETED lifecycle consistent with
  the ledger; position/price-check endpoints.
- **Evidence:** `Investment` model, `InvestmentType`/`InvestmentStatus` enums;
  `app/investments/`, `app/api/accounts/[id]/investments/{positions,price-check}`,
  `app/api/investments/`; `_lib/jobs/processors/pendingInvestments.ts`; spec
  `investments.md`.
- **Interactions:** Mutates Accounts; valued via Market Data prices; aggregated
  by Portfolio Analytics; recurrent buys handled through Recurrent Items;
  PENDING ones applied by Scheduled Jobs.
- **Open questions:** Whether "Investments & Positions" and "Portfolio
  Analytics" should be one area; they are kept separate because operations
  (write/ledger side) and analytics (read/derived side) have different
  responsibilities and already live in different `_lib` groups.

### Area G — Portfolio Analytics

- **Purpose:** Derive read-only, cross-account insight from investment positions
  and prices.
- **Included functionality:** Performance (P&L, TWR, portfolio/position value
  over time), exposure (sector/country look-through, coverage, monthly
  snapshots), allocation drift (pending). (Financial milestones moved to Area J;
  contribution-history markers moved to Area E.)
- **Evidence:** `AssetExposureSnapshot`, `ExposureCategory`,
  `ExposureCategoryMapping` models and `ExposureType` enum;
  `app/api/investments/{performance,exposure}`; `_lib/{performance,exposure}/`;
  `_lib/jobs/processors/exposureSync.ts`; specs `portfolio-performance.md`,
  `portfolio-exposure.md`, `portfolio-drift.md`.
- **Interactions:** Reads Investments (positions) and Market Data (prices);
  exposure snapshots refreshed by Scheduled Jobs and by admin re-sync; depends
  on no write path of its own except exposure snapshot persistence. Supplies
  portfolio-value and invested-amount figures that Area J consumes.
- **Open questions:** None outstanding for this area's boundary.

### Area H — Metrics & Reporting

- **Purpose:** Account- and month-centric financial reporting independent of
  investments.
- **Included functionality:** Balances, monthly summary, account balance series,
  expenses-by-kind; year analytics (pending).
- **Evidence:** `app/metrics/`, `app/api/metrics/{balances,monthly-summary,
  account-balance-series,expenses-by-kind}`; README "View".
- **Interactions:** Reads Accounts, Ledger, and Monthly Model / snapshots.
  Distinct from Portfolio Analytics (different data sources and routes).
- **Open questions:** Whether "year analytics" extends this area or warrants its
  own reporting surface.

### Area I — Todos (Manual Workflow)

- **Purpose:** Track non-automated recurrent items that require a manual user
  action.
- **Included functionality:** Todo list for pending recurrent expenses and
  transactions not marked automated; OPEN/DONE lifecycle; manual vs
  recurrent-originated todos.
- **Evidence:** `Todo` model with `TodoType`/`TodoOrigin`/`TodoStatus` enums;
  `app/todos/`, `app/api/todos/`; README "View".
- **Interactions:** Driven by Recurrent Items and the Scheduled Jobs run;
  completing a todo likely creates Ledger entries.
- **Open questions:** Marked pending in the README but models/routes exist —
  actual implementation status and exact relationship to recurrent processing
  are unconfirmed.

### Area J — Financial Milestones

- **Purpose:** Track meaningful financial milestones (e.g. invested capital, net
  worth, portfolio value, expense coverage) and record progress and the date
  each is first reached.
- **Included functionality:** Define milestones by metric and target value;
  compute progress; list completed vs upcoming; persist the first reached date;
  re-evaluate on metric changes. All currently **pending** (no implementation
  reviewed).
- **Evidence:** Spec `financial-milestones.md`; README backlog entry
  (`[spec:financial-milestones]` 🟨). No dedicated Prisma model, route, or
  `_lib` module confirmed in this pass — the spec proposes a
  `financial_milestones` model but no implementation evidence was found.
- **Interactions:** Reads derived figures from Portfolio Analytics (invested
  amount, portfolio value, net worth) and from Metrics / Ledger (expense
  coverage). It is a consumer of several areas rather than owning that data.
- **Status / decision:** Promoted to a standalone area at human request.
  Reasoning: its metrics span the portfolio **and** expenses/net worth, so it is
  not purely portfolio analytics. Marked **provisional / leaning-standalone** —
  final confirmation pending (reviewer was "not sure").
- **Open questions:** Confirm standalone vs folding into Portfolio Analytics (G).
  Whether "net worth" and "expense coverage" metrics require their own
  calculation service that doesn't yet exist.

### Cross-cutting (not core domains — see Cross-cutting Concerns)

- **Authentication & Access Control**, **Scheduled Jobs**, and
  **Administration & Debug** are treated as cross-cutting concerns rather than
  core functional domains, because their responsibility is to protect, drive, or
  operate the domains above rather than to own financial behavior themselves.
  They are detailed in the Cross-cutting Concerns subsection.

### Functional Area Mapping

Documented features / specs → proposed area (A–J, or a cross-cutting concern):

| Feature / spec | Area |
|---|---|
| Accounts; disabled accounts; account icon; edit account | A — Accounts |
| Incomes; Expenses (fixed/variable); Transactions; edit/delete; "Adjust for analytics"; per-month filter/paginate | B — Ledger |
| Recurrent incomes/expenses/transactions/investments; pause/resume; no-end-date; modify dates/frequency | C — Recurrent Items |
| Current/past months; month details; monthly budget; monthly splits (planned + real); snapshots | D — Monthly Model & Snapshots |
| `financial-product-data`; `assets-provider`; asset search & tracking; price history; `asset-comparison`; `sparklines`; `contribution-history` | E — Market Data & Assets |
| `investments`; positions; buy/sell cash impact | F — Investments & Positions |
| `portfolio-performance`; `portfolio-exposure`; `portfolio-drift` | G — Portfolio Analytics |
| Metrics page; balances; monthly summary; account balance series; expenses-by-kind; year analytics | H — Metrics & Reporting |
| Todo tab for non-automated recurrent items | I — Todos |
| `financial-milestones` | J — Financial Milestones |
| `basic-authentification`; route protection; login; sign-out | X-Auth (cross-cutting) |
| Daily "apply pending" job; cron automation; `assets-background-sync` (price-sync cron, stub) | X-Jobs (cross-cutting) |
| Admin job trigger; job run history; debug mode columns; admin exposure re-sync | X-Admin (cross-cutting) |

Notes on multi-area items:
- **`asset-comparison` / `sparklines`:** read-only projections of `AssetPrice`
  (Area E) but presented as analytics. **Confirmed to Area E.**
- **`contribution-history`:** **Confirmed to Area E.** It is a marker overlay on
  the asset price chart (Area E's surface,
  `components/financial-products/PriceChart.tsx`); the marker **data** are
  BUY/SELL records from Investments (Area F). It has no analytics of its own, so
  it does not belong in Portfolio Analytics (G).
- **`financial-milestones`:** **Promoted to its own Area J** (confirmed by human
  review). Its metrics span portfolio value/invested amount (G) and net worth /
  expense coverage (H / B), which is the rationale for not folding it into
  Portfolio Analytics.
- **Recurrent investments:** sit at the intersection of C (recurrence) and F
  (investment operation); proposed to Area C for lifecycle, with execution
  delegated to Area F / X-Jobs.
- **Monthly budget / splits:** **Confirmed to Area D.** Budget and splits both
  live in D; splits are a single feature (planned + real) that depends on
  Recurrent Items (C) for execution.

### Cross-cutting Concerns

Capabilities that affect multiple areas and are documented separately from the
core domains.

> **Decision (human review):** Cross-cutting concerns **do receive requirement
> IDs** with their own prefixes (`AUT`, `JOB`, `ADM`), the same as core domains.
> "Cross-cutting" describes where the behavior applies (across many domains), not
> whether it has requirements. Each has observable, testable behavior worth
> specifying and tracing (e.g. 401 on unauthenticated access, job idempotency,
> Bearer-token enforcement), and a spec and tests already exist for parts of it.
> They are labeled cross-cutting only so it is clear they are not business
> domains.

- **X-Auth — Authentication & Access Control.** Single-user, credential-based
  auth (Auth.js v5) gating all pages/APIs except the Bearer-protected internal
  job endpoint. Affects every area uniformly; it is access control, not a
  financial domain. Evidence: `app/login/`, `app/api/auth/`, `next-auth`,
  `AUTH_*` env vars, spec `basic-authentification.md`.
- **X-Jobs — Scheduled / Background Processing.** The daily job orchestrates
  behavior that belongs to several domains (apply pending ledger items, apply
  recurrent items, sync prices, sync exposure, finalize snapshots), plus the
  proposed dedicated price-sync cron. It is an execution/orchestration concern.
  Evidence: `app/api/internal/jobs/apply-pending-transactions`,
  `_lib/jobs/` (incl. `processors/`), `JobRun` model, README job section,
  `assets-background-sync.md`.
- **X-Admin — Administration & Debug.** Operational surface for running/
  inspecting jobs and toggling debug UI, plus admin exposure re-sync. Operates
  the domains rather than owning financial rules. Evidence: `app/admin/`,
  `app/api/admin/exposure-resync`, `components/debug/`, README.
- **(Technical, not functional) Platform & Tooling.** Monorepo, Prisma/DB,
  shared packages, styling, testing. Already covered by the steering files
  (`tech.md`, `structure.md`); listed here only to mark it out of scope for
  functional specs.

### Recommended Structure

Provisional functional areas with suggested requirement-ID prefixes. **No
individual requirement IDs are assigned yet.**

| # | Area | Prefix (proposed) | Type |
|---|---|---|---|
| A | Accounts | `ACC` | Core domain |
| B | Ledger (Incomes/Expenses/Transactions) | `LED` | Core domain |
| C | Recurrent Items | `REC` | Core domain |
| D | Monthly Model & Snapshots | `MON` | Core domain |
| E | Market Data & Assets | `MKT` | Core domain |
| F | Investments & Positions | `INV` | Core domain |
| G | Portfolio Analytics | `PFA` | Core domain |
| H | Metrics & Reporting | `MET` | Core domain |
| I | Todos | `TOD` | Core domain |
| J | Financial Milestones | `MIL` | Core domain |
| — | Authentication & Access Control | `AUT` | Cross-cutting (gets IDs) |
| — | Scheduled / Background Jobs | `JOB` | Cross-cutting (gets IDs) |
| — | Administration & Debug | `ADM` | Cross-cutting (gets IDs) |

Current count: **10 core domains + 3 cross-cutting concerns** (confirmed by
human review; milestones promoted from G to a standalone Area J). All 13 carry
requirement-ID prefixes.

### Open Decisions

**Resolved by human review:**

1. ~~Investments vs Portfolio Analytics (F vs G)~~ → **Keep separate.**
2. ~~Ledger granularity (B)~~ → **Keep as one area.**
3. ~~Comparison & sparklines placement~~ → **Market Data (E).**
4. ~~Monthly splits — which area~~ → **Monthly Model & Snapshots (D)**, single
   feature (planned + real), with a Recurrent Items (C) execution dependency.
5. ~~Cross-cutting vs domain for Auth / Jobs / Admin~~ → **Confirmed
   cross-cutting.**
6. ~~Prefix scheme and area granularity~~ → **Confirmed** (prefixes accepted;
   10 core + 3 cross-cutting).
7. ~~Milestones (Area J)~~ → **Confirmed standalone area.**
8. ~~Do cross-cutting concerns get requirement IDs?~~ → **Yes** — `AUT` / `JOB` /
   `ADM` carry requirement-ID prefixes like core domains.
9. ~~Contribution-history placement~~ → **Market Data (E)** as a chart overlay;
   marker data sourced from Investments (F).

**Still open (lower priority, can be settled when writing the specs):**

1. **Monthly splits internal detail:** exact modeling of planned vs real within
   Area D, and precisely how it reuses recurrent transactions (Area C). No
   implementation exists yet, so this is deferred to spec authoring.
2. **Snapshot finalization behavior (Area D):** documented but not yet verified
   against the implementation.

---

## Functional Inventory by Area

> **Status:** Organized by the agreed functional areas (A–J core, X-* cross-cutting).
> **Status values:** Implemented / Partially implemented / Planned / Unverified /
> Obsolete.
>
> **Verification basis for this pass (targeted, not exhaustive):** route
> handlers and pages under `apps/web/app`, the Prisma schema
> (`packages/db/prisma/schema.prisma`), the `_lib` server logic, and the test
> files (34 `*.test.ts` located; see note). **Important caveat:** automated test
> coverage is concentrated almost entirely in Market Data (E), Investments (F),
> and Portfolio Analytics (G). The core ledger areas (A, B, C, D, H, I) have
> route handlers and models but **no automated tests**, so their "Implemented"
> status is based on the presence of route handlers + models + UI, not on
> verified runtime behavior. Business rules (balance mutation, snapshot
> finalization, lifecycle transitions) were **not** traced end-to-end and are
> marked accordingly.

### Area A — Accounts (`ACC`)

| Feature | Description | Status | Existing docs | Implementation evidence | Open questions |
|---|---|---|---|---|---|
| Create / list / edit account | CRUD for bank accounts with balance | Implemented (untested) | README "Create & List"/"Actions" | `Account` model; `app/accounts/`, `app/accounts/[id]/`; `app/api/accounts/route.ts`, `app/api/accounts/[id]/route.ts` | No automated tests |
| Live balance tracking | Account balance updated by ledger/investment ops | Unverified | README | `Account` model has balance; mutation logic not traced | Atomic/transactional behavior unverified |
| Account icon | Visual icon per account | Unverified | README "Design" (✅) | Not inspected | Field presence unconfirmed |
| Enable / disable account | Mark account inactive | Planned | README 🟨 | No disabled/enabled field confirmed in schema | Whether it is a state or a flag |

### Area B — Ledger: Incomes, Expenses, Transactions (`LED`)

| Feature | Description | Status | Existing docs | Implementation evidence | Open questions |
|---|---|---|---|---|---|
| Incomes CRUD | One-off income per account/month | Implemented (untested) | README | `Income` model; `app/incomes/[id]/`; `app/api/incomes/`, `app/api/accounts/[id]/incomes/` | No tests; balance effect unverified |
| Expenses CRUD | One-off expense; fixed/variable kind | Implemented (untested) | README | `Expense` model, `ExpenseKind` enum; `app/expenses/[id]/`; `app/api/expenses/`, `app/api/accounts/[id]/expenses/` | No tests |
| Transactions CRUD | Account-to-account transfer | Implemented (untested) | README (incl. from/to bug ✅ fixed) | `Transaction` model; `app/transactions/[id]/`; `app/api/transactions/`, `app/api/accounts/[id]/transactions/` | No tests |
| "Adjust for analytics" | Separate actual value from metrics value | Implemented (untested) | README (✅); "hide if not needed" (✅) | `analytics_amount` field used in `metrics/expenses-by-kind/route.ts` | Rule for when it applies unverified |
| Per-month filter / paginate | Filter & paginate by month | Implemented (untested) | README (✅) | `month`-range filtering in `accounts/[id]/{incomes,expenses,transactions}/route.ts` | — |
| Sort / filter / search (non-month) | Global sort/filter/search | Planned | README 🟨 | Not found | — |
| PENDING→COMPLETED on create | Current/past month = COMPLETED + balance; future = PENDING | Unverified | README; spec patterns | `*Status` enums (`PENDING`/`COMPLETED`) exist | Balance/lifecycle logic not traced |

### Area C — Recurrent Items (`REC`)

| Feature | Description | Status | Existing docs | Implementation evidence | Open questions |
|---|---|---|---|---|---|
| Recurrent incomes | Scheduled income with run tracking | Implemented (untested) | README | `RecurrentIncome(Run)` models; `app/api/recurrent-incomes/`, `accounts/[id]/recurrent-incomes/`; `_lib/jobs/processors/recurrentIncomes.ts` | No tests |
| Recurrent expenses | Scheduled expense (fixed/variable) | Implemented (untested) | README | `RecurrentExpense(Run)`; `recurrent-expenses/` routes; `processors/recurrentExpenses.ts` | No tests |
| Recurrent transactions | Scheduled transfer | Implemented (untested) | README | `RecurrentTransaction(Run)`; `recurrent-transactions/` routes; `processors/recurrentTransactions.ts` | No tests |
| Recurrent investments | Scheduled buy | Implemented (untested) | README (corrupted glyph) | `RecurrentInvestment(Run)`; `recurrent-investments/` routes; `processors/recurrentInvestments.ts` | README status glyph unreadable; runtime unverified |
| No end date | Open-ended recurrences | Implemented (untested) | README (✅) | Nullable end-date in recurrent models (per schema patterns) | Field confirmed broadly, not per-model |
| Delete with associated items | Cascade delete generated entries | Unverified | README (✅ for incomes/expenses) | Cascade behavior not traced | — |
| Pause / resume | Toggle ACTIVE/PAUSED | Partially implemented | README 🟨 (actions pending) | `ACTIVE`/`PAUSED`/`CANCELLED` enums exist; UI/endpoint not confirmed | Whether endpoints exist |
| Modify start/end dates, frequency | Edit recurrence schedule | Planned | README 🟨 | Not confirmed | — |

### Area D — Monthly Model & Snapshots (`MON`)

| Feature | Description | Status | Existing docs | Implementation evidence | Open questions |
|---|---|---|---|---|---|
| Month model & detail view | Year+month entity; detail breakdown | Implemented (untested) | README "View" | `Month` model; `app/months/{current,[year]/[month]}/`; `app/api/months/`, `months/[year]/[month]/` | — |
| Monthly budget | Per-month spending target (upsert) | Implemented (untested) | README (✅) | `MonthBudget` model; `app/api/months/[year]/[month]/budget/route.ts` (GET/PUT); used in `metrics/expenses-by-kind` | No tests |
| Month snapshots | Per-account/month aggregation | Implemented (untested) | README job section | `MonthSnapshot` model; `_lib/snapshots/`; `months/[year]/[month]/snapshots` | Recalc/finalize behavior unverified |
| Snapshot finalization lifecycle | Lock previous months after daily job | Unverified | README (documented) | `MonthSnapshot` has `is_final`/`closed_at`-style fields (per README) | Not traced in code |
| Monthly splits (planned + real) | Planned allocations vs actuals | Planned | README 🟨 | **No implementation found** (only `String.split`) | Internal modeling; dependency on Area C |

### Area E — Market Data & Assets (`MKT`)

| Feature | Description | Status | Existing docs | Implementation evidence | Open questions |
|---|---|---|---|---|---|
| Asset catalog & tracking | Track funds/ETFs/ETPs/stocks/crypto | Implemented & tested | `financial-product-data.md` | `Asset` model, `AssetType`; `app/api/financial-products/assets/` (+ `assets.property.test.ts`, `route.test.ts`) | — |
| Provider mapping (ISIN) | Separate identity from provider symbol | Implemented & tested | `assets-provider.md` | `AssetProviderMapping`, `AssetProvider`; used in `prices/route.ts` | — |
| Price history storage & sync | Store prices, detect/fetch missing ranges | Implemented & tested | `financial-product-data.md` | `AssetPrice`, `AssetPriceSyncRange`; `_lib/financialProducts/` (many property tests: `syncPrices`, `computeMissingRanges`, `syncIdempotency`, `priceSyncAlgorithm`) | — |
| Asset search | Search provider for trackable assets | Implemented & tested | `financial-product-data.md` | `financial-products/search/route.ts` (+ `route.test.ts`) | — |
| Price charts & timeframes | Plot prices with timeframe filters | Implemented & tested | README (✅) | `financial-products/prices/` (+ tests); `PriceChart.tsx`; `deriveGranularity`/`customRangeGranularity` tests | — |
| Asset comparison | Compare 2–5 assets normalized to 0% | Implemented & tested | `asset-comparison.md` | `financial-products/compare/route.ts` (+ tests); `_lib/financialProducts/compareAssets*.property.test.ts` | — |
| Sparklines | 1-month mini price trend per asset | Implemented | `sparklines.md` | `financial-products/assets/sparklines/route.ts` | No dedicated sparkline test located |
| Contribution-history markers | BUY/SELL overlay on asset chart | Implemented (untested) | `contribution-history.md` | `PriceChart.tsx`, `lib/groupMarkers.ts` (marker data from Investments) | Marker-grouping logic untested |
| Currency on asset plots | Respect initial currency conversion | Partially implemented (bug) | README 🟨 (bug: "always show $") | `PriceChart.tsx` handles €/£/$ symbols; conversion gap noted | Conversion not applied |

### Area F — Investments & Positions (`INV`)

| Feature | Description | Status | Existing docs | Implementation evidence | Open questions |
|---|---|---|---|---|---|
| Buy/Sell operations | Record BUY/SELL with cash impact | Implemented & tested | `investments.md` | `Investment` model, `InvestmentType`/`InvestmentStatus`; `accounts/[id]/investments/route.ts` (+ `investments.property.test.ts`) | — |
| Positions per account | Aggregate units/cost per asset per account | Implemented & tested | `investments.md` | `accounts/[id]/investments/positions/` (+ `positions.property.test.ts`) | — |
| Price check on create | Validate/lookup price for amount mode | Implemented | `investments.md` | `accounts/[id]/investments/price-check/` | No dedicated test located |
| PENDING investment processing | Apply future-month buys via daily job | Implemented & tested | `investments.md` | `_lib/jobs/processors/pendingInvestments.ts` (+ `pendingInvestments.test.ts`) | — |
| Sell-units validation | Reject sells exceeding held units | Unverified | `investments.md` | Likely in route; not traced this pass | — |

### Area G — Portfolio Analytics (`PFA`)

| Feature | Description | Status | Existing docs | Implementation evidence | Open questions |
|---|---|---|---|---|---|
| Portfolio performance | P&L, TWR, value over time | Implemented & tested | `portfolio-performance.md` | `app/investments/performance/`; `app/api/investments/performance/`; `_lib/performance/` (+ `performanceCalculator.test.ts`, `historyCalculator`) | — |
| Portfolio exposure | Sector/country look-through + coverage | Implemented & tested | `portfolio-exposure.md` | `app/investments/exposure/`; `app/api/investments/exposure/` (+ `exposure.property.test.ts`); `_lib/exposure/` (+ tests); `AssetExposureSnapshot`, `ExposureCategory(Mapping)` | — |
| Exposure monthly sync | Store monthly exposure snapshots via job | Implemented & tested | `portfolio-exposure.md` | `_lib/jobs/processors/exposureSync.ts` (+ `exposureSync.property.test.ts`) | — |
| Admin exposure re-sync | Overwrite snapshot for asset+period | Implemented & tested | `portfolio-exposure.md` | `app/api/admin/exposure-resync/` (+ `resync.property.test.ts`) | — |
| Allocation drift | Target vs current + contribution suggestion | Planned | `portfolio-drift.md` (🟨) | No route/model found | — |

### Area H — Metrics & Reporting (`MET`)

| Feature | Description | Status | Existing docs | Implementation evidence | Open questions |
|---|---|---|---|---|---|
| Balances | Current balance per account | Implemented (untested) | README | `app/api/metrics/balances/` | No tests |
| Monthly summary | Income/expense summary per month | Implemented (untested) | README | `app/api/metrics/monthly-summary/` | No tests |
| Account balance series | Balance over time series | Implemented (untested) | README | `app/api/metrics/account-balance-series/` | No tests |
| Expenses by kind | Fixed/variable + budget per month | Implemented (untested) | README | `app/api/metrics/expenses-by-kind/route.ts`; `metrics-budget-surplus-chart.tsx` | No tests |
| Year analytics | Yearly totals | Planned | README 🟨 | Not found | — |

### Area I — Todos (`TOD`)

| Feature | Description | Status | Existing docs | Implementation evidence | Open questions |
|---|---|---|---|---|---|
| Todo list & lifecycle | Manual workflow for non-automated recurrent items | Partially implemented | README 🟨 ("Todo tab" pending) | `Todo` model, `TodoType`/`TodoOrigin`/`TodoStatus`; `app/todos/`, `app/api/todos/`, `todos/[id]/` | README marks pending yet model+routes exist; actual completeness and link to recurrent processing unverified |

### Area J — Financial Milestones (`MIL`)

| Feature | Description | Status | Existing docs | Implementation evidence | Open questions |
|---|---|---|---|---|---|
| Milestone tracking | Define/track invested, net worth, portfolio, expense-coverage milestones | Planned | `financial-milestones.md` (🟨) | **None found** — no model, route, or `_lib` module | Requires net-worth / expense-coverage calc services that may not exist |

### Cross-cutting — Authentication & Access Control (`AUT`)

| Feature | Description | Status | Existing docs | Implementation evidence | Open questions |
|---|---|---|---|---|---|
| Route protection | Gate all pages/APIs; 401 for API, redirect for pages | Implemented (untested) | `basic-authentification.md` | `apps/web/middleware.ts` (explicit 401/redirect + bypass list) | No automated auth tests |
| Credential login | Email/password via env vars | Implemented (untested) | `basic-authentification.md` | `app/login/`, `app/api/auth/[...nextauth]/route.ts`, `lib/auth` (imported by middleware); `AUTH_*` env vars | Credential-compare details not traced |
| Internal job bypass | Bearer token instead of session | Implemented (untested) | `basic-authentification.md`, README | middleware bypass of `/api/internal/`; internal endpoint checks Bearer | — |

### Cross-cutting — Scheduled / Background Jobs (`JOB`)

| Feature | Description | Status | Existing docs | Implementation evidence | Open questions |
|---|---|---|---|---|---|
| Daily "apply pending" job | Apply pending items + recurrents + price/exposure sync; finalize snapshots | Implemented (partially tested) | README job section | `app/api/internal/jobs/apply-pending-transactions`; `_lib/jobs/` incl. `processors/` (pending-investments & exposure-sync have tests) | Non-investment processors untested; idempotency claim verified only for parts |
| Job run log | One `JobRun` per `(job_name, madrid_date)` | Unverified | README | `JobRun` model, `JobRunStatus`; `_lib/jobs/jobRun.ts` | Idempotency not traced end-to-end |
| Dedicated price-sync cron | Separate scheduled price refresh | Planned | `assets-background-sync.md` (stub) | `/api/internal/jobs/sync-financial-products` not found | Feature is a TODO comment only |
| Server cron automation | External cron hitting the endpoint | Planned (ops) | README 🟨 | Operational, not app code | — |

### Cross-cutting — Administration & Debug (`ADM`)

| Feature | Description | Status | Existing docs | Implementation evidence | Open questions |
|---|---|---|---|---|---|
| Admin panel: trigger job | Manually run the daily job | Implemented (untested) | README (✅) | `app/admin/` (`actions.ts`, `jobs-panel.tsx`) | No tests |
| Job run history | View past job runs | Implemented (untested) | README (✅) | `app/admin/jobs-table.tsx`; `JobRun` model | No tests |
| Debug mode | Toggle extra table columns | Implemented (untested) | README (✅) | `components/debug/` (DebugContext/Indicator); `layout.tsx` DebugProvider | No tests |
| Admin exposure re-sync | (Also listed under G) | Implemented & tested | `portfolio-exposure.md` | `app/api/admin/exposure-resync/` (+ test) | Cross-listed with Area G |

### Documentation & Implementation Health

**Areas with good existing documentation**
- **E — Market Data & Assets**, **F — Investments & Positions**, **G —
  Portfolio Analytics**: multiple detailed specs, matching routes/models, and
  substantial property-test coverage. Documentation and code align well.
- **X-Auth**: `basic-authentification.md` is detailed and the middleware matches
  its described 401/redirect/bypass behavior.

**Areas with significant documentation gaps**
- **A — Accounts**, **B — Ledger**, **C — Recurrent Items**, **D — Monthly Model
  & Snapshots**, **H — Metrics**: these are foundational and mostly implemented,
  but have **no dedicated specs** (only README bullets) and **no tests**. This is
  the largest documentation gap in the project.
- **I — Todos**: implemented in schema/routes but documented only as a pending
  README bullet; its real scope is undocumented.
- **X-Jobs**: core to correctness but only partially tested and described mainly
  in the README runbook rather than a spec.

**Features whose implementation appears to differ from documentation**
- **Todos (I):** README marks it 🟨 (pending) but a `Todo` model and
  `app/todos` + `app/api/todos` routes exist → likely further along than the
  backlog implies.
- **Recurrent investments (C):** README status glyph is corrupted/pending, yet
  models, routes, and a job processor exist → likely implemented.
- **Monthly budget (D):** present and functional (GET/PUT route + model + metrics
  use), consistent with ✅, but has no spec.
- **Asset plot currency (E):** marked ✅ overall but the README itself flags an
  open currency-conversion bug; treated as partially implemented.

**Features requiring further investigation**
- Balance-mutation atomicity and the PENDING→COMPLETED lifecycle (A/B/C/F).
- Snapshot recalculation and finalization behavior (D).
- Recurrent pause/resume and edit endpoints (C) — enums exist, endpoints
  unconfirmed.
- Daily-job idempotency and the non-investment processors (X-Jobs).
- Todos completeness and its link to recurrent processing (I).

---

## Detailed Functional Analysis — Area B: Ledger

> **Status:** Evidence-based behavioral analysis of the current implementation.
> This describes **what the code does**, not necessarily the intended business
> rule. No EARS requirements are written here. All findings cite source files;
> behaviors not directly traced are marked **[Unverified]** or raised as open
> questions. There are **no automated tests** for any Ledger route (see Section
> 9), so every "verified" statement below is verified by **reading code**, not by
> executing it.
>
> Files traced: `app/api/{incomes,expenses,transactions}/route.ts` and their
> `[id]/route.ts`; `app/api/accounts/[id]/{incomes,expenses,transactions}/route.ts`;
> `app/api/_lib/jobs/processors/pendingItems.ts`;
> `app/api/_lib/snapshots/recalculateMonthSnapshot.ts`;
> `packages/db/prisma/schema.prisma` (`Income`, `Expense`, `Transaction`).

### 1. Functional Overview

The Ledger area records three one-off financial movements and their effect on
account balances:

- **Income** — money into one account (`balance += amount`).
- **Expense** — money out of one account (`balance -= amount`); carries a
  `kind` (`FIXED`/`VARIABLE`) and an optional `analytics_amount`.
- **Transaction** — transfer between two accounts (`from -= amount`,
  `to += amount`).

Each item is tied to a `Month` (year+month) and a status
(`PENDING`/`COMPLETED`; the `Transaction` enum also allows `CANCELLED`). Whether
an item takes effect immediately or waits for the daily job is decided by
comparing its month to the current Europe/Madrid month.

### 2. Main Components and Execution Flow

**[Verified]** There are two parallel creation surfaces, which is the single
most important structural finding:

- **Account-scoped routes** (`app/api/accounts/[id]/{incomes,expenses,transactions}`)
  — these are the full-featured, UI-facing endpoints. They provide paginated
  `GET` (cursor + month-range filter) and `POST` with the complete feature set.
- **Top-level routes** (`app/api/{incomes,expenses,transactions}`) — mostly
  unused; see the resolution of Open Question 1 (Section 10):
  - `GET /api/incomes` — returns all incomes; **no POST**. **Unused → marked for
    removal.**
  - `GET/POST /api/expenses` — the POST **omits `analytics_amount`** and neither
    verb has a caller. **Unused → marked for removal.**
  - `GET /api/transactions` — **unused → marked for removal.**
  - `POST /api/transactions` — **the one top-level route to keep**: it is the
    transaction create path used by the UI and carries the `automated`→Todo
    branch. Transactions have no account-scoped POST by design (a transfer spans
    two accounts).
- **Detail routes** (`app/api/{incomes,expenses,transactions}/[id]`) — provide
  `GET`, `PUT` (edit), `DELETE`.
- **Shared service:** `recalculateMonthSnapshot(accountId, monthId)` is called
  after any balance-affecting change.
- **Background processor:** `pendingItems.ts` applies PENDING items when the
  daily job runs.

Common pattern on write: `month.upsert` → compute effective status → if
effective-now, run a `prisma.$transaction` that creates/updates the row **and**
mutates balance(s) atomically, then recalculate the snapshot; else create as
PENDING with no balance change.

### 3. Operation Types and Lifecycle

**[Verified] Effective-status rule (identical across all three types):** using
`getEuropeMadridDateParts()`, an item whose month is the **current month or any
past month** is created `COMPLETED` (balance applied immediately,
`processed_at = now`); an item in a **future month** is created `PENDING` (no
balance effect). Past months are treated the same as the current month — there
is no "locked past month" guard at creation time.

**[Verified] PENDING → COMPLETED via the daily job** (`pendingItems.ts`): for a
given month it finds `PENDING` rows, and inside a transaction does a
**status-guarded claim** (`updateMany where status=PENDING → COMPLETED`). If the
claim count is 0, it is `skipped` (prevents double-apply under concurrency);
otherwise it applies the balance delta and stamps `job_run_id`. Errors are
caught per-item, counted as `failed`, and written to `processing_error` without
aborting the batch.

**[Verified] Edit (`PUT`) lifecycle:** edit recomputes the effective status from
the (possibly changed) target month. Within one transaction it **reverses the
old balance effect if the item was COMPLETED**, writes the new values, and
**re-applies the new balance effect if the new status is COMPLETED**. It then
recalculates snapshots for every affected (account, month) pair — handling the
case where the month changed. This means a COMPLETED item edited into a future
month is correctly reverted and set back to PENDING.

**[Verified] Delete lifecycle:** if the item was COMPLETED, its balance effect is
reversed inside a transaction; recurrent-run links are detached
(`recurrent*Run.update … _id: null`) rather than cascade-deleted; then the row
is deleted and the snapshot recalculated.

**[Unverified] CANCELLED status:** the `TransactionStatus` enum and the
top-level transaction POST Zod schema allow `CANCELLED`, but no route transitions
an item to `CANCELLED` or branches on it. Its lifecycle is effectively unused in
Ledger code traced here.

### 4. Balance Management

**[Verified] Two different mechanisms, by design:**

1. **`Account.balance`** is mutated with relative `increment`/`decrement` deltas,
   always inside a `prisma.$transaction` together with the row write. It is a
   **running, mutation-based** value.
   - Income COMPLETED: `account += amount`.
   - Expense COMPLETED: `account -= amount`.
   - Transaction COMPLETED: `from -= amount`, `to += amount`.
   - Edit reverses the prior delta then applies the new one; delete reverses it.
2. **`MonthSnapshot`** is **recomputed from scratch** by aggregating all
   `COMPLETED` rows for that account+month (`_sum` of incomes, expenses,
   transactions in/out, investments in/out) and upserting the totals. It is
   **idempotent / derived** — running it twice yields the same result.

**[Verified] Duplicate-mutation prevention differs between the two paths:**
- The **daily job** is protected by the status-guarded claim (a second run finds
  no PENDING rows → skipped). This is the only genuine idempotency guard.
- The **synchronous create/edit/delete** paths have **no such guard**; they trust
  that each HTTP call happens once. A retried or double-submitted POST would
  apply the balance delta twice (**[Unverified]** whether the UI prevents this).

**[Verified] Transfers:** handled as two balance updates in one transaction; both
accounts' snapshots are recalculated. The snapshot splits transfers into
`total_transactions_in` / `total_transactions_out`.

**[Verified] Negative balances are permitted** — no balance check precedes an
expense or outgoing transfer.

### 5. Analytics Behavior ("Adjust for analytics")

**[Verified] `analytics_amount` is an Expense-only field** (`Decimal?` on
`Expense`; absent from `Income` and `Transaction`).

**[Verified] It does NOT affect account balance or MonthSnapshot.** Both the
balance mutation and `recalculateMonthSnapshot` use `amount`, never
`analytics_amount`. So analytics is a **separate reporting value**, not an
accounting value — the "actual" money moved is always `amount`.

**[Verified] Where it is consumed:** `metrics/expenses-by-kind` reads
`analytics_amount` (Area H). So the field exists to let analytics/metrics treat
an expense's "effective" value differently from the cash actually spent (e.g.
excluding or adjusting a one-off), without changing the ledger balance.

**[Verified] Inconsistent defaulting — a key defect:**
- `accounts/[id]/expenses` POST and `expenses/[id]` PUT set
  `analytics_amount = parsed.analytics_amount ?? amount` (defaults to the real
  amount).
- **Top-level `expenses` POST does not set `analytics_amount` at all** → it is
  left `NULL`.
  This means expenses created through different endpoints end up with different
  analytics semantics (`NULL` vs equal-to-amount), which downstream metrics must
  handle. (`metrics/expenses-by-kind` was not fully traced for NULL handling.)

### 6. Validation and Error Handling

**[Verified] Zod schemas, with inconsistencies across endpoints:**

| Field / rule | account-scoped POST | top-level POST | `[id]` PUT |
|---|---|---|---|
| Income `amount` | `nonnegative` (≥0) | n/a (no POST) | `positive` (>0) |
| Expense `amount` | `nonnegative` | `nonnegative` | `positive` |
| Expense `kind` | optional (`?? FIXED`) | optional | **required** |
| `analytics_amount` | optional | **absent** | optional |
| Transaction `amount` | n/a (no scoped POST traced) | `nonnegative` | `positive` |
| `description` | `min(1)` | income/expense `min(1)`; txn optional | `min(1)` |

So amount `0` is accepted on create but rejected on edit; `kind` is optional on
create but mandatory on edit. **[Verified]** inconsistency, business intent
**[Unverified]**.

**[Verified] Error handling:** `ZodError → 400` with details; other errors →
500. `[id]` routes return `400` for non-numeric id and `404` when the row is
missing. All routes export `OPTIONS` returning 405 with an `Allow` header.

**[Verified] Referential validation is thin:** POST routes do **not** verify the
`account_id` / `from_account_id` / `to_account_id` exist before attempting the
balance update — a bad id surfaces as a caught 500, not a 400/404. Same-account
transfer is rejected **only** in transaction `PUT` (`from === to → 400`); the
transaction **POST does not** perform this check.

### 7. Interactions with Other Areas

- **Accounts (A):** Ledger owns the balance mutations on `Account.balance`. No
  existence check; negative balances allowed.
- **Monthly Model (D):** every write `upsert`s the `Month` and, on COMPLETED,
  calls `recalculateMonthSnapshot`. Snapshot totals are derived purely from
  COMPLETED Ledger (+investment) rows. Snapshot **finalization** (`is_final`) is
  set only by the job's `finalizeMonthSnapshots`, never by Ledger routes.
- **Recurrent (C):** recurrent runs reference Ledger rows via nullable FKs
  (`recurrent*Run.{income,expense,transaction}_id`). On delete, Ledger **detaches**
  the link (sets it `null`) instead of cascading, preserving the run record.
- **Scheduled Jobs (X-Jobs):** `pendingItems.ts` is the sole processor that
  transitions Ledger items PENDING→COMPLETED and stamps `job_run_id`.
- **Todos (I):** when a create request sets `automated: false`, the
  transaction POST and the account-scoped expense POST create a **Todo instead of
  a ledger row** (no month/balance effect). Income has no such branch.

### 8. Edge Cases and Potential Defects

- **[Verified] Duplicate top-level expense creation path** (`POST /api/expenses`)
  that silently skips `analytics_amount` (Section 5). **Confirmed unused by any
  caller and marked for removal** (Open Question 1), so the inconsistency is not
  reachable through the app today — but the dead handler should be deleted.
- **[Verified] No idempotency on synchronous writes** (Section 4) — a
  double-submitted POST double-applies the balance.
- **[Verified] Transaction POST lacks same-account validation** that PUT has — a
  self-transfer via POST would `+amount` and `-amount` on the same account
  (net zero to balance, but creates a meaningless row and inflates both
  snapshot in/out totals).
- **[Verified] No account-existence validation** on create → 500 instead of a
  clean 4xx.
- **[Verified] amount=0 accepted on create, rejected on edit**; `kind` optional
  on create, required on edit — inconsistent contracts.
- **[Verified] Past-month creation applies immediately** (treated like current
  month) with no "finalized/locked month" guard, even though the job finalizes
  past snapshots. Editing/creating into an already-finalized past month will
  mutate balance and recalc that month's snapshot — **[Unverified]** whether this
  is intended given the finalization model.
- **[Verified] CANCELLED is dead** in Ledger (Section 3).
- **[Verified] `GET /api/incomes` returns all incomes unpaginated** (no
  account filter), unlike the scoped/paginated expense/transaction listings.
- **[Unverified] Timezone boundary:** effective-status uses Madrid date parts;
  behavior exactly at month boundaries (e.g. creating on the 1st at 00:30 Madrid)
  was not tested.
- **[Unverified] Decimal/float handling:** amounts arrive as JS `number` via Zod
  and are stored as `Decimal(18,2)`; rounding behavior for >2-decimal inputs not
  traced.

### 9. Test Coverage and Gaps

**[Verified] Zero automated tests for the Ledger area.** The 34 `*.test.ts`
files all target Market Data / Investments / Portfolio Analytics
(`_lib/financialProducts`, `_lib/exposure`, `_lib/performance`, investment
routes). None exercise income/expense/transaction routes, the edit/delete
balance-reversal logic, `pendingItems.ts`, or `recalculateMonthSnapshot`.

Highest-value untested behaviors: balance reversal on edit/delete; the
job's status-guarded claim (idempotency); analytics_amount defaulting; transfer
dual-balance correctness; snapshot aggregation accuracy.

### 10. Open Questions and Decisions Requiring Human Review

1. ~~**Two creation paths**~~ → **RESOLVED (human review + usage trace).** A
   full-source search (excluding `.next/` build artifacts) confirmed which
   routes have a real caller:
   - **Keep:** `POST /api/transactions` (the transaction create path used by
     `AddTransactionForm`; a top-level route is justified because a transfer
     spans two accounts and has no single owning account); all
     `/api/accounts/[id]/{incomes,expenses,transactions}` routes (per-account
     create + paginated listing); all `/api/{incomes,expenses,transactions}/[id]`
     detail routes (GET/PUT/DELETE used by detail pages, edit forms, tables).
   - **Remove — no caller anywhere in source (not UI, tests, jobs, or scripts):**
     `GET /api/incomes`, `GET /api/expenses`, `POST /api/expenses` (also carries
     the `analytics_amount` NULL defect), and `GET /api/transactions`. These are
     unused "list-all" / duplicate-create endpoints with no user requirement
     behind them. The planned mobile app will reuse the same endpoints, so no
     top-level REST surface needs to be preserved for it.
   - **Action (code change, deferred — not performed in this analysis):** delete
     the four unused handlers above. This is a removal task to be scheduled
     separately; the documentation constraint for this analysis prohibits code
     changes.
2. ~~**analytics_amount default**~~ → **RESOLVED (human review).** Standardize on
   **`analytics_amount` always defaults to `amount`** when no explicit analytics
   value is given. Rationale from the usage trace: every reader already uses
   `analytics_amount ?? amount` (`metrics/expenses-by-kind`,
   `months/[year]/[month]` totals, `ExpensesTable`), and every writer except the
   now-removed `POST /api/expenses` already persists `?? amount` (account-scoped
   POST, `[id]` PUT, recurrent-expense create/run, recurrent processor,
   todo-complete). `NULL` and `amount` are functionally equivalent today and no
   feature uses the "explicitly set?" distinction. Once the dead `POST
   /api/expenses` is removed (Q1), store-`amount` is the single consistent
   behavior. Optional later migration: make the column `NOT NULL`. Candidate
   requirement: *"When an expense is created without an explicit analytics
   amount, the system SHALL set `analytics_amount` equal to `amount`."*
3. ~~**Past-month edits vs finalized snapshots**~~ → **RESOLVED (human review):
   allow edits, but re-finalize instead of silently downgrading.**
   - **Context (verified):** the daily job recalculates the current month as
     `is_final = false` and calls `finalizeMonthSnapshots(previousMonth)` which
     recomputes the prior month and sets `is_final = true` + `closed_at`.
     However, `is_final` is **never read as a guard** anywhere — Ledger
     create/edit/delete routes don't check it, and `recalculateMonthSnapshot`
     defaults `isFinal` to `false`. So today, editing a past-month item mutates
     `Account.balance`, recomputes that month's snapshot, and **silently flips
     its `is_final` back to false**. `is_final` is currently a display label, not
     a lock.
   - **Decision:** do **not** hard-block past-month writes (legitimate late
     corrections are a real need, and the single running `Account.balance` must
     absorb corrections regardless, so blocking the snapshot while allowing the
     balance would cause divergence). Instead, when a write recomputes a month
     that was already finalized, **preserve `is_final = true`** (re-finalize:
     recompute totals but keep the month closed), rather than downgrading it to
     provisional.
   - **Optional UX (not a data rule):** a soft confirmation when editing a closed
     month ("This month is closed — apply correction?").
   - **Rejected alternatives:** hard block (breaks corrections, conflicts with
     running balance); leave as-is (finalized silently downgrades — the current
     defect). A full audit/correction log is a future feature, deferred.
   - **Candidate requirements:** *"The system SHALL allow creating, editing, and
     deleting ledger items in the current or any past month."* and *"WHEN a
     ledger write recomputes a month whose snapshot was finalized, THE system
     SHALL recompute the snapshot totals while keeping the snapshot finalized."*
4. ~~**Idempotency for synchronous writes**~~ → **RESOLVED (human review):
   prevent accidental duplicates, via a layered lightweight guard.**
   - **Context (verified):** the daily job uses a status-guarded claim and is
     idempotent, but the synchronous create/edit/delete paths have no guard — a
     double-submitted POST (double-click, retry, re-render) creates two rows and
     applies the balance delta twice. This is interpreting one intended action as
     two, not distrusting the user's intent.
   - **Decision:** yes, prevent accidental duplicates, but scope it so it never
     rejects a *legitimate* identical entry (e.g. two real €3.50 coffees the same
     day):
     - **Primary — client-side:** disable the submit control after first click,
       re-enable on response/error. Catches the common double-click/retry case.
     - **Optional — server-side soft check:** if an identical
       `account + month + amount + description` row was created within a short
       window (seconds), treat the repeat as a likely duplicate and **warn /
       confirm**, never hard-reject. True idempotency keys (per-submit token) are
       the most correct form but add the most plumbing — deferred.
   - **Deliberately not doing:** hard content-based dedup or mandatory
     server-side idempotency keys (false-positive risk on genuine duplicates;
     complexity unjustified for a single-user tracker). "Trust the user's intent"
     is preserved by never silently refusing a real entry.
   - **Candidate requirement:** *"The system SHALL guard against accidental
     duplicate submission of a ledger item (e.g. by preventing repeated
     submission of the same create request), without preventing the user from
     intentionally creating distinct items with identical details."*
5. ~~**Validation contract**~~ → **RESOLVED (human review): make create and edit
   identical.**
   - **5a — `amount`:** standardize on **`positive` (> 0)** on both create and
     edit, for all three types. `amount = 0` is **rejected** — a zero-value
     income/expense/transfer moves no money and only adds noise to the ledger and
     snapshots. (Current state: create accepted `nonnegative`/≥0, edit required
     `positive`/>0 — inconsistent; align create to edit.)
   - **5b — `kind` (expenses only):** **required** on both create and edit; drop
     the silent `kind ?? "FIXED"` default. The user should select a value.
     Rationale: `kind` (FIXED/VARIABLE) drives the fixed-vs-variable split in
     `metrics/expenses-by-kind`, the `AddExpenseForm` UI already always sends it,
     and a silent default risks misclassifying a variable expense.
   - **`description`:** keep `min(1)`; the surviving routes are already consistent
     once the top-level income/expense routes are removed (Q1). The top-level
     transaction POST's optional `description` is addressed under Q6.
   - **Candidate requirements:** *"The system SHALL reject a ledger item whose
     amount is not greater than zero."* and *"The system SHALL require an expense
     to specify its kind (FIXED or VARIABLE)."*
6. ~~**Referential & self-transfer validation**~~ → **RESOLVED (human review):
   add both checks to POST.**
   - **6a — account existence:** Ledger POSTs SHALL verify the referenced
     account(s) exist and return a clean **404/400** instead of today's caught
     500. (Current: a bad id throws inside the `$transaction` → caught 500; the
     transfer rolls back so no half-applied balance, but the error is
     misleading.) Low risk via the UI dropdowns, but matters for the future
     mobile/direct-API client reusing these endpoints.
   - **6b — self-transfer:** transaction POST SHALL reject `from === to` with a
     400, matching the rule transaction PUT already enforces. A self-transfer
     nets to zero on balance but creates a meaningless row and inflates both
     `total_transactions_in` and `total_transactions_out` in the snapshot.
   - **Candidate requirements:** *"The system SHALL reject a ledger item that
     references a non-existent account."* and *"The system SHALL reject a transfer
     whose source and destination accounts are the same."*
7. ~~**CANCELLED status**~~ → **RESOLVED (human review): keep `CANCELLED`,
   reserved for a future soft-delete feature.**
   - **Context (verified):** `CANCELLED` exists on `IncomeStatus`,
     `ExpenseStatus`, and `TransactionStatus` but is currently **dead for
     Ledger** — never set, read, validated, or shown (it only appears, ignored,
     in the top-level transaction POST Zod enum). It *is* genuinely used for
     investments (cancel reverses a position, with tests) and recurrent items
     (ACTIVE/PAUSED/CANCELLED). The README backlog has no cancel/void task and
     treats "remove a ledger item" as hard **DELETE** (shipped).
   - **Decision:** do **not** remove the enum value. Instead, reserve it for a
     planned **soft-delete** capability for all three ledger types, to be built
     later. No soft-delete code exists today, so this stays a reserved state for
     now (intentional, not dead).
   - **Intended future behavior (not yet implemented):**
     - Cancel a COMPLETED item → reverse its balance effect, set `CANCELLED`,
       recalc snapshot (re-finalizing a closed month per Q3).
     - Cancel a PENDING item → set `CANCELLED`, no balance change.
     - Snapshots/metrics already aggregate only `COMPLETED`, so cancelled items
       are naturally excluded — no change needed there.
     - Listings SHALL **clearly mark** cancelled items (not hide them).
     - Soft-cancel **coexists** with hard DELETE (both available).
     - Cancellation is **reversible** — the user can restore/un-cancel an item
       (re-applying its balance effect if in an effective month).
     - Reuse the existing investment-cancel pattern for consistency.
   - **Status:** **Planned / future feature** (should be reflected in the
     roadmap/backlog). Not part of the current Ledger baseline behavior.
8. ~~**Analytics scope**~~ → **RESOLVED (human review): keep "adjust for
   analytics" expense-only.**
   - **Decision:** `analytics_amount` remains an **Expense-only** field; incomes
     and transactions do **not** gain an analytics value. This matches the
     current implementation (the field exists only on `Expense`) and the primary
     use case — adjusting expense values for the fixed/variable spend analysis in
     `metrics/expenses-by-kind`. Analytics adjustment is intrinsically an expense
     concern.
   - **Candidate requirement:** *"The system SHALL support an analytics-adjusted
     value for expenses only; incomes and transactions use their actual amount
     for all reporting."*

---

## 4. Existing Backlog

**[Documented]** The README Features section is the declared backlog. Pending
(🟨) items, grouped:

- **Infrastructure / config:** Docker setup; fix Prisma console; new packages
  (`mobile`, `shared`, `api`); automate cron on server; deploy prod; upload ERD
  dbdocs file and update `erd.png`; covering test suite.
- **Features:** disabled/enable-disable accounts; monthly splits across accounts
  (planned vs real view); recurrent investments; year analytics; todo tab for
  non-automated recurrent items; sort/filter/search for accounts/transactions/
  incomes/expenses.
- **Recurrent-item actions:** pause/resume recurrent incomes & expenses; modify
  start/end dates for recurrent incomes/expenses/transactions; modify recurrent
  frequency.
- **Bugs:** shift+click row doesn't open a new tab; asset plots always show `$`
  (ignoring currency conversion).
- **Design:** prioritize icons/visual cues; improve UI cleanliness/usability;
  calendar for date visualization.
- **Spec-linked pending:** portfolio allocation drift (`portfolio-drift`);
  financial milestones (`financial-milestones`); assets background sync
  (`assets-background-sync`).

**[Documented]** Status legend defined in the README: 🟨 Pending, 🔷 Ongoing,
✅ Completed. **[Observation]** No item currently uses the 🔷 Ongoing marker in
the actual backlog list (it appears only in the legend and the format example).

---

## 5. Documentation Issues

Issues identified from the reviewed files only:

1. **Backlog status vs. spec maturity mismatch.** Several features are marked ✅
   in the README but their specs are still written as future proposals
   ("The system shall…", Out of Scope, open design questions) — e.g.
   `investments.md`, `portfolio-performance.md`, `portfolio-exposure.md`,
   `contribution-history.md`, `asset-comparison.md`, `sparklines.md`. The specs
   do not record that the feature was implemented, so ✅ cannot be confirmed from
   docs alone. **[Open question]** actual implementation status.

2. **Spec name vs. backlog tag inconsistencies.**
   - File is `basic-authentification.md` (misspelled "authentification") but the
     tag is `[spec:basic-authentication]`. The README body also uses
     "authentification". Tag and filename don't match the convention
     `[spec:feature-name]` → `/specs/<feature-name>.md`.
   - `assets-provider.md`: backlog quote inside the file says
     `[spec:assets-provider]` and titles it "Asset Provider Mapping", but the
     README bug entry reads "Assets provider [spec:assets-provider]". Minor
     naming drift.

3. **Placeholder titles left in specs.** `asset-comparison.md`, `sparklines.md`,
   `financial-product-data.md`, and `portfolio-drift.md` still have the template
   heading `# Feature Name` instead of a real title.

4. **Incomplete specs.**
   - `financial-product-data.md` — Acceptance Criteria and Edge Cases are still
     empty template placeholders, despite the feature being marked ✅.
   - `assets-background-sync.md` — not a spec at all; it is a single HTML
     `<!-- TODO -->` comment describing an unbuilt cron job.
   - `financial-milestones.md` — missing the top-level `# Title` heading and the
     `> Backlog entry:` reference that every other spec includes.

5. **Encoding / glyph corruption in the README.**
   - "Recurrent investments" status renders as a replacement character (`�`)
     instead of 🟨.
   - Several apostrophes appear as `´` (e.g. "doesn´t", "it´s", "It´s"),
     suggesting an encoding/typo issue.

6. **Backlog-tag format inconsistency.** The README documents the convention as
   `entry 🟨 [spec:name]` (status before tag), but some entries place the tag
   before the status or omit the status, e.g.
   "Asset comparison mode [spec:asset-comparison] 🟨" and the in-file backlog
   quotes mirror that drift.

7. **Mixed content in the README.** As the SDD plan itself notes, the README
   blends product overview, backlog, implemented features, bugs, setup
   instructions, dev workflow, and operational runbook (DB dump/restore, cron)
   in one file. This is the core motivation for the SDD/documentation effort.

8. **Duplicated information across README and steering.** Tech stack, project
   structure, and product description exist both in the README and in workspace
   steering (`tech`, `structure`, `product`). **[Observation]** steering lists
   features (Todos, admin panel, debug mode) and a port-3001 docs app that the
   README treats differently or omits; the two sources are not fully aligned.

9. **Terminology.** Product is called "FinanceApp" (README), "FinanceApp_v2"
   (clone path/Figma), and "Precision Ledger" (steering). No single canonical
   product name.

10. **Prerequisite version inconsistency.** README prerequisites list
    "Turborepo (11.10.0)" and "Node.js (v20)", whereas steering lists
    "npm 11.10.0" and "Node >=18". The `11.10.0` version appears to be the npm/
    packageManager version mislabeled as Turborepo, and the Node version differs.

---

## 6. Open Questions

Items that cannot be resolved from the three reviewed sources:

- **Implementation reality:** Which ✅ features are actually implemented and
  behaving as their specs describe? (Requires code/test review in a later phase.)
- **Canonical product name:** FinanceApp vs. FinanceApp_v2 vs. Precision Ledger.
- **Data model source of truth:** Specs sketch models (`Investment`,
  `AssetProviderMapping`, `AssetExposureSnapshot`, `ExposureCategory`, etc.) but
  the actual `schema.prisma` was not reviewed; alignment is unverified.
- **Recurrent investments:** marked pending with a corrupted glyph — intended
  scope and relationship to the (completed) investments feature is unclear.
- **Monthly splits:** appears both under "Create & List" and "View" as pending;
  exact scope and whether it maps to recurrent transactions is ambiguous.
- **Todos feature:** described in steering as an existing area but marked pending
  in the README — actual status unknown.
- **Exposure / background-sync job integration:** `portfolio-exposure.md` says
  exposure sync runs as part of the daily job (and the README confirms the daily
  job fetches exposure), yet `assets-background-sync.md` proposes a separate,
  unbuilt price-sync cron. The division of responsibilities between the two jobs
  is unclear.
- **Which specs are retained vs. retired** once OpenSpec is adopted (per the SDD
  plan's "avoid parallel specification systems" principle).

---

## 7. Initial Observations

Findings that may influence the future documentation structure:

1. **The README is doing too many jobs.** It is simultaneously a product pitch, a
   backlog/issue tracker, a setup guide, a dev-workflow doc, and an ops runbook.
   The SDD plan's proposed split (product-overview, architecture, development,
   functional-inventory, roadmap, decisions) maps well onto these concerns.

2. **The backlog status markers are not a reliable implementation signal.**
   Because specs for ✅ items are still phrased as proposals, a code-evidence pass
   is needed before any functional-inventory document can assert "implemented".

3. **Investment/portfolio is the richest and most spec-covered domain.** Seven of
   the eleven real specs concern assets, investments, and portfolio analytics.
   This is a strong candidate to become its own top-level functional area (or a
   small cluster of areas) in the eventual OpenSpec structure.

4. **Core ledger (accounts/incomes/expenses/transactions/months/snapshots) is
   under-specified.** These are the foundational features, mostly marked ✅, yet
   they have **no spec files** — only README bullet points. The SDD baseline will
   need new EARS requirements written from code evidence for this area, since
   there is no existing spec to adapt.

5. **Spec quality is uneven.** Strong, detailed specs (investments, portfolio
   performance/exposure) sit alongside templates, stubs, and placeholder-title
   files. Consolidation into OpenSpec will require normalizing them.

6. **Requirements already use "The system shall…" phrasing**, which aligns closely
   with the EARS methodology the SDD plan intends to adopt — a helpful starting
   point for the Phase 4 functional-specification baseline.

7. **Functional-area prefixes are not yet defined.** The SDD plan expects stable
   requirement IDs per area; the candidate areas in Section 3 can seed that
   naming once validated against the repository.

---

## 8. Review Summary

- **Files reviewed:** `README.md`; `docs/project-documentation-and-sdd-plan.md`;
  all 13 Markdown files in `specs/` (`_example.md`, `basic-authentification.md`,
  `investments.md`, `financial-product-data.md`, `assets-provider.md`,
  `sparklines.md`, `asset-comparison.md`, `contribution-history.md`,
  `portfolio-exposure.md`, `portfolio-performance.md`, `portfolio-drift.md`,
  `financial-milestones.md`, `assets-background-sync.md`).
- **Main functional areas identified (candidate):** Accounts; Ledger entries;
  Recurrent items; Monthly model & snapshots; Scheduled jobs; Market data/assets;
  Investments & positions; Portfolio analytics; Metrics & charts; Milestones;
  Todos; Authentication; Admin/debug.
- **Important findings:** README status markers are self-reported and unverified;
  specs for many ✅ features are still written as proposals; core ledger features
  have no specs while investment/portfolio is heavily spec-covered; several naming,
  encoding, and completeness issues exist in both the README and specs.
- **Remaining questions:** actual implementation status of ✅ items; canonical
  product name; data-model alignment with `schema.prisma`; scope of recurrent
  investments, monthly splits, and todos; division between the daily job and the
  proposed background price-sync job.
- **Limitations of this review:** Documentation-only. No source code, tests, or
  configuration were inspected, so no statement here confirms actual runtime
  behavior. This is an initial overview, not a comprehensive audit, and is
  expected to be revised in subsequent phases.


---

## Kiro Steering Review

> **Added in:** Steering-file review pass. Compares the three foundation
> steering files (`.kiro/steering/product.md`, `tech.md`, `structure.md`)
> against `docs/project-documentation-and-sdd-plan.md`, this assessment, and
> spot-checked repository evidence (root listing, `apps/web/app` tree,
> `apps/web/package.json`, root `package.json`, `apps/web/.env.example`,
> `packages/db/prisma/schema.prisma`). The three steering files were **not**
> modified.
>
> Each finding is tagged **[Verified]**, **[Potentially outdated]**,
> **[Unverified assumption]**, or **[Missing]**.

### product.md

- **[Potentially outdated]** The subtitle states the app is "Designed for a
  single user (**no authentication**)". Authentication is now present in the
  repository: `apps/web/app/login/`, `apps/web/app/api/auth/`, the
  `next-auth@^5.0.0-beta.31` dependency (`apps/web/package.json`), and the
  `AUTH_SECRET` / `AUTH_USER_EMAIL` / `AUTH_USER_PASSWORD` variables
  (`apps/web/.env.example`). The feature is also marked ✅ in the README and has
  a spec (`specs/basic-authentification.md`). "No authentication" contradicts
  current evidence; it should read "single user, credential-based auth".
- **[Verified]** Core-feature list (Accounts, Expenses & Incomes, Transactions,
  Recurrent Items, Monthly Model, Todos, Metrics, Admin Panel) is supported by
  `packages/db/prisma/schema.prisma` (models `Account`, `Income`, `Expense`,
  `Transaction`, the `Recurrent*` families, `Month`, `MonthSnapshot`, `Todo`,
  `JobRun`) and the `apps/web/app` route tree (`accounts/`, `admin/`,
  `metrics/`, `months/`, `todos/`).
- **[Verified]** Business rule "Recurrent Items … with ACTIVE/PAUSED/CANCELLED
  state" matches the enums `RecurrentIncomeStatus`, `RecurrentExpenseStatus`,
  and `RecurrentTransactionStatus`, which all list `ACTIVE`, `PAUSED`,
  `CANCELLED` (`schema.prisma`).
- **[Missing]** The product file does not mention the **Investments /
  portfolio** domain at all, even though it is the most heavily implemented and
  spec-covered area. The schema contains `Investment`, `RecurrentInvestment`,
  `Asset`, `AssetPrice`, `AssetProviderMapping`, `AssetPriceSyncRange`,
  `AssetExposureSnapshot`, `ExposureCategory`, `ExposureCategoryMapping`, and the
  app has `investments/` and `financial-products/` routes. This is a significant
  capability gap in the product overview.
- **[Unverified assumption]** Business rules about snapshot finalization,
  `recalculateMonthSnapshot()` on every mutation, and the idempotent
  `JobRun` per `(job_name, madrid_date)` are plausible and partially supported
  (the `JobRun` and `MonthSnapshot` models exist) but the runtime behavior was
  not traced in this review. Treat as documented-but-unverified behavior.

### tech.md

- **[Verified]** Monorepo/build facts: Turborepo v2 (`turbo ^2.8.9`,
  root `package.json`), npm workspaces (`apps/*`, `packages/*`),
  `packageManager: npm@11.10.0`, and `engines.node >=18` — all confirmed in the
  root `package.json`.
- **[Verified]** `apps/web` uses Next.js 16.1.5 and React 19
  (`next: 16.1.5`, `react: ^19.2.0` in `apps/web/package.json`). TanStack Table
  v8 (`^8.21.3`), ECharts v5 (`^5.6.0`), Lucide React, Zod v4 (`^4.3.6`),
  `clsx` + `tailwind-merge`, and TailwindCSS v4 are all present.
- **[Potentially outdated]** The **Environment Variables** section lists only
  `CRON_SECRET` for `apps/web/.env`. The actual `apps/web/.env.example` also
  defines `AUTH_SECRET`, `AUTH_USER_EMAIL`, and `AUTH_USER_PASSWORD`. These auth
  variables are missing from the steering file.
- **[Missing]** Several notable dependencies present in `apps/web/package.json`
  are not reflected in the tech stack:
  - `next-auth ^5.0.0-beta.31` (authentication — Auth.js v5).
  - `yahoo-finance2 ^3.15.4` (market-data provider used by the asset/price and
    exposure features).
  - A **testing stack** — `vitest`, `@vitest/coverage-v8`, and `fast-check`
    (property-based testing) as devDependencies, plus `test` / `test:watch`
    scripts. `tech.md` currently lists no testing tooling, and the "covering
    test suite" is marked 🟨 in the README, yet tests already exist (e.g.
    `apps/web/app/api/admin/exposure-resync/resync.property.test.ts`).
- **[Potentially outdated]** The root `package.json` does not define
  `db:generate`, `db:migrate`, `db:deploy`, or `db:force_reset` scripts (those
  are package-level, run via turbo as the README shows), and `db:reset` is
  `docker compose down -v && docker compose up -d`. The command list in
  `tech.md` is mostly accurate but mixes root and package-level scripts without
  distinguishing them; minor wording review recommended.
- **[Unverified assumption]** "Prisma 7 ORM + `@prisma/adapter-mariadb`" and the
  shadcn "new-york style, neutral base" details were not re-verified against
  `packages/db/package.json` or the shadcn config in this pass. Plausible but
  unconfirmed here.

### structure.md

- **[Potentially outdated]** The `apps/web/app` tree omits directories that
  exist in the repository: `investments/`, `financial-products/`, and `login/`.
  The documented tree predates the investments/portfolio and authentication
  work.
- **[Potentially outdated]** The `app/api` subtree omits `auth/`,
  `investments/`, `recurrent-investments/`, and `financial-products/`, all of
  which exist under `apps/web/app/api/`. It also shows `internal/jobs/` but not
  the broader `internal/` grouping as it stands.
- **[Potentially outdated]** The **Root Layout** block lists `apps/`,
  `packages/`, `package.json`, `turbo.json`, and `design.md`, but the real root
  also contains `docker/`, `docker-compose.yml`, `docs/`, `specs/`,
  `README_turbo.md`, `erd.png`, and `db-dump*.sql` files. Not all need listing,
  but `docker-compose.yml` (referenced by `db:start`/`db:stop`), `docs/`, and
  `specs/` are structurally relevant and currently absent.
- **[Verified]** The `packages/` list (`db`, `ui`, `utils`, `eslint-config`,
  `typescript-config`) matches the actual `packages/` directory.
- **[Verified]** `packages/db` notes (`prisma/schema.prisma` as the data-model
  source of truth, `src/client.ts` singleton, `@repo/db` import) are consistent
  with the `packages/db` layout (`prisma/`, `src/`, `generated/`).
- **[Unverified assumption]** The API Route Patterns (force-dynamic export, Zod
  `.parse()` before DB access, `ZodError`→400 / else→500, `OPTIONS()` returning
  405 with `Allow`) and Component Patterns were not re-verified against actual
  route files in this pass. They are plausible conventions but unconfirmed here;
  note the newer `investments/` and `auth/` routes may or may not follow them.

### Cross-file consistency

- **Authentication contradiction.** `product.md` says "no authentication" while
  the repository (and `tech.md`'s silence plus the `AUTH_*` env vars in
  `.env.example`) show credential-based auth is implemented. The steering set is
  internally inconsistent on this point and both `product.md` and `tech.md` are
  behind the current state.
- **Investments/portfolio blind spot.** None of the three steering files
  describe the investments, assets/market-data, or portfolio-analytics domain,
  despite it being the largest implemented area (schema models + routes +
  dependencies + seven specs). This is the most important shared gap.
- **Duplication with the README.** `tech.md` and `structure.md` substantially
  duplicate the README's Tech Stack, setup commands, and structure content. The
  SDD plan explicitly favors references over duplication; this overlap is a
  maintenance risk already flagged in the Documentation Issues section above.
- **Responsibilities are otherwise clear.** product (what it is / rules), tech
  (stack / commands / env), and structure (layout / conventions) have distinct,
  non-overlapping scopes. The boundaries are sound; the problem is accuracy and
  completeness, not overlap between the three.
- **Naming.** All three use "Precision Ledger / Finance App"; the README uses
  "FinanceApp"; the structure root block uses "FinanceApp_v2". The canonical
  product name is still unresolved (see Open Questions).

### Recommended updates

Concise, evidence-backed changes worth making to the steering files (to be
applied in a later, separately-authorized step — not now):

1. **product.md** — Replace "no authentication" with "single user,
   credential-based authentication (Auth.js v5)". Add an **Investments &
   Portfolio** core-feature entry (investments/positions, asset price tracking,
   exposure, performance, comparison, sparklines).
2. **tech.md** — Add `next-auth` (Auth.js v5), `yahoo-finance2`, and the testing
   stack (Vitest, `@vitest/coverage-v8`, fast-check) to the libraries; add the
   `AUTH_SECRET` / `AUTH_USER_EMAIL` / `AUTH_USER_PASSWORD` variables to the
   `apps/web/.env` section; clarify which `db:*` commands are root vs
   package-level.
3. **structure.md** — Add `investments/`, `financial-products/`, and `login/`
   under `app/`; add `auth/`, `investments/`, `recurrent-investments/`, and
   `financial-products/` under `app/api/`; add `docker-compose.yml`, `docs/`,
   and `specs/` to the root layout.
4. **All three** — Decide and apply the canonical product name consistently
   (see Open Questions), and prefer linking to the README/docs instead of
   duplicating setup and stack details, per the SDD plan.

> **Verification note:** The API/component convention claims in `structure.md`
> and the "Prisma 7 / adapter-mariadb / shadcn style" details in `tech.md` were
> not re-checked against individual files in this pass and remain unverified
> assumptions rather than confirmed facts.


---

## OpenSpec Installation & Ledger Migration Proposal

> **Status:** OpenSpec installed and initialized. The Ledger migration below is a
> **proposal for review** — no spec has been migrated yet.

### Installation record

- **OpenSpec version:** 1.16.0
- **Install method:** npm global (`npm install -g @fission-ai/openspec@latest`).
  The official standalone Windows installer (`irm .../install.ps1 | iex`) failed
  with "unsupported CPU" and explicitly directed us to npm; the CPU is actually
  `x86_64`, so this appears to be an installer arch-detection issue rather than a
  genuinely unsupported machine.
- **Node:** upgraded from v20.20.0 to **v22.12.0** via the pre-existing
  `nvm` (nvm-windows 1.1.12) to meet OpenSpec's `>=22.12.0` requirement. The
  project's pinned Node (steering/README/`engines`) was **not** changed; 22.x
  still satisfies `engines.node >=18`. (A benign `EBADENGINE` warning noted a
  sub-dependency prefers `^22.13.0`; the CLI installs and runs fine.)
- **Initialization:** `openspec init --tools kiro --no-animation` from the repo
  root → "Setup complete for Kiro".
- **Created — canonical structure:** `openspec/config.yaml` (schema:
  `spec-driven`), `openspec/specs/`, `openspec/changes/archive/`.
- **Created — Kiro integration:** 6 skills under `.kiro/skills/`
  (`openspec-propose`, `openspec-apply-change`, `openspec-archive-change`,
  `openspec-update-change`, `openspec-sync-specs`, `openspec-explore`) and 6
  command prompts under `.kiro/prompts/` (`opsx-propose`, `opsx-apply`,
  `opsx-archive`, `opsx-update`, `opsx-sync`, `opsx-explore`).
- **Untouched (verified):** all 5 `.kiro/steering/` files, the legacy `specs/`
  directory, `.kiro/specs/ledger/requirements.md`, and application source.

### OpenSpec main-spec format (from the sync-specs skill)

Approved specs live at `openspec/specs/<capability-path>/spec.md` and use:

```markdown
# <capability> Specification

## Purpose
Short description of what this capability does and why it exists.

## Requirements

### Requirement: <Name>
The system SHALL ...

#### Scenario: <name>
- **WHEN** ...
- **THEN** ...
```

Key constraints: a main spec has a `## Purpose` and a single `## Requirements`
section; each requirement is a `### Requirement:` block whose body is a normative
SHALL statement, followed by one or more `#### Scenario:` blocks using
**WHEN/THEN** (and **GIVEN/AND**) bullets. Main specs must **not** contain delta
operation headers (ADDED/MODIFIED/REMOVED) — those belong only to change deltas.

### Proposed Ledger migration (`.kiro/specs/ledger/requirements.md` → `openspec/specs/ledger/spec.md`)

**Destination:** `openspec/specs/ledger/spec.md` (capability path `ledger`,
prefix `LED`).

**ID & EARS mapping:**
- Each `LED-NNN` requirement → one `### Requirement:` block. The `LED-NNN` ID is
  preserved by embedding it in the heading, e.g.
  `### Requirement: LED-001 Create an Income`, keeping IDs stable and traceable.
- Each numbered EARS acceptance criterion → a `#### Scenario:` block using
  WHEN/THEN (and GIVEN/AND) bullets. Existing Given/When/Then scenarios in the
  requirements doc carry over directly; plain SHALL criteria are phrased as a
  scenario or folded into the requirement's SHALL body as appropriate.
- The requirement's SHALL body states the normative behavior; scenarios capture
  the conditions and outcomes.

**Representing Current vs Target vs Future without misstating reality — proposal
for your decision (see open items):** OpenSpec main specs describe the *approved*
behavior, not implementation status, and have no native status field. Options:
1. **Baseline = current behavior only.** Migrate only the `[Implemented]`
   criteria into `openspec/specs/ledger/spec.md`. Capture every
   `[Target — not yet implemented]` item (LED-002.3, LED-004.1, LED-005.1,
   LED-006, LED-012.2, LED-013.2, LED-015.1) and the `[Future]` LED-016 as one or
   more **OpenSpec changes** under `openspec/changes/` (proposal + spec deltas),
   which is exactly what changes are for. This keeps the spec truthful about
   today and routes agreed-but-unbuilt behavior through the change workflow.
   **(Recommended.)**
2. **Baseline = approved target behavior**, with Target/Future annotated inline.
   Migrate everything but mark unimplemented requirements (e.g. a `> Status:`
   note per requirement). Simpler to read in one place, but risks presenting
   unbuilt behavior as current and bends the OpenSpec convention.

**Recommended path:** Option 1 — a clean current-state `ledger` baseline spec
plus a change (e.g. `ledger-validation-and-cleanup`) carrying the Target items,
and a separate future change (or roadmap entry) for LED-016 soft delete. This
honors the documentation principle of not describing unimplemented behavior as
current, and exercises the OpenSpec change workflow as intended.

### Migration status update — baseline completed (Option 1)

The owner approved **Option 1** (clean baseline spec + separate changes).

- **Done:** `openspec/specs/ledger/spec.md` created, containing **only the
  `[Implemented]` behavior**, verified against the current route handlers,
  `pendingItems.ts`, and `recalculateMonthSnapshot.ts`. All `LED` IDs, EARS
  wording, and relevant scenarios are preserved. Partially-target requirements
  were included with their implemented criteria only; their target criteria were
  omitted (with a short truthful note on current behavior where useful, e.g. the
  current `nonnegative`/`positive` amount rule, the still-present unused routes,
  and the finalized-snapshot downgrade). `openspec validate --specs` passes.
- **LED-016 (soft delete):** kept in `docs/product-backlog.md` with status
  **Candidate** (not approved); **no** OpenSpec change created for it.
- **Not done (awaiting review):** the seven Target requirements are **not** yet
  authored as OpenSpec changes. Proposed groupings are below for approval.

### Proposed Target change groupings (for review — not created)

The seven Target requirements (LED-002.3, LED-004.1, LED-005.1, LED-006,
LED-012.2, LED-013.2, LED-015.1) are **not** all one change. Grouped by
functional cohesion and dependency:

**Change 1 — `ledger-input-validation`** (input contract hardening)
- **Includes:** LED-004.1 (reject amount ≤ 0 on create, aligning with edit),
  LED-005.1 (require expense `kind` on create), LED-006.1 (reject non-existent
  account → 404/400), LED-006.2 (reject self-transfer on create).
- **Purpose:** make create-time validation consistent with edit and fail cleanly.
- **Rationale:** all four are request-validation rules on the create paths,
  touching the same Zod schemas/handlers; naturally reviewed and tested together.
- **Dependencies:** none; independent of the others.

**Change 2 — `ledger-route-cleanup`** (remove dead routes + fix analytics default)
- **Includes:** LED-013.2 (remove the four unused top-level routes), LED-002.3
  (default `analytics_amount` to `amount` on create).
- **Purpose:** remove the unused/duplicate surface and the only code path that
  produces a NULL `analytics_amount`.
- **Rationale:** tightly coupled — the buggy analytics default lives in
  `POST /api/expenses`, one of the routes being removed; doing them together
  avoids fixing code that is about to be deleted.
- **Dependencies:** none; but logically best done as one unit.

**Change 3 — `ledger-finalized-snapshot-preservation`** (snapshot behavior)
- **Includes:** LED-012.2 (recomputing a finalized snapshot keeps it finalized).
- **Purpose:** stop past-month edits from silently downgrading finalized
  snapshots to provisional.
- **Rationale:** isolated behavioral change in the snapshot-recalculation path;
  different subsystem and risk profile from validation/routes; warrants its own
  review and tests.
- **Dependencies:** none.

**Change 4 — `ledger-duplicate-submission-guard`** (accidental-duplicate guard)
- **Includes:** LED-015.1 (guard against accidental duplicate create submission).
- **Purpose:** prevent one intended action becoming two via double-submit.
- **Rationale:** spans client + optional soft server check; a distinct concern
  with its own UX/implementation shape, not a pure validation rule. Kept separate
  so it isn't blocked by the validation change.
- **Dependencies:** none; could be deferred/lowest priority.

> **Open decisions for the owner:**
> 1. Approve the four-change grouping above (vs. fewer/more changes)?
> 2. Confirm change names.
> 3. Priority/order (suggested: 1 → 2 → 3 → 4; all are independent).
> 4. These are code-affecting changes; creating the OpenSpec changes is a
>    separate authorized step — none are created yet.


---

## Detailed Functional Analysis — Area A: Accounts

> **Status:** Evidence-based behavioral analysis of the current implementation,
> traced from source. Describes **what the code does**, not necessarily the
> intended rule. Findings are tagged **[Verified]** (read from code),
> **[Unverified]**, or raised as open questions. There are **no automated tests**
> for the Accounts area.
>
> Files traced: `packages/db/prisma/schema.prisma` (`Account` model);
> `app/api/accounts/route.ts` (GET, POST); `app/api/accounts/[id]/route.ts`
> (GET, PATCH); `app/accounts/page.tsx`; `components/AccountsTable.tsx`;
> `components/accounts/EditAccountForm.tsx` (+ `IconPicker`, `AccountIcon`).

### 1. Functional Overview

Accounts are the root entity of the app: every ledger item, investment, and
snapshot attaches to one. An account has `name`, optional `description`,
optional `icon`, a `Decimal(18,2)` `balance` (default 0), `created_at`, and an
`active` boolean (default true). The area supports **create, list, read, edit,
and enable/disable** — but **not deletion**.

### 2. Main Components and Execution Flow

- **`GET /api/accounts`** — returns **all** accounts (no `active` filter, no
  pagination).
- **`POST /api/accounts`** — creates an account; accepts `name` (required),
  `description`, `icon`, and an optional initial `balance` (nonnegative).
- **`GET /api/accounts/[id]`** — single account; 400 on non-numeric id, 404 if
  missing.
- **`PATCH /api/accounts/[id]`** — partial update of `name`, `description`,
  `icon`, and `active`. Does **not** allow editing `balance`.
- **UI:** `AccountsTable` (create dialog via POST, list via GET, status badge,
  per-row "Edit"); `EditAccountForm` (PATCH, includes an "Active" switch);
  `app/accounts/page.tsx` (header KPIs; aggregates balances filtered to
  `active: true`).

### 3. Operations and Lifecycle

- **[Verified] Create:** balance starts at the provided initial value or 0.
- **[Verified] Enable/disable:** `active` is a first-class boolean, toggled via
  the PATCH route and the "Active" switch in `EditAccountForm`; the table shows
  an Active/Inactive status badge. **This contradicts the backlog**, which marks
  "Enable/Disable account" as Planned (🟨) — it is actually **implemented
  end-to-end** (doc-vs-reality mismatch, like Todos and recurrent investments).
- **[Verified] No deletion:** there is no DELETE handler and no delete UI.
  Disabling (`active = false`) is the only way to retire an account.

### 4. Balance Handling

- **[Verified] Balance is owned by the Ledger/Investment areas, not Accounts.**
  The only place Accounts sets balance is the **initial** value at creation. The
  edit PATCH schema deliberately omits `balance`, so it cannot be edited directly
  through the account API — balance changes only via completed ledger/investment
  operations (see Area B).
- **[Verified] Active filtering is a consumer concern.** `GET /api/accounts`
  returns inactive accounts too; it is the **accounts page aggregates** and
  snapshot queries that filter `active: true`. The table itself lists all
  accounts (active and inactive) with a status badge.

### 5. Validation and Error Handling

- **[Verified] Create:** `name` min length 1; `balance` nonnegative if provided;
  `description`/`icon` nullable-optional. ZodError → 400, else 500.
- **[Verified] Edit:** all fields optional; a `.refine` rejects a `name` that is
  empty/whitespace-only. Non-numeric id → 400; missing account → 404.
- **[Verified — potential defect] `POST /api/accounts` references
  `error.errors`** on the ZodError (`details: error.errors`). This is the same
  property the repo-wide type-check flags as non-existent on `ZodError` in the
  installed Zod v4 — so the 400 branch may be constructing `details` from an
  undefined property. Worth verifying at implementation time.

### 6. Interactions with Other Areas

- **Ledger (B) / Investments (F):** own all post-creation balance mutation.
- **Monthly Model (D):** the accounts page reads `MonthSnapshot` to compute the
  balance delta KPI; snapshot queries filter `active: true`.
- **Recurrent (C), Todos (I):** reference accounts via FKs (see `Account`
  relations in the schema).
- **Debug (ADM):** `AccountsTable` shows extra `id`/`created_at` columns when
  debug mode is on.

### 7. Edge Cases and Potential Defects

- **[Verified] No account deletion path at all** — intentional? (disable-only).
- **[Verified] `GET /api/accounts` is unfiltered and unpaginated** — inactive
  accounts are returned; the table shows them. Consumers must filter themselves.
- **[Verified] Balance not editable post-creation** via the account API — a
  correction to a wrong initial balance has no direct account-level path (would
  require a ledger entry). Intended?
- **[Verified — potential defect] `error.errors` on ZodError** in the POST 400
  branch (Section 5).
- **[Unverified] Initial balance semantics:** an account created with a non-zero
  initial balance does not create any ledger row or snapshot for that opening
  amount; how opening balances are meant to reconcile with monthly metrics is
  not traced.

### 8. Test Coverage and Gaps

**[Verified] Zero automated tests** for the Accounts area. Highest-value
untested behaviors: create validation, enable/disable via PATCH, and the
unfiltered list.

### 9. Open Questions and Decisions Requiring Human Review

All resolved by human review:

1. ~~**Account deletion**~~ → **Keep disable-only.** No DELETE path; retiring an
   account is done via `active = false`. (Avoids broad FK/history impact.)
2. ~~**`GET /api/accounts` filtering**~~ → **Exclude inactive by default**, with
   an opt-in `includeInactive` (or equivalent) to return all. (Target — current
   code returns all unconditionally.)
3. ~~**Editable balance**~~ → **Balance is derived-only.** No account-level
   balance correction; balance changes only via completed ledger/investment
   activity (plus the initial value at creation). (Confirms current behavior.)
4. ~~**Opening balance reconciliation**~~ → **Leave the initial balance as a
   standalone starting value** for now; it does not create a ledger entry or
   snapshot. (Confirms current behavior; revisit later if needed.)
5. ~~**`error.errors` defect**~~ → **Fix** the ZodError property usage in
   `POST /api/accounts` as part of the Accounts work (ties into the repo-wide
   type-check failures). (Target.)
6. ~~**Backlog correction**~~ → **Yes**, move ACC-004 (enable/disable) from
   Planned to Implemented in `docs/product-backlog.md`.


---

## Detailed Functional Analysis — Area D: Monthly Model & Snapshots

> **Status:** Evidence-based behavioral analysis traced from source. Tags:
> **[Verified]** (read from code), **[Unverified]**, or open question. No
> automated tests exist for this area. Snapshot mutation mechanics overlap with
> Ledger (LED-011/LED-012) and are not re-specified here — this area owns the
> Month entity, the budget, and the snapshot lifecycle/read surface.
>
> Files traced: `Month`, `MonthSnapshot`, `MonthBudget` models; `app/api/months/route.ts`;
> `app/api/months/[year]/[month]/route.ts`; `.../budget/route.ts`;
> `.../snapshots/route.ts`; `.../{incomes,expenses,transactions}/route.ts`;
> `app/api/_lib/snapshots/recalculateMonthSnapshot.ts` (incl.
> `recalculateAllSnapshotsForMonth`, `finalizeMonthSnapshots`).

### 1. Functional Overview

The monthly model anchors every financial item to a `Month` (year + month,
unique). A `MonthBudget` (optional, one per month) stores a spending target. A
`MonthSnapshot` (one per account+month) aggregates completed totals — incomes,
expenses, transfers in/out, investments in/out — plus an `is_final` finalized
flag and `closed_at`. The area provides month creation/listing, a month detail
read, budget get/set, month-scoped item listings, and the snapshot read surface.

### 2. Main Components and Execution Flow

- **`GET /api/months`** — all months, newest first. **`POST /api/months`** —
  upserts a (year, month). (OPTIONS advertises only `POST` — see defects.)
- **`GET /api/months/[year]/[month]`** — returns the month, **upserting it if
  absent** (a read with a create side effect).
- **`GET/PUT /api/months/[year]/[month]/budget`** — read / upsert the month's
  budget amount (nonnegative).
- **`GET /api/months/[year]/[month]/snapshots`** — returns per-account snapshots;
  for the **current** month it recalculates all active-account snapshots first
  (live values) before returning.
- **`GET /api/months/[year]/[month]/{incomes,expenses,transactions}`** —
  month-scoped item reads.
- **Snapshot service (`_lib/snapshots`)**: `recalculateMonthSnapshot`
  (per account+month, from COMPLETED rows), `recalculateAllSnapshotsForMonth`
  (all active accounts), `finalizeMonthSnapshots` (sets `is_final`/`closed_at`).

### 3. Snapshot Lifecycle

- **[Verified]** The daily job recalculates the **current** month's snapshots as
  provisional (`is_final = false`) and calls `finalizeMonthSnapshots(previous)`
  to lock the prior month (`is_final = true`, `closed_at` set).
- **[Verified]** Snapshot GET refreshes only the **current** month before
  returning; past months are served as stored.
- **[Verified]** Snapshots are derived — recomputed from COMPLETED items, never
  hand-edited. (Mutation detail is owned by Ledger LED-011; the finalized-status
  preservation gap is tracked by the Ledger change
  `ledger-finalized-snapshot-preservation`, LED-012.)

### 4. Budget

- **[Verified]** One optional `MonthBudget` per month (`month_id @unique`),
  `amount` `Decimal(18,2)` nonnegative. `PUT` upserts; `GET` returns `{budget:
  null}` when absent. Consumed by `metrics/expenses-by-kind` (Area H).

### 5. Monthly Splits

- **[Verified] Not implemented.** No model, route, or logic exists (confirmed by
  full-source search — only `String.split`). Remains a backlog idea
  (`MON` area, Planned). Per earlier decision it belongs to this area, as a
  single feature (planned + real) with a Recurrent (C) execution dependency.

### 6. Interactions with Other Areas

- **Ledger (B) / Investments (F):** produce the COMPLETED rows snapshots
  aggregate; they call `recalculateMonthSnapshot` after mutations.
- **Scheduled Jobs (X-Jobs):** drives current-month recalculation and
  previous-month finalization.
- **Metrics (H):** reads budgets and snapshots.
- **Accounts (A):** snapshots are per active account.

### 7. Edge Cases and Potential Defects

- **[Verified — defect] `GET /api/months/[year]/[month]` upserts on read** — a
  GET has the side effect of creating a Month row. Convenient but surprising;
  means merely viewing a month materializes it.
- **[Verified — defect] `POST /api/months` OPTIONS advertises only `Allow:
  POST`** though `GET` is also implemented; `[year]/[month]` OPTIONS advertises
  only `GET`. Minor `Allow`-header inaccuracies.
- **[Verified] No pagination on `GET /api/months`** (returns all).
- **[Unverified] Finalized-status downgrade on past-month edits** — the known
  LED-012 behavior; tracked under the Ledger change, noted here for the lifecycle.
- **[Verified] Monthly splits** entirely unbuilt (Section 5).

### 8. Test Coverage and Gaps

**[Verified] Zero automated tests** for months/budget/snapshots. Snapshot
aggregation correctness and finalization are the highest-value untested paths
(partly covered conceptually by the Ledger area's intent).

### 9. Decisions (applied; code is source of truth)

- Documented the month/budget/snapshot behavior as implemented. The two
  `Allow`-header inaccuracies and the GET-upserts-on-read behavior are recorded
  as **target** cleanups (small), proposed as an OpenSpec change. Monthly splits
  stays **Planned** (not specified as current behavior). No business-rule
  guesses were required.


---

## Detailed Functional Analysis — Area C: Recurrent Items

> **Status:** Evidence-based analysis traced from source. Tags **[Verified]**,
> **[Unverified]**, or open question. No automated tests for this area. The four
> recurrent types (income, expense, transaction, investment) follow the same
> structure; the recurrent-expense route + processor were read in full and the
> others confirmed to share the pattern (same schema families, route shape, and
> `_lib/jobs/processors/recurrent*.ts`).
>
> Files traced: `Recurrent{Income,Expense,Transaction,Investment}` + their
> `*Run` models and status enums; `app/api/accounts/[id]/recurrent-*/route.ts`
> (GET, POST); `app/api/recurrent-*/[id]/route.ts` (DELETE);
> `_lib/jobs/processors/recurrent*.ts`.

### 1. Functional Overview

Recurrent items are templates that generate concrete ledger/investment entries
over time. Each has an amount, description, `automated` flag, a status
(`ACTIVE`/`PAUSED`/`CANCELLED`), optional `start_month`/`end_month`, and
next-run tracking (`next_run_year`/`next_run_month`, `last_applied_month_id`).
Each application is recorded in a per-month run-log (`*Run`, APPLIED/FAILED)
linked to the generated item.

### 2. Operations and Lifecycle

- **[Verified] Create (`POST /api/accounts/[id]/recurrent-*`):** creates the
  template (status defaults ACTIVE, automated defaults true), validates
  `end_month >= start_month`, and **backfills**:
  - **automated + start_month in the past:** applies the item for each due month
    up to the current month (idempotent via run-log + `last_applied_month_id`),
    mutating balances and recalculating snapshots.
  - **non-automated:** creates **Todos** (origin RECURRENT, OPEN) for each due
    month instead of applying (Area I).
- **[Verified] Daily job (`recurrent*.ts` processors):** for ACTIVE, automated,
  account-active templates whose window/next-run is due, creates the item as
  COMPLETED, mutates balance, records the run APPLIED, and advances
  `next_run_*` / `last_applied_month_id`. Idempotent: an existing APPLIED run or
  matching `last_applied_month_id` is skipped; errors mark the run FAILED and
  continue.
- **[Verified] Delete (`DELETE /api/recurrent-*/[id]`):** reverts completed
  child amounts, deletes child items and runs, deletes the template, recalculates
  affected snapshots. (Confirmed for recurrent expense; income/transaction/
  investment variants follow the same cascade pattern.)

### 3. Lifecycle Gaps (confirmed Planned)

- **[Verified] No PATCH/edit endpoint.** The `[id]` route exposes **only
  DELETE** (OPTIONS advertises `DELETE`). Therefore:
  - **Pause/resume** (ACTIVE↔PAUSED) is **not implemented** via API, even though
    the status enum exists and POST accepts an initial status. The backlog's
    "Pause and resume recurrent incomes/expenses 🟨" is **genuinely Planned**.
  - **Modify start/end dates** and **modify frequency** are **not implemented**
    — also genuinely Planned, matching the backlog 🟨.
  - **CANCELLED** can only be set at creation; no transition path exists.
- This contrasts with Accounts/Todos (which were falsely marked Planned) — here
  the backlog's Planned markers are **accurate**.

### 4. Interactions with Other Areas

- **Ledger (B) / Investments (F):** recurrent application creates COMPLETED
  items and mutates balances through the same mechanics.
- **Monthly Model (D):** applications recalculate snapshots; items are
  month-scoped.
- **Scheduled Jobs (X-Jobs):** the processors run inside the daily job.
- **Todos (I):** non-automated recurrents create Todos instead of applying.
- **Accounts (A):** processors skip templates whose account is inactive.

### 5. Edge Cases and Potential Defects

- **[Verified] No-end-date support** works (`end_month` nullable; window checks
  treat null as open) — matches backlog ✅.
- **[Verified] Idempotency** is robust (run-log unique on
  `(recurrent_id, month_id)` + `last_applied_month_id` guard).
- **[Verified — gap] Status transitions** (pause/resume/cancel) and **edits**
  have no API path (Section 3).
- **[Verified] OPTIONS on `[id]` advertises only `DELETE`** (accurate — only
  DELETE exists).
- **[Unverified] Backfill window vs. non-automated Todo window** differ subtly
  between the automated and non-automated branches at create time; exact
  boundary behavior (e.g. end_month exactly current month) not exhaustively
  traced.

### 6. Test Coverage and Gaps

**[Verified] Zero automated tests** for recurrent routes/processors (the only
related tests are in investments/pending — not recurrent templates). The
backfill-on-create and daily-job idempotency are the highest-value untested
paths.

### 7. Decisions (applied; code is source of truth)

- Documented recurrent create / backfill / daily-apply / delete as implemented.
- **Pause/resume, edit dates, edit frequency, and status transitions are
  recorded as Planned** (genuinely not implemented) — NOT specified as current
  behavior, and left as backlog items (REC Planned). No OpenSpec change is
  created for them (they are future features, not agreed-target cleanups of
  existing behavior). No business-rule guesses required.


---

## Detailed Functional Analysis — Area H: Metrics & Reporting

> **Status:** Evidence-based analysis traced from source. All four endpoints are
> read-only GETs that aggregate from accounts and month snapshots. No automated
> tests. Files: `app/api/metrics/{balances,monthly-summary,account-balance-series,expenses-by-kind}/route.ts`.

### 1. Functional Overview

Account- and month-centric reporting, derived entirely from `Account.balance`
and `MonthSnapshot`. No writes, no validation, no persistence of its own.

### 2. Endpoints (all [Verified])

- **`GET /api/metrics/balances`** — active accounts with balances + total.
- **`GET /api/metrics/monthly-summary`** — per-month income/expense/net from
  snapshots, with a running total anchored to the current total balance (walked
  backward), plus totals and averages.
- **`GET /api/metrics/account-balance-series`** — per-account balance over time,
  reconstructed backward from current balance using each month's snapshot net.
- **`GET /api/metrics/expenses-by-kind`** — fixed/variable expense totals per
  month (using `analytics_amount ?? amount`) plus the month budget.

### 3. Interactions

- **Accounts (A):** balances; filters `active: true`.
- **Monthly Model (D):** reads `MonthSnapshot` and `MonthBudget`.
- **Ledger (B):** `expenses-by-kind` uses the expense analytics value (LED-014).

### 4. Edge Cases / Defects

- **[Verified] Balance-over-time is reconstructed backward** from the current
  balance via snapshot nets; accuracy depends on snapshot completeness. Both
  series endpoints share this approach.
- **[Verified] No OPTIONS handlers** on metrics routes (minor inconsistency vs
  other areas).
- **[Verified] No pagination** (bounded by number of months; acceptable).

### 5. Planned

- **[Verified] Year analytics** (yearly totals) — no route exists; genuinely
  Planned (README 🟨).

### 6. Test Coverage

**[Verified] Zero automated tests.** The backward running-total reconstruction
is the highest-value untested logic.

### 7. Decisions (applied; code is source of truth)

- Documented the four read endpoints as implemented. Year analytics stays
  Planned (not specified). No OpenSpec change (no agreed-target cleanup of
  existing behavior; the missing OPTIONS handlers are too minor to warrant a
  change on their own). No business-rule guesses required.


---

## Detailed Functional Analysis — Area I: Todos

> **Status:** Evidence-based analysis traced from source. No automated tests.
> Files: `Todo` model; `app/api/todos/route.ts` (GET);
> `app/api/todos/[id]/{complete,skip,reopen}/route.ts`.

### 1. Functional Overview

Todos are the manual-action workflow for non-automated recurrent items (and
manual one-offs). A `Todo` has a type (EXPENSE | TRANSACTION), origin (MANUAL |
RECURRENT), status (OPEN | DONE), a due year/month, title/description, optional
amount, and account references. Unique on
`(recurrent_expense_id, due_year, due_month)` and the transaction equivalent, so
a recurrent item yields at most one todo per due month.

### 2. Operations (all [Verified])

- **`GET /api/todos`** — paginated (limit/skip), status-filtered (default OPEN,
  `includeDone` option), **gated to due ≤ current month**, newest-due first,
  with account names included; returns `{data, total}`.
- **`POST /api/todos/[id]/complete`** — status-guarded claim OPEN→DONE; on first
  completion it **creates the real ledger entry** (expense, or transfer for
  TRANSACTION type), mutates balance(s), recalculates snapshot(s). Reopen-aware:
  a previously-completed todo re-marked DONE does **not** re-create the movement.
  Returns 404 if not open, 409 if the claim is lost.
- **`POST /api/todos/[id]/skip`** and **`/reopen`** — status transitions
  (skip with reason; reopen back to OPEN).

### 3. Doc-vs-Reality

- **[Verified] Todos is fully implemented**, not "pending". The README marks the
  "Todo tab" 🟨, but the model, list, and complete/skip/reopen actions all exist
  and the complete action performs real ledger movements. This is another
  backlog mismatch (like Accounts enable/disable) — corrected in the backlog.

### 4. Interactions

- **Recurrent (C):** non-automated recurrents create RECURRENT-origin todos
  (backfill + daily job).
- **Ledger (B) / Accounts (A) / Monthly Model (D):** completing a todo creates a
  COMPLETED expense/transfer, mutates balance, recalculates the snapshot.

### 5. Edge Cases / Defects

- **[Verified] Idempotent completion** via the status-guarded claim (409 on
  lost claim).
- **[Verified] Reopen→complete does not double-apply** the movement (guarded by
  `completed_at`).
- **[Verified] `complete` upserts the Month** for the due period (same
  read/write-materialization pattern seen elsewhere).
- **[Unverified] skip/reopen** internal detail not fully traced (status-only by
  design; no balance effect expected).

### 6. Test Coverage

**[Verified] Zero automated tests.** The complete action's ledger-creation +
idempotency is the highest-value untested path.

### 7. Decisions (applied; code is source of truth)

- Documented list + complete/skip/reopen as implemented. Corrected the backlog
  (Todos is Implemented, not Planned). No OpenSpec change (no agreed-target
  cleanup of existing behavior). No business-rule guesses required.


---

## Detailed Functional Analysis — Area J: Financial Milestones

> **Status:** Evidence-based — confirmed **not implemented**. Full-source search
> found no model, route, `_lib` module, or UI for milestones. The only artifact
> is the legacy proposal `specs/financial-milestones.md`.

### Finding

- **[Verified] No implementation exists.** There is no `financial_milestones`
  Prisma model, no `/api/.../milestones` route, no milestone calculation
  service, and no milestone UI. The schema, route tree, and `_lib` were searched.
- The legacy `specs/financial-milestones.md` describes the intended feature
  (track invested amount, net worth, portfolio value, expense-coverage
  milestones with progress and first-reached date).

### Decision (applied; code is source of truth)

- **No OpenSpec baseline spec is created** for Milestones, because a canonical
  spec must describe implemented behavior and there is none. Creating one would
  describe unbuilt functionality as current — contrary to the documentation
  principles.
- Milestones remains a **Planned / Candidate** backlog item (`MIL`), referencing
  the legacy proposal. When it is approved and built, it will enter via an
  OpenSpec change that introduces the `milestones` capability (new spec at that
  point).
- No business-rule guesses made; no code changed.


---

## Detailed Functional Analysis — Cross-cutting: Authentication & Access Control (`AUT`)

> **Status:** Evidence-based analysis traced from source. No automated auth
> tests. Files: `apps/web/middleware.ts`; `apps/web/lib/auth.ts`;
> `app/api/auth/[...nextauth]/route.ts`; `app/login/`; `AUTH_*` env vars. Legacy
> spec `specs/basic-authentification.md` matches the implementation.

### 1. Functional Overview

Single-user, credential-based authentication via Auth.js / NextAuth v5 with a
JWT session strategy, gating all pages and APIs except an explicit bypass list.

### 2. Behavior (all [Verified])

- **Credentials provider** (`lib/auth.ts`): compares submitted email/password
  against `AUTH_USER_EMAIL` / `AUTH_USER_PASSWORD` env vars (raw comparison);
  returns a single owner identity on match, null otherwise. Session strategy
  `jwt`; sign-in page `/login`; secret from `AUTH_SECRET`.
- **Handler** (`api/auth/[...nextauth]`): exposes NextAuth GET/POST.
- **Middleware** (`middleware.ts`): for unauthenticated requests, API routes
  (`/api/*`) return **401 JSON**, page routes **redirect to `/login`**. Bypass
  list: `/login`, `/api/auth`, `/api/internal/*`, `/_next`, and any path with a
  `.` (static assets).
- **Internal job bypass:** `/api/internal/*` is exempt from session auth; those
  endpoints are protected separately by the Bearer `CRON_SECRET` (X-Jobs).

### 3. Interactions

- Applies uniformly to every area (access control, not a business domain).
- **X-Jobs:** the internal job endpoint relies on the middleware bypass + its own
  Bearer check.

### 4. Edge Cases / Notes

- **[Verified] Raw password comparison** (no hashing) — matches the legacy
  spec's "compared raw for simplicity" option; acceptable for single-user, but a
  noted hardening candidate (bcrypt) for any future multi-user move.
- **[Verified] Env-var credentials** — missing/empty `AUTH_*` would make login
  impossible; no explicit startup validation traced beyond `lib/env`.
- **[Unverified] Session expiry / tampered-token** handling is delegated to
  NextAuth defaults (not separately traced).

### 5. Test Coverage

**[Verified] Zero automated auth tests.** Middleware gating (401 vs redirect vs
bypass) is the highest-value untested path.

### 6. Decisions (applied; code is source of truth)

- Documented auth as implemented. No OpenSpec change (behavior matches intent;
  bcrypt hashing and multi-user are future enhancements, not agreed-target
  cleanups). Recorded raw-comparison and env-validation as notes. No code changed.


---

## Detailed Functional Analysis — Cross-cutting: Scheduled / Background Jobs (`JOB`)

> **Status:** Evidence-based analysis traced from source. The pending-investments
> and exposure-sync processors have tests; the orchestrator and `jobRun` do not.
> Files: `JobRun` model; `app/api/internal/jobs/apply-pending-transactions/route.ts`;
> `_lib/jobs/applyPendingTransactions.ts`; `_lib/jobs/jobRun.ts`; the
> `_lib/jobs/processors/*`.

### 1. Functional Overview

A single daily job orchestrates end-of-day processing for the current
Europe/Madrid month: apply recurrent items (income/expense/transaction/
investment), apply pending items (transaction/income/expense/investment), sync
exposure data, recalculate current-month snapshots (provisional), and finalize
the previous month's snapshots. It is idempotent per day and tracked via a
`JobRun` record.

### 2. Behavior (all [Verified])

- **Endpoint:** `POST /api/internal/jobs/apply-pending-transactions`, Bearer
  `CRON_SECRET` authorized (AUT-004); 401 otherwise.
- **Idempotency (`jobRun.ts`):** `JobRun` is unique on `(job_name,
  madrid_date)`. A COMPLETED or RUNNING run for today → exit early (reports
  already-run); a FAILED run → reset and retry; a create race (unique
  constraint) is caught and treated as already-running. So the job runs at most
  once to completion per Madrid day.
- **Orchestration (`applyPendingTransactions.ts`):** upserts the current month,
  runs the recurrent processors, then the pending processors, then exposure
  sync, then `recalculateAllSnapshotsForMonth(current, isFinal:false)`, then
  `finalizeMonthSnapshots(previous)`. Aggregates processed/failed/skipped counts;
  marks the run COMPLETED or FAILED.
- **Per-item error isolation:** individual processor failures are counted and
  recorded without aborting the batch (per LED-009 / REC-003 behavior).

### 3. Interactions

- Drives **Ledger (B)**, **Recurrent (C)**, **Investments (F)**, **Portfolio
  Analytics (G, exposure sync)**, and **Monthly Model (D, finalization)**.
- **Auth (X-Auth):** endpoint uses the Bearer bypass (AUT-004).

### 4. Planned / Not Implemented

- **[Verified] Dedicated price-sync cron** (`assets-background-sync.md`) — not
  implemented (a TODO stub). Planned.
- **[Verified] Server cron automation** (external scheduler hitting the endpoint)
  — operational, not app code; Planned.

### 5. Edge Cases / Notes

- **[Verified] Robust idempotency** incl. the create-race path.
- **[Unverified] Partial-failure semantics:** a mid-run exception marks the whole
  JobRun FAILED (then retryable), but processors that already committed their
  own transactions are not rolled back — re-run relies on each processor's own
  idempotency (run-log / status-guarded claims).

### 6. Test Coverage

**[Verified] Partial.** `pendingInvestments` and `exposureSync` processors have
property/unit tests; the orchestrator, `jobRun` idempotency, and the non-
investment processors are untested.

### 7. Decisions (applied; code is source of truth)

- Documented the daily job as implemented. The dedicated price-sync cron and
  external cron automation stay **Planned** (not specified as current behavior).
  No OpenSpec change. No business-rule guesses required.


---

## Detailed Functional Analysis — Cross-cutting: Administration & Debug (`ADM`)

> **Status:** Evidence-based analysis traced from source. The exposure re-sync
> route has property tests; the rest is untested. Files: `app/admin/`
> (`actions.ts`, `jobs-panel.tsx`, `jobs-table.tsx`, `page.tsx`);
> `components/debug/DebugContext.tsx` (+ indicator); `app/api/admin/exposure-resync/route.ts`.

### 1. Functional Overview

Operational surface for running and inspecting the daily job, re-syncing
exposure data, and toggling a debug UI mode. It operates the domains rather than
owning financial rules.

### 2. Behavior (all [Verified])

- **Trigger daily job:** `runPendingJobAction` server action
  (`"use server"`) calls the same orchestrator as the cron endpoint
  (`applyPendingTransactionsForCurrentMadridMonth`) and returns processed/failed/
  skipped counts and `alreadyRun`. Used by the admin panel.
- **Job run history:** the admin page renders past `JobRun` records
  (`jobs-table.tsx`).
- **Debug mode:** `DebugContext` is a client-side toggle persisted in
  `localStorage` (`debugMode`); when on, tables render extra columns
  (e.g. ids, timestamps). Purely presentational.
- **Admin exposure re-sync:** `POST /api/admin/exposure-resync` overwrites an
  asset's exposure snapshot for a period (fetches fresh data from the provider).
  Has property tests. (Cross-listed with Portfolio Analytics; canonical ID here.)

### 3. Interactions

- **X-Jobs:** admin trigger invokes the same orchestrator as the cron endpoint
  (via a server action rather than the Bearer endpoint).
- **Portfolio Analytics (G):** exposure re-sync writes `AssetExposureSnapshot`.
- **All tables:** debug mode toggles extra columns across the app.

### 4. Edge Cases / Notes

- **[Verified] Admin trigger bypasses the Bearer check** — it runs as a server
  action behind the app's session auth (X-Auth), not the cron endpoint. Both
  reach the same idempotent orchestrator, so double-run is still guarded by the
  JobRun idempotency (JOB-003).
- **[Verified] Debug mode is per-browser** (localStorage), not a server setting;
  not shared across devices.

### 5. Test Coverage

**[Verified] Partial.** Exposure re-sync has tests; the job-trigger action, job
history view, and debug toggle are untested.

### 6. Decisions (applied; code is source of truth)

- Documented admin trigger, job history, debug mode, and exposure re-sync as
  implemented. Exposure re-sync's canonical ID is `ADM-004` (classified as an
  admin operation; referenced from Portfolio Analytics). No OpenSpec change. No
  business-rule guesses required.
