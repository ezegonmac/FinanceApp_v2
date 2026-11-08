---
inclusion: manual
---

# Discovery Workflow

Guidance for Kiro during repository discovery, legacy analysis, and
documentation work. Activate this steering manually when performing those tasks.

## General approach

- Understand the existing project before proposing changes.
- Work incrementally and focus on one clearly defined objective at a time.
- Inspect existing documentation and source code before suggesting new
  structures.
- Prefer evidence-based conclusions over assumptions.
- Present important findings before proposing significant organizational changes.

## During discovery

- Start with the requested files and expand the investigation only when
  necessary.
- Identify relevant source files, functions, dependencies, and execution flows.
- Distinguish implemented functionality from documented intentions and pending
  work.
- Record uncertainties and questions explicitly.
- Identify duplicated, outdated, or inconsistent documentation.
- Avoid exhaustive analysis when a lightweight investigation is sufficient.

## Change restrictions

- Do not modify application source code or existing tests during discovery
  unless explicitly authorized.
- Do not reorganize, rename, or delete existing files without approval.
- Do not install dependencies or introduce new tools without approval.
- Do not create functional specifications or OpenSpec changes unless explicitly
  requested.
- Avoid refactoring or unrelated improvements during documentation tasks.

## Reporting findings

- Summarize findings clearly and concisely.
- Reference the relevant files whenever possible.
- Distinguish facts, assumptions, potential issues, and open questions.
- Explain when evidence is insufficient to reach a conclusion.
- Recommend the next logical investigation step without prematurely expanding
  the scope.
