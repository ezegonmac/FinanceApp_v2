# Project Structure

## Root Layout

```
FinanceApp_v2/
├── apps/
│   ├── web/          # Main Next.js application
│   └── docs/         # Placeholder docs app (boilerplate)
├── packages/
│   ├── db/           # Prisma client + schema
│   ├── ui/           # Shared UI components
│   ├── utils/        # Shared utilities
│   ├── eslint-config/
│   └── typescript-config/
├── package.json      # Root workspace scripts
├── turbo.json        # Turbo pipeline config
└── design.md         # Brand tokens, design system reference
```

## apps/web Structure

```
apps/web/
├── app/
│   ├── layout.tsx              # Root layout: nav, fonts, DebugProvider
│   ├── page.tsx                # Home/dashboard
│   ├── accounts/               # Account list + [id] detail
│   ├── admin/                  # Admin panel (job trigger, debug)
│   ├── expenses/[id]/          # Expense detail
│   ├── incomes/[id]/           # Income detail
│   ├── transactions/[id]/      # Transaction detail
│   ├── recurrent/              # Recurrent items overview
│   ├── months/
│   │   ├── current/            # Redirect to current month
│   │   └── [year]/[month]/     # Month detail breakdown
│   ├── metrics/                # Charts and financial metrics
│   ├── todos/                  # Todos list
│   ├── playground/             # Dev playground (dev only)
│   └── api/
│       ├── _lib/               # Server-side logic (NOT route handlers)
│       │   ├── jobs/           # Daily job + per-type processors
│       │   └── snapshots/      # MonthSnapshot recalculation
│       ├── accounts/           # GET, POST + nested [id]/expenses|incomes|transactions
│       ├── expenses/           # GET, POST, PATCH, DELETE
│       ├── incomes/
│       ├── transactions/
│       ├── recurrent-expenses/
│       ├── recurrent-incomes/
│       ├── recurrent-transactions/
│       ├── months/             # Month upsert + nested queries
│       ├── metrics/            # Balances, monthly-summary, balance-series
│       ├── todos/
│       └── internal/jobs/      # Cron-only endpoint (Bearer auth)
├── components/
│   ├── ui/                     # shadcn primitives (button, input, table, dialog…)
│   ├── accounts/
│   ├── expenses/
│   ├── incomes/
│   ├── transactions/
│   ├── recurrent-expenses/
│   ├── recurrent-incomes/
│   ├── recurrent-transactions/
│   ├── snapshots/
│   ├── metrics/
│   ├── todos/
│   └── debug/                  # DebugContext + DebugIndicator
└── lib/
    └── utils.ts                # cn() helper
```

## Naming Conventions

| Context | Convention |
|---------|-----------|
| Component files | PascalCase `.tsx` (e.g. `AddExpenseForm.tsx`) |
| Utility / API files | camelCase `.ts` (e.g. `recalculateMonthSnapshot.ts`) |
| API route paths | kebab-case (e.g. `/api/recurrent-expenses`) |
| Database columns | `snake_case` (Prisma schema) |
| TS variables/props | camelCase |
| TS types/interfaces/components | PascalCase |
| Enum values | `SCREAMING_SNAKE_CASE` |

## Component Patterns

- **`'use client'`** at the top of any component using hooks or browser APIs; all other components are RSC by default
- **Page files** (`page.tsx`) are async server components that fetch data and pass it down
- **Domain component naming:** `<Domain>Table.tsx`, `Add<Domain>Form.tsx`, `Edit<Domain>Form.tsx`, `<Domain>View.tsx`
- **Forms** use local `useState` + `fetch` to API routes (no form library)
- **Data tables** always use `DataTable` from `components/ui/data-table.tsx` (TanStack Table)
- **Server Actions** (`"use server"`) are used only in the admin panel

## API Route Patterns

- Every route file exports `export const dynamic = "force-dynamic"` (Prisma requirement)
- Zod schema is declared at the top of the file and `.parse(body)` is called before any DB access
- `ZodError` → 400, all other errors → 500
- Every route file exports an `OPTIONS()` handler returning 405 with an `Allow` header
- Account-scoped resources live under `/api/accounts/[id]/<resource>` (nested routes)
- The internal cron endpoint (`/api/internal/jobs/...`) checks `Authorization: Bearer <CRON_SECRET>`

## packages/db

- `prisma/schema.prisma` — single source of truth for the data model
- `src/client.ts` — Prisma singleton (safe for Next.js HMR in dev)
- Import as `import { prisma } from "@repo/db"` from any app

## packages/utils

- `src/dates.ts` — all date/timezone helpers; always use `getEuropeMadridDateParts()` for "current date" logic
- Import as `import { ... } from "@repo/utils"`
