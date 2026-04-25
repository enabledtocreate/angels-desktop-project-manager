# AI Environment Module AI

> Module AI file. Keep filename `AI_ENVIRONMENT.ai.md`; APM discovers and syncs module AI files by this name.
> Read this file after `AI_ENVIRONMENT.md` and before generating or updating AI Environment documents or fragments.

## 1. AI File Metadata

- AI File Name: `AI_ENVIRONMENT.ai.md`
- AI File Version: `1.4`
- Last Updated: `2026-04-25`
- Owning Module: `AI Environment`
- Document Template: `AI_ENVIRONMENT.template.md`
- Fragment Template: `AI_ENVIRONMENT_FRAGMENT.template.md`

## 2. Module Purpose

Use AI Environment as the first point of contact for outside AI agents so they understand how to work in the project before reading module-local AI files.

## 3. Source Of Truth

- Read `AI_ENVIRONMENT.md` first for global operating rules, fragment-path rules, stable-id rules, and standards references.
- Read `AI_ENVIRONMENT.template.md` for the literal document shape that APM generates.
- Read `AI_ENVIRONMENT_FRAGMENT.template.md` for the literal fragment shape that APM can consume.
- Treat generated markdown as an output of module state; prefer module saves or compliant fragments over direct edits.

## 4. Document Rules

- Generate AI_ENVIRONMENT.md as the top-level operating manual for agents.
- Keep project-wide mission, operating model, communication style, dictionary, and enabled directive references readable and current.
- Reference module AI files rather than duplicating all module-local rules here.

## 5. Fragment Rules

- Use AI_ENVIRONMENT fragments to change top-level agent behavior, dictionary terms, project-wide guardrails, or shared profiles.
- Module-local AI behavior belongs in the owning module AI file, not duplicated fragments here, unless the module emits a reference to AI Environment.
- Keep fragment updates structured and stable-id addressable.

## 6. Allowed Values / Contracts

- AI Environment is project-wide guidance, not module-local artifact detail.
- Keep references to module AI files, document templates, and fragment templates current.
- Locked required directives remain code-owned and cannot be edited away.

## 7. Cross-Module Rules

- AI Environment should point agents toward module AI files, standards, and target templates.
- Module-emitted directives may appear in AI Environment as references, but the detailed rules stay in the module AI files.

## 8. Guardrails

- Do not duplicate every module rule body into AI_ENVIRONMENT.md.
- Do not let optional project guidance override locked code-owned directives.

## 9. Template Construction Rules

- Use token references where helpful: `@stable-id` for persisted targets, `#module-or-section` for document/module scope, `$work-item-code` for provenance, `/operation` for intended action, `?question` for review points, and `!guardrail` for constraints.
- Token references supplement structured operations and target ids; they do not replace explicit fields such as operation, targetSection, targetItemId, sourceRefs, or managed payload data.
- Keep instructions human-readable and AI-readable.
- Preserve locked directives and treat them as non-editable system rules.
- Describe why the new directive is needed and which project or module workflow it affects.
- For section-targeted changes, include an `APM:OPERATIONS` HTML comment block with JSON operations such as `add`, `update`, `remove`, `reorder`, `move`, `link`, and `unlink`.
- Use stable ids for persisted document items, fragment targets, graph nodes, graph edges, models, and projections.
- Keep titles concise; put long detail in description or body fields.
- Token references supplement structured fragment operations and target ids; they do not replace explicit fields such as operation, targetSection, targetItemId, sourceRefs, or managed payload data.
- Treat this as AI-readable operating context.
- Put non-directive project context before directive sections so agents understand APM terminology, purpose, and operating model before reading rules.
- Include a markdown table for the APM term dictionary with term, definition, stable ID, and source refs.
- Include references to module AI files first, then the paired document and fragment templates.
- Keep instructions deterministic, explicit, and safe for structured updates.
- Prefer short titles with clear descriptions for repeatable rules.
- For parent/child projects, preserve project autonomy, use rollups as read-only summaries, and reference cross-project work by project id plus module/item id.
- When generating fragments, use token references where helpful: `@stable-id` for persisted targets, `#module-or-section` for document/module scope, `$work-item-code` for feature/bug/task provenance, `/operation` for intended actions, `?question` for unresolved review points, and `!guardrail` for constraints.

### AI_ENVIRONMENT.template.md

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

### AI_ENVIRONMENT_FRAGMENT.template.md

- Template role: Fill-in contract only. Keep behavioral guidance in this AI file, not in the paired template.
- Direct mappings: APM detects uppercase mustache placeholders from the template and treats them as fill-in slots.
- Fill-in slots: none currently defined.

#### Imported Construction Contract

### Required Contract Rules

- Keep `Template Name`, `Template Version`, and `Last Updated` present and current.
- Keep the managed-document compliance note in generated artifacts.
- Preserve `APM:DATA` managed blocks when present, and keep JSON valid.

### Allowed Target Sections

- `term-dictionary`
- `required-behaviors`
- `module-update-rules`
- `project-family-read-order`
- `project-family-inheritance-rules`
- `data-phrasing-rules`
- `avoid-rules`
- `handoff-checklist`
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
