# BUGS Template

> Template Contract. Keep filename `BUGS.template.md`; APM discovers and syncs templates by this name.
> Managed document. Must comply with template BUGS.template.md.

## 1. Template Contract Metadata

- Template Name: `BUGS.template.md`
- Template Version: `1.3`
- Last Updated: `2026-04-23`
- Template Kind: `document`
- Owning Module: `Bugs`
- Generated Artifact: `BUGS.md`

## 2. Contract / Allowed Schema

### Required Contract Rules

- Keep `Template Name`, `Template Version`, and `Last Updated` present and current.
- Keep the managed-document compliance note in generated artifacts.
- Preserve `APM:DATA` managed blocks when present, and keep JSON valid.

### Allowed Target Sections

- This is a generated document contract; update module state or consume fragments instead of editing generated output directly.

## 3. Actual Template

This document defines the required structure for `BUGS.md`.

Rules:
- Keep the `APM:DATA` managed block intact and valid JSON.
- Preserve the workflow-first structure with `## 1. Bug Workflow` before any bug entries.
- Preserve the approved lifecycle vocabulary and active/archive rules.
- Each bug must preserve its tracking ID.
- Each bug must include both `Current Behavior` and `Expected Behavior`.
- Only active bugs belong in `BUGS.md`.
- Resolved and closed bugs move into archived workspace follow-up notes under `.apm/_WORKSPACE` instead of remaining in the main document.
- Completed and regressed states must stay explicit.
- Preserve optional `@item-id` association hints when they exist.
- Preserve the `## Mermaid` section.

## 4. Examples

```md
# BUGS.md: {{PROJECT_NAME}}

> Managed document. Must comply with template BUGS.template.md.
```

## 5. Merge / Consumption Rules

- APM copies this template into the active project workspace and records its version/hash in the template registry.
- If this is a fragment template, APM discovers matching fragment files from the configured project fragments folder and shared fragments folder.
- The consuming module validates managed metadata and applies supported operations to structured module state.
- After consumption, generated markdown is regenerated from module state; stale fragment files may be archived or deleted according to the module workflow.

## 6. Version / Migration Notes

- Version `1.3` moves AI-facing instructions and restrictions into the paired module AI file so this template stays artifact-focused.
- Version `1.2` moves AI behavior guidance into the paired module AI file and keeps this template artifact-focused.
- Version `1.1` adds the standardized Template Contract structure.
- Fragment consumers must migrate older payload versions through explicit migrators before listing or consumption.
- When this template changes again, update `Template Version`, `Last Updated`, and any migrator guidance needed for older unconsumed fragments.
