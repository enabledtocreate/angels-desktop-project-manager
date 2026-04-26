# Domain Models Module AI

> Module AI file. Keep filename `DOMAIN_MODELS.ai.md`; APM discovers and syncs module AI files by this name.
> Read this file after `AI_ENVIRONMENT.md` and before generating or updating Domain Models documents or fragments.

## 1. AI File Metadata

- AI File Name: `DOMAIN_MODELS.ai.md`
- AI File Version: `1.10`
- Last Updated: `2026-04-25`
- Owning Module: `Domain Models`
- Document Template: `DOMAIN_MODELS.template.md`
- Fragment Template: `DOMAIN_MODELS_FRAGMENT.template.md`

## 2. Module Purpose

Use Domain Models as the shared conceptual model layer that other modules can project from before implementation-specific shapes are known.

## 3. Source Of Truth

- Read `AI_ENVIRONMENT.md` first for global operating rules, fragment-path rules, stable-id rules, and standards references.
- Read `DOMAIN_MODELS.template.md` for the literal document shape that APM generates.
- Read `DOMAIN_MODELS_FRAGMENT.template.md` for the literal fragment shape that APM can consume.
- Treat generated markdown as an output of module state; prefer module saves or compliant fragments over direct edits.

## 4. Document Rules

- Generate DOMAIN_MODELS.md from structured model and projection state.
- Keep models conceptual first and implementation-neutral.
- Use projections to express how the conceptual model appears in schema, UI, APIs, flows, or technical design.

## 5. Fragment Rules

- Use DOMAIN_MODELS fragments for adding, updating, removing, linking, or reordering models, projections, and open questions.
- Target model ids or projection ids explicitly when they already exist.
- Prefer precise operations over freeform narrative when the fragment intends to change structured state.

## 6. Allowed Values / Contracts

- Allowed `conceptualType` values are `unknown`, `text`, `number`, `boolean`, `date`, `datetime`, `identifier`, `enum`, `object`, `collection`, and `reference`.
- These are conceptual types, not database, API, UI, or programming-language contracts.
- Keep model stable ids distinct from projection stable ids and work-item codes.

## 7. Cross-Module Rules

- Domain Models should inform Database Schema, Functional Spec, Experience Design, Technical Design, and Architecture.
- Use projections instead of mutating the base conceptual model into stack-specific shapes.

## 8. Guardrails

- Do not treat Domain Models as database tables, UI forms, API payloads, or implementation classes.
- Do not treat DOMAIN_MODELS.md as a direct database-schema generator without review.
- Do not edit generated DOMAIN_MODELS.md directly when the module or fragments should own the change.

## 9. Template Construction Rules

### Placeholder Syntax

- `{{NAME}}`: required single value.
- `{{NAME:OPTION_A|OPTION_B}}`: select one allowed value.
- `{{NAME:0..1}}`: optional value or optional block.
- `{{NAME:0..N}}`: repeatable value, list, array, or repeated markdown block.
- Placeholders used as full JSON values must be replaced with valid JSON objects, arrays, strings, numbers, booleans, or `null` that match the surrounding structure.
- `<!-- REPEAT {{NAME:0..N}} --> ... <!-- END REPEAT {{NAME}} -->` marks a repeatable markdown region.
- Keep the `APM:DATA` and `APM:OPERATIONS` blocks structurally valid after replacement.

### DOMAIN_MODELS.template.md

- Template Version: `1.4`
- Last Updated: `2026-04-25`
- Template Role: `document`
- Generated Artifact: `DOMAIN_MODELS.md`
- Consumption Goal: A filled template should read like the final managed document body and keep the managed metadata block intact.
- Fill-In Slots:
  - `{{PROJECT_NAME}}`: Required single fill-in.
  - `{{DOC_VERSION:1}}`: Fill using `1` semantics.
  - `{{TEMPLATE_VERSION}}`: Required single fill-in.
  - `{{SOURCE_OF_TRUTH:database|generated|hybrid}}`: Select one allowed value: `database`, `generated`, `hybrid`.
  - `{{EDITOR_STATE_JSON:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{EXECUTIVE_SUMMARY}}`: Required single fill-in.
  - `{{MODEL_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{MODEL_NAME}}`: Required single fill-in.
  - `{{MODEL_ID}}`: Required single fill-in.
  - `{{MODEL_SUMMARY}}`: Required single fill-in.
  - `{{FIELD_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{PROJECTION_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{SHARED_PROJECTION_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{OPEN_QUESTION_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.

### DOMAIN_MODELS_FRAGMENT.template.md

- Template Version: `1.4`
- Last Updated: `2026-04-25`
- Template Role: `fragment`
- Fragment Merge Mode: `apm-operations`
- Allowed Target Sections: `models`, `projections`, `shared-model-projections`, `open-questions`
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
  - `{{TARGET_SECTION:models|projections|shared-model-projections|open-questions}}`: Select one allowed value: `models`, `projections`, `shared-model-projections`, `open-questions`.
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
  - `{{MODEL_TYPE:entity|value-object|aggregate|event|command|concept|external-resource}}`: Select one allowed value: `entity`, `value-object`, `aggregate`, `event`, `command`, `concept`, `external-resource`.
  - `{{MODEL_FIELDS_JSON:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{MODEL_RELATIONSHIPS_JSON:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{MODEL_RULES_JSON:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{MODEL_EXAMPLES_JSON:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{BASE_MODEL_ID:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{BASE_MODEL_STABLE_ID:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{BASE_MODEL_NAME:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{OWNING_MODULE:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{PROJECTION_TYPE:functional|experience|persistence|technical|api-request|api-response|event|message|test-fixture}}`: Select one allowed value: `functional`, `experience`, `persistence`, `technical`, `api-request`, `api-response`, `event`, `message`, `test-fixture`.
  - `{{PROJECTION_FIELD_MAPPINGS_JSON:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{PROJECTION_EXCLUDED_FIELDS_JSON:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{PROJECTION_ADDITIONAL_FIELDS_JSON:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{PROJECTION_CONSTRAINTS_JSON:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{SOURCE_REFS_JSON:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{ADDITIONAL_OPERATION_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{EXECUTIVE_SUMMARY}}`: Required single fill-in.
  - `{{MODEL_UPDATE_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{PROJECTION_UPDATE_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{SHARED_PROJECTION_UPDATE_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{OPEN_QUESTION_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{MERGE_GUIDANCE}}`: Required single fill-in.
