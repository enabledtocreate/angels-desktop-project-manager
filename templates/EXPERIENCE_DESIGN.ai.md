# Experience Design Module AI

> Module AI file. Keep filename `EXPERIENCE_DESIGN.ai.md`; APM discovers and syncs module AI files by this name.
> Read this file after `AI_ENVIRONMENT.md` and before generating or updating Experience Design documents or fragments.

## 1. AI File Metadata

- AI File Name: `EXPERIENCE_DESIGN.ai.md`
- AI File Version: `1.4`
- Last Updated: `2026-04-25`
- Owning Module: `Experience Design`
- Document Template: `EXPERIENCE_DESIGN.template.md`
- Fragment Template: `EXPERIENCE_DESIGN_FRAGMENT.template.md`

## 2. Module Purpose

Use Experience Design to describe interface structure, user-visible behavior, interaction flows, and view-to-workflow connections without binding the design to a single UI framework too early.

## 3. Source Of Truth

- Read `AI_ENVIRONMENT.md` first for global operating rules, fragment-path rules, stable-id rules, and standards references.
- Read `EXPERIENCE_DESIGN.template.md` for the literal document shape that APM generates.
- Read `EXPERIENCE_DESIGN_FRAGMENT.template.md` for the literal fragment shape that APM can consume.
- Treat generated markdown as an output of module state; prefer module saves or compliant fragments over direct edits.

## 4. Document Rules

- Generate EXPERIENCE_DESIGN.md from structured design state rather than brittle freeform lists.
- Keep user-visible views, flows, controls, states, and references stable-id addressable.
- Use it as the module that connects visual experience to functional workflows.

## 5. Fragment Rules

- Use EXPERIENCE_DESIGN fragments to update views, states, component groups, transitions, or workflow attachments.
- Target stable ids for screens, components, flows, and interaction points.
- Keep experience updates connected to functional control points when relevant.

## 6. Allowed Values / Contracts

- Experience Design remains framework-neutral until a stack-specific projection is needed.
- Stable ids should exist for addressable design surfaces and attachments.
- Use template-approved sections and operation names.

## 7. Cross-Module Rules

- Experience Design should connect to Functional Spec, Domain Models, Architecture, and eventually Technical Design.
- UI references may point into functional flows using stable ids.

## 8. Guardrails

- Do not collapse Experience Design into CSS or implementation code too early.
- Do not edit generated EXPERIENCE_DESIGN.md directly.

## 9. Template Construction Rules

- Use token references where helpful: `@stable-id` for persisted targets, `#module-or-section` for document/module scope, `$work-item-code` for provenance, `/operation` for intended action, `?question` for review points, and `!guardrail` for constraints.
- Token references supplement structured operations and target ids; they do not replace explicit fields such as operation, targetSection, targetItemId, sourceRefs, or managed payload data.
- Keep the language user-facing.
- Make state changes and edge cases explicit so implementation and testing can follow.
- Use stable ids for persisted document items, fragment targets, graph nodes, graph edges, models, and projections.
- Keep titles concise; put long detail in description or body fields.
- Focus on how the interface should behave for users.
- Keep it aligned with the PRD and Functional Spec.

### EXPERIENCE_DESIGN.template.md

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

### EXPERIENCE_DESIGN_FRAGMENT.template.md

- Template role: Fill-in contract only. Keep behavioral guidance in this AI file, not in the paired template.
- Direct mappings: APM detects uppercase mustache placeholders from the template and treats them as fill-in slots.
- Fill-in slots: none currently defined.

#### Imported Construction Contract

### Required Contract Rules

- Keep `Template Name`, `Template Version`, and `Last Updated` present and current.
- Keep the managed-document compliance note in generated artifacts.
- Preserve `APM:DATA` managed blocks when present, and keep JSON valid.

### Allowed Target Sections

- `open-questions`
- `working-content`

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
