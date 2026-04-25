# PRD Module AI

> Module AI file. Keep filename `PRD.ai.md`; APM discovers and syncs module AI files by this name.
> Read this file after `AI_ENVIRONMENT.md` and before generating or updating PRD documents or fragments.

## 1. AI File Metadata

- AI File Name: `PRD.ai.md`
- AI File Version: `1.4`
- Last Updated: `2026-04-25`
- Owning Module: `PRD`
- Document Template: `PRD.template.md`
- Fragment Template: `PRD_FRAGMENT.template.md`

## 2. Module Purpose

Use PRD to describe what the product must do, for whom, and under what constraints, while keeping stable section ids for downstream updates.

## 3. Source Of Truth

- Read `AI_ENVIRONMENT.md` first for global operating rules, fragment-path rules, stable-id rules, and standards references.
- Read `PRD.template.md` for the literal document shape that APM generates.
- Read `PRD_FRAGMENT.template.md` for the literal fragment shape that APM can consume.
- Treat generated markdown as an output of module state; prefer module saves or compliant fragments over direct edits.

## 4. Document Rules

- Generate PRD.md with consistent hierarchical numbering and stable ids for section items.
- Keep titles concise and descriptions rich enough to stand on their own.
- Use feature and bug codes as traceability tags attached to relevant items.

## 5. Fragment Rules

- Use PRD fragments to add, update, remove, reorder, or link structured PRD items.
- Target stable ids directly whenever an item already exists.
- Attach source refs and work-item codes so downstream reasoning stays traceable.

## 6. Allowed Values / Contracts

- Maintain section and subsection numbering consistency.
- Keep human-readable ids and stored stable ids aligned but distinct.
- Use target sections and supported operations from the fragment template.

## 7. Cross-Module Rules

- PRD should align with Features, Functional Spec, Architecture, Domain Models, and Test Strategy.
- Implemented feature behavior should move into canonical documents and out of future-enhancement planning lists.

## 8. Guardrails

- Do not edit generated PRD.md directly.
- Do not let titles collapse into truncated descriptions.

## 9. Template Construction Rules

- AI agents should update this fragment instead of editing `PRD.md` directly.
- Use token references where helpful: `@stable-id` for persisted targets, `#module-or-section` for document/module scope, `$work-item-code` for provenance, `/operation` for intended action, `?question` for review points, and `!guardrail` for constraints.
- Token references supplement structured operations and target ids; they do not replace explicit fields such as operation, targetSection, targetItemId, sourceRefs, or managed payload data.
- Use stable ids for persisted document items, fragment targets, graph nodes, graph edges, models, and projections.
- Keep titles concise; put long detail in description or body fields.

### PRD.template.md

- Template role: Fill-in contract only. Keep behavioral guidance in this AI file, not in the paired template.
- Direct mappings: APM detects uppercase mustache placeholders from the template and treats them as fill-in slots.
- Fill-in slots: `{{PROJECT_NAME}}`

#### Imported Construction Contract

### Required Contract Rules

- Keep `Template Name`, `Template Version`, and `Last Updated` present and current.
- Keep the managed-document compliance note in generated artifacts.
- Preserve `APM:DATA` managed blocks when present, and keep JSON valid.

### Allowed Target Sections

- This is a generated document contract; update module state or consume fragments instead of editing generated output directly.

#### Imported Artifact Shape Notes

No extra artifact-shape notes were imported from the paired template.

#### Imported Merge Notes

- APM copies this template into the active project workspace and records its version/hash in the template registry.
- If this is a fragment template, APM discovers matching fragment files from the configured project fragments folder and shared fragments folder.
- The consuming module validates managed metadata and applies supported operations to structured module state.
- After consumption, generated markdown is regenerated from module state; stale fragment files may be archived or deleted according to the module workflow.

### PRD_FRAGMENT.template.md

- Template role: Fill-in contract only. Keep behavioral guidance in this AI file, not in the paired template.
- Direct mappings: APM detects uppercase mustache placeholders from the template and treats them as fill-in slots.
- Fill-in slots: `{{FEATURE_CODE}}`, `{{FEATURE_TITLE}}`

#### Imported Construction Contract

### Required Contract Rules

- Keep `Template Name`, `Template Version`, and `Last Updated` present and current.
- Keep the managed-document compliance note in generated artifacts.
- Preserve `APM:DATA` managed blocks when present, and keep JSON valid.

### Allowed Target Sections

- `product-overview-target-audience`
- `product-overview-key-value-propositions`
- `functional-requirements-workflows`
- `functional-requirements-user-actions`
- `functional-requirements-system-behaviors`
- `technical-architecture`
- `implementation-plan-sequencing`
- `implementation-plan-dependencies`
- `implementation-plan-milestones`
- `success-metrics`
- `risks-and-mitigations`
- `future-enhancements`

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

#### Imported Artifact Shape Notes

No extra artifact-shape notes were imported from the paired template.

#### Imported Merge Notes

- APM copies this template into the active project workspace and records its version/hash in the template registry.
- If this is a fragment template, APM discovers matching fragment files from the configured project fragments folder and shared fragments folder.
- The consuming module validates managed metadata and applies supported operations to structured module state.
- After consumption, generated markdown is regenerated from module state; stale fragment files may be archived or deleted according to the module workflow.
