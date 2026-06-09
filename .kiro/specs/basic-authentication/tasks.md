# Implementation Plan: Basic Authentication

## Overview

Add session-based authentication to the Precision Ledger web app using Auth.js v5 (next-auth@5) with credentials provider and JWT strategy. Implementation follows dependency order: environment validation → auth config → route handler → middleware → login page → sign-out button → layout update.

## Tasks

- [ ] 1. Set up Auth.js dependencies and environment validation
  - [ ] 1.1 Install next-auth@5 and create environment validation module
    - Run `npm install next-auth@beta` in `apps/web`
    - Create `apps/web/lib/env.ts` with Zod schema validating AUTH_SECRET, AUTH_USER_EMAIL, AUTH_USER_PASSWORD
    - Add AUTH_SECRET, AUTH_USER_EMAIL, AUTH_USER_PASSWORD to `apps/web/.env` and `apps/web/.env.example`
    - _Requirements: 7.1, 7.2_

  - [ ]* 1.2 Write property test for environment validation
    - **Property 8: Environment validation rejects missing variables**
    - **Validates: Requirements 7.1, 7.2**

- [ ] 2. Implement Auth.js configuration and route handler
  - [ ] 2.1 Create Auth.js configuration with credentials provider
    - Create `apps/web/lib/auth.ts` exporting `auth`, `signIn`, `signOut`, `handlers`
    - Configure credentials provider with `authorize()` callback comparing against env vars
    - Set JWT strategy, custom sign-in page `/login`, and AUTH_SECRET
    - _Requirements: 3.1, 3.2, 5.1, 5.2, 8.1_

  - [ ]* 2.2 Write property test for credential validation
    - **Property 5: Valid credentials produce a session**
    - **Property 6: Invalid credentials are rejected**
    - **Validates: Requirements 2.2, 2.3, 5.1, 5.2**

  - [ ] 2.3 Create Auth.js route handler
    - Create `apps/web/app/api/auth/[...nextauth]/route.ts`
    - Export GET and POST handlers from `@/lib/auth`
    - _Requirements: 3.1_

- [ ] 3. Implement middleware for route protection
  - [ ] 3.1 Create Next.js middleware with auth enforcement
    - Create `apps/web/middleware.ts` using `auth()` wrapper
    - Implement bypass logic for `/login`, `/api/auth/*`, `/api/internal/*`, `/_next/*`, and static assets
    - Return 401 JSON for unauthenticated API requests
    - Redirect to `/login` for unauthenticated page requests
    - Pass through authenticated requests
    - Configure matcher to exclude static files
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.1_

  - [ ]* 3.2 Write property tests for middleware route protection
    - **Property 1: Middleware redirects unauthenticated page requests**
    - **Property 2: Middleware returns 401 for unauthenticated API requests**
    - **Property 3: Middleware allows authenticated requests**
    - **Property 4: Middleware bypasses session auth for internal API paths**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.5, 6.1**

- [ ] 4. Checkpoint - Ensure auth core compiles
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement login page
  - [ ] 5.1 Create login page server component
    - Create `apps/web/app/login/page.tsx` as async server component
    - Check session via `auth()` — if authenticated, redirect to `/`
    - Render centered layout wrapper with `LoginForm` client component
    - _Requirements: 2.4_

  - [ ] 5.2 Create login form client component
    - Create `apps/web/app/login/login-form.tsx` with `"use client"` directive
    - Build form with email and password inputs using shadcn/ui Card, CardHeader, CardTitle, CardContent, Label, Input, Button
    - Handle submission via `signIn("credentials", { redirect: false })` from `next-auth/react`
    - On success redirect to `/` with `router.push("/")` and `router.refresh()`
    - On error display "Invalid credentials" message without revealing which field failed
    - _Requirements: 2.1, 2.2, 2.3_

- [ ] 6. Implement sign-out and update layout
  - [ ] 6.1 Create sign-out button component
    - Create `apps/web/components/SignOutButton.tsx` as client component
    - Use `signOut({ callbackUrl: "/login" })` from `next-auth/react`
    - Render ghost Button with LogOut icon from lucide-react and sr-only label
    - _Requirements: 4.1, 4.2_

  - [ ] 6.2 Update root layout to conditionally show header and sign-out button
    - Modify `apps/web/app/layout.tsx` to import `auth` from `@/lib/auth` and `SignOutButton`
    - Make layout an async function, call `await auth()` to get session
    - Conditionally render header only when session exists
    - Position SignOutButton at far-right using `ml-auto` wrapper div
    - _Requirements: 4.1, 4.2_

- [ ] 7. Final checkpoint - Ensure full build passes
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- The design uses TypeScript throughout (Next.js + Auth.js v5)
- No database tables are needed — sessions use JWT strategy only
- The internal `/api/internal/jobs/*` endpoint keeps its existing Bearer token validation unchanged

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3"] },
    { "id": 3, "tasks": ["3.1"] },
    { "id": 4, "tasks": ["3.2", "5.1", "5.2", "6.1"] },
    { "id": 5, "tasks": ["6.2"] }
  ]
}
```
