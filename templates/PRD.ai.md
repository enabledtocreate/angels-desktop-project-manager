# PRD Module AI

> Module AI file. Keep filename `PRD.ai.md`; APM discovers and syncs module AI files by this name.
> Read this file after `AI_ENVIRONMENT.md` and before generating or updating PRD documents or fragments.

## 1. AI File Metadata

- AI File Name: `PRD.ai.md`
- AI File Version: `1.10`
- Last Updated: `2026-04-25`
- Owning Module: `PRD`
- Document Template: `PRD.template.md`
- Fragment Template: `PRD_FRAGMENT.template.md`

## 2. Module Purpose

Use PRD to describe what the product must do, for whom, and under what constraints, while keeping stable section ids for downstream updates.

## 3. Source Of Truth

- Read `AI_ENVIRONMENT.md` first for global operating rules, fragment-path rules, stable-id rules, and standards references.
- Read `PRD.template.md` for the literal document shape that APM generates.
- Read `PRD_FRAGMENT.template.md` for the literal fragment shape that APM can consume.
- Treat generated markdown as an output of module state; prefer module saves or compliant fragments over direct edits.

## 4. Document Rules

- Generate PRD.md with consistent hierarchical numbering and stable ids for section items.
- Keep titles concise and descriptions rich enough to stand on their own.
- Use feature and bug codes as traceability tags attached to relevant items.

## 5. Fragment Rules

- Use PRD fragments to add, update, remove, reorder, or link structured PRD items.
- Target stable ids directly whenever an item already exists.
- Attach source refs and work-item codes so downstream reasoning stays traceable.

## 6. Allowed Values / Contracts

- Maintain section and subsection numbering consistency.
- Keep human-readable ids and stored stable ids aligned but distinct.
- Use target sections and supported operations from the fragment template.

## 7. Cross-Module Rules

- PRD should align with Features, Functional Spec, Architecture, Domain Models, and Test Strategy.
- Implemented feature behavior should move into canonical documents and out of future-enhancement planning lists.

## 8. Guardrails

- Do not edit generated PRD.md directly.
- Do not let titles collapse into truncated descriptions.

## 9. Template Construction Rules

### Placeholder Syntax

- `{{NAME}}`: required single value.
- `{{NAME:OPTION_A|OPTION_B}}`: select one allowed value.
- `{{NAME:0..1}}`: optional value or optional block.
- `{{NAME:0..N}}`: repeatable value, list, array, or repeated markdown block.
- Placeholders used as full JSON values must be replaced with valid JSON objects, arrays, strings, numbers, booleans, or `null` that match the surrounding structure.
- `<!-- REPEAT {{NAME:0..N}} --> ... <!-- END REPEAT {{NAME}} -->` marks a repeatable markdown region.
- Keep the `APM:DATA` and `APM:OPERATIONS` blocks structurally valid after replacement.

### PRD.template.md

- Template Version: `1.4`
- Last Updated: `2026-04-25`
- Template Role: `document`
- Generated Artifact: `PRD.md`
- Consumption Goal: A filled template should read like the final managed document body and keep the managed metadata block intact.
- Fill-In Slots:
  - `{{PROJECT_NAME}}`: Required single fill-in.
  - `{{DOC_VERSION:1}}`: Fill using `1` semantics.
  - `{{TEMPLATE_VERSION}}`: Required single fill-in.
  - `{{SOURCE_OF_TRUTH:database|generated|hybrid}}`: Select one allowed value: `database`, `generated`, `hybrid`.
  - `{{EDITOR_STATE_JSON:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{EXECUTIVE_SUMMARY}}`: Required single fill-in.
  - `{{PRODUCT_NAME}}`: Required single fill-in.
  - `{{PRODUCT_VISION}}`: Required single fill-in.
  - `{{TARGET_AUDIENCE_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{TARGET_AUDIENCE_ITEM}}`: Required single fill-in.
  - `{{VALUE_PROPOSITION_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{VALUE_PROPOSITION_ITEM}}`: Required single fill-in.
  - `{{WORKFLOW_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{USER_ACTION_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{SYSTEM_BEHAVIOR_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{DATA_REPORTING_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{NON_FUNCTIONAL_REQUIREMENT_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{TECHNICAL_ARCHITECTURE_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{SEQUENCING_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{DEPENDENCY_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{MILESTONE_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{SUCCESS_METRIC_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{RISK_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{FUTURE_ENHANCEMENT_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{OPEN_QUESTION_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.

### PRD_FRAGMENT.template.md

- Template Version: `1.4`
- Last Updated: `2026-04-25`
- Template Role: `fragment`
- Fragment Merge Mode: `managed-body`
- Consumption Goal: A filled template should preserve valid fragment metadata and body sections that the current fragment importer reads directly.
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
  - `{{MERMAID_BODY:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{PAYLOAD_JSON:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{EXECUTIVE_SUMMARY}}`: Required single fill-in.
  - `{{PRODUCT_OVERVIEW_UPDATE_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{FUNCTIONAL_REQUIREMENT_UPDATE_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{TECHNICAL_AND_IMPLEMENTATION_UPDATE_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{RISK_AND_FUTURE_UPDATE_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{MERGE_GUIDANCE}}`: Required single fill-in.
