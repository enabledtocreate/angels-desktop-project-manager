# Test Strategy Module AI

> Module AI file. Keep filename `TEST_STRATEGY.ai.md`; APM discovers and syncs module AI files by this name.
> Read this file after `AI_ENVIRONMENT.md` and before generating or updating Test Strategy documents or fragments.

## 1. AI File Metadata

- AI File Name: `TEST_STRATEGY.ai.md`
- AI File Version: `1.10`
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

### Placeholder Syntax

- `{{NAME}}`: required single value.
- `{{NAME:OPTION_A|OPTION_B}}`: select one allowed value.
- `{{NAME:0..1}}`: optional value or optional block.
- `{{NAME:0..N}}`: repeatable value, list, array, or repeated markdown block.
- Placeholders used as full JSON values must be replaced with valid JSON objects, arrays, strings, numbers, booleans, or `null` that match the surrounding structure.
- `<!-- REPEAT {{NAME:0..N}} --> ... <!-- END REPEAT {{NAME}} -->` marks a repeatable markdown region.
- Keep the `APM:DATA` and `APM:OPERATIONS` blocks structurally valid after replacement.

### TEST_STRATEGY.template.md

- Template Version: `1.4`
- Last Updated: `2026-04-25`
- Template Role: `document`
- Generated Artifact: `TEST_STRATEGY.md`
- Consumption Goal: A filled template should read like the final managed document body and keep the managed metadata block intact.
- Fill-In Slots:
  - `{{PROJECT_NAME}}`: Required single fill-in.
  - `{{DOC_VERSION:1}}`: Fill using `1` semantics.
  - `{{TEMPLATE_VERSION}}`: Required single fill-in.
  - `{{SOURCE_OF_TRUTH:database|generated|hybrid}}`: Select one allowed value: `database`, `generated`, `hybrid`.
  - `{{EDITOR_STATE_JSON:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{EXECUTIVE_SUMMARY}}`: Required single fill-in.
  - `{{VALIDATION_SCOPE}}`: Required single fill-in.
  - `{{TEST_LAYER_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{RISK_AREA_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{RELEASE_CONFIDENCE}}`: Required single fill-in.
  - `{{OPEN_QUESTION_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.

### TEST_STRATEGY_FRAGMENT.template.md

- Template Version: `1.4`
- Last Updated: `2026-04-25`
- Template Role: `fragment`
- Fragment Merge Mode: `apm-operations`
- Allowed Target Sections: `open-questions`, `working-content`
- Consumption Goal: A filled template should preserve valid fragment metadata and a valid operations block for merge-time processing.
- Fill-In Slots:
  - `{{FRAGMENT_CODE}}`: Required single fill-in.
  - `{{FRAGMENT_TITLE}}`: Required single fill-in.
  - `{{DOC_VERSION:1}}`: Fill using `1` semantics.
  - `{{FRAGMENT_ID}}`: Required single fill-in.
  - `{{FRAGMENT_SUMMARY}}`: Required single fill-in.
  - `{{FRAGMENT_STATUS:draft|proposed|approved|rejected|merged|archived}}`: Select one allowed value: `draft`, `proposed`, `approved`, `rejected`, `merged`, `archived`.
  - `{{FRAGMENT_REVISION:1}}`: Fill using `1` semantics.
  - `{{LINEAGE_KEY}}`: Required single fill-in.
  - `{{SOURCE_LABEL}}`: Required single fill-in.
  - `{{TEMPLATE_VERSION}}`: Required single fill-in.
  - `{{PAYLOAD_JSON:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{OPERATION:add|update|remove|reorder|move|link|unlink}}`: Select one allowed value: `add`, `update`, `remove`, `reorder`, `move`, `link`, `unlink`.
  - `{{TARGET_SECTION:open-questions|working-content}}`: Select one allowed value: `open-questions`, `working-content`.
  - `{{FROM_SECTION:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{TARGET_ITEM_ID:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{BEFORE_ITEM_ID:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{AFTER_ITEM_ID:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{ORDERED_IDS_JSON:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{VERSION_DATE:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{ITEM_ID:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{ITEM_STABLE_ID:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{ITEM_NAME:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{ITEM_TITLE:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{ITEM_SUMMARY:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{ITEM_DESCRIPTION:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{ITEM_TEXT:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{ITEM_RISK:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{ITEM_MITIGATION:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{ITEM_TYPE:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{SOURCE_REFS_JSON:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{ADDITIONAL_OPERATION_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{EXECUTIVE_SUMMARY}}`: Required single fill-in.
  - `{{VALIDATION_SCOPE_UPDATE_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{TEST_LAYER_UPDATE_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{RISK_AND_COVERAGE_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{OPEN_QUESTION_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{MERGE_GUIDANCE}}`: Required single fill-in.
