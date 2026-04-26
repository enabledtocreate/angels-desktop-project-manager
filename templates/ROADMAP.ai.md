# Roadmap Module AI

> Module AI file. Keep filename `ROADMAP.ai.md`; APM discovers and syncs module AI files by this name.
> Read this file after `AI_ENVIRONMENT.md` and before generating or updating Roadmap documents or fragments.

## 1. AI File Metadata

- AI File Name: `ROADMAP.ai.md`
- AI File Version: `1.10`
- Last Updated: `2026-04-25`
- Owning Module: `Roadmap`
- Document Template: `ROADMAP.template.md`
- Fragment Template: `ROADMAP_FRAGMENT.template.md`

## 2. Module Purpose

Use Roadmap to plan phases, sequencing, and active future work without duplicating implemented history.

## 3. Source Of Truth

- Read `AI_ENVIRONMENT.md` first for global operating rules, fragment-path rules, stable-id rules, and standards references.
- Read `ROADMAP.template.md` for the literal document shape that APM generates.
- Read `ROADMAP_FRAGMENT.template.md` for the literal fragment shape that APM can consume.
- Treat generated markdown as an output of module state; prefer module saves or compliant fragments over direct edits.

## 4. Document Rules

- Generate ROADMAP.md from live roadmap state and active unfinished work.
- Keep archived work out of the active roadmap views unless the document explicitly calls for history.
- Reflect planning buckets and phase structure consistently.

## 5. Fragment Rules

- Use ROADMAP fragments for phase, sequencing, and active planning changes.
- Fragments should target phases, planned features, considered items, or roadmap notes explicitly.
- When planning changes affect Features or PRD traceability, reference the work-item codes.

## 6. Allowed Values / Contracts

- Use stable ids for phases, roadmap notes, and targetable roadmap items.
- Respect supported operations and target sections from the fragment template.
- Keep roadmap phrasing planning-focused, not implementation-complete.

## 7. Cross-Module Rules

- Roadmap should align with active entries in FEATURES.md and BUGS.md.
- When a roadmap change implies canonical product behavior changes, downstream document fragments may also be needed.

## 8. Guardrails

- Do not edit `ROADMAP.md` directly when proposing roadmap changes through AI-assisted workflows.
- Do not use Roadmap as the implemented feature archive.
- Do not edit generated ROADMAP.md directly.

## 9. Template Construction Rules

### Placeholder Syntax

- `{{NAME}}`: required single value.
- `{{NAME:OPTION_A|OPTION_B}}`: select one allowed value.
- `{{NAME:0..1}}`: optional value or optional block.
- `{{NAME:0..N}}`: repeatable value, list, array, or repeated markdown block.
- Placeholders used as full JSON values must be replaced with valid JSON objects, arrays, strings, numbers, booleans, or `null` that match the surrounding structure.
- `<!-- REPEAT {{NAME:0..N}} --> ... <!-- END REPEAT {{NAME}} -->` marks a repeatable markdown region.
- Keep the `APM:DATA` and `APM:OPERATIONS` blocks structurally valid after replacement.

### ROADMAP.template.md

- Template Version: `1.4`
- Last Updated: `2026-04-25`
- Template Role: `document`
- Generated Artifact: `ROADMAP.md`
- Consumption Goal: A filled template should read like the final managed document body and keep the managed metadata block intact.
- Fill-In Slots:
  - `{{PROJECT_NAME}}`: Required single fill-in.
  - `{{DOC_VERSION:1}}`: Fill using `1` semantics.
  - `{{PHASES_JSON:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{TASKS_JSON:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{FEATURES_JSON:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{BUGS_JSON:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{TEMPLATE_VERSION}}`: Required single fill-in.
  - `{{MERMAID_BODY:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{EXECUTIVE_SUMMARY}}`: Required single fill-in.
  - `{{PHASE_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{PHASE_CODE}}`: Required single fill-in.
  - `{{PHASE_NAME}}`: Required single fill-in.
  - `{{PHASE_GOAL}}`: Required single fill-in.
  - `{{PHASE_STATUS:planned|in_progress|blocked|completed}}`: Select one allowed value: `planned`, `in_progress`, `blocked`, `completed`.
  - `{{PHASE_TARGET_DATE}}`: Required single fill-in.
  - `{{PHASE_SUMMARY}}`: Required single fill-in.
  - `{{PHASE_FEATURE_LINE:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{PHASE_TASK_LINE:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{PLANNED_FEATURE_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{FEATURE_ID}}`: Required single fill-in.
  - `{{FEATURE_TITLE}}`: Required single fill-in.
  - `{{FEATURE_STATUS:considered|planned|in_progress|blocked|completed}}`: Select one allowed value: `considered`, `planned`, `in_progress`, `blocked`, `completed`.
  - `{{CONSIDERED_FEATURE_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{MERMAID_BODY}}`: Required single fill-in.

### ROADMAP_FRAGMENT.template.md

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
  - `{{PROJECT_ID:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{SOURCE_FEATURE_ID:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{SOURCE_PHASE_ID:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{FRAGMENT_MARKDOWN_JSON:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{MERMAID_BODY:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{PHASE_CHANGES_JSON:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{FEATURE_ASSIGNMENTS_JSON:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{TASK_ASSIGNMENTS_JSON:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{FRAGMENT_STATUS:draft|proposed|approved|rejected|merged|archived}}`: Select one allowed value: `draft`, `proposed`, `approved`, `rejected`, `merged`, `archived`.
  - `{{MERGED_JSON:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{MERGED_AT_JSON:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{INTEGRATED_AT_JSON:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{FILE_NAME:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{CREATED_AT_JSON:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{UPDATED_AT_JSON:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{EXECUTIVE_SUMMARY}}`: Required single fill-in.
  - `{{PHASE_CHANGES_MARKDOWN:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{FEATURE_ASSIGNMENTS_MARKDOWN:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{TASK_ASSIGNMENTS_MARKDOWN:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{MERGE_GUIDANCE}}`: Required single fill-in.
