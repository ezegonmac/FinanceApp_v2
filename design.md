---
name: Precision Ledger

# ─────────────────────────────────────────────────────────────
# TOKEN REFERENCE
# Every token listed here maps 1:1 to a CSS variable in
# apps/web/app/globals.css — the single source of truth for
# actual hex values. This frontmatter exists as a human-readable
# index, not a generator.
# ─────────────────────────────────────────────────────────────

tokens:
  # Surfaces & backgrounds
  background:         { css: "--background",         hex: "#f7f9fb", use: "Page background"                   }
  foreground:         { css: "--foreground",         hex: "#191c1e", use: "Primary text"                      }
  card:               { css: "--card",               hex: "#ffffff", use: "Card / panel surface"              }
  card-foreground:    { css: "--card-foreground",    hex: "#191c1e", use: "Text on cards"                     }
  popover:            { css: "--popover",            hex: "#ffffff", use: "Dropdowns, tooltips"               }
  popover-foreground: { css: "--popover-foreground", hex: "#191c1e", use: "Text in popovers"                  }

  # Brand
  primary:            { css: "--primary",            hex: "#1e40af", use: "Primary actions, active states, brand" }
  primary-foreground: { css: "--primary-foreground", hex: "#ffffff", use: "Text on primary"                   }

  # Secondary
  secondary:            { css: "--secondary",            hex: "#565e74", use: "Secondary buttons, neutral badges" }
  secondary-foreground: { css: "--secondary-foreground", hex: "#ffffff", use: "Text on secondary"             }

  # Muted
  muted:            { css: "--muted",            hex: "#e6e8ea", use: "Subtle backgrounds, disabled states, zebra rows" }
  muted-foreground: { css: "--muted-foreground", hex: "#444653", use: "Subdued text, placeholders, column headers"      }

  # Accent — hover / focus surfaces (NOT financial green)
  accent:            { css: "--accent",            hex: "#dae2fd", use: "Nav hover, dropdown focus, active link tint" }
  accent-foreground: { css: "--accent-foreground", hex: "#1e3a8a", use: "Text on accent background"          }

  # Destructive
  destructive:            { css: "--destructive",            hex: "#ba1a1a", use: "Error states, delete actions" }
  destructive-foreground: { css: "--destructive-foreground", hex: "#ffffff", use: "Text on destructive"        }

  # Borders & inputs
  border: { css: "--border", hex: "#e2e8f0", use: "Hairline dividers, table rows, card borders, input borders" }
  input:  { css: "--input",  hex: "#e2e8f0", use: "Input field border at rest"                                 }
  ring:   { css: "--ring",   hex: "#93a5d6", use: "Keyboard focus ring"                                        }

  # Semantic financial — solid (for text, solid badges, chart anchors)
  positive:                   { css: "--positive",                   hex: "#10b981", use: "Income, growth, completed status"  }
  positive-foreground:        { css: "--positive-foreground",        hex: "#ffffff", use: "Text on positive"                  }
  negative:                   { css: "--negative",                   hex: "#ef4444", use: "Expenses, loss, failed status"     }
  negative-foreground:        { css: "--negative-foreground",        hex: "#ffffff", use: "Text on negative"                  }

  # Semantic financial — subtle (for badge / chip backgrounds)
  positive-subtle:            { css: "--positive-subtle",            hex: "#d1fae5", use: "Positive badge background"         }
  positive-subtle-foreground: { css: "--positive-subtle-foreground", hex: "#065f46", use: "Text on positive-subtle"           }
  negative-subtle:            { css: "--negative-subtle",            hex: "#fee2e2", use: "Negative badge background"         }
  negative-subtle-foreground: { css: "--negative-subtle-foreground", hex: "#991b1b", use: "Text on negative-subtle"           }

  # Chart — green scale (income / growth, light → dark)
  chart-1: { css: "--chart-1", hex: "#d1fae5" }
  chart-2: { css: "--chart-2", hex: "#86efac" }
  chart-3: { css: "--chart-3", hex: "#10b981" }
  chart-4: { css: "--chart-4", hex: "#059669" }
  chart-5: { css: "--chart-5", hex: "#065f46" }

  # Chart — red scale (expenses / loss, light → dark)
  chart-6:  { css: "--chart-6",  hex: "#fee2e2" }
  chart-7:  { css: "--chart-7",  hex: "#fca5a5" }
  chart-8:  { css: "--chart-8",  hex: "#ef4444" }
  chart-9:  { css: "--chart-9",  hex: "#dc2626" }
  chart-10: { css: "--chart-10", hex: "#991b1b" }

typography:
  page-title:  { fontFamily: Inter, fontSize: 24px, fontWeight: 700, lineHeight: 30px, letterSpacing: -0.02em }                                  # page <h1>
  metric:      { fontFamily: Inter, fontSize: 30px, fontWeight: 600, lineHeight: 1, fontVariantNumeric: tabular-nums }                           # primary KPI value
  headline-lg: { fontFamily: Inter, fontSize: 24px, fontWeight: 600, lineHeight: 32px, letterSpacing: -0.02em }                                  # section group titles
  headline-md: { fontFamily: Inter, fontSize: 18px, fontWeight: 600, lineHeight: 24px, letterSpacing: -0.01em }
  headline-sm: { fontFamily: Inter, fontSize: 14px, fontWeight: 600, lineHeight: 20px }
  body-lg:     { fontFamily: Inter, fontSize: 14px, fontWeight: 400, lineHeight: 20px }
  body-md:     { fontFamily: Inter, fontSize: 13px, fontWeight: 400, lineHeight: 18px }
  body-sm:     { fontFamily: Inter, fontSize: 12px, fontWeight: 400, lineHeight: 16px }
  label-lg:    { fontFamily: Inter, fontSize: 12px, fontWeight: 600, lineHeight: 16px, letterSpacing: 0.05em, textTransform: uppercase }         # KPI / section labels
  label-md:    { fontFamily: Inter, fontSize: 11px, fontWeight: 600, lineHeight: 14px, letterSpacing: 0.05em, textTransform: uppercase }         # column headers, badges
  caption-xs:  { fontFamily: Inter, fontSize: 10px, fontWeight: 400, lineHeight: 14px }                                                          # micro annotations
  mono-data:   { fontFamily: JetBrains Mono, fontSize: 13px, fontWeight: 500, lineHeight: 18px }

radius:
  sm:      0.125rem  # 2px  — status badges, chips
  DEFAULT: 0.25rem   # 4px  — buttons, inputs (--radius base)
  lg:      0.5rem    # 8px  — cards, containers
  xl:      1rem      # 16px — modals, large overlays
  full:    9999px    # pill shapes

spacing:
  unit:             4px   # baseline grid unit
  container-margin: 32px  # page-level horizontal margin
  gutter:           16px  # column gutter (desktop)
  card-padding:     20px  # internal card padding
  stack-sm:         8px   # tight vertical gap
  stack-md:         12px  # standard vertical gap
  stack-lg:         24px  # section vertical gap
  header-margin:    28px  # page header → first content section
---

## Brand & Style

Precision Ledger's personality is authoritative, transparent, and rigorous — built for users who prioritize data density and clarity over decorative elements. The emotional tone is control, reliability, and precision.

The design style is **Modern Functional** — clean surfaces, restrained geometry (8px max radius), and subtle borders. The interface feels premium through organization, not decoration.

### Visual Hierarchy Principles

Hierarchy is established through:

1. **Typography** — size, weight, and case create clear levels (page title → section label → body → caption)
2. **Positioning** — primary KPI right-aligned in the header, supporting metrics below, detail tables last
3. **Spacing** — 24px section gaps separate content groups without needing visual containers
4. **Alignment** — consistent left edge for labels, right-aligned numerics, grid-based card layouts

Hierarchy is **not** established through:
- Large shadows
- Large radii
- Bright colors on containers
- Nested boxes or excessive framing

The interface should feel premium through organization.

### Design Guardrails

**Preserve data density.** Do not redesign toward consumer fintech. This is a financial workspace. Always keep:
- Tables as the primary data surface
- Compact row heights (32–40px)
- Tabular numbers (`font-mono tabular-nums`) for all financial figures
- Visible borders between rows and around containers
- High information density per screen

**Preserve existing design foundations.** The refresh improves hierarchy and polish — it does not change brand identity. Do not modify:
- Color palette (primary blue, semantic green/red, neutral grays)
- Inter typography system
- JetBrains Mono for financial data
- Financial semantic token pairs (positive/negative)
- Table architecture (DataTable + ListTable)
- Button variants and sizing
- Status badge/chip system

## Colors

The palette anchors on a Global Banking blue (`#1e40af`) for institutional stability.

- **Primary (`#1e40af`)** — primary actions, active states, brand indicators
- **Background (`#f7f9fb`)** — page surface; paper-like, low eye strain
- **Border (`#e2e8f0`)** — hairline dividers throughout; defines the grid without weight
- **Accent (`#dae2fd`)** — soft blue tint used for hover and focus surfaces (nav items, dropdown rows). Not a financial color.
- **Muted (`#e6e8ea`)** — subtle backgrounds, disabled states, table zebra rows
- **Positive (`#10b981`)** — strictly for income, growth, and completed/cleared states
- **Negative (`#ef4444`)** — strictly for expenses, loss, and failed/error states
- **Destructive (`#ba1a1a`)** — UI error states and destructive actions (delete, remove)

> Positive/Negative are **financial semantics**. Destructive is a **UI action semantic**. Do not mix them.

### Financial Color Usage

| Context              | Token                    | Example                         |
|----------------------|--------------------------|---------------------------------|
| Positive amount text | `text-positive`          | `+€1,200`                       |
| Positive badge bg    | `bg-positive-subtle`     | "Completed" / "Income" chips    |
| Positive badge text  | `text-positive-subtle-foreground` | Text inside above chip |
| Negative amount text | `text-negative`          | `-€340`                         |
| Negative badge bg    | `bg-negative-subtle`     | "Failed" / "Expense" chips      |
| Negative badge text  | `text-negative-subtle-foreground` | Text inside above chip |
| Charts (income)      | `chart-1` → `chart-5`   | Green scale, light → dark       |
| Charts (expenses)    | `chart-6` → `chart-10`  | Red scale, light → dark         |

## Typography

**Inter** is used for all UI text — exceptional legibility at small sizes in data-dense layouts. The scale is intentionally compact to maximize visible information per screen.

**JetBrains Mono** (`mono-data`) is used for financial figures **inside tables** — tabular numerals ensure decimal alignment. Display-scale KPI values use Inter with `tabular-nums` (the `metric` style), not mono.

| Token        | Size  | Weight | Usage                                        |
|--------------|-------|--------|----------------------------------------------|
| `page-title` | 24px  | 700    | Page `<h1>` — anchors the header             |
| `metric`     | 30px  | 600    | Primary KPI value (Inter + `tabular-nums`)   |
| `headline-lg`| 24px  | 600    | Section group titles                         |
| `headline-md`| 18px  | 600    | Section / card group headers                 |
| `headline-sm`| 14px  | 600    | Card headers, table section titles           |
| `body-lg`    | 14px  | 400    | Primary body text                            |
| `body-md`    | 13px  | 400    | Secondary body text, form labels             |
| `body-sm`    | 12px  | 400    | Captions, helper text                        |
| `label-lg`   | 12px  | 600    | KPI / section labels (ALL CAPS)              |
| `label-md`   | 11px  | 600    | Column headers, badge text (ALL CAPS)        |
| `caption-xs` | 10px  | 400    | Micro annotations (e.g. KPI delta context)   |
| `mono-data`  | 13px  | 500    | Financial amounts, IDs, numeric table cells  |

> `headline-sm` and `body-lg` share 14px but differ in weight — use `headline-sm` only for titles/labels, never for body copy.

> `page-title` (24px/700) and `headline-lg` (24px/600) share a size but differ in weight — page `<h1>` is bold, section group titles are semibold.

> **Uppercase labels** (`label-lg`, `label-md`) are rendered at reduced emphasis via `text-muted-foreground` — and `text-muted-foreground/70` when they should recede further (e.g. the HeaderKPI label).

> **Implementation:** `metric` and `page-title` map to Tailwind defaults (`text-3xl`, `text-2xl`). The sub-`text-xs` steps (`label-md` 11px, `caption-xs` 10px) use arbitrary values (`text-[11px]`, `text-[10px]`); `label-lg` (12px) uses `text-xs`. (Custom `@theme` text utilities were not used — they don't reliably generate under `@theme inline`.)

## Layout & Spacing

The layout uses a **Fixed-Fluid Hybrid** grid. Content is constrained to `max-width: 1440px`, centered with `32px` margins.

A strict **4px baseline grid** governs all vertical rhythm:

- **Desktop:** 12-column grid, 16px gutters. Cards use 20px internal padding. Sections separated by 24px gaps.
- **Mobile:** Single column, 16px horizontal padding.
- **Data tables:** Row heights fixed at 32px (compact) or 40px (default) to maximize row count without sacrificing touch targets.

The goal is improved hierarchy, not empty space — breathing room makes content groups distinct without wasting screen real estate.

### Padding Rhythm — horizontal ≥ vertical

For compact, text-bearing components — buttons, badges/chips, inputs, KPI cards — **horizontal padding is larger than vertical, typically ~2:1** (1.5:1 at minimum). Line-height already gives text vertical presence, so the vertical axis feels filled at smaller padding; the horizontal axis needs explicit room or text feels cramped against the edges.

| Component   | Padding (V × H) | Ratio |
|-------------|-----------------|-------|
| Button      | `8px × 12px`    | 1.5:1 |
| Delta badge | `4px × 8px`     | 2:1   |
| KPI card    | `16px × 48px` (`py-4 px-12`) | 3:1 |

This is a heuristic for **component interiors**, not page layout. The ratio scales with how much horizontal room the component can afford — tighter elements (buttons) sit near 1.5:1, while roomy display cards can go up to ~3:1. Page-level margins, section gaps, and grid gutters follow the 4px baseline grid (see spacing tokens), where horizontal and vertical can be equal. Full-bleed containers may use symmetric padding.

### Section Framing

Reduce visual containers. Use whitespace to separate content groups before introducing another box.

**Preferred structure:**
```
Page Title + KPI
KPI Cards (grid)
Table
```

**Avoid nested framing:**
```
Page
└ Section (card)
  └ Section (card)
    └ Table
```

A component that already renders its own bordered container (e.g. `ListTable`) should **not** be wrapped in an additional card. Let the component's own border define the boundary.

### Redundant Titles

Every title must introduce a new concept. If the page is already called "Accounts", don't add "Accounts list" as a sub-heading — that's the same concept restated.

**Remove titles that:**
- Repeat the page name in different words
- Label something already obvious from context (e.g. "Quick Insights" above a row of KPI cards)
- Add a subtitle that describes what you can already see

**Keep titles that:**
- Introduce a genuinely new section with different content type
- Are needed for accessibility landmarks
- Disambiguate when multiple distinct data sets share a page

### Dashboard Page Pattern

All top-level pages follow a consistent three-part structure:

```
Header
├── Title
├── Description
└── HeaderKPI (right-aligned)

Metrics Row
├── KpiCard
├── KpiCard
├── KpiCard
└── KpiCard

Primary Content
└── Table (or other main data view)
```

- Container: a single `<section className="space-y-6">` — no wrapper component needed
- Header: `<header className="mb-7 flex items-end justify-between gap-4">` — `header-margin` (28px) bottom separation
- Title: `page-title` type (24px / 700 / `tracking-tight`)
- Description: `mt-1` (4px) below title, `body-lg` in `text-muted-foreground`
- HeaderKPI: `self-end` — bottom-aligned with the title baseline area, feels attached to the header
- Metrics row and table are direct children, separated by whitespace (24px gap)
- No additional framing or nesting between these three layers

## Elevation & Depth

Depth is expressed through **tonal layers** and **subtle outlines**. Shadows are optional and always micro-scale.

| Level | Surface                | Treatment                                                              |
|-------|------------------------|------------------------------------------------------------------------|
| 0     | Page background        | `#f7f9fb`                                                              |
| 1     | Cards / panels         | `#ffffff` + 1px `--border` + optional `0 1px 2px rgba(15,23,42,0.03)` |
| 2     | Dropdowns / modals     | `#ffffff` + 1px `--border` + `0 4px 12px rgba(15,23,42,0.08)` shadow  |
| —     | Dividers               | 1px `#e2e8f0` hairline stroke — used in tables and lists              |

## Shapes

Base radius is **4px (0.25rem)**. The scale:

| Token      | Value   | Applied to                      |
|------------|---------|---------------------------------|
| `sm`       | 2px     | Status badges, chips            |
| `DEFAULT`  | 4px     | Buttons, inputs, form elements  |
| `lg`       | 8px     | Cards, containers, panels       |
| `xl`       | 16px    | Modals, large overlays          |
| `full`     | 9999px  | Pill shapes                     |

## Components

### Navigation Bar

Sticky top navigation bar — the only global chrome element.

- **Height:** `56px` (`h-14`)
- **Background:** `--card` (`#ffffff`)
- **Border:** 1px bottom `--border`
- **Padding:** `0 32px` (matches container margin)
- **Position:** `sticky top-0 z-40`

**Nav links — text only, differentiated by weight:**
- Text only, no icons. `text-sm`, `px-5` horizontal padding, link height matches the bar (`h-14`)
- **Active:** `font-semibold text-foreground` with a primary underline. The underline is a child element scoped to the label text (a full-height inner span with an `absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-primary` line), so it spans **only the word width** and sits at the bar's bottom edge — not the full padded link width.
- **Inactive:** `font-normal text-muted-foreground`, hover → `text-foreground` plus a faint underline (`bg-muted-foreground/30`, `opacity-0 group-hover:opacity-100`) that fades in to hint at the active state — subtle, never competing with the active primary line.
- Hierarchy comes from **weight + color contrast** (active is bold and full-contrast; inactive is normal weight and muted), not from icons or background fills

**Nav badge (e.g. Todos count):** neutral, not colored — `bg-muted text-muted-foreground ring-1 ring-border`, `rounded-full`, `text-[10px] font-semibold`. A count indicator is informational, not an alert, so it stays in the neutral palette.

### Buttons

| Variant     | Background     | Text           | Border         |
|-------------|----------------|----------------|----------------|
| Primary     | `--primary`    | `--primary-fg` | —              |
| Secondary   | `--secondary`  | `--secondary-fg`| —             |
| Outline     | `--background` | `--foreground` | `--border`     |
| Ghost       | transparent    | `--foreground` | —              |
| Destructive | `--destructive`| `--destructive-fg` | —          |

- Padding: `8px 12px` (compact). Use `size="sm"` for table actions.
- Disabled: `opacity-50`, `pointer-events-none`.

### Data Tables

The primary UI surface for financial data.

- Header cells: `label-md` style (`11px`, `600`, `uppercase`, `tracking-wide`, `text-muted-foreground`)
- Row height: 40px default, 32px compact
- Zebra striping: alternate rows use `bg-muted/30` (`#e6e8ea` at 30% opacity)
- Amounts: `mono-data` font, right-aligned
- Border: `--border` between rows; outer container has `rounded-lg border`

### Status Badges / Chips

Use `bg-*-subtle` + `text-*-subtle-foreground` pairs for filled chips. Use `variant="secondary"` for neutral states.

| Status      | Background           | Text                          |
|-------------|----------------------|-------------------------------|
| Completed   | `positive-subtle`    | `positive-subtle-foreground`  |
| Failed      | `negative-subtle`    | `negative-subtle-foreground`  |
| Pending     | `muted`              | `muted-foreground`            |
| Cancelled   | `muted`              | `muted-foreground`            |
| Active      | `accent`             | `accent-foreground`           |
| Manual      | `secondary`          | `secondary-foreground`        |
| Overdue     | —                    | `destructive` (text only)     |

Shape: `radius-sm` (2px) for a sharp, technical look.

### Trend / Delta Badge

A lightweight pill that annotates a metric with its direction of change (used in `HeaderKPI`). Distinct from status chips: it is **quiet** — muted fill, near-invisible border, small chevron.

- Shape: `rounded-full` (pill)
- Border: 1px, semantic color at **10% opacity** (`/10`) — just enough to define the edge
- Fill: semantic subtle at **60% opacity** (`/60`) — softer than a solid status chip
- Text: semantic subtle-foreground, `label-md` (11px / 600), `leading-none`
- Padding: `px-2 py-1` (8px / 4px — 2:1 horizontal:vertical)
- Glyph: Lucide `ChevronUp` / `ChevronDown` at `size-3`, `strokeWidth={2.5}`, `gap-0.5` from value

| Direction | Border           | Fill                   | Text                          |
|-----------|------------------|------------------------|-------------------------------|
| Up        | `positive/10`    | `positive-subtle/60`   | `positive-subtle-foreground`  |
| Down      | `negative/10`    | `negative-subtle/60`   | `negative-subtle-foreground`  |
| Neutral   | `border/50`      | `muted/60`             | `muted-foreground`            |

### Opacity De-emphasis Convention

When an element needs to recede without changing its color token, apply an opacity modifier rather than picking a new color:

- `/70` — de-emphasized labels (e.g. HeaderKPI label keeps `font-semibold` weight but softens via `text-muted-foreground/70`)
- `/60` — subtle badge fills
- `/50` — neutral hairline borders
- `/10` — semantic accent borders (barely-there edge)

### Input Fields

- Border: 1px `--input` at rest
- Focus: border color → `--primary`, focus ring → `--ring` at 50% opacity
- Disabled: `bg-muted`, `opacity-50`
- Error: border color → `--destructive`

### Cards

Every card is an "Information Module":

- Background: `--card` (`#ffffff`)
- Border: 1px `--border` (standard, full opacity), `radius-lg` (8px)
- Shadow: optional `0 1px 2px rgba(15,23,42,0.03)` — only when extra lift helps hierarchy
- Header: bottom border (`--border`), `headline-sm` title, `20px` padding
- Body: `20px` padding, `stack-md` (12px) vertical gap between rows

Do not exceed `radius: 8px`. Avoid fintech-style oversized radii.

### List Tables

`ListTable` is used for entity browsing/listing pages (accounts, etc.) where comfortable row density and row-level navigation matter. It wraps TanStack Table and shares the same base structure as `DataTable` but with different row sizing.

**Differences from `DataTable` (compact, used for financial data within a month/detail view):**

| Aspect | `DataTable` | `ListTable` |
|---|---|---|
| Row height | 32px compact / 40px default | 40px default (`[&>td]:py-2.5`) |
| Row navigation | — | Optional `getRowHref` — entire row is a nav target |
| Hover state | `hover:bg-muted/50` (table default) | `hover:bg-accent/40` on clickable rows |
| Action columns | — | `meta: { isAction: true }` stops propagation |
| Pagination | Always rendered if enabled | Only rendered when `totalRows > pageSize` |

**Usage rules:**
- Use `ListTable` for top-level entity lists (e.g. `/accounts`).
- Use `DataTable` for financial line-item tables inside month/account detail views.
- Clickable rows use `cursor-pointer hover:bg-accent/40 transition-colors` — no other hover override.
- Action-column cells (dropdowns, buttons) must set `meta: { isAction: true }` to prevent row-click navigation from firing.
- Numeric/financial columns must set `meta: { numeric: true }` — the table applies `font-mono tabular-nums` to both header and body cells for digit alignment. Unlike `DataTable`, `ListTable` does **not** force `text-right` on numeric columns; alignment follows the column definition.
- Container: `rounded-lg border bg-card` — same as all card surfaces (no shadow at Level 1).
- Pagination bar (when shown): `border-t px-3 py-2`, page label in `text-xs text-muted-foreground`.

### Account Icons / Avatars

Small square containers that display an account's custom icon image or a fallback glyph.

- Shape: `rounded-md` (6px) — softer than cards but not fully rounded; differentiates from card containers.
- Sizes: `sm` (24px), `md` (32px), `lg` (40px) — all multiples of 8, aligned to the 4px grid.
- Fallback: `bg-muted` surface with a `text-muted-foreground` icon centered.
- Image: `object-contain` to preserve aspect ratio within the square.

### HeaderKPI

The primary KPI displayed in the page header. It feels like part of the page structure — not a card, not a container. Just the number. The amount dominates; the delta is a quiet annotation.

- **Container:** none — transparent background, no border, no shadow
- **Min width:** `220px` — gives the value and badge room to breathe, prevents compression
- **Position:** right side of the page header (use `self-end`)
- **Alignment:** left (`text-left`) — label, value, and context share a common left edge as a grouped block

**Label:**
- Type: `label-lg` (12px / 600 / uppercase)
- Color: `text-muted-foreground/70` — muted opacity so the semibold weight doesn't draw too much attention (see *Opacity De-emphasis Convention*)
- Position: top (above the value row)

**Value + Delta (inline row, `items-end justify-start gap-3`):**
- Value: `metric` type (30px / 600 / `leading-none` / `tabular-nums`, Inter) / `text-foreground`
- Badge + context are stacked in a column to the right of the value
- The column uses `self-center` so the badge aligns with the **vertical center** of the amount
- Value → Badge gap: `12px` (`gap-3` / `stack-md`)

**Delta badge:** see *Trend / Delta Badge* under Components — the quiet pill with semantic `/10` border + `/60` fill and a Lucide chevron.

**Context text (belongs to the badge):**
- Type: `caption-xs` (10px) / `text-muted-foreground`
- `ml-0.5 mt-0.5` — nudged just beneath the badge

**Structure:**
```
TOTAL BALANCE
€16,821.50   ↑ 2.3%
             vs last month
```

The composition reads as a single grouped element — the amount dominates while the delta acts as a quiet annotation.

**Implementation notes:**
- Every node carries a `data-slot` attribute (`header-kpi`, `kpi-label`, `kpi-value-row`, `kpi-value`, `kpi-delta`, `kpi-delta-badge`, `kpi-delta-context`) for identification.
- Direction-specific styles live in lookup maps (`DELTA_BADGE_STYLES`, `DELTA_ICON`) rather than inline conditionals.
- The badge + context render as a separate `DeltaBadge` sub-component.

**Usage rules:**
- One `HeaderKPI` per page maximum.
- Lives inside the page `<header>` element alongside the `<h1>` and description.
- Use `self-end` so the KPI bottom-aligns with the header content and feels attached, not floating.
- No wrapping card — the KPI is part of the page chrome, not content.
- If no delta data is available, render without the chip.

### KpiCard

Compact metric cards for secondary KPIs. **The metric is the product — everything else supports it.** The card should read like a financial summary, not a dashboard widget.

**Attention budget:** Value ~70% · Label ~20% · Context ~8% · Icon ~2%.

**Layout — left-aligned content, watermark icon top-right:**
```
Label                    ◹ (watermark)
Value
Context
```

- **Padding:** `16px × 48px` (`py-4 px-12`) — horizontal 3× vertical, see *Padding Rhythm*. Content top-aligned (never vertically centered)
- **Label:** `text-sm` (14px) / `font-medium` / `text-muted-foreground` — always above the value
- **Value:** `text-2xl` (24px) / `font-semibold` / `tabular-nums` / `text-foreground` — highest contrast, the focal point. Generous breathing room (`mt-2` above, `mt-1` below)
- **Context:** `text-xs` (12px) / `text-muted-foreground/70` — one line, kept concise. Softer than the label so it recedes as the lowest tier of the card.
- **Watermark icon:** Lucide icon, `absolute` in the top-right, aligned to the card padding (`right-12 top-4`), `size-8` (32px), `strokeWidth={1.5}`, `pointer-events-none`. Dim it with **element opacity** (`text-foreground opacity-[0.07]`), *not* a semi-transparent stroke color. Stroke alpha (`text-foreground/[0.08]`) compounds where strokes overlap — joints and crossings render darker, looking like a rendering glitch. Element opacity composites the whole icon once, keeping it uniform. Decorative texture only — never a colored chip, never affects layout.

> The value (24px) stays below the HeaderKPI value (30px) so the page hero remains primary, while still dominating its own card.

**Grouping — fused stripe:** related KPI cards are visually fused into a single bordered stripe rather than separate floating cards. One container owns the border/background; individual cards drop their own border and are divided by subtle internal separators.
- Container: `rounded-lg border bg-card`, `grid-cols-1` → `md:grid-cols-4`
- **Single separator system:** separators are drawn with `border-image` (a gradient that's transparent at the ends, solid in the middle) applied to `.kpi-stripe > * + *` — horizontal top border when stacked, vertical left border in the row. The `> * + *` selector means every card except the first gets one.
- **Why border-image, not a pseudo-element line:** only real borders snap to whole device pixels. A 1px/2px pseudo-element or background at a fractional column boundary anti-aliases and renders unevenly (one separator looks thicker than the rest). A border-image is a true border — it snaps crisply and renders identically on every column — while the gradient fades the ends to keep the inset look.
- Inset: 1rem at the ends on mobile (horizontal), 2rem on desktop (vertical). Color: muted `--border`.
- **Do not** use `divide-x`/`divide-y` or absolutely-positioned pseudo-lines for these separators — they don't snap and produce uneven/doubled lines.
- Each card: padding only (`py-4 px-12`), no border/radius/background of its own.

**Unit normalization:** the unit/period lives in the **label**, never repeated in the value. The label tells you the context; the value is a clean number.
- ✅ `Daily Expenses` → `38,58 €`
- ❌ `Expenses` → `38,58 € / day`

This gives every card an identical `Label / Value / Context` rhythm — the dashboard reads as more intentional and polished.

**Anti-patterns — do not:**
- Place the icon before the label, or use a colored icon background
- Center content vertically
- Make the icon larger than the value, or give it equal visual weight to the metric

### Selectable Table Rows

When a table row acts as a toggle-selection target (e.g. selecting a position to show its detail panel below the table), apply the following pattern:

- **Cursor:** `cursor-pointer` on all rows
- **Selected row:** `bg-primary/10 hover:bg-primary/15` — a soft primary tint that clearly distinguishes the active selection without overwhelming the table
- **Unselected rows:** standard zebra striping (`bg-muted/30` on odd rows) with `hover:bg-muted/50` / `hover:bg-muted/30`
- **Transition:** `transition-colors` for smooth feedback
- **Click behavior:** clicking the selected row deselects it (toggle)

This pattern differs from `ListTable`'s `hover:bg-accent/40` navigation rows — selectable rows communicate *state* (which item is active), while navigation rows communicate *destination* (click to go somewhere).

### Investment Type Badges

Investment operations (BUY / SELL) use directional type badges to distinguish cash-flow direction at a glance. These are **not** status badges — they indicate the transaction type, not its lifecycle state.

| Type | Variant | Appearance |
|------|---------|------------|
| BUY  | `info`  | Blue background (`blue-100` / `blue-800`) — neutral action, cash out |
| SELL | `warning` | Amber background (`amber-100` / `amber-800`) — notable action, cash in |

Usage: `<Badge variant="info">BUY</Badge>`, `<Badge variant="warning">SELL</Badge>`

These complement the status badges (Completed → `success`, Pending/Cancelled → `secondary`) on the same row without visual conflict.

### KPI Sparklines

Minimalist line charts embedded in cards. No axes, no labels — trend only.

- Positive trend: `--positive` (`#10b981`)
- Negative trend: `--negative` (`#ef4444`)
- Neutral / primary trend: `--primary` (`#1e40af`)
- Height: 40–48px. Width fills the card body.

### Comparison Color Palette

A fixed palette of 5 visually distinct hues for multi-asset comparison charts and their associated UI elements (selected chips, watchlist toggle buttons). These are **not** semantic tokens — they are categorical identifiers that distinguish one data series from another.

```typescript
const COMPARISON_COLORS = [
  "#2563eb", // blue
  "#dc2626", // red
  "#16a34a", // green
  "#9333ea", // purple
  "#ea580c", // orange
];
```

| Index | Hex       | Hue    |
|-------|-----------|--------|
| 0     | `#2563eb` | Blue   |
| 1     | `#dc2626` | Red    |
| 2     | `#16a34a` | Green  |
| 3     | `#9333ea` | Purple |
| 4     | `#ea580c` | Orange |

**Usage rules:**
- Colors are assigned by selection order (first selected → index 0, etc.)
- The same index must produce the same color across all surfaces: chart lines, legend, selected chips, and watchlist buttons
- Text on these backgrounds uses `text-white`; de-emphasized text uses `text-white/70`
- These colors exist outside the CSS variable system — they are applied via inline `style` since the index is dynamic
- The canonical export lives in `compareAssets.ts`; components that need the palette should import from there rather than redeclaring

**Chip shape:** `rounded-full` (pill) for selected asset chips — these are removable selection indicators, not status badges (which use `rounded-sm`).
