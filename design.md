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
  headline-lg: { fontFamily: Inter, fontSize: 24px, fontWeight: 600, lineHeight: 32px, letterSpacing: -0.02em }
  headline-md: { fontFamily: Inter, fontSize: 18px, fontWeight: 600, lineHeight: 24px, letterSpacing: -0.01em }
  headline-sm: { fontFamily: Inter, fontSize: 14px, fontWeight: 600, lineHeight: 20px }
  body-lg:     { fontFamily: Inter, fontSize: 14px, fontWeight: 400, lineHeight: 20px }
  body-md:     { fontFamily: Inter, fontSize: 13px, fontWeight: 400, lineHeight: 18px }
  body-sm:     { fontFamily: Inter, fontSize: 12px, fontWeight: 400, lineHeight: 16px }
  label-md:    { fontFamily: Inter, fontSize: 11px, fontWeight: 600, lineHeight: 14px, letterSpacing: 0.05em, textTransform: uppercase }
  mono-data:   { fontFamily: JetBrains Mono, fontSize: 13px, fontWeight: 500, lineHeight: 18px }

radius:
  sm:      0.0625rem # 1px  — status badges, chips
  DEFAULT: 0.125rem  # 2px  — buttons, inputs (--radius base)
  lg:      0.25rem   # 4px  — cards, containers
  xl:      0.5rem    # 8px  — modals, large overlays
  full:    9999px    # pill shapes

spacing:
  unit:             4px   # baseline grid unit
  container-margin: 24px  # page-level horizontal margin
  gutter:           16px  # column gutter (desktop)
  card-padding:     16px  # internal card padding
  stack-sm:         8px   # tight vertical gap
  stack-md:         12px  # standard vertical gap
  stack-lg:         20px  # section vertical gap
---

## Brand & Style

Precision Ledger's personality is authoritative, transparent, and rigorous — built for users who prioritize data density and clarity over decorative elements. The emotional tone is control, reliability, and precision.

The design style is **Corporate / Modern** with a lean toward **Functional Minimalism**. Depth is communicated through tonal layers and crisp borders, not shadows. The aesthetic is "Spreadsheet-Plus": the efficiency of a financial tool with the polish of a premium dashboard.

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

**JetBrains Mono** (`mono-data`) is used exclusively for financial figures in tables and KPI values — tabular numerals ensure decimal alignment.

| Token        | Size  | Weight | Usage                                    |
|--------------|-------|--------|------------------------------------------|
| `headline-lg`| 24px  | 600    | Page titles                              |
| `headline-md`| 18px  | 600    | Section / card group headers             |
| `headline-sm`| 14px  | 600    | Card headers, table section titles       |
| `body-lg`    | 14px  | 400    | Primary body text                        |
| `body-md`    | 13px  | 400    | Secondary body text, form labels         |
| `body-sm`    | 12px  | 400    | Captions, helper text                    |
| `label-md`   | 11px  | 600    | Column headers, ALL CAPS labels          |
| `mono-data`  | 13px  | 500    | Financial amounts, IDs, numeric columns  |

> `headline-sm` and `body-lg` share 14px but differ in weight — use `headline-sm` only for titles/labels, never for body copy.

## Layout & Spacing

The layout uses a **Fixed-Fluid Hybrid** grid. Content is constrained to `max-width: 1440px`, centered with `24px` margins.

A strict **4px baseline grid** governs all vertical rhythm:

- **Desktop:** 12-column grid, 16px gutters. Cards use 16px internal padding.
- **Mobile:** Single column, 12px horizontal padding.
- **Data tables:** Row heights fixed at 32px (compact) or 40px (default) to maximize row count without sacrificing touch targets.

## Elevation & Depth

Depth is expressed through **tonal layers** and **low-contrast outlines** — never heavy shadows.

| Level | Surface                | Treatment                                                              |
|-------|------------------------|------------------------------------------------------------------------|
| 0     | Page background        | `#f7f9fb`                                                              |
| 1     | Cards / panels         | `#ffffff` + 1px `#e2e8f0` border. No shadow.                          |
| 2     | Dropdowns / modals     | `#ffffff` + 1px `#e2e8f0` border + `0 4px 12px rgba(15,23,42,0.08)` shadow |
| —     | Dividers               | 1px `#e2e8f0` hairline stroke — used extensively in tables and lists  |

## Shapes

Base radius is **2px (0.125rem)**. The scale:

| Token      | Value   | Applied to                      |
|------------|---------|---------------------------------|
| `sm`       | 1px     | Status badges, chips            |
| `DEFAULT`  | 2px     | Buttons, inputs, form elements  |
| `lg`       | 4px     | Cards, containers, panels       |
| `xl`       | 8px     | Modals, large overlays          |
| `full`     | 9999px  | Pill shapes                     |

## Components

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

### Input Fields

- Border: 1px `--input` at rest
- Focus: border color → `--primary`, focus ring → `--ring` at 50% opacity
- Disabled: `bg-muted`, `opacity-50`
- Error: border color → `--destructive`

### Cards

Every card is an "Information Module":

- Background: `--card` (`#ffffff`)
- Border: 1px `--border`, `radius-lg` (4px)
- Header: bottom border (`--border`), `headline-sm` title, `16px` padding
- Body: `16px` padding, `stack-md` (12px) vertical gap between rows

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

### HeroMetric

The dominant visual element on any page that needs a single KPI anchor. Replaces scattered equal-weight metrics with a clear hierarchy: one number rules the page. Renders as a `<header>` landmark containing the page title.

- **Element:** `<header>` — semantic landmark; contains the page `<h1>`
- **Height:** content-driven, no fixed height
- **Background:** `--card` (`#ffffff`)
- **Border:** none — the hero earns its elevation from shadow alone
- **Radius:** `xl` (8px / `rounded-xl`)
- **Shadow:** Level 2 — `0 2px 8px rgba(15,23,42,0.04)` (very subtle, just enough to lift)
- **Padding:** `24px` horizontal, `20px` vertical

**Layout:**
- Two-column flex row (`flex items-center justify-between gap-6`)
- Left column: title + optional description
- Right column: label, value, delta chip (right-aligned)

**Title (required):**
- Rendered as `<h1>` — the page heading lives inside the hero
- `text-lg` / `font-semibold` / `tracking-tight`
- Color: `text-foreground`

**Description (optional):**
- Rendered below the title when provided
- `text-sm` / `text-muted-foreground`
- Margin: `mt-0.5` below the title

**Label:**
- `text-[11px]` / `font-semibold` / `uppercase` / `tracking-wide`
- Color: `text-muted-foreground`

**Value:**
- `text-3xl` (30px) / `font-weight: 700` / `tabular-nums`
- Color: `text-foreground`
- Uses system font stack (Inter) at this size for visual weight; no mono needed at display scale

**Delta chip:**
- Inline-flex row below the value (`mt-1.5`), right-aligned (`justify-end`)
- Chip: `rounded-sm px-1.5 py-0.5 text-[11px] font-medium`
- Directional arrow prefix: `↑` / `↓`
- Semantic background:
  - Up → `bg-positive-subtle text-positive-subtle-foreground`
  - Down → `bg-negative-subtle text-negative-subtle-foreground`
  - Neutral → `bg-muted text-muted-foreground`
- Context label beside chip: `text-[11px] text-muted-foreground` (e.g. "vs last month")

**Structure:**
```
┌───────────────────────────────────────────────────────────────┐
│  Accounts                              TOTAL BALANCE          │
│  Overview of your balances       16.821,50 €                  │
│  and key insights                ↑ 2.3%  vs last month        │
└───────────────────────────────────────────────────────────────┘
```

**Usage rules:**
- One `HeroMetric` per page maximum. It is the visual anchor — not a grid of equals.
- Place at the top of the page content area — the component contains its own `<h1>`, so no separate page title is needed above it.
- If no delta data is available (e.g. first month), render without the chip — the component handles this gracefully.

### KPI Sparklines

Minimalist line charts embedded in cards. No axes, no labels — trend only.

- Positive trend: `--positive` (`#10b981`)
- Negative trend: `--negative` (`#ef4444`)
- Neutral / primary trend: `--primary` (`#1e40af`)
- Height: 40–48px. Width fills the card body.
