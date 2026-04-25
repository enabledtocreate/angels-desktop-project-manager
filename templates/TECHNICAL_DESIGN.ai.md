# Technical Design Module AI

> Module AI file. Keep filename `TECHNICAL_DESIGN.ai.md`; APM discovers and syncs module AI files by this name.
> Read this file after `AI_ENVIRONMENT.md` and before generating or updating Technical Design documents or fragments.

## 1. AI File Metadata

- AI File Name: `TECHNICAL_DESIGN.ai.md`
- AI File Version: `1.4`
- Last Updated: `2026-04-25`
- Owning Module: `Technical Design`
- Document Template: `TECHNICAL_DESIGN.template.md`
- Fragment Template: `TECHNICAL_DESIGN_FRAGMENT.template.md`

## 2. Module Purpose

Use Technical Design to capture implementation-facing structure, stack decisions, library choices, integration patterns, and delivery constraints.

## 3. Source Of Truth

- Read `AI_ENVIRONMENT.md` first for global operating rules, fragment-path rules, stable-id rules, and standards references.
- Read `TECHNICAL_DESIGN.template.md` for the literal document shape that APM generates.
- Read `TECHNICAL_DESIGN_FRAGMENT.template.md` for the literal fragment shape that APM can consume.
- Treat generated markdown as an output of module state; prefer module saves or compliant fragments over direct edits.

## 4. Document Rules

- Generate TECHNICAL_DESIGN.md as the implementation-oriented companion to product, functional, and architecture documents.
- Capture technologies, frameworks, integration boundaries, migrations, deployment-relevant notes, and testing implications.
- Keep it concrete enough to guide implementation but separate from raw code listings.

## 5. Fragment Rules

- Use TECHNICAL_DESIGN fragments to add or revise implementation decisions, libraries, interfaces, deployment notes, or integration rules.
- Target stable ids where existing technical sections are already known.
- Tie changes to feature or bug codes when they represent delivered work.

## 6. Allowed Values / Contracts

- Technical Design owns implementation-facing detail, not user-facing workflow or product intent.
- Use clear stable ids and keep sections traceable to upstream modules.
- Respect template structure and fragment operation rules.

## 7. Cross-Module Rules

- Technical Design should read from PRD, Functional Spec, Domain Models, Architecture, and Database Schema.
- Library choices and integration patterns may affect Test Strategy and deployment guidance.

## 8. Guardrails

- Do not let Technical Design replace Architecture or PRD.
- Do not edit generated TECHNICAL_DESIGN.md directly when the module or fragments should own the change.

## 9. Template Construction Rules

- Use token references where helpful: `@stable-id` for persisted targets, `#module-or-section` for document/module scope, `$work-item-code` for provenance, `/operation` for intended action, `?question` for review points, and `!guardrail` for constraints.
- Token references supplement structured operations and target ids; they do not replace explicit fields such as operation, targetSection, targetItemId, sourceRefs, or managed payload data.
- Keep this tied to implementation details for a specific capability or subsystem.
- Note architecture, schema, and test impacts explicitly.
- Use stable ids for persisted document items, fragment targets, graph nodes, graph edges, models, and projections.
- Keep titles concise; put long detail in description or body fields.
- Keep the scope narrower than architecture.
- Explain how the design should be built, not just why it exists.

### TECHNICAL_DESIGN.template.md

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

### TECHNICAL_DESIGN_FRAGMENT.template.md

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
