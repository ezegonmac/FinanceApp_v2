# Requirements Document

## Introduction

Add a session-based authentication layer to the Precision Ledger web application using Auth.js v5 (NextAuth) with a credentials provider. The system protects all pages and API routes from unauthorized access, validates credentials against environment variables, uses JWT strategy with no database session table, and provides a login page and sign-out action. The `/api/internal/jobs/*` endpoint remains protected exclusively by Bearer token. The design is extensible to multi-user in the future.

## Glossary

- **Auth_System**: The authentication layer built on Auth.js v5 (NextAuth) integrated into the Next.js App Router at `apps/web`
- **Middleware**: The Next.js middleware at `apps/web/middleware.ts` that intercepts requests and enforces authentication
- **Login_Page**: The `/login` route that renders an email and password form using shadcn/ui components
- **Session**: A JWT token issued by Auth.js upon successful authentication, stored as an HTTP cookie
- **NavBar**: The application navigation bar rendered by the `NavLinks.tsx` component in the header
- **Env_Validator**: The Zod schema that validates required environment variables at build time
- **Internal_API**: The `/api/internal/jobs/*` endpoints protected exclusively by Bearer token (CRON_SECRET)

## Requirements

### Requirement 1: Route Protection

**User Story:** As the app owner, I want all application routes to be protected by authentication, so that unauthorized users cannot access financial data.

#### Acceptance Criteria

1. WHEN an unauthenticated user navigates to any route other than `/login` or `/api/internal/*`, THE Middleware SHALL redirect the user to `/login`.
2. WHEN an unauthenticated request is made to any API route other than `/api/internal/*`, THE Middleware SHALL respond with HTTP status 401 Unauthorized.
3. WHILE a user has a valid Session, THE Middleware SHALL allow the request to proceed to the target route.
4. THE Middleware SHALL allow requests to `/login` to proceed without authentication.
5. THE Middleware SHALL allow requests matching `/api/internal/*` to proceed without session authentication.

### Requirement 2: Login Page

**User Story:** As the app owner, I want a login page with email and password fields, so that I can authenticate and access the application.

#### Acceptance Criteria

1. THE Login_Page SHALL render an email input field and a password input field inside a Card component using shadcn/ui (Card and Label components).
2. WHEN the user submits the login form with credentials matching AUTH_USER_EMAIL and AUTH_USER_PASSWORD environment variables, THE Auth_System SHALL create a Session and redirect the user to `/`.
3. WHEN the user submits the login form with credentials that do not match AUTH_USER_EMAIL or AUTH_USER_PASSWORD, THE Login_Page SHALL display the message "Invalid credentials" without revealing which field is incorrect.
4. WHILE a user is already authenticated, WHEN the user navigates to `/login`, THE Auth_System SHALL redirect the user to `/`.

### Requirement 3: Session Management

**User Story:** As the app owner, I want JWT-based sessions, so that my authentication state persists across requests without a database session table.

#### Acceptance Criteria

1. THE Auth_System SHALL use the JWT strategy for session management with no database session table.
2. THE Auth_System SHALL sign and encrypt Session tokens using the AUTH_SECRET environment variable.
3. IF a Session token is tampered with or invalid, THEN THE Auth_System SHALL treat the request as unauthenticated and redirect the user to `/login`.
4. IF a Session has expired, THEN THE Auth_System SHALL treat the request as unauthenticated and redirect the user to `/login`.

### Requirement 4: Sign-Out

**User Story:** As the app owner, I want a sign-out button in the navigation bar, so that I can terminate my session.

#### Acceptance Criteria

1. THE NavBar SHALL display a sign-out button at the far-right position as a standalone element not inside any dropdown.
2. WHEN the user clicks the sign-out button, THE Auth_System SHALL destroy the Session and redirect the user to `/login`.

### Requirement 5: Credential Validation

**User Story:** As the app owner, I want credentials validated against environment variables using plain-text comparison, so that setup is simple for a single-user deployment.

#### Acceptance Criteria

1. WHEN the Auth_System receives a login attempt, THE Auth_System SHALL compare the submitted email against AUTH_USER_EMAIL using exact string comparison.
2. WHEN the Auth_System receives a login attempt, THE Auth_System SHALL compare the submitted password against AUTH_USER_PASSWORD using plain-text (raw) string comparison without hashing.

### Requirement 6: Internal API Bypass

**User Story:** As the system operator, I want the internal jobs endpoint to remain accessible via Bearer token regardless of session state, so that scheduled cron jobs continue to function.

#### Acceptance Criteria

1. WHEN a request targets a path matching `/api/internal/jobs/*`, THE Middleware SHALL bypass session authentication for that request.
2. THE Internal_API SHALL continue to validate the Authorization header Bearer token (CRON_SECRET) independently of the Auth_System.

### Requirement 7: Environment Variable Validation

**User Story:** As a developer, I want the build to fail with a clear error when required auth environment variables are missing, so that misconfiguration is caught before deployment.

#### Acceptance Criteria

1. THE Env_Validator SHALL validate the presence of AUTH_SECRET, AUTH_USER_EMAIL, and AUTH_USER_PASSWORD using a Zod schema at build time.
2. IF any of AUTH_SECRET, AUTH_USER_EMAIL, or AUTH_USER_PASSWORD is missing, THEN THE Env_Validator SHALL cause the build to fail with a clear error message identifying the missing variable.

### Requirement 8: Extensibility

**User Story:** As a developer, I want the authentication architecture to support future multi-user migration, so that adding database-backed users requires minimal changes.

#### Acceptance Criteria

1. THE Auth_System SHALL isolate credential validation logic in the `authorize()` callback of the credentials provider, so that replacing environment variable lookup with a database query requires changing only that callback.
