# ADR Module AI

> Module AI file. Keep filename `ADR.ai.md`; APM discovers and syncs module AI files by this name.
> Read this file after `AI_ENVIRONMENT.md` and before generating or updating ADR documents or fragments.

## 1. AI File Metadata

- AI File Name: `ADR.ai.md`
- AI File Version: `1.4`
- Last Updated: `2026-04-25`
- Owning Module: `ADR`
- Document Template: `ADR.template.md`
- Fragment Template: `ADR_FRAGMENT.template.md`

## 2. Module Purpose

Use ADR to capture durable architectural decisions, their context, alternatives, and consequences.

## 3. Source Of Truth

- Read `AI_ENVIRONMENT.md` first for global operating rules, fragment-path rules, stable-id rules, and standards references.
- Read `ADR.template.md` for the literal document shape that APM generates.
- Read `ADR_FRAGMENT.template.md` for the literal fragment shape that APM can consume.
- Treat generated markdown as an output of module state; prefer module saves or compliant fragments over direct edits.

## 4. Document Rules

- Generate ADR.md as a structured register of architecture decisions rather than a loose narrative.
- Each ADR entry should clearly state status, context, decision, consequences, and references.
- Keep ADRs durable and revision-friendly.

## 5. Fragment Rules

- Use ADR fragments to add, revise, supersede, or annotate architectural decisions.
- Link ADR changes to Architecture and any affected work-item codes.
- Use stable ids for ADR entries when present.

## 6. Allowed Values / Contracts

- ADR entries are architecture-decision records, not implementation tickets.
- Keep statuses and cross-references explicit.
- Follow fragment operation and section rules from the paired templates.

## 7. Cross-Module Rules

- ADR follows Architecture changes and may influence Technical Design and Test Strategy.
- Significant architecture shifts should usually produce or update ADR records.

## 8. Guardrails

- Do not bury architecture decisions only inside Architecture or Technical Design if they deserve an ADR.
- Do not edit generated ADR.md directly when fragments or module state should own the change.

## 9. Template Construction Rules

- Use token references where helpful: `@stable-id` for persisted targets, `#module-or-section` for document/module scope, `$work-item-code` for provenance, `/operation` for intended action, `?question` for review points, and `!guardrail` for constraints.
- Token references supplement structured operations and target ids; they do not replace explicit fields such as operation, targetSection, targetItemId, sourceRefs, or managed payload data.
- Keep the fragment focused on one decision at a time.
- Reference the affected architecture area, rationale, and downstream tradeoffs clearly.
- Use this fragment when a significant architectural decision is introduced, changed, or reversed.
- For section-targeted changes, include an `APM:OPERATIONS` HTML comment block with JSON operations such as `add`, `update`, `remove`, `reorder`, `move`, `link`, and `unlink`.
- Use stable ids for persisted document items, fragment targets, graph nodes, graph edges, models, and projections.
- Keep titles concise; put long detail in description or body fields.
- Keep the `APM:DATA` managed block intact and valid JSON.
- Keep the top compliance note intact.
- Preserve the section order defined in this template.
- ADRs should record important decisions, not replace the Architecture document.
- If this template structure changes, update the version section before making any other structural edits.
- AI Agent instruction: Whenever this template is updated, update the template version and last updated date before changing any section definitions.
- `ADR.md` is a managed document generated from application state.
- The application database is the source of truth for ADR editor fields and generated markdown.
- Architecture describes the broader system design; ADR records explain significant architectural decisions and their tradeoffs.
- Significant architecture changes should update Architecture and create or update ADR entries.
- If a disk file conflicts with database state, the application may regenerate this file from the database.

### ADR.template.md

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

This document defines the required structure for `ADR.md`.

#### Imported Merge Notes

- APM copies this template into the active project workspace and records its version/hash in the template registry.
- If this is a fragment template, APM discovers matching fragment files from the configured project fragments folder and shared fragments folder.
- The consuming module validates managed metadata and applies supported operations to structured module state.
- After consumption, generated markdown is regenerated from module state; stale fragment files may be archived or deleted according to the module workflow.

### ADR_FRAGMENT.template.md

- Template role: Fill-in contract only. Keep behavioral guidance in this AI file, not in the paired template.
- Direct mappings: APM detects uppercase mustache placeholders from the template and treats them as fill-in slots.
- Fill-in slots: none currently defined.

#### Imported Construction Contract

### Required Contract Rules

- Keep `Template Name`, `Template Version`, and `Last Updated` present and current.
- Keep the managed-document compliance note in generated artifacts.
- Preserve `APM:DATA` managed blocks when present, and keep JSON valid.

### Allowed Target Sections

- `alternatives`
- `consequences`
- `related-architecture`
- `related-modules`
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

#### Imported Artifact Shape Notes

No extra artifact-shape notes were imported from the paired template.

#### Imported Merge Notes

- APM copies this template into the active project workspace and records its version/hash in the template registry.
- If this is a fragment template, APM discovers matching fragment files from the configured project fragments folder and shared fragments folder.
- The consuming module validates managed metadata and applies supported operations to structured module state.
- After consumption, generated markdown is regenerated from module state; stale fragment files may be archived or deleted according to the module workflow.
