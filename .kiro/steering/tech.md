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

## Authentication

- **Auth.js / NextAuth v5** (`next-auth` v5 beta in `apps/web`) — single-user, credential-based authentication.
- Credentials and signing secret are provided via environment variables (see Environment Variables below).

## Market Data

- **`yahoo-finance2`** (in `apps/web`) — source for asset search, historical prices, and portfolio exposure data.

## Testing

- **Vitest** — test runner for `apps/web` (`test` / `test:watch` scripts).
- **`@vitest/coverage-v8`** — coverage reporting.
- **fast-check** — property-based testing (e.g. `apps/web/app/api/admin/exposure-resync/resync.property.test.ts`).

## Database

- **MariaDB** (MySQL-compatible) running in Docker on port 3309
- **Prisma ORM** with `@prisma/adapter-mariadb` (native adapter, not mysql provider)
- Schema: `packages/db/prisma/schema.prisma`
- Client singleton: `packages/db/src/client.ts`
- Import from other packages via `@repo/db`

## Common Commands

Root-level scripts (defined in the root `package.json`, mostly turbo wrappers):

```bash
npm run dev           # Start all apps (turbo run dev)
npm run build         # Build all apps (turbo run build)
npm run lint          # Lint all packages (turbo run lint)
npm run check-types   # Type-check all packages (turbo run check-types)
npm run format        # Prettier format all .ts/.tsx/.md
npm run db:start      # docker compose up -d
npm run db:stop       # docker compose down
npm run db:reset      # docker compose down -v && docker compose up -d
```

Package-level database scripts live in `packages/db` and are typically run via turbo (e.g. `npx turbo db:migrate -- --name <name>`):

```bash
db:generate    # prisma generate (turbo runs it before dev/build)
db:migrate     # prisma migrate dev
db:deploy      # prisma migrate deploy
db:force_reset # prisma migrate reset --force
```

Per-app test scripts live in `apps/web` (`npm run test`, `npm run test:watch`).

For full setup and run instructions, see `README.md` rather than duplicating them here.

## Environment Variables

Root `.env` / `.env.example` (Docker compose + Prisma client):
```
DB_HOST, DB_PORT=3309, DB_NAME, DB_USER, DB_PASSWORD, DB_ROOT_PASSWORD, CRON_SECRET, WEB_PORT
```

`apps/web/.env` / `.env.example`:
```
CRON_SECRET          # Authorizes the internal cron endpoint
AUTH_SECRET          # Signs/encrypts Auth.js session tokens
AUTH_USER_EMAIL      # The single user's login email
AUTH_USER_PASSWORD   # The single user's login password
```

`packages/db` uses a separate `.env` with `DATABASE_URL` for Prisma migrations.

## TypeScript

- Strict TypeScript throughout; all packages use `@repo/typescript-config`
- ESM modules (`"type": "module"` in package.json)
- Path alias `@/` maps to `apps/web/` root

## Shell and Command Conventions

- On Windows, use Git Bash as the preferred shell.
- Prefer Bash and standard Unix utilities over PowerShell-specific commands.
- Use POSIX-compatible command syntax.
- Prefer simple, readable commands over complex command chains.
- Use existing project scripts for build, test, lint, and database operations.
- Prefer read-only commands during discovery and analysis.
- Avoid destructive commands unless explicitly authorized.
- Do not install dependencies, reset databases, delete files, or modify Git history without explicit authorization.
- When a command fails, investigate the cause rather than automatically switching shells or trying unrelated alternatives.