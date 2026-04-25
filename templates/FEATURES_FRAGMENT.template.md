# Features Fragment Template

> Template Contract. Keep filename `FEATURES_FRAGMENT.template.md`; APM discovers and syncs templates by this name.
> Managed document. Must comply with template FEATURES_FRAGMENT.template.md.

## 1. Template Contract Metadata

- Template Name: `FEATURES_FRAGMENT.template.md`
- Template Version: `1.5`
- Last Updated: `2026-04-23`
- Template Kind: `fragment`
- Owning Module: `Features`
- Generated Artifact: `FEATURES_FRAGMENT_*.md`

## 2. Contract / Allowed Schema

### Required Contract Rules

- Keep `Template Name`, `Template Version`, and `Last Updated` present and current.
- Keep the managed-document compliance note in generated artifacts.
- Preserve `APM:DATA` managed blocks when present, and keep JSON valid.

### Allowed Target Sections

- `features`
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

## Purpose

Use this fragment to propose active feature changes for `FEATURES.md`, especially when new planned work or reorganized planning needs to be merged safely.

## Required Sections

1. Executive Summary
2. Planned Feature Updates
3. Roadmap and Work Item Impact
4. Open Questions
5. Merge Guidance

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

- Version `1.5` moves AI-facing instructions and restrictions into the paired module AI file so this template stays artifact-focused.
- Version `1.4` moves AI behavior guidance into the paired module AI file and keeps this template artifact-focused.
- Version `1.3` adds the standardized Template Contract structure.
- Fragment consumers must migrate older payload versions through explicit migrators before listing or consumption.
- When this template changes again, update `Template Version`, `Last Updated`, and any migrator guidance needed for older unconsumed fragments.
