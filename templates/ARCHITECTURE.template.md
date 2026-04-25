# ARCHITECTURE Template

> Template Contract. Keep filename `ARCHITECTURE.template.md`; APM discovers and syncs templates by this name.
> Managed document. Must comply with template ARCHITECTURE.template.md.

## 1. Template Contract Metadata

- Template Name: `ARCHITECTURE.template.md`
- Template Version: `2.3`
- Last Updated: `2026-04-23`
- Template Kind: `document`
- Owning Module: `Architecture`
- Generated Artifact: `ARCHITECTURE.md`

## 2. Contract / Allowed Schema

### Required Contract Rules

- Keep `Template Name`, `Template Version`, and `Last Updated` present and current.
- Keep the managed-document compliance note in generated artifacts.
- Preserve `APM:DATA` managed blocks when present, and keep JSON valid.

### Allowed Target Sections

- This is a generated document contract; update module state or consume fragments instead of editing generated output directly.

## 3. Actual Template

This document defines the required structure for `ARCHITECTURE.md`.

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

## 4. Examples

```md
# ARCHITECTURE.md: {{PROJECT_NAME}}

> Managed document. Must comply with template ARCHITECTURE.template.md.
```

## 5. Merge / Consumption Rules

- APM copies this template into the active project workspace and records its version/hash in the template registry.
- If this is a fragment template, APM discovers matching fragment files from the configured project fragments folder and shared fragments folder.
- The consuming module validates managed metadata and applies supported operations to structured module state.
- After consumption, generated markdown is regenerated from module state; stale fragment files may be archived or deleted according to the module workflow.

## 6. Version / Migration Notes

- Version `2.3` moves AI-facing instructions and restrictions into the paired module AI file so this template stays artifact-focused.
- Version `2.2` moves AI behavior guidance into the paired module AI file and keeps this template artifact-focused.
- Version `2.1` adds the standardized Template Contract structure.
- Fragment consumers must migrate older payload versions through explicit migrators before listing or consumption.
- When this template changes again, update `Template Version`, `Last Updated`, and any migrator guidance needed for older unconsumed fragments.
