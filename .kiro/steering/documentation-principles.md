---
inclusion: always
---

# Documentation Principles

These principles apply whenever documentation is created, reviewed, or modified
in this project. They hold regardless of which AI coding assistant is being used.

## Writing style

- Write documentation in clear, natural, professional English.
- Prefer concise, human-readable explanations.
- Prioritize useful information over exhaustive description.
- Avoid unnecessary jargon, excessive formality, and overly complex sentences.
- Use headings and lists to aid readability, but avoid excessive fragmentation.
- Explain technical concepts when needed, assuming a reader may return to the
  project after several months without remembering its details.

## Accuracy and evidence

- Document actual behavior, not assumed or intended behavior.
- Base technical descriptions on source code, tests, configuration, or
  reproducible evidence.
- Clearly distinguish verified facts, assumptions, and unresolved questions.
- Never invent functionality, implementation details, or test results.
- Reference relevant files, functions, or other documentation when it improves
  traceability.

## Structure and maintenance

- Give each document a clear purpose and scope.
- Avoid duplicating information across documents.
- Prefer references and links over copying existing content.
- Keep the README concise and use it as the main project entry point.
- Keep documentation synchronized with the actual implementation.
- Do not create unnecessary documentation files.
- Use consistent terminology and naming conventions.

## Requirements and specifications

- Functional requirements must describe observable system behavior.
- Use the established EARS methodology when writing formal functional
  requirements.
- Preserve unique and stable requirement identifiers once established.
- Separate functional requirements from implementation details and development
  tasks.
- Use Given / When / Then scenarios where they add clarity and enable
  verification.

### Where requirements live

- The **canonical** functional requirements (EARS, with stable IDs) live in
  OpenSpec: `openspec/specs/<area>/spec.md` for approved/implemented behavior,
  and `openspec/changes/<change>/` for proposed changes.
- The **readable functional analysis** of how an area works lives in
  `docs/current-state-assessment.md`.
- Do **not** create an intermediate `.kiro/specs/<area>/requirements.md`. That
  step is retired: author EARS requirements directly into OpenSpec, using the
  analysis doc and resolved decisions as the source. `.kiro/specs/` is reserved
  for Kiro-managed implementation specs only when explicitly needed.

### Keep canonical specs behavior-only

A canonical specification (for example an `openspec/specs/<area>/spec.md` and
its `## Purpose`) describes **what the capability does** — durable, observable
behavior. It must not carry process, status, or migration commentary, because
that goes stale and duplicates information that lives elsewhere.

- Do **not** put the following in a canonical spec: implementation status
  (implemented / planned / candidate), references to OpenSpec changes or the
  backlog, migration notes ("tracked separately as a change"), or restatements
  of project-wide conventions (e.g. that IDs are permanent).
- Keep that information in its proper home instead: implementation status and
  roadmap in `docs/product-backlog.md`; migration state and decisions in
  `docs/current-state-assessment.md`; conventions in this file and the SDD plan.
- A spec's `## Purpose` states what the capability is for, in behavioral terms
  only.
- Process/scope commentary **is** appropriate in an OpenSpec **change**
  (`proposal.md`, `design.md`) — just not in the canonical spec it feeds into.

## Requirement and backlog IDs

These rules apply whenever a requirement or backlog item is created, moved, or
reclassified. The central registry is `docs/product-backlog.md`; the full
rationale lives in `docs/project-documentation-and-sdd-plan.md` (§5.2).

- Assign every sufficiently defined functional requirement or backlog item a
  unique, permanent ID when it is defined, even before it is approved for
  implementation.
- Never change or reuse an ID as an item moves between the backlog, OpenSpec
  changes, and OpenSpec specifications.
- Use the functional-area prefix when the area is known (e.g. `LED`, `INV`,
  `ACC`).
- Use `GEN` for cross-cutting ideas or items whose functional area is not yet
  known.
- Treat the prefix as the item's original classification, not a statement about
  where it will ultimately be implemented.
- When an item's area or status changes, keep its ID and update its
  classification instead of renumbering it.
- Do not assign IDs to vague notes or open questions until they are concrete
  enough to describe an observable behavior or a well-scoped item.
