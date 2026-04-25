# ADR Template

> Template Contract. Keep filename `ADR.template.md`; APM discovers and syncs templates by this name.
> Managed document. Must comply with template ADR.template.md.

## 1. Template Contract Metadata

- Template Name: `ADR.template.md`
- Template Version: `2.3`
- Last Updated: `2026-04-23`
- Template Kind: `document`
- Owning Module: `ADR`
- Generated Artifact: `ADR.md`

## 2. Contract / Allowed Schema

### Required Contract Rules

- Keep `Template Name`, `Template Version`, and `Last Updated` present and current.
- Keep the managed-document compliance note in generated artifacts.
- Preserve `APM:DATA` managed blocks when present, and keep JSON valid.

### Allowed Target Sections

- This is a generated document contract; update module state or consume fragments instead of editing generated output directly.

## 3. Actual Template

This document defines the required structure for `ADR.md`.

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

## 4. Examples

```md
# ADR.md: {{PROJECT_NAME}}

> Managed document. Must comply with template ADR.template.md.
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
