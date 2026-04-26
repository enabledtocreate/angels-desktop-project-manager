# AI Environment Module AI

> Module AI file. Keep filename `AI_ENVIRONMENT.ai.md`; APM discovers and syncs module AI files by this name.
> Read this file after `AI_ENVIRONMENT.md` and before generating or updating AI Environment documents or fragments.

## 1. AI File Metadata

- AI File Name: `AI_ENVIRONMENT.ai.md`
- AI File Version: `1.11`
- Last Updated: `2026-04-25`
- Owning Module: `AI Environment`
- Document Template: `AI_ENVIRONMENT.template.md`
- Fragment Template: `AI_ENVIRONMENT_FRAGMENT.template.md`

## 2. Module Purpose

Use AI Environment as the first point of contact for outside AI agents so they understand how to work in the project before reading module-local AI files.

## 3. Source Of Truth

- Read `AI_ENVIRONMENT.md` first for global operating rules, fragment-path rules, stable-id rules, and standards references.
- Read `AI_ENVIRONMENT.template.md` for the literal final-document contract and reference shape that APM generates or re-imports.
- Read `AI_ENVIRONMENT_FRAGMENT.template.md` for the literal fragment shape that APM can consume as the normal AI write path.
- Treat generated markdown as an output of module state; prefer module saves or compliant fragments over direct edits.

## 4. Document Rules

- Generate AI_ENVIRONMENT.md as the top-level operating manual for agents.
- Keep project-wide mission, operating model, communication style, dictionary, and enabled directive references readable and current.
- Reference module AI files rather than duplicating all module-local rules here.
- Treat normal document templates as contract and reconciliation artifacts that show the final managed document shape; they are not usually the file an AI agent should write to produce changes.

## 5. Fragment Rules

- Use AI_ENVIRONMENT fragments to change top-level agent behavior, dictionary terms, project-wide guardrails, or shared profiles.
- Module-local AI behavior belongs in the owning module AI file, not duplicated fragments here, unless the module emits a reference to AI Environment.
- Keep fragment updates structured and stable-id addressable.
- Default workflow for AI-authored change: read module AI -> read fragment template -> fill fragment -> save to configured fragments path -> let APM consume it into the growing document state.

## 6. Allowed Values / Contracts

- AI Environment is project-wide guidance, not module-local artifact detail.
- Keep references to module AI files, document templates, and fragment templates current.
- Locked required directives remain code-owned and cannot be edited away.
- Document templates define what the final managed artifact should look like. Fragment templates define what an AI agent should normally produce when proposing changes.

## 7. Cross-Module Rules

- AI Environment should point agents toward module AI files, standards, and target templates.
- Module-emitted directives may appear in AI Environment as references, but the detailed rules stay in the module AI files.

## 8. Guardrails

- Do not duplicate every module rule body into AI_ENVIRONMENT.md.
- Do not let optional project guidance override locked code-owned directives.

## 9. Template Construction Rules

### Placeholder Syntax

- `{{NAME}}`: required single value.
- `{{NAME:OPTION_A|OPTION_B}}`: select one allowed value.
- `{{NAME:0..1}}`: optional value or optional block.
- `{{NAME:0..N}}`: repeatable value, list, array, or repeated markdown block.
- Placeholders used as full JSON values must be replaced with valid JSON objects, arrays, strings, numbers, booleans, or `null` that match the surrounding structure.
- `<!-- REPEAT {{NAME:0..N}} --> ... <!-- END REPEAT {{NAME}} -->` marks a repeatable markdown region.
- Keep the `APM:DATA` and `APM:OPERATIONS` blocks structurally valid after replacement.

### AI_ENVIRONMENT.template.md

- Template Version: `1.4`
- Last Updated: `2026-04-25`
- Template Role: `document`
- Generated Artifact: `AI_ENVIRONMENT.md`
- Consumption Goal: A filled template should read like the final managed document body and keep the managed metadata block intact.
- Fill-In Slots:
  - `{{PROJECT_NAME}}`: Required single fill-in.
  - `{{DOC_VERSION:1}}`: Fill using `1` semantics.
  - `{{TEMPLATE_VERSION}}`: Required single fill-in.
  - `{{SOURCE_OF_TRUTH:database|generated|hybrid}}`: Select one allowed value: `database`, `generated`, `hybrid`.
  - `{{EDITOR_STATE_JSON:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{MISSION}}`: Required single fill-in.
  - `{{OPERATING_MODEL}}`: Required single fill-in.
  - `{{COMMUNICATION_STYLE}}`: Required single fill-in.
  - `{{TERM_DICTIONARY_ROW:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{CUSTOM_INSTRUCTIONS}}`: Required single fill-in.
  - `{{SHARED_PROFILE_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{MODULE_REFERENCE_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{LOCKED_DIRECTIVE_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{MODULE_DIRECTIVE_INDEX_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{REQUIRED_BEHAVIOR_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{MODULE_UPDATE_RULE_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{PROJECT_FAMILY_READ_ORDER_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{PROJECT_FAMILY_INHERITANCE_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{DATA_PHRASING_RULE_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{GUARDRAIL_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{HANDOFF_CHECKLIST_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.

### AI_ENVIRONMENT_FRAGMENT.template.md

- Template Version: `1.4`
- Last Updated: `2026-04-25`
- Template Role: `fragment`
- Fragment Merge Mode: `apm-operations`
- Allowed Target Sections: `term-dictionary`, `required-behaviors`, `module-update-rules`, `project-family-read-order`, `project-family-inheritance-rules`, `data-phrasing-rules`, `avoid-rules`, `handoff-checklist`, `open-questions`
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
  - `{{TARGET_SECTION:term-dictionary|required-behaviors|module-update-rules|project-family-read-order|project-family-inheritance-rules|data-phrasing-rules|avoid-rules|handoff-checklist|open-questions}}`: Select one allowed value: `term-dictionary`, `required-behaviors`, `module-update-rules`, `project-family-read-order`, `project-family-inheritance-rules`, `data-phrasing-rules`, `avoid-rules`, `handoff-checklist`, `open-questions`.
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
  - `{{MISSION_AND_OPERATING_MODEL_UPDATE_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{REQUIRED_BEHAVIOR_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{MODULE_UPDATE_RULE_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{GUARDRAIL_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{OPEN_QUESTION_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{MERGE_GUIDANCE}}`: Required single fill-in.
