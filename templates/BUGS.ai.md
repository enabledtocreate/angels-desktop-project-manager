# Bugs Module AI

> Module AI file. Keep filename `BUGS.ai.md`; APM discovers and syncs module AI files by this name.
> Read this file after `AI_ENVIRONMENT.md` and before generating or updating Bugs documents or fragments.

## 1. AI File Metadata

- AI File Name: `BUGS.ai.md`
- AI File Version: `1.4`
- Last Updated: `2026-04-25`
- Owning Module: `Bugs`
- Document Template: `BUGS.template.md`
- Fragment Template: `BUGS_FRAGMENT.template.md`

## 2. Module Purpose

Use Bugs to track active software defects, their lifecycle states, and the documentation follow-up required when fixes land.

## 3. Source Of Truth

- Read `AI_ENVIRONMENT.md` first for global operating rules, fragment-path rules, stable-id rules, and standards references.
- Read `BUGS.template.md` for the literal document shape that APM generates.
- Read `BUGS_FRAGMENT.template.md` for the literal fragment shape that APM can consume.
- Treat generated markdown as an output of module state; prefer module saves or compliant fragments over direct edits.

## 4. Document Rules

- BUGS.md should focus on active bugs and the documented lifecycle workflow.
- Closed or resolved bugs belong in archived history rather than the active list.
- State, phase, category, and linked module ids should remain structured and readable.

## 5. Fragment Rules

- Use BUGS fragments for adding, updating, archiving, or restoring bugs through supported operations.
- When a bug fix changes canonical behavior, use fragments in downstream modules to attach the bug code to the affected stable ids.
- Use explicit target sections and item ids for state changes.

## 6. Allowed Values / Contracts

- Active bug states are open, triaged, in progress, blocked, fixed, verifying, or regressed.
- Archived bugs represent implemented or historically tracked items and should not stay in the live list.
- Keep bug codes, stable ids, and linked module references distinct.

## 7. Cross-Module Rules

- Bug fixes may require follow-up in PRD, Functional Spec, Test Strategy, Architecture, or Change Log.
- Use module references and work-item codes to make the documentation trail visible.

## 8. Guardrails

- Do not keep resolved or closed bugs in the active bug list.
- Do not edit BUGS.md directly when the bug module or bug fragments should own the change.

## 9. Template Construction Rules

- Use token references where helpful: `@stable-id` for persisted targets, `#module-or-section` for document/module scope, `$work-item-code` for provenance, `/operation` for intended action, `?question` for review points, and `!guardrail` for constraints.
- Token references supplement structured operations and target ids; they do not replace explicit fields such as operation, targetSection, targetItemId, sourceRefs, or managed payload data.
- Use stable bug IDs when they already exist.
- Be explicit about current behavior, expected behavior, and validation impact.
- Note whether the bug should stay planned, move to implemented history, or trigger follow-up work elsewhere.
- Use stable ids for persisted document items, fragment targets, graph nodes, graph edges, models, and projections.
- Keep titles concise; put long detail in description or body fields.

### BUGS.template.md

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

#### Imported Merge Notes

- APM copies this template into the active project workspace and records its version/hash in the template registry.
- If this is a fragment template, APM discovers matching fragment files from the configured project fragments folder and shared fragments folder.
- The consuming module validates managed metadata and applies supported operations to structured module state.
- After consumption, generated markdown is regenerated from module state; stale fragment files may be archived or deleted according to the module workflow.

### BUGS_FRAGMENT.template.md

- Template role: Fill-in contract only. Keep behavioral guidance in this AI file, not in the paired template.
- Direct mappings: APM detects uppercase mustache placeholders from the template and treats them as fill-in slots.
- Fill-in slots: none currently defined.

#### Imported Construction Contract

### Required Contract Rules

- Keep `Template Name`, `Template Version`, and `Last Updated` present and current.
- Keep the managed-document compliance note in generated artifacts.
- Preserve `APM:DATA` managed blocks when present, and keep JSON valid.

### Allowed Target Sections

- `bugs`
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
