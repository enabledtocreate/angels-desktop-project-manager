# Change Log Module AI

> Module AI file. Keep filename `CHANGELOG.ai.md`; APM discovers and syncs module AI files by this name.
> Read this file after `AI_ENVIRONMENT.md` and before generating or updating Change Log documents or fragments.

## 1. AI File Metadata

- AI File Name: `CHANGELOG.ai.md`
- AI File Version: `1.4`
- Last Updated: `2026-04-25`
- Owning Module: `Change Log`
- Document Template: `CHANGELOG.template.md`
- Fragment Template: `CHANGELOG_FRAGMENT.template.md`

## 2. Module Purpose

Use Change Log to keep a human-readable trail of document-impacting changes tied to work-item codes and stable ids.

## 3. Source Of Truth

- Read `AI_ENVIRONMENT.md` first for global operating rules, fragment-path rules, stable-id rules, and standards references.
- Read `CHANGELOG.template.md` for the literal document shape that APM generates.
- Read `CHANGELOG_FRAGMENT.template.md` for the literal fragment shape that APM can consume.
- Treat generated markdown as an output of module state; prefer module saves or compliant fragments over direct edits.

## 4. Document Rules

- Generate CHANGELOG.md from structured log entries rather than ad hoc prose.
- Entries should reference work-item codes, target documents, target sections, stable ids, and summary of change.
- Keep the log readable and chronological.

## 5. Fragment Rules

- Use CHANGELOG fragments to add or revise log entries without editing generated markdown directly.
- Prefer one structured entry per meaningful change set.
- Reference the affected work-item code and stable ids explicitly.

## 6. Allowed Values / Contracts

- Use stable ids for log entries when they are addressable.
- Keep titles concise and put detail in descriptions.
- Follow the fragment template operation rules.

## 7. Cross-Module Rules

- Change Log should reflect document-impacting feature and bug work across modules.
- Use it as the human-readable history layer, not as a replacement for module state.

## 8. Guardrails

- Do not use Change Log as a backlog or roadmap.
- Do not edit CHANGELOG.md directly when a fragment or module save should own the change.

## 9. Template Construction Rules

- Use token references where helpful: `@stable-id` for persisted targets, `#module-or-section` for document/module scope, `$work-item-code` for provenance, `/operation` for intended action, `?question` for review points, and `!guardrail` for constraints.
- Token references supplement structured operations and target ids; they do not replace explicit fields such as operation, targetSection, targetItemId, sourceRefs, or managed payload data.
- Prefer stable target item ids over section numbers when deciding what changed.
- Use section numbers as human-readable helpers, not as the only locator.
- Keep the fragment focused on one logical change set.
- Reference feature and bug codes whenever the change came from tracked work.
- For targeted updates to existing change entries, include an `APM:OPERATIONS` HTML comment block with JSON operations such as `add`, `update`, `remove`, `reorder`, `move`, `link`, and `unlink`.
- Use stable ids for persisted document items, fragment targets, graph nodes, graph edges, models, and projections.
- Keep titles concise; put long detail in description or body fields.
- Keep the `APM:DATA` managed block intact and valid JSON.
- Keep the top compliance note intact.
- Preserve the section order defined in this template.
- Each change entry must include work item codes, a target document, a target section number, and a stable target item id.
- Change history should remain human-readable and should not replace the canonical source documents.
- If this template structure changes, update the version section before making any other structural edits.
- AI Agent instruction: Whenever this template is updated, update the template version and last updated date before changing any section definitions.
- `CHANGELOG.md` is a managed document generated from application state.
- The application database is the source of truth for change log editor fields and generated markdown.
- The change log is a human-readable history layer that references feature and bug work item codes and points back to stable document item ids.
- Canonical product and system truth still lives in the corresponding managed docs such as `PRD.md`, `ARCHITECTURE.md`, `DATABASE_SCHEMA.md`, and others.
- If a disk file conflicts with database state, the application may regenerate this file from the database.

### CHANGELOG.template.md

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

This document defines the required structure for `CHANGELOG.md`.

#### Imported Merge Notes

- APM copies this template into the active project workspace and records its version/hash in the template registry.
- If this is a fragment template, APM discovers matching fragment files from the configured project fragments folder and shared fragments folder.
- The consuming module validates managed metadata and applies supported operations to structured module state.
- After consumption, generated markdown is regenerated from module state; stale fragment files may be archived or deleted according to the module workflow.

### CHANGELOG_FRAGMENT.template.md

- Template role: Fill-in contract only. Keep behavioral guidance in this AI file, not in the paired template.
- Direct mappings: APM detects uppercase mustache placeholders from the template and treats them as fill-in slots.
- Fill-in slots: none currently defined.

#### Imported Construction Contract

### Required Contract Rules

- Keep `Template Name`, `Template Version`, and `Last Updated` present and current.
- Keep the managed-document compliance note in generated artifacts.
- Preserve `APM:DATA` managed blocks when present, and keep JSON valid.

### Allowed Target Sections

- `entries`
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
