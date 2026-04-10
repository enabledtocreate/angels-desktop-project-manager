# Architecture Fragment Template

> Managed document. Must comply with template ARCHITECTURE_FRAGMENT.template.md.

- Template Version: `2.0`
- Last Updated: `2026-04-04`

## Purpose

Use this fragment to propose architecture updates without editing `ARCHITECTURE.md` directly.

## Required Sections

1. Executive Summary
2. Architecture Scope Updates
3. Technology Stack Updates
4. Component and Boundary Updates
5. Workflow Updates
6. Module Interdependence Updates
7. Persistence and State Impact
8. Architectural Decision / ADR Impact
9. Runtime or Deployment Impact
10. Open Questions
11. Merge Guidance

## Guidance

- Focus on system structure, workflows, boundaries, major components, and cross-module impact.
- Record new libraries, runtime dependencies, and external integrations explicitly.
- Call out whether the architecture change should also create or update an ADR record.
- Link downstream impacts to Persistence, Technical Design, Experience Design, ADR, or Test Strategy when relevant.
- For section-targeted changes, include an `APM:OPERATIONS` HTML comment block with JSON operations such as `add`, `update`, `remove`, `reorder`, `move`, `link`, and `unlink`.
- Use stable target item ids when updating existing architecture entries so fragments stay resilient to reordering.

