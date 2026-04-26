# Change Log Module AI

> Module AI file. Keep filename `CHANGELOG.ai.md`; APM discovers and syncs module AI files by this name.
> Read this file after `AI_ENVIRONMENT.md` and before generating or updating Change Log documents or fragments.

## 1. AI File Metadata

- AI File Name: `CHANGELOG.ai.md`
- AI File Version: `1.10`
- Last Updated: `2026-04-25`
- Owning Module: `Change Log`
- Document Template: `CHANGELOG.template.md`
- Fragment Template: `CHANGELOG_FRAGMENT.template.md`

## 2. Module Purpose

Use Change Log to keep a human-readable trail of document-impacting changes tied to work-item codes and stable ids.

## 3. Source Of Truth

- Read `AI_ENVIRONMENT.md` first for global operating rules, fragment-path rules, stable-id rules, and standards references.
- Read `CHANGELOG.template.md` for the literal document shape that APM generates.
- Read `CHANGELOG_FRAGMENT.template.md` for the literal fragment shape that APM can consume.
- Treat generated markdown as an output of module state; prefer module saves or compliant fragments over direct edits.

## 4. Document Rules

- Generate CHANGELOG.md from structured log entries rather than ad hoc prose.
- Entries should reference work-item codes, target documents, target sections, stable ids, and summary of change.
- Keep the log readable and chronological.

## 5. Fragment Rules

- Use CHANGELOG fragments to add or revise log entries without editing generated markdown directly.
- Prefer one structured entry per meaningful change set.
- Reference the affected work-item code and stable ids explicitly.

## 6. Allowed Values / Contracts

- Use stable ids for log entries when they are addressable.
- Keep titles concise and put detail in descriptions.
- Follow the fragment template operation rules.

## 7. Cross-Module Rules

- Change Log should reflect document-impacting feature and bug work across modules.
- Use it as the human-readable history layer, not as a replacement for module state.

## 8. Guardrails

- Do not use Change Log as a backlog or roadmap.
- Do not edit CHANGELOG.md directly when a fragment or module save should own the change.

## 9. Template Construction Rules

### Placeholder Syntax

- `{{NAME}}`: required single value.
- `{{NAME:OPTION_A|OPTION_B}}`: select one allowed value.
- `{{NAME:0..1}}`: optional value or optional block.
- `{{NAME:0..N}}`: repeatable value, list, array, or repeated markdown block.
- Placeholders used as full JSON values must be replaced with valid JSON objects, arrays, strings, numbers, booleans, or `null` that match the surrounding structure.
- `<!-- REPEAT {{NAME:0..N}} --> ... <!-- END REPEAT {{NAME}} -->` marks a repeatable markdown region.
- Keep the `APM:DATA` and `APM:OPERATIONS` blocks structurally valid after replacement.

### CHANGELOG.template.md

- Template Version: `1.4`
- Last Updated: `2026-04-25`
- Template Role: `document`
- Generated Artifact: `CHANGELOG.md`
- Consumption Goal: A filled template should read like the final managed document body and keep the managed metadata block intact.
- Fill-In Slots:
  - `{{PROJECT_NAME}}`: Required single fill-in.
  - `{{DOC_VERSION:1}}`: Fill using `1` semantics.
  - `{{TEMPLATE_VERSION}}`: Required single fill-in.
  - `{{SOURCE_OF_TRUTH:database|generated|hybrid}}`: Select one allowed value: `database`, `generated`, `hybrid`.
  - `{{EDITOR_STATE_JSON:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{EXECUTIVE_SUMMARY}}`: Required single fill-in.
  - `{{CHANGELOG_ENTRY_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{ENTRY_DATE}}`: Required single fill-in.
  - `{{ENTRY_TITLE}}`: Required single fill-in.
  - `{{CHANGE_TYPE:feature|bug|task|document|schema|refactor|other}}`: Select one allowed value: `feature`, `bug`, `task`, `document`, `schema`, `refactor`, `other`.
  - `{{SOURCE_REF}}`: Required single fill-in.
  - `{{TARGET_SECTION_ID}}`: Required single fill-in.
  - `{{ENTRY_SUMMARY}}`: Required single fill-in.
  - `{{OPEN_QUESTION_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.

### CHANGELOG_FRAGMENT.template.md

- Template Version: `1.4`
- Last Updated: `2026-04-25`
- Template Role: `fragment`
- Fragment Merge Mode: `apm-operations`
- Allowed Target Sections: `entries`, `open-questions`
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
  - `{{TARGET_SECTION:entries|open-questions}}`: Select one allowed value: `entries`, `open-questions`.
  - `{{FROM_SECTION:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{TARGET_ITEM_ID:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{BEFORE_ITEM_ID:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{AFTER_ITEM_ID:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{ORDERED_IDS_JSON:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{VERSION_DATE:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{WORK_ITEM_CODES:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{TARGET_DOC:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{TARGET_SECTION_NUMBER:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{RELATED_FRAGMENT_CODE:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{CHANGE_SUMMARY:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{ITEM_ID:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{ITEM_STABLE_ID:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{ITEM_TITLE:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{ITEM_SUMMARY:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{ITEM_DESCRIPTION:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{CHANGE_DATE:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{ITEM_OPERATION:add|update|remove|reorder|move|link|unlink}}`: Select one allowed value: `add`, `update`, `remove`, `reorder`, `move`, `link`, `unlink`.
  - `{{SOURCE_REFS_JSON:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{ADDITIONAL_OPERATION_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{EXECUTIVE_SUMMARY}}`: Required single fill-in.
  - `{{ENTRY_UPDATE_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{OPEN_QUESTION_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{MERGE_GUIDANCE}}`: Required single fill-in.
