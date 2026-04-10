# ADR Template

This document defines the required structure for `ADR.md`.

## Compliance Rules

- Keep the `APM:DATA` managed block intact and valid JSON.
- Keep the top compliance note intact.
- Preserve the section order defined in this template.
- ADRs should record important decisions, not replace the Architecture document.
- If this template structure changes, update the version section before making any other structural edits.

## Version

- Template Name: `ADR.template.md`
- Template Version: `2.0`
- Last Updated: `2026-04-04`
- AI Agent instruction: Whenever this template is updated, update the template version and last updated date before changing any section definitions.

## Model Context Protocol

- `ADR.md` is a managed document generated from application state.
- The application database is the source of truth for ADR editor fields and generated markdown.
- Architecture describes the broader system design; ADR records explain significant architectural decisions and their tradeoffs.
- Significant architecture changes should update Architecture and create or update ADR entries.
- If a disk file conflicts with database state, the application may regenerate this file from the database.

## Structure Definition

The generated `ADR.md` must contain the following sections in this order.

1. `# ADR: {{PROJECT_NAME}}`
2. Compliance note
3. Managed data block
4. `## 1. Executive Summary`
5. `## 2. Decision Metadata`
6. `## 3. Context`
7. `## 4. Decision`
8. `## 5. Rationale`
9. `## 6. Alternatives Considered`
10. `## 7. Consequences`
11. `## 8. Related Architecture Elements`
12. `## 9. Related Modules and Workflows`
13. `## 10. Follow-Up Notes`
14. `## 11. Applied Fragments`
15. `## 12. Open Questions`

Repeating sections such as alternatives, consequences, related architecture elements, related modules, and open questions should use numbered subsection entries with a title and description.
