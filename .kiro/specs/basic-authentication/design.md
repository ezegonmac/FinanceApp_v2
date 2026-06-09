# Design Document

## Overview

This design adds a session-based authentication layer to the Precision Ledger web application using Auth.js v5 (next-auth@5) with the credentials provider and JWT strategy. The system protects all pages and API routes via Next.js middleware, validates credentials against environment variables with plain-text comparison, and provides a login page and sign-out button. The `/api/internal/*` routes remain accessible exclusively via Bearer token.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP Request
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              Next.js Middleware (middleware.ts)               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 1. Match route against bypass list                   │    │
│  │    (/login, /api/internal/*, _next/*, static assets) │    │
│  │ 2. If bypass → pass through                          │    │
│  │ 3. Otherwise → check session via auth()              │    │
│  │    • No session + page route → redirect /login       │    │
│  │    • No session + API route  → 401 JSON              │    │
│  │    • Valid session → pass through                    │    │
│  └─────────────────────────────────────────────────────┘    │
└────────────────────────────┬────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
     ┌──────────────┐ ┌──────────┐ ┌────────────────┐
     │  /login page │ │  App     │ │ /api/internal/* │
     │  (public)    │ │  routes  │ │ (Bearer token)  │
     └──────┬───────┘ └──────────┘ └────────────────┘
            │
            ▼
┌──────────────────────────────────┐
│    Auth.js Configuration         │
│  ┌────────────────────────────┐  │
│  │ Credentials Provider       │  │
│  │  authorize(credentials) {  │  │
│  │    compare email & pwd     │  │
│  │    against env vars        │  │
│  │  }                         │  │
│  ├────────────────────────────┤  │
│  │ JWT Strategy (no DB table) │  │
│  │ Signed with AUTH_SECRET    │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

## Components

### 1. Environment Validation (`apps/web/lib/env.ts`)

Zod schema that validates required auth environment variables at build time. Imported early in the auth configuration so the app fails fast on misconfiguration.

```typescript
import { z } from "zod";

const envSchema = z.object({
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),
  AUTH_USER_EMAIL: z.string().email("AUTH_USER_EMAIL must be a valid email"),
  AUTH_USER_PASSWORD: z.string().min(1, "AUTH_USER_PASSWORD is required"),
});

export const env = envSchema.parse(process.env);
```

### 2. Auth.js Configuration (`apps/web/lib/auth.ts`)

Central Auth.js v5 configuration using the credentials provider with JWT strategy.

```typescript
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { env } from "@/lib/env";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) return null;

        if (email === env.AUTH_USER_EMAIL && password === env.AUTH_USER_PASSWORD) {
          return { id: "1", email: env.AUTH_USER_EMAIL, name: "Owner" };
        }

        return null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  secret: env.AUTH_SECRET,
});
```

### 3. Auth.js Route Handler (`apps/web/app/api/auth/[...nextauth]/route.ts`)

Exposes the NextAuth API routes required for sign-in/sign-out operations.

```typescript
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

### 4. Middleware (`apps/web/middleware.ts`)

Intercepts every request and enforces authentication. Bypasses public paths and internal API routes.

```typescript
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Bypass: login page, internal API, Next.js internals, static assets
  if (
    pathname === "/login" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/internal/") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Unauthenticated
  if (!req.auth) {
    // API routes return 401 JSON
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Page routes redirect to /login
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

### 5. Login Page (`apps/web/app/login/page.tsx`)

Server component wrapper + client form component using shadcn/ui Card and Label.

```typescript
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/");

  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoginForm />
    </div>
  );
}
```

### 6. Login Form Component (`apps/web/app/login/login-form.tsx`)

Client component handling form state, submission via `signIn()`, and error display.

```typescript
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid credentials");
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

### 7. Sign-Out Button (`apps/web/components/SignOutButton.tsx`)

Standalone client component rendered at far-right of the navigation header.

```typescript
"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="text-muted-foreground hover:text-foreground"
    >
      <LogOut className="h-4 w-4" />
      <span className="sr-only">Sign out</span>
    </Button>
  );
}
```

### 8. Updated Root Layout (`apps/web/app/layout.tsx`)

Conditionally renders the header with NavLinks and SignOutButton only for authenticated users. The SignOutButton is positioned at the far-right using `ml-auto`.

```typescript
import { auth } from "@/lib/auth";
import { SignOutButton } from "@/components/SignOutButton";
import NavLinks from "@/components/NavLinks";
// ... existing imports

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="en" className={cn("font-sans", inter.variable, jetbrains.variable)}>
      <body>
        <DebugProvider>
          {session && (
            <header className="sticky top-0 z-40 border-b border-border bg-card">
              <div className="flex items-center h-10 px-4">
                <NavLinks />
                <div className="ml-auto">
                  <SignOutButton />
                </div>
              </div>
            </header>
          )}
          <main className="p-4">{children}</main>
        </DebugProvider>
      </body>
    </html>
  );
}
```

## Interfaces

### Auth.js Configuration Interface

| Export | Type | Purpose |
|--------|------|---------|
| `auth` | `() => Promise<Session \| null>` | Get current session (server-side) |
| `signIn` | `(provider, options) => Promise` | Trigger sign-in (server action) |
| `signOut` | `(options) => Promise` | Trigger sign-out (server action) |
| `handlers` | `{ GET, POST }` | NextAuth API route handlers |

### Middleware Request Flow

| Path Pattern | Auth Required | Behavior |
|---|---|---|
| `/login` | No | Pass through |
| `/api/auth/*` | No | Auth.js handlers |
| `/api/internal/*` | No (Bearer only) | Pass through, Bearer checked by route |
| `/_next/*`, static assets | No | Pass through |
| `/api/*` (other) | Yes | 401 if no session |
| All other pages | Yes | Redirect to `/login` if no session |

### Environment Variables

| Variable | Type | Validation | Purpose |
|---|---|---|---|
| `AUTH_SECRET` | string (32+ chars) | `z.string().min(1)` | Signs/encrypts JWT tokens |
| `AUTH_USER_EMAIL` | string (email) | `z.string().email()` | Single user's email |
| `AUTH_USER_PASSWORD` | string | `z.string().min(1)` | Single user's password (plain-text) |

## Data Models

No new database tables are introduced. Sessions are managed entirely via JWT tokens stored in HTTP cookies.

### JWT Token Payload (managed by Auth.js)

```typescript
interface JWTPayload {
  sub: string;       // User ID ("1")
  email: string;     // User email
  name: string;      // User name ("Owner")
  iat: number;       // Issued at timestamp
  exp: number;       // Expiry timestamp
  jti: string;       // Unique token identifier
}
```

## Error Handling

| Scenario | Handler | Response |
|---|---|---|
| Invalid credentials on login | `authorize()` returns `null` | Client shows "Invalid credentials" |
| Missing env vars at build | Zod `parse()` throws | Build fails with descriptive error |
| Tampered/invalid JWT | Auth.js middleware | Treated as unauthenticated |
| Expired JWT | Auth.js middleware | Treated as unauthenticated |
| Unauthenticated API request | Middleware | `{ error: "Unauthorized" }` with 401 |
| Unauthenticated page request | Middleware | 302 redirect to `/login` |

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Middleware redirects unauthenticated page requests

*For any* route path that is not `/login`, does not start with `/api/internal/`, `/api/auth/`, or `/_next/`, and is not a static asset, an unauthenticated request to that path SHALL result in a redirect to `/login`.

**Validates: Requirements 1.1**

### Property 2: Middleware returns 401 for unauthenticated API requests

*For any* route path starting with `/api/` that does not match `/api/internal/*` or `/api/auth/*`, an unauthenticated request SHALL receive an HTTP 401 response with a JSON body containing `{ error: "Unauthorized" }`.

**Validates: Requirements 1.2**

### Property 3: Middleware allows authenticated requests

*For any* route path and any valid (non-expired, non-tampered) session token, the middleware SHALL allow the request to proceed without redirect or 401 response.

**Validates: Requirements 1.3**

### Property 4: Middleware bypasses session auth for internal API paths

*For any* path matching `/api/internal/*`, the middleware SHALL allow the request to proceed regardless of whether a valid session is present or not.

**Validates: Requirements 1.5, 6.1**

### Property 5: Valid credentials produce a session

*For any* login attempt where the submitted email equals `AUTH_USER_EMAIL` (exact match) and the submitted password equals `AUTH_USER_PASSWORD` (exact plain-text match), the `authorize()` callback SHALL return a non-null user object.

**Validates: Requirements 2.2, 5.1, 5.2**

### Property 6: Invalid credentials are rejected

*For any* login attempt where the submitted email does NOT equal `AUTH_USER_EMAIL` OR the submitted password does NOT equal `AUTH_USER_PASSWORD`, the `authorize()` callback SHALL return `null`, and the login page SHALL display the message "Invalid credentials" without revealing which field is wrong.

**Validates: Requirements 2.3, 5.1, 5.2**

### Property 7: Invalid tokens are treated as unauthenticated

*For any* JWT token that has been tampered with (modified payload, altered signature, truncated) or has an expiry timestamp in the past, the auth system SHALL treat the request as unauthenticated (redirect for pages, 401 for APIs).

**Validates: Requirements 3.3, 3.4**

### Property 8: Environment validation rejects missing variables

*For any* subset of the required environment variables `{AUTH_SECRET, AUTH_USER_EMAIL, AUTH_USER_PASSWORD}` where at least one variable is missing, the Zod schema validation SHALL throw an error whose message identifies the missing variable(s).

**Validates: Requirements 7.1, 7.2**
