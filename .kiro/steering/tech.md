# Tech Stack

## Monorepo & Build

- **Turborepo v2** with npm workspaces
- **Package manager:** npm 11.10.0 (`npm@11.10.0` in `packageManager`)
- **Node:** >=18 required
- Turbo pipeline ensures `db:generate` (Prisma client) always runs before `dev` and `build`

## Applications

| App | Framework | Port |
|-----|-----------|------|
| `apps/web` | Next.js 16.1.5, React 19 | 3000 |
| `apps/docs` | Next.js 16.1.5, React 19 | 3001 (boilerplate only) |

## Packages

| Package | Purpose |
|---------|---------|
| `@repo/db` | Prisma 7 ORM + MariaDB adapter, singleton client |
| `@repo/ui` | Shared React component primitives |
| `@repo/utils` | Date utilities (Europe/Madrid timezone) |
| `@repo/eslint-config` | Shared ESLint configs |
| `@repo/typescript-config` | Shared tsconfig presets |

## Frontend Libraries

- **TailwindCSS v4** with PostCSS
- **shadcn/ui** (new-york style, neutral base, CSS variables, RSC-compatible)
- **Radix UI** primitives
- **TanStack Table v8** — standard for all data tables
- **Apache ECharts v5** — charts and sparklines
- **Lucide React** — icons
- **Zod v4** — validation in all API routes
- `clsx` + `tailwind-merge` via `cn()` utility (`apps/web/lib/utils.ts`)
- **Inter** (sans) + **JetBrains Mono** (mono) fonts via `next/font/google`

## Database

- **MariaDB** (MySQL-compatible) running in Docker on port 3309
- **Prisma ORM** with `@prisma/adapter-mariadb` (native adapter, not mysql provider)
- Schema: `packages/db/prisma/schema.prisma`
- Client singleton: `packages/db/src/client.ts`
- Import from other packages via `@repo/db`

## Common Commands

```bash
# Development
npm run dev           # Start all apps (turbo)

# Build & Quality
npm run build         # Build all apps (turbo)
npm run lint          # Lint all packages
npm run check-types   # Type-check all packages
npm run format        # Prettier format all .ts/.tsx/.md

# Database (run from repo root)
npm run db:start      # docker compose up -d
npm run db:stop       # docker compose down
npm run db:reset      # Wipe DB volumes and restart

# Database migrations (run from packages/db)
npm run db:generate   # prisma generate (auto-runs before dev/build)
npm run db:migrate    # prisma migrate dev
npm run db:deploy     # prisma migrate deploy
npm run db:force_reset  # prisma migrate reset --force
```

## Environment Variables

Root `.env` / `.env.example` (Docker compose + Prisma client):
```
DB_HOST=localhost, DB_PORT=3309, DB_NAME, DB_USER, DB_PASSWORD, DB_ROOT_PASSWORD, CRON_SECRET, WEB_PORT=3000
```

`apps/web/.env`:
```
CRON_SECRET   # Used to authorize the internal cron endpoint
```

`packages/db` uses a separate `.env` with `DATABASE_URL` for Prisma migrations.

## TypeScript

- Strict TypeScript throughout; all packages use `@repo/typescript-config`
- ESM modules (`"type": "module"` in package.json)
- Path alias `@/` maps to `apps/web/` root
