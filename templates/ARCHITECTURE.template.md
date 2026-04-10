# ARCHITECTURE Template

This document defines the required structure for `ARCHITECTURE.md`.

## Compliance Rules

- Keep the `APM:DATA` managed block intact and valid JSON.
- Keep the top compliance note intact.
- Preserve the section order defined in this template.
- Keep Mermaid text valid and aligned with the component and connection map maintained in the architecture editor.
- If this template structure changes, update the version section before making any other structural edits.

## Version

- Template Name: `ARCHITECTURE.template.md`
- Template Version: `2.0`
- Last Updated: `2026-04-04`
- AI Agent instruction: Whenever this template is updated, update the template version and last updated date before changing any section definitions.

## Model Context Protocol

- `ARCHITECTURE.md` is a managed document generated from application state.
- The application database is the source of truth for architecture editor fields, generated markdown, and Mermaid content.
- Architecture should support both single-application projects and larger systems with sub-architectures.
- Architecture should describe system structure, workflows, stack, persistence strategy, and module interdependence.
- Significant architectural decisions should also create or update ADR records.
- If a disk file conflicts with database state, the application may regenerate this file from the database.

## Structure Definition

The generated `ARCHITECTURE.md` must contain the following sections in this order.

1. `# Architecture: {{PROJECT_NAME}}`
2. Compliance note
3. Managed data block
4. `## 1. Architecture Overview`
   - `### 1.1 System Purpose`
   - `### 1.2 Architectural Vision`
   - `### 1.3 Architectural Style`
   - `### 1.4 Architecture Type and Scope`
5. `## 2. Architecture Registry`
   - `### 2.1 Sub-Architectures`
   - `### 2.2 External Dependencies and Integrations`
6. `## 3. Technology Stack`
7. `## 4. Components and Boundaries`
   - `### 4.1 Core Components`
   - `### 4.2 Component Connections`
   - `### 4.3 Boundaries and Responsibilities`
8. `## 5. Workflows`
   - `### 5.1 Application Workflows`
   - `### 5.2 Architecture Workflows`
9. `## 6. Module Interdependence`
10. `## 7. Persistence and State`
    - `### 7.1 Persistence Strategy`
    - `### 7.2 Source of Truth`
    - `### 7.3 Synchronization Expectations`
11. `## 8. Cross-Cutting Concerns`
12. `## 9. Architectural Decisions and ADR Expectations`
13. `## 10. Constraints and Tradeoffs`
14. `## 11. Runtime and Deployment`
    - `### 11.1 Runtime Topology`
    - `### 11.2 Environment Notes`
15. `## 12. Open Questions`
16. `## Mermaid`

Repeating sections such as stack entries, components, sub-architectures, dependencies, workflows, module interactions, concerns, decisions, constraints, and open questions should use numbered subsection entries with a title and description. Component connections should identify a source, a target, and an optional connection label.
