# Bugs Module AI

> Module AI file. Keep filename `BUGS.ai.md`; APM discovers and syncs module AI files by this name.
> Read this file after `AI_ENVIRONMENT.md` and before generating or updating Bugs documents or fragments.

## 1. AI File Metadata

- AI File Name: `BUGS.ai.md`
- AI File Version: `1.10`
- Last Updated: `2026-04-25`
- Owning Module: `Bugs`
- Document Template: `BUGS.template.md`
- Fragment Template: `BUGS_FRAGMENT.template.md`

## 2. Module Purpose

Use Bugs to track active software defects, their lifecycle states, and the documentation follow-up required when fixes land.

## 3. Source Of Truth

- Read `AI_ENVIRONMENT.md` first for global operating rules, fragment-path rules, stable-id rules, and standards references.
- Read `BUGS.template.md` for the literal document shape that APM generates.
- Read `BUGS_FRAGMENT.template.md` for the literal fragment shape that APM can consume.
- Treat generated markdown as an output of module state; prefer module saves or compliant fragments over direct edits.

## 4. Document Rules

- BUGS.md should focus on active bugs and the documented lifecycle workflow.
- Closed or resolved bugs belong in archived history rather than the active list.
- State, phase, category, and linked module ids should remain structured and readable.

## 5. Fragment Rules

- Use BUGS fragments for adding, updating, archiving, or restoring bugs through supported operations.
- When a bug fix changes canonical behavior, use fragments in downstream modules to attach the bug code to the affected stable ids.
- Use explicit target sections and item ids for state changes.

## 6. Allowed Values / Contracts

- Active bug states are open, triaged, in progress, blocked, fixed, verifying, or regressed.
- Archived bugs represent implemented or historically tracked items and should not stay in the live list.
- Keep bug codes, stable ids, and linked module references distinct.

## 7. Cross-Module Rules

- Bug fixes may require follow-up in PRD, Functional Spec, Test Strategy, Architecture, or Change Log.
- Use module references and work-item codes to make the documentation trail visible.

## 8. Guardrails

- Do not keep resolved or closed bugs in the active bug list.
- Do not edit BUGS.md directly when the bug module or bug fragments should own the change.

## 9. Template Construction Rules

### Placeholder Syntax

- `{{NAME}}`: required single value.
- `{{NAME:OPTION_A|OPTION_B}}`: select one allowed value.
- `{{NAME:0..1}}`: optional value or optional block.
- `{{NAME:0..N}}`: repeatable value, list, array, or repeated markdown block.
- Placeholders used as full JSON values must be replaced with valid JSON objects, arrays, strings, numbers, booleans, or `null` that match the surrounding structure.
- `<!-- REPEAT {{NAME:0..N}} --> ... <!-- END REPEAT {{NAME}} -->` marks a repeatable markdown region.
- Keep the `APM:DATA` and `APM:OPERATIONS` blocks structurally valid after replacement.

### BUGS.template.md

- Template Version: `1.4`
- Last Updated: `2026-04-25`
- Template Role: `document`
- Generated Artifact: `BUGS.md`
- Consumption Goal: A filled template should read like the final managed document body and keep the managed metadata block intact.
- Fill-In Slots:
  - `{{PROJECT_NAME}}`: Required single fill-in.
  - `{{DOC_VERSION:1}}`: Fill using `1` semantics.
  - `{{BUGS_JSON:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{MERMAID_BODY:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{ACTIVE_ARCHIVE_RULES}}`: Required single fill-in.
  - `{{BUG_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{BUG_CODE}}`: Required single fill-in.
  - `{{BUG_TITLE}}`: Required single fill-in.
  - `{{BUG_STATUS:open|triaged|in_progress|blocked|fixed|verifying|regressed}}`: Select one allowed value: `open`, `triaged`, `in_progress`, `blocked`, `fixed`, `verifying`, `regressed`.
  - `{{PLANNING_BUCKET:considered|planned|phase}}`: Select one allowed value: `considered`, `planned`, `phase`.
  - `{{BUG_SEVERITY:low|medium|high|critical}}`: Select one allowed value: `low`, `medium`, `high`, `critical`.
  - `{{ROADMAP_PHASE_ID:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{TASK_ID:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{AFFECTED_MODULES:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{ASSOCIATION_HINTS:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{CURRENT_BEHAVIOR}}`: Required single fill-in.
  - `{{EXPECTED_BEHAVIOR}}`: Required single fill-in.
  - `{{MERMAID_BODY}}`: Required single fill-in.

### BUGS_FRAGMENT.template.md

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
  - `{{PAYLOAD_JSON:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{EXECUTIVE_SUMMARY}}`: Required single fill-in.
  - `{{BUG_UPDATE_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{BEHAVIOR_UPDATE_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{FIX_AND_VALIDATION_NOTES}}`: Required single fill-in.
  - `{{OPEN_QUESTION_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{MERGE_GUIDANCE}}`: Required single fill-in.
