# Technical Design Module AI

> Module AI file. Keep filename `TECHNICAL_DESIGN.ai.md`; APM discovers and syncs module AI files by this name.
> Read this file after `AI_ENVIRONMENT.md` and before generating or updating Technical Design documents or fragments.

## 1. AI File Metadata

- AI File Name: `TECHNICAL_DESIGN.ai.md`
- AI File Version: `1.10`
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

### Placeholder Syntax

- `{{NAME}}`: required single value.
- `{{NAME:OPTION_A|OPTION_B}}`: select one allowed value.
- `{{NAME:0..1}}`: optional value or optional block.
- `{{NAME:0..N}}`: repeatable value, list, array, or repeated markdown block.
- Placeholders used as full JSON values must be replaced with valid JSON objects, arrays, strings, numbers, booleans, or `null` that match the surrounding structure.
- `<!-- REPEAT {{NAME:0..N}} --> ... <!-- END REPEAT {{NAME}} -->` marks a repeatable markdown region.
- Keep the `APM:DATA` and `APM:OPERATIONS` blocks structurally valid after replacement.

### TECHNICAL_DESIGN.template.md

- Template Version: `1.4`
- Last Updated: `2026-04-25`
- Template Role: `document`
- Generated Artifact: `TECHNICAL_DESIGN.md`
- Consumption Goal: A filled template should read like the final managed document body and keep the managed metadata block intact.
- Fill-In Slots:
  - `{{PROJECT_NAME}}`: Required single fill-in.
  - `{{DOC_VERSION:1}}`: Fill using `1` semantics.
  - `{{TEMPLATE_VERSION}}`: Required single fill-in.
  - `{{SOURCE_OF_TRUTH:database|generated|hybrid}}`: Select one allowed value: `database`, `generated`, `hybrid`.
  - `{{EDITOR_STATE_JSON:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{EXECUTIVE_SUMMARY}}`: Required single fill-in.
  - `{{DESIGN_SCOPE}}`: Required single fill-in.
  - `{{INTERNAL_FLOW}}`: Required single fill-in.
  - `{{DATA_AND_INTERFACE_IMPACT}}`: Required single fill-in.
  - `{{RISK_AND_TRADEOFF_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{OPEN_QUESTION_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.

### TECHNICAL_DESIGN_FRAGMENT.template.md

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
  - `{{SCOPE_AND_DESIGN_UPDATE_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{INTERNAL_FLOW_CHANGE_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{DATA_AND_INTERFACE_IMPACT_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{RISK_AND_OPEN_QUESTION_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{MERGE_GUIDANCE}}`: Required single fill-in.
