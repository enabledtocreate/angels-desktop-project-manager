# Features Module AI

> Module AI file. Keep filename `FEATURES.ai.md`; APM discovers and syncs module AI files by this name.
> Read this file after `AI_ENVIRONMENT.md` and before generating or updating Features documents or fragments.

## 1. AI File Metadata

- AI File Name: `FEATURES.ai.md`
- AI File Version: `1.4`
- Last Updated: `2026-04-25`
- Owning Module: `Features`
- Document Template: `FEATURES.template.md`
- Fragment Template: `FEATURES_FRAGMENT.template.md`

## 2. Module Purpose

Use Features as the planning register for planned, considered, phased, and archived features, with downstream documentation handled by AI-created destination fragments.

## 3. Source Of Truth

- Read `AI_ENVIRONMENT.md` first for global operating rules, fragment-path rules, stable-id rules, and standards references.
- Read `FEATURES.template.md` for the literal document shape that APM generates.
- Read `FEATURES_FRAGMENT.template.md` for the literal fragment shape that APM can consume.
- Treat generated markdown as an output of module state; prefer module saves or compliant fragments over direct edits.

## 4. Document Rules

- FEATURES.md should represent planned and pending work, not duplicate implemented canonical behavior in other documents.
- Archived features represent implemented or completed planning items and should be separated from active planning buckets.
- Keep planning buckets, phase assignments, and work-item codes structured.

## 5. Fragment Rules

- Use FEATURES fragments to change planning state, descriptions, codes, or traceability metadata.
- Do not let the application auto-generate destination document fragments; only AI agents should do that.
- When a feature is implemented, downstream module fragments should carry the feature code to the affected stable ids.

## 6. Allowed Values / Contracts

- Keep feature codes stable and distinct from document stable ids.
- Preserve planning buckets and archive semantics.
- Use explicit target sections and work-item references in fragments.

## 7. Cross-Module Rules

- Implemented features may need follow-up in PRD, Architecture, Functional Spec, Domain Models, Change Log, and Test Strategy.
- Features is the planning register; downstream modules carry the canonical implemented behavior.

## 8. Guardrails

- Do not add implemented, completed, done, closed, or archived features back into the generated `FEATURES.md` document.
- Do not render implemented, completed, done, closed, or archived features in the generated document; those remain available through database-backed history/archive views.
- Do not auto-create destination fragments from the Features UI or server code.
- Do not treat FEATURES.md as the final source of implemented product truth.

## 9. Template Construction Rules

- Use token references where helpful: `@stable-id` for persisted targets, `#module-or-section` for document/module scope, `$work-item-code` for provenance, `/operation` for intended action, `?question` for review points, and `!guardrail` for constraints.
- Token references supplement structured operations and target ids; they do not replace explicit fields such as operation, targetSection, targetItemId, sourceRefs, or managed payload data.
- Treat `Planned Features` as work still to be implemented.
- Historical feature records remain in the database-backed archive/history views.
- Reference stable feature IDs whenever they exist.
- Note whether roadmap phases, PRD content, or other modules need follow-up updates.
- Use stable ids for persisted document items, fragment targets, graph nodes, graph edges, models, and projections.
- Keep titles concise; put long detail in description or body fields.

### FEATURES.template.md

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

This document defines the required structure for `FEATURES.md`.

Rules:
- Keep the `APM:DATA` managed block intact and valid JSON.
- Each feature must preserve its tracking ID.
- If a feature is assigned to a roadmap phase, preserve that linkage.
- Keep the AI-agent instruction about updating `PRD.md` when implementation is completed.
- Render only active, unfinished feature work in `FEATURES.md`.
- Preserve the `## Mermaid` section.

#### Imported Merge Notes

- APM copies this template into the active project workspace and records its version/hash in the template registry.
- If this is a fragment template, APM discovers matching fragment files from the configured project fragments folder and shared fragments folder.
- The consuming module validates managed metadata and applies supported operations to structured module state.
- After consumption, generated markdown is regenerated from module state; stale fragment files may be archived or deleted according to the module workflow.

### FEATURES_FRAGMENT.template.md

- Template role: Fill-in contract only. Keep behavioral guidance in this AI file, not in the paired template.
- Direct mappings: APM detects uppercase mustache placeholders from the template and treats them as fill-in slots.
- Fill-in slots: none currently defined.

#### Imported Construction Contract

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

#### Imported Artifact Shape Notes

No extra artifact-shape notes were imported from the paired template.

#### Imported Merge Notes

- APM copies this template into the active project workspace and records its version/hash in the template registry.
- If this is a fragment template, APM discovers matching fragment files from the configured project fragments folder and shared fragments folder.
- The consuming module validates managed metadata and applies supported operations to structured module state.
- After consumption, generated markdown is regenerated from module state; stale fragment files may be archived or deleted according to the module workflow.
