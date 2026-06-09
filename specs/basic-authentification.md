# Basic Authentication

> Backlog entry: `- Add native authentification layer with nextjs 🟨 [spec:basic-authentication]`

## Goal

Protect the application from unauthorized access. Currently anyone with the URL can view and modify financial data. Add a session-based authentication layer using Auth.js (NextAuth v5) with a credentials provider so only the app owner can log in. The design should be extensible to multi-user in the future.

## Requirements

- The system shall require authentication to access any page or API route.
- The system shall provide a `/login` page with an email and password form.
- The system shall validate credentials against environment variables (`AUTH_USER_EMAIL`, `AUTH_USER_PASSWORD`).
- The system shall create a server-side session (JWT strategy) upon successful login.
- The system shall redirect unauthenticated users to `/login`.
- The system shall redirect already-authenticated users away from `/login` to `/`.
- The system shall expose a sign-out action accessible from the app navigation.
- The system shall NOT require authentication for the `/api/internal/jobs/*` endpoint (protected by Bearer token already).
- The system shall add an `AUTH_SECRET` environment variable used to sign/encrypt tokens.
- When credentials are invalid, the system shall show an inline error message without revealing which field is wrong.
- If the session expires or is invalid, the system shall redirect the user to `/login`.

## Acceptance Criteria

```
Given an unauthenticated user
When  they navigate to any app route (e.g. /, /accounts, /metrics)
Then  they are redirected to /login
```

```
Given an unauthenticated user on /login
When  they submit valid credentials (matching AUTH_USER_EMAIL and AUTH_USER_PASSWORD)
Then  a session is created and they are redirected to /
```

```
Given an unauthenticated user on /login
When  they submit invalid credentials
Then  an error message is displayed ("Invalid credentials") and no session is created
```

```
Given an authenticated user
When  they click the sign-out button
Then  the session is destroyed and they are redirected to /login
```

```
Given an unauthenticated request to /api/accounts (or any non-internal API route)
When  no valid session cookie is present
Then  the API returns 401 Unauthorized
```

```
Given a request to /api/internal/jobs/apply-pending-transactions
When  the Authorization header contains a valid Bearer token
Then  the request is processed regardless of session state (auth bypass)
```

## Edge Cases

- What happens when the session token is tampered with? → Treated as unauthenticated, redirect to `/login`.
- What happens if `AUTH_USER_EMAIL` or `AUTH_USER_PASSWORD` env vars are missing? → App should fail to start or log a clear error at build time.
- What happens on concurrent requests with an expired session? → All return 401, client redirects once.
- What happens if the user navigates directly to `/login` while authenticated? → Redirect to `/`.

## Out of Scope

- Multi-user support (DB-backed users table, registration).
- OAuth/social login providers.
- Password reset or recovery flow.
- Rate limiting on login attempts (can be added at Caddy/reverse-proxy level).
- Two-factor authentication (2FA).

## Notes

- **Library:** Auth.js v5 (`next-auth@5`) — the Next.js-native solution. Uses the App Router integration.
- **Strategy:** JWT (no database session table needed for single user).
- **Middleware:** Next.js middleware (`middleware.ts` at app root) to protect all routes except `/login`, `/api/internal/*`, and static assets.
- **Env vars to add:**
  - `AUTH_SECRET` — random 32+ char string for signing tokens
  - `AUTH_USER_EMAIL` — the single user's email
  - `AUTH_USER_PASSWORD` — the single user's password (hashed with bcrypt at build/startup, or compared raw for simplicity)
- **Future multi-user migration path:** Replace the env-var credential check with a DB lookup in the `authorize()` callback. Everything else (middleware, session handling, UI) stays the same.
- **Login page styling:** Use existing shadcn/ui components (Card, Input, Button, Label) to match the app's design language.
