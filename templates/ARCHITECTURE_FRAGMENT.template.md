# Architecture Template

> Template Contract. Keep filename `ARCHITECTURE_FRAGMENT.template.md`; APM discovers and syncs templates by this name.
> Managed document. Must comply with template ARCHITECTURE_FRAGMENT.template.md.

## 1. Template Contract Metadata

- Template Name: `ARCHITECTURE_FRAGMENT.template.md`
- Template Version: `2.4`
- Last Updated: `2026-04-23`
- Template Kind: `fragment`
- Owning Module: `Architecture`
- Generated Artifact: `ARCHITECTURE_FRAGMENT_*.md`

## 2. Contract / Allowed Schema

### Required Contract Rules

- Keep `Template Name`, `Template Version`, and `Last Updated` present and current.
- Keep the managed-document compliance note in generated artifacts.
- Preserve `APM:DATA` managed blocks when present, and keep JSON valid.

### Allowed Target Sections

- `tech-stack`
- `external-dependencies`
- `boundaries`
- `application-workflows`
- `architecture-workflows`
- `module-interactions`
- `project-family-orchestration`
- `child-project-boundaries`
- `cross-project-interfaces`
- `cross-cutting-concerns`
- `decisions`
- `constraints`
- `open-questions`

### Supported Operations

For `APM:OPERATIONS`, supported first-pass operations are:

- `add`
- `update`
- `remove`
- `reorder`
- `move`
- `link`
- `unlink`

Use explicit `targetSection`, `targetItemId`, `sourceRefs`, and `item` payloads. Token references supplement these fields; they do not replace them.

## 3. Actual Template

# Architecture Fragment Template

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

## 4. Examples

```json
[
  {
    "operation": "add",
    "targetSection": "open-questions",
    "item": {
      "title": "Example question",
      "description": "Replace this with a module-specific unresolved question."
    },
    "sourceRefs": ["FEAT-000"]
  }
]
```

## 5. Merge / Consumption Rules

- APM copies this template into the active project workspace and records its version/hash in the template registry.
- If this is a fragment template, APM discovers matching fragment files from the configured project fragments folder and shared fragments folder.
- The consuming module validates managed metadata and applies supported operations to structured module state.
- After consumption, generated markdown is regenerated from module state; stale fragment files may be archived or deleted according to the module workflow.

## 6. Version / Migration Notes

- Version `2.4` moves AI-facing instructions and restrictions into the paired module AI file so this template stays artifact-focused.
- Version `2.3` moves AI behavior guidance into the paired module AI file and keeps this template artifact-focused.
- Version `2.2` adds the standardized Template Contract structure.
- Fragment consumers must migrate older payload versions through explicit migrators before listing or consumption.
- When this template changes again, update `Template Version`, `Last Updated`, and any migrator guidance needed for older unconsumed fragments.
