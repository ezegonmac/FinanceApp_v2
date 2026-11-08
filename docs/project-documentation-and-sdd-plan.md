# Project Documentation and SDD Adoption Plan

## 1. Purpose

This document defines the plan for documenting the current state of the project and progressively adopting a Specification-Driven Development (SDD) workflow.

The immediate objective is to understand, organize, and document the existing project before introducing new development practices or making structural changes.

Once the current state is properly documented, the project will progressively adopt OpenSpec to manage functional specifications and future development changes.

Kiro is the current primary development assistant. However, the documentation and specification structure should remain as tool-independent as reasonably possible, allowing other development assistants, such as Claude Code, to be used in the future without reorganizing the project's knowledge base.

This document is a working plan, not a finalized project structure. All proposed directories, documents, and conventions must be validated against the actual repository before implementation.

---

## 2. Main Objectives

The overall goal is to establish a reliable and maintainable knowledge base for the project.

The specific objectives are:

1. Understand the current implementation, functionality, and repository structure.
2. Reorganize the information currently accumulated in the README file and specs folder especially the mixture of implemented features, pending tasks, improvements, and known issues.
3. Document the existing functionality based on actual implementation evidence.
4. Identify and organize the project's functional areas.
5. Establish a consistent functional requirements methodology based on EARS.
6. Introduce stable and unique requirement identifiers to support traceability between specifications, source code, and tests.
7. Adopt OpenSpec as the primary workflow for managing future functional changes.
8. Keep the documentation concise, consistent, and synchronized with the actual implementation.
9. Preserve independence from any particular AI coding assistant.

---

## 3. Guiding Principles

### 3.1. Understand Before Changing

The initial phase is dedicated to discovery and documentation.

- Inspect the existing repository before proposing structural changes.
- Understand the current implementation before describing its behavior.
- Do not modify source code or existing tests during the initial discovery and documentation process unless explicitly authorized.
- Do not introduce new architectural decisions without understanding the current design.
- Avoid unnecessary refactoring during documentation work.

### 3.2. Document Observed Behavior

Documentation must describe what the system actually does, not what it is assumed to do or what it should ideally do.

When analyzing existing functionality:

- Base conclusions on source code, tests, configuration, and reproducible experiments.
- Distinguish implemented behavior from intended behavior.
- Identify incomplete functionality explicitly.
- Record potential defects and unexpected behavior separately.
- Document uncertainties rather than making unsupported assumptions.
- Request human review when behavior cannot be determined confidently.

The objective is to establish an accurate baseline of the existing system.

### 3.3. Separate Different Types of Documentation

Documentation should have clear responsibilities.

- Product documentation explains what the project is and what it aims to achieve.
- Architecture documentation explains how the system is organized.
- Development documentation explains how to configure, execute, and test the project.
- Functional specifications define the expected behavior of the system.
- Roadmap documentation tracks future functionality and improvements.
- Decision records explain important decisions and their rationale.

Do not mix implementation tasks, functional requirements, known defects, and architectural decisions into a single document.

### 3.4. Avoid Unnecessary Documentation

Documentation should provide useful information without creating excessive maintenance overhead.

- Do not create documents simply to populate a predefined structure.
- Avoid duplicating information across multiple files.
- Keep the README concise and use it as the main project entry point.
- Use references and links instead of copying entire documents.
- Create additional documentation only when it serves a clear purpose.

---

## 4. Initial Documentation and Discovery Phase

The first phase focuses on understanding the existing project and organizing its current documentation.

### Phase 1. README Analysis

Start by inspecting the existing README and understanding how information is currently organized.

Identify and classify its contents:

- Project purpose and overview.
- Existing functionality.
- Implemented features.
- Partially implemented features.
- Pending functionality.
- Known defects and limitations.
- Technical improvements and technical debt.
- Development instructions.
- Historical notes and obsolete information.

Do not immediately rewrite the README.

First, understand the information it contains and determine where each type of information should eventually belong.

In particular, distinguish between:

- Existing functional behavior.
- Incomplete functionality.
- Known defects.
- Future functional requirements.
- Technical improvements.
- Development tasks.

Not every task should become a functional requirement, and not every functional requirement should become an implementation task.

### Phase 2. Repository Inspection

Inspect the actual repository to understand the project beyond its README.

Investigate relevant elements such as:

- Directory and file organization.
- Application entry points.
- Main components and modules.
- Dependencies and external services.
- Configuration files.
- Input and output formats.
- Important execution flows.
- Existing tests and test fixtures.
- Build, execution, and development procedures.
- Relevant architectural decisions already present in the code.

Identify the responsibilities of the main components and how they interact.

Do not assume that the existing directory structure is necessarily the appropriate documentation structure.

### Phase 3. Functional Area Identification

Identify the natural functional areas of the project based on its actual functionality and responsibilities.

The areas should represent meaningful functional boundaries, not arbitrary groups of source files.

For each identified area, determine:

- Its purpose.
- Its main responsibilities.
- Its relationship with other functional areas.
- Its implemented functionality.
- Its incomplete functionality.
- Its known issues and uncertainties.

The final list of functional areas must be based on repository evidence and should only be established after the initial analysis.

### Phase 4. Documentation Structure Definition

Once the repository and its functional areas are understood, define an appropriate documentation structure.

Potential documents include:

| Document | Responsibility |
|---|---|
| `README.md` | Project overview, prerequisites, installation, execution, and documentation links. |
| `product-overview.md` | Project purpose, objectives, scope, and main capabilities. |
| `architecture.md` | System organization, components, responsibilities, and execution flows. |
| `development.md` | Development environment, configuration, commands, and testing procedures. |
| `functional-inventory.md` | Inventory of existing functionality and implementation status. |
| `roadmap.md` | Planned functionality, improvements, and future work. |
| `decisions.md` | Important decisions and their rationale. |

This is a candidate structure, not a mandatory document list.

Only create documents that provide meaningful value to the project.

The structure must be adapted to the actual needs of the repository.

---

## 5. Functional Specifications and EARS

Once the functional areas have been identified, establish a consistent approach to documenting functional requirements.

The chosen requirements methodology will be EARS (Easy Approach to Requirements Syntax).

### 5.1. EARS as the Requirements Standard

EARS will be used to express functional requirements clearly, consistently, and in a verifiable manner.

The main EARS patterns are:

| Pattern | Purpose |
|---|---|
| Ubiquitous | Describes behavior that must always apply. |
| Event-driven | Describes behavior triggered by an event. |
| State-driven | Describes behavior while a particular state is active. |
| Unwanted behavior | Describes how the system handles unwanted situations or failures. |
| Optional feature | Describes behavior that applies when a feature is enabled. |

Requirements should describe observable system behavior rather than prescribe unnecessary implementation details.

Use normative language consistently, particularly `SHALL` when defining mandatory system behavior.

### 5.2. Functional Areas and Requirement IDs

Requirements will be organized by functional area.

Each area will have a stable prefix and each requirement will have a unique identifier.

Examples (using this project's established prefixes):

- `LED-001`: Ledger requirement.
- `INV-001`: Investments & Positions requirement.
- `ACC-001`: Accounts requirement.
- `MKT-001`: Market Data & Assets requirement.
- `GEN-001`: Cross-cutting item whose functional area is not yet known.

The full set of functional areas and their prefixes is defined in
`docs/current-state-assessment.md` (Recommended Structure) and registered in
`docs/product-backlog.md`.

Requirement ID conventions:

- Every requirement must have a unique identifier.
- IDs must remain stable over time.
- Existing IDs must not be reassigned to unrelated requirements.
- Retired IDs must not be reused.
- Changes to an existing requirement should preserve its ID whenever it represents the same underlying behavior.
- New requirements must receive new identifiers.

#### Permanent requirement/backlog ID rules

These rules govern identifiers across the entire lifecycle — from a backlog idea,
through an OpenSpec change, to an approved specification. They are also mirrored
in `.kiro/steering/documentation-principles.md` so they apply automatically.

1. **Assign on definition.** Every sufficiently defined functional requirement or
   backlog item receives a unique, permanent ID, even if it has not yet been
   approved for implementation.
2. **Stable across the lifecycle.** An ID never changes and is never reused as an
   item moves between the backlog, OpenSpec changes, and OpenSpec specifications.
3. **Area prefix when known.** Use the functional-area prefix when the area is
   known (e.g. `LED`, `INV`, `ACC`). The established area prefixes are listed in
   `docs/current-state-assessment.md` (Recommended Structure) and reproduced in
   `docs/product-backlog.md`.
4. **`GEN` when unknown.** Use the `GEN` prefix for cross-cutting ideas or items
   whose functional area is not yet determined.
5. **Prefix = origin, not destination.** The prefix records the item's original
   area of classification; it does not dictate where the behavior is ultimately
   implemented.
6. **Reclassify, don't renumber.** When an item's area or status changes, keep its
   ID and update its classification/notes instead of renumbering it. (For example,
   a `GEN` item that is later assigned to an area keeps its `GEN-NNN` ID; the
   backlog records its new area in a separate field.)
7. **Not for vague notes.** Do not assign IDs to vague notes, open questions, or
   undecided ideas until they become sufficiently concrete to describe an
   observable behavior or a well-scoped item.

The central registry of these IDs and their status is `docs/product-backlog.md`.

### 5.3. Requirements and Scenarios

Each requirement should describe one coherent and verifiable behavior.

Where useful, requirements should include scenarios using Given / When / Then notation.

For example:

```markdown
### Requirement: ANO-002 - Anonymization of supported files

WHEN a supported file is submitted for anonymization,
THE system SHALL anonymize the configured identifiers.

#### Scenario: Successful anonymization

- GIVEN a supported file containing identifiable information
- WHEN the anonymization process is executed
- THEN the configured identifiers SHALL be anonymized
- AND the resulting file SHALL preserve the expected structure
```

EARS defines the required behavior, while scenarios describe concrete situations that can be verified through tests.

Not every requirement needs multiple scenarios. Include the scenarios necessary to clarify its expected behavior and relevant edge cases.

### 5.4. Traceability

Maintain traceability between requirements, implementation, and tests.

The intended relationship is:

- Specifications define what the system must do.
- Source code implements the specified behavior.
- Tests verify that the implementation satisfies the requirements.

Where useful, reference requirement IDs in:

- Relevant source code comments or documentation.
- Test names or test descriptions.
- Test reports and implementation reports.
- Technical documentation.

For example:

```python
def anonymize_file(file_path):
    """
    Implements: ANO-002
    """
    ...
```

And:

```python
def test_ano_002_successful_anonymization():
    ...
```

Avoid excessive comments or artificial references. Traceability should provide useful navigation and verification evidence.

Do not include implementation-specific details in functional requirements unless they are genuine external constraints.

---

## 6. OpenSpec Adoption

OpenSpec will be introduced after the existing project has been inspected and its documentation and functional areas have been established.

The objective is to use OpenSpec as the primary workflow for managing functional specifications and future changes.

### 6.1. Specifications as the Current Functional Contract

OpenSpec's main specification directory will contain the approved functional behavior of the project.

The intended organization is one specification per functional area.

For example:

```text
openspec/
├── config.yaml
│
├── specs/
│   ├── README.md
│   │
│   ├── system/
│   │   └── spec.md
│   │
│   ├── collection/
│   │   └── spec.md
│   │
│   ├── anonymization/
│   │   └── spec.md
│   │
│   ├── output/
│   │   └── spec.md
│   │
│   └── configuration/
│       └── spec.md
│
└── changes/
    └── archive/
```

This is an illustrative structure. The final directories must reflect the functional areas identified during discovery.

Each `spec.md` will contain the requirements belonging to its functional area.

The established requirement IDs and EARS methodology will be preserved.

### 6.2. OpenSpec Changes

Future functional modifications will be managed through OpenSpec changes.

A change may contain:

- `proposal.md`: Explains the motivation, scope, and expected outcome.
- `specs/`: Contains the proposed additions, modifications, or removals to existing requirements.
- `design.md`: Describes relevant technical design decisions and implementation considerations.
- `tasks.md`: Breaks the approved change into implementation tasks.

Not every change requires extensive technical design documentation. Keep each proposal proportional to its complexity.

### 6.3. OpenSpec Workflow

The intended development workflow is:

1. **Explore:** Investigate the requested functionality and relevant existing behavior.
2. **Propose:** Define the change, its requirements, and its implementation approach.
3. **Review:** Validate the proposal and resolve ambiguities before implementation.
4. **Apply:** Implement the approved change following its tasks.
5. **Verify:** Execute the relevant tests and confirm the expected behavior.
6. **Archive:** Archive the completed change and incorporate its approved specification updates into the main specifications.

The main specifications should represent the currently approved functional behavior of the system.

Archived changes preserve the historical evolution of the project.

### 6.4. Preserve Requirement Identity

When modifying an existing requirement through OpenSpec:

- Preserve its existing identifier when it represents the same underlying behavior.
- Keep the requirement identity consistent between the main specification and the proposed change.
- Use new identifiers for genuinely new requirements.
- Avoid creating duplicate requirements for behavior already covered elsewhere.

OpenSpec manages specification changes, while the EARS identifiers provide the project's persistent requirement identity.

### 6.5. Avoid Parallel Specification Systems

OpenSpec should be the primary system for managing functional specifications and functional changes.

Do not maintain separate, competing functional specification repositories for the same requirements.

Kiro Steering may still contain general project instructions, conventions, and documentation references, but it should not duplicate the functional specifications managed by OpenSpec.

---

## 7. Kiro and Tool Independence

Kiro is the current primary development assistant because it is already familiar and available in the working environment.

Its Steering configuration should provide persistent project-level guidance.

The intended Steering responsibilities include:

- Product overview and project objectives.
- Technology stack and development constraints.
- Repository structure and documentation map.
- Documentation principles.
- Testing and compatibility principles, where relevant.
- References to important project documentation.

Steering files should remain relatively small and focused.

Avoid copying entire specifications, inventories, or technical documents into Steering.

Use references when necessary and configure inclusion behavior appropriately to avoid loading irrelevant information into every interaction.

The project should remain reasonably independent of Kiro.

In particular:

- Functional specifications must live in the repository.
- Requirement identifiers must not depend on a particular assistant.
- OpenSpec should manage functional changes independently of the selected coding assistant.
- General documentation must remain useful to human developers and other AI tools.

Claude Code or other assistants may be evaluated in the future without requiring a change to the project's functional specification methodology.

---

## 8. Validation and Documentation Maintenance

Documentation must be treated as part of the project rather than a one-time activity.

When functionality changes:

- Review the affected functional requirements.
- Update the corresponding OpenSpec specifications through the change workflow.
- Review relevant architectural or development documentation if necessary.
- Update tests and traceability references where appropriate.
- Keep the README and documentation index synchronized with the actual repository.

During implementation and verification:

- Test normal behavior, edge cases, invalid inputs, and relevant error conditions.
- Never claim that a test passed unless it was actually executed successfully.
- Do not modify tests merely to make an implementation pass.
- Distinguish implementation defects from incorrect or incomplete specifications.
- Record unresolved questions rather than hiding them.

The final implementation report should identify:

- Requirements affected.
- Relevant implementation changes.
- Tests executed and their actual results.
- Known limitations and unresolved questions.

---

## 9. Working Phases and Completion Criteria

The adoption process will be incremental.

### Phase 1 — Initial Discovery

Activities:

- Review the existing README.
- Inspect the repository structure.
- Identify the main components and execution flows.
- Inspect existing tests and configuration.
- Classify existing README tasks and information.

Completion criteria:

- The current repository structure is understood.
- The README contents have been classified.
- Main uncertainties and information gaps have been identified.
- No unauthorized source code or test modifications have been made.

### Phase 2 — Functional Analysis

Activities:

- Identify natural functional areas.
- Describe their responsibilities.
- Inventory existing and incomplete functionality.
- Identify known defects and unresolved questions.
- Identify potential functional requirements.

Completion criteria:

- Functional areas are defined and reviewed.
- Existing functionality is documented based on evidence.
- Pending functionality is separated from implemented behavior.
- Uncertainties are explicitly recorded.

### Phase 3 — Documentation Consolidation

Activities:

- Define the final documentation structure.
- Create or update the relevant documentation files.
- Rewrite the README to serve as the main project entry point.
- Document the product, architecture, development process, and functional inventory as needed.

Completion criteria:

- Documentation reflects the actual project.
- Information is organized and easy to navigate.
- Redundant or obsolete information has been addressed.
- Important documentation gaps are recorded.

### Phase 4 — Functional Specification Baseline

Activities:

- Establish functional area prefixes.
- Define the requirement ID convention.
- Write functional requirements using EARS.
- Add Given / When / Then scenarios where useful.
- Review requirements against code and tests.
- Establish traceability where it provides value.

Completion criteria:

- Functional requirements describe the existing approved behavior.
- Requirement IDs are unique and stable.
- Scenarios clarify the relevant expected behaviors.
- Significant discrepancies and unknowns have been reviewed.

### Phase 5 — OpenSpec Integration

Activities:

- Install and configure OpenSpec.
- Establish the functional specification structure.
- Incorporate the reviewed functional requirements.
- Configure relevant project context and instructions.
- Validate a small change through the complete OpenSpec workflow.

Completion criteria:

- The main specifications accurately describe the approved functional baseline.
- OpenSpec changes can be proposed, reviewed, implemented, verified, and archived.
- Requirement identifiers and the EARS methodology are preserved.
- The workflow is usable with Kiro.

### Phase 6 — Ongoing Development

All subsequent functional development should follow the established SDD workflow.

Each change should be appropriately specified, reviewed, implemented, verified, and incorporated into the main specifications.

The process should remain proportional to the complexity of the change.

---

## 10. Immediate Next Steps

The work should begin with discovery, not with the creation of directories or specification files.

The first activities are:

1. Inspect the existing README in detail.
2. Identify and classify the information and tasks it contains.
3. Inspect the repository structure and identify the most relevant files.
4. Understand the existing application and its main functionality.
5. Identify the natural functional areas.
6. Agree on the documentation structure before creating it.

Work progressively and review each stage before moving forward.

Do not attempt to complete all phases in a single operation.

The purpose of this plan is to provide a stable direction while allowing decisions to be made based on actual repository evidence.

---

## 11. General Working Rule

**Document the existing project accurately before changing how it is developed.**

The initial objective is not to redesign, refactor, or improve the application.

It is to understand what exists, organize that knowledge, and establish a reliable functional baseline.

Only after that baseline is sufficiently understood should OpenSpec become the foundation for future development.

This approach should make the project easier to maintain, easier to understand after periods of inactivity, and less dependent on any particular developer or AI coding assistant.