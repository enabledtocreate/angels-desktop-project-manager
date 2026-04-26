# Project Brief Module AI

> Module AI file. Keep filename `PROJECT_BRIEF.ai.md`; APM discovers and syncs module AI files by this name.
> Read this file after `AI_ENVIRONMENT.md` and before generating or updating Project Brief documents or fragments.

## 1. AI File Metadata

- AI File Name: `PROJECT_BRIEF.ai.md`
- AI File Version: `1.10`
- Last Updated: `2026-04-25`
- Owning Module: `Project Brief`
- Document Template: `PROJECT_BRIEF.template.md`
- Fragment Template: `PROJECT_BRIEF_FRAGMENT.template.md`

## 2. Module Purpose

Use Project Brief to establish the root context for what the project is, why it exists, and how the rest of the managed documents should inherit that framing.

## 3. Source Of Truth

- Read `AI_ENVIRONMENT.md` first for global operating rules, fragment-path rules, stable-id rules, and standards references.
- Read `PROJECT_BRIEF.template.md` for the literal document shape that APM generates.
- Read `PROJECT_BRIEF_FRAGMENT.template.md` for the literal fragment shape that APM can consume.
- Treat generated markdown as an output of module state; prefer module saves or compliant fragments over direct edits.

## 4. Document Rules

- Generate PROJECT_BRIEF.md as the root human-readable context document for the project.
- Keep the brief high-level and stable; move operational or rapidly changing detail into downstream modules.
- Prefer concise section summaries and durable language over implementation chatter.

## 5. Fragment Rules

- Use PROJECT_BRIEF fragments for scoped changes to the brief rather than editing generated markdown directly.
- Target explicit stable ids and target sections whenever a fragment changes structured items.
- Use the fragment only to change project brief context, not to smuggle downstream module updates.

## 6. Allowed Values / Contracts

- Preserve stable ids for persisted brief items.
- Treat Project Brief as a root-context document, not a delivery tracker.
- Keep document and fragment payloads aligned with the paired templates.

## 7. Cross-Module Rules

- Project Brief informs PRD, Roadmap, AI Environment, and Architecture.
- If a change alters the project mission or scope, check downstream modules for follow-up edits.

## 8. Guardrails

- Do not turn Project Brief into a changelog, feature register, or bug list.
- Do not edit PROJECT_BRIEF.md directly when the module state or fragment workflow should own the change.

## 9. Template Construction Rules

### Placeholder Syntax

- `{{NAME}}`: required single value.
- `{{NAME:OPTION_A|OPTION_B}}`: select one allowed value.
- `{{NAME:0..1}}`: optional value or optional block.
- `{{NAME:0..N}}`: repeatable value, list, array, or repeated markdown block.
- Placeholders used as full JSON values must be replaced with valid JSON objects, arrays, strings, numbers, booleans, or `null` that match the surrounding structure.
- `<!-- REPEAT {{NAME:0..N}} --> ... <!-- END REPEAT {{NAME}} -->` marks a repeatable markdown region.
- Keep the `APM:DATA` and `APM:OPERATIONS` blocks structurally valid after replacement.

### PROJECT_BRIEF.template.md

- Template Version: `1.4`
- Last Updated: `2026-04-25`
- Template Role: `document`
- Generated Artifact: `PROJECT_BRIEF.md`
- Consumption Goal: A filled template should read like the final managed document body and keep the managed metadata block intact.
- Fill-In Slots:
  - `{{PROJECT_NAME}}`: Required single fill-in.
  - `{{DOC_VERSION:1}}`: Fill using `1` semantics.
  - `{{TEMPLATE_VERSION}}`: Required single fill-in.
  - `{{SOURCE_OF_TRUTH:database|generated|hybrid}}`: Select one allowed value: `database`, `generated`, `hybrid`.
  - `{{EDITOR_STATE_JSON:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{PROJECT_TYPE:software|general|design|research|operations|other}}`: Select one allowed value: `software`, `general`, `design`, `research`, `operations`, `other`.
  - `{{PROJECT_PATH}}`: Required single fill-in.
  - `{{OPERATING_CONTEXT}}`: Required single fill-in.
  - `{{GOAL_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{GOAL_ITEM}}`: Required single fill-in.
  - `{{CONSTRAINT_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{CONSTRAINT_ITEM}}`: Required single fill-in.
  - `{{BRANCH_DOCUMENT_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{BRANCH_DOCUMENT_NAME}}`: Required single fill-in.
  - `{{BRANCH_DOCUMENT_PURPOSE}}`: Required single fill-in.

### PROJECT_BRIEF_FRAGMENT.template.md

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
  - `{{IDENTITY_UPDATES}}`: Required single fill-in.
  - `{{GOAL_AND_CONSTRAINT_UPDATES}}`: Required single fill-in.
  - `{{OPERATING_CONTEXT_UPDATES}}`: Required single fill-in.
  - `{{OPEN_QUESTION_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{MERGE_GUIDANCE}}`: Required single fill-in.
