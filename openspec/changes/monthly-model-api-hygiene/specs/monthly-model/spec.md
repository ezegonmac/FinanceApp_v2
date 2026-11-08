# Spec Delta

## MODIFIED Requirements

### Requirement: MON-001 Month Entity

The system SHALL represent each period as a unique `Month` identified by year and
month, and SHALL return months via `GET /api/months` and upsert a month via
`POST /api/months`. The `OPTIONS` response for `/api/months` SHALL advertise
`GET, POST`.

#### Scenario: List months

- **WHEN** the user requests the month list
- **THEN** the system returns months ordered newest first

#### Scenario: Upsert a month

- **WHEN** the user submits a (year, month)
- **THEN** the system returns the existing month or creates it if absent

#### Scenario: Accurate Allow header

- **WHEN** an OPTIONS request is made to `/api/months`
- **THEN** the system advertises `GET, POST` in the Allow header

### Requirement: MON-002 Month Detail Read

The system SHALL return a single month by year and month via
`GET /api/months/[year]/[month]` without creating it as a side effect,
validating the path values. The `OPTIONS` response SHALL advertise `GET`.

#### Scenario: Read a month

- **WHEN** the user requests an existing month by year and month
- **THEN** the system returns the corresponding month

#### Scenario: Missing month

- **WHEN** the user requests a month that does not exist
- **THEN** the system returns a 404 status without creating the month

#### Scenario: Invalid year or month

- **WHEN** the year or month path value is not a number
- **THEN** the system returns a 400 status
