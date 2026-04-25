# AI Environment

> Template Contract. Keep filename `AI_ENVIRONMENT.template.md`; APM discovers and syncs templates by this name.
> Managed document. Must comply with template AI_ENVIRONMENT.template.md.

## 1. Template Contract Metadata

- Template Name: `AI_ENVIRONMENT.template.md`
- Template Version: `1.7`
- Last Updated: `2026-04-23`
- Template Kind: `document`
- Owning Module: `AI Environment`
- Generated Artifact: `AI_ENVIRONMENT.md`

## 2. Contract / Allowed Schema

### Required Contract Rules

- Keep `Template Name`, `Template Version`, and `Last Updated` present and current.
- Keep the managed-document compliance note in generated artifacts.
- Preserve `APM:DATA` managed blocks when present, and keep JSON valid.

### Allowed Target Sections

- This is a generated document contract; update module state or consume fragments instead of editing generated output directly.

## 3. Actual Template

## Purpose

This document governs how AI agents should operate within the project.

## Top-Level Fragment Rule

- Generate managed fragments in the runtime fragments directory, not in project `docs`.
- Use `data/projects/<project-id>/fragments/` for project-specific fragments.
- Use `data/projects/shared/fragments/` only for intentionally shared fragment library files.
- Generated markdown documents in `docs` are outputs, not the place to draft new fragments.

## Required Sections

1. Mission
2. Operating Model
3. Communication Style
4. APM Term Dictionary
5. Custom Instructions
6. Applied Shared Profiles
7. Module AI and Template References
8. Locked System Directives
9. Module Directive Index
10. Project-Level Required Behaviors
11. Project-Level Module Update Rules
12. Project Family Read Order
13. Project Family Inheritance Rules
14. Project-Level Data Structure and Phrasing Rules
15. Project-Level Avoid / Guardrails
16. Handoff Checklist

## 4. Examples

```md
# AI_ENVIRONMENT.md: {{PROJECT_NAME}}

> Managed document. Must comply with template AI_ENVIRONMENT.template.md.
```

## 5. Merge / Consumption Rules

- APM copies this template into the active project workspace and records its version/hash in the template registry.
- If this is a fragment template, APM discovers matching fragment files from the configured project fragments folder and shared fragments folder.
- The consuming module validates managed metadata and applies supported operations to structured module state.
- After consumption, generated markdown is regenerated from module state; stale fragment files may be archived or deleted according to the module workflow.

## 6. Version / Migration Notes

- Version `1.7` moves AI-facing instructions and restrictions into the paired module AI file so this template stays artifact-focused.
- Version `1.6` aligns the AI Environment document template with module AI references and the expanded section ordering.
- Version `1.5` moves AI behavior guidance into the paired module AI file and keeps this template artifact-focused.
- Version `1.4` adds the standardized Template Contract structure.
- Fragment consumers must migrate older payload versions through explicit migrators before listing or consumption.
- When this template changes again, update `Template Version`, `Last Updated`, and any migrator guidance needed for older unconsumed fragments.
