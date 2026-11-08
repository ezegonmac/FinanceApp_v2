# Authentication & Access Control Specification

## Purpose

Single-user, credential-based authentication (Auth.js / NextAuth v5, JWT
sessions) that protects all pages and API routes except an explicit bypass list.
This is a cross-cutting concern applied uniformly across the application; the
internal job endpoint is authorized separately by a Bearer secret rather than a
user session.

## Requirements

### Requirement: AUT-001 Credential Login

The system SHALL authenticate a single user by comparing submitted email and
password against the configured credentials, issuing a JWT session on success.

#### Scenario: Valid credentials

- **WHEN** the user submits email and password matching the configured values
- **THEN** the system establishes an authenticated session

#### Scenario: Invalid credentials

- **WHEN** the user submits credentials that do not match
- **THEN** the system does not establish a session

### Requirement: AUT-002 Route Protection

The system SHALL require authentication for pages and API routes, returning a 401
for unauthenticated API requests and redirecting unauthenticated page requests to
the login page.

#### Scenario: Unauthenticated API request

- **WHEN** an unauthenticated request is made to a protected API route
- **THEN** the system returns a 401 status

#### Scenario: Unauthenticated page request

- **WHEN** an unauthenticated request is made to a protected page
- **THEN** the system redirects to the login page

### Requirement: AUT-003 Access Bypass List

The system SHALL exempt the login page, the auth endpoints, the internal job
endpoints, and static assets from session authentication.

#### Scenario: Bypassed paths

- **WHEN** a request targets the login page, an auth endpoint, an internal job endpoint, or a static asset
- **THEN** the system does not require a user session for that request

### Requirement: AUT-004 Internal Job Authorization

The system SHALL authorize internal job endpoints with a Bearer secret instead of
a user session.

#### Scenario: Internal endpoint with Bearer secret

- **WHEN** a request to an internal job endpoint presents the correct Bearer secret
- **THEN** the system authorizes it regardless of session state
