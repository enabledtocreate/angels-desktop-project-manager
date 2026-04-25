# Functional Spec Template

> Template Contract. Keep filename `FUNCTIONAL_SPEC_FRAGMENT.template.md`; APM discovers and syncs templates by this name.
> Managed document. Must comply with template FUNCTIONAL_SPEC_FRAGMENT.template.md.

## 1. Template Contract Metadata

- Template Name: `FUNCTIONAL_SPEC_FRAGMENT.template.md`
- Template Version: `1.4`
- Last Updated: `2026-04-23`
- Template Kind: `fragment`
- Owning Module: `Functional Spec`
- Generated Artifact: `FUNCTIONAL_SPEC_FRAGMENT_*.md`

## 2. Contract / Allowed Schema

### Required Contract Rules

- Keep `Template Name`, `Template Version`, and `Last Updated` present and current.
- Keep the managed-document compliance note in generated artifacts.
- Preserve `APM:DATA` managed blocks when present, and keep JSON valid.

### Allowed Target Sections

- `functional-areas`
- `logical-flows`
- `flow-visuals`
- `flow-endpoints`
- `user-actions-and-system-responses`
- `validation-rules`
- `interface-expectations`
- `edge-cases`
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

# Functional Spec Fragment Template

## Purpose

Use this fragment to propose functional behavior changes without editing `FUNCTIONAL_SPEC.md` directly.

## Required Sections

1. Executive Summary
2. Functional Area Updates
3. Logical Flow Updates
4. Flow Node Updates
5. Flow Connection Updates
6. Flow Endpoints and Return Points
7. Open Questions
8. Merge Guidance

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

- Version `1.4` moves AI-facing instructions and restrictions into the paired module AI file so this template stays artifact-focused.
- Version `1.3` moves AI behavior guidance into the paired module AI file and keeps this template artifact-focused.
- Version `1.2` adds the standardized Template Contract structure.
- Fragment consumers must migrate older payload versions through explicit migrators before listing or consumption.
- When this template changes again, update `Template Version`, `Last Updated`, and any migrator guidance needed for older unconsumed fragments.
