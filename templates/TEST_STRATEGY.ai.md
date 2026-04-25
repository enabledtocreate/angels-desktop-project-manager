# Test Strategy Module AI

> Module AI file. Keep filename `TEST_STRATEGY.ai.md`; APM discovers and syncs module AI files by this name.
> Read this file after `AI_ENVIRONMENT.md` and before generating or updating Test Strategy documents or fragments.

## 1. AI File Metadata

- AI File Name: `TEST_STRATEGY.ai.md`
- AI File Version: `1.4`
- Last Updated: `2026-04-25`
- Owning Module: `Test Strategy`
- Document Template: `TEST_STRATEGY.template.md`
- Fragment Template: `TEST_STRATEGY_FRAGMENT.template.md`

## 2. Module Purpose

Use Test Strategy to capture how the project verifies behavior, prevents regressions, and translates features or bug fixes into validation work.

## 3. Source Of Truth

- Read `AI_ENVIRONMENT.md` first for global operating rules, fragment-path rules, stable-id rules, and standards references.
- Read `TEST_STRATEGY.template.md` for the literal document shape that APM generates.
- Read `TEST_STRATEGY_FRAGMENT.template.md` for the literal fragment shape that APM can consume.
- Treat generated markdown as an output of module state; prefer module saves or compliant fragments over direct edits.

## 4. Document Rules

- Generate TEST_STRATEGY.md as structured verification guidance rather than ad hoc notes.
- Keep testing layers, coverage expectations, regression guidance, environments, and open risks clear.
- Tie important testing expectations back to features, bugs, and module behavior.

## 5. Fragment Rules

- Use TEST_STRATEGY fragments to add, revise, or retire test guidance as implementation evolves.
- Bug fixes should usually produce regression-test follow-up here.
- Use explicit target sections and stable ids for updates.

## 6. Allowed Values / Contracts

- Test Strategy owns verification guidance, not product requirements.
- Keep traceability to work-item codes and affected modules visible.
- Respect paired template structure and fragment operations.

## 7. Cross-Module Rules

- Test Strategy should follow changes in PRD, Functional Spec, Technical Design, Bugs, and Architecture.
- Regression expectations often need to be attached to bug and feature work.

## 8. Guardrails

- Do not leave regression expectations implied only in bug history.
- Do not edit generated TEST_STRATEGY.md directly.

## 9. Template Construction Rules

- Use token references where helpful: `@stable-id` for persisted targets, `#module-or-section` for document/module scope, `$work-item-code` for provenance, `/operation` for intended action, `?question` for review points, and `!guardrail` for constraints.
- Token references supplement structured operations and target ids; they do not replace explicit fields such as operation, targetSection, targetItemId, sourceRefs, or managed payload data.
- Keep the fragment focused on how the project should be validated.
- Call out which modules or requirements are affected by the proposed changes.
- Use stable ids for persisted document items, fragment targets, graph nodes, graph edges, models, and projections.
- Keep titles concise; put long detail in description or body fields.
- Tie validation effort back to Functional Spec, Architecture, Features, and Bugs.
- Focus on proving behavior and reducing project risk.

### TEST_STRATEGY.template.md

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

### TEST_STRATEGY_FRAGMENT.template.md

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
