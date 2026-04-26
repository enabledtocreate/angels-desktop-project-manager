# Features Module AI

> Module AI file. Keep filename `FEATURES.ai.md`; APM discovers and syncs module AI files by this name.
> Read this file after `AI_ENVIRONMENT.md` and before generating or updating Features documents or fragments.

## 1. AI File Metadata

- AI File Name: `FEATURES.ai.md`
- AI File Version: `1.10`
- Last Updated: `2026-04-25`
- Owning Module: `Features`
- Document Template: `FEATURES.template.md`
- Fragment Template: `FEATURES_FRAGMENT.template.md`

## 2. Module Purpose

Use Features as the planning register for planned, considered, phased, and archived features, with downstream documentation handled by AI-created destination fragments.

## 3. Source Of Truth

- Read `AI_ENVIRONMENT.md` first for global operating rules, fragment-path rules, stable-id rules, and standards references.
- Read `FEATURES.template.md` for the literal document shape that APM generates.
- Read `FEATURES_FRAGMENT.template.md` for the literal fragment shape that APM can consume.
- Treat generated markdown as an output of module state; prefer module saves or compliant fragments over direct edits.

## 4. Document Rules

- FEATURES.md should represent planned and pending work, not duplicate implemented canonical behavior in other documents.
- Archived features represent implemented or completed planning items and should be separated from active planning buckets.
- Keep planning buckets, phase assignments, and work-item codes structured.

## 5. Fragment Rules

- Use FEATURES fragments to change planning state, descriptions, codes, or traceability metadata.
- Do not let the application auto-generate destination document fragments; only AI agents should do that.
- When a feature is implemented, downstream module fragments should carry the feature code to the affected stable ids.

## 6. Allowed Values / Contracts

- Keep feature codes stable and distinct from document stable ids.
- Preserve planning buckets and archive semantics.
- Use explicit target sections and work-item references in fragments.

## 7. Cross-Module Rules

- Implemented features may need follow-up in PRD, Architecture, Functional Spec, Domain Models, Change Log, and Test Strategy.
- Features is the planning register; downstream modules carry the canonical implemented behavior.

## 8. Guardrails

- Do not add implemented, completed, done, closed, or archived features back into the generated `FEATURES.md` document.
- Do not render implemented, completed, done, closed, or archived features in the generated document; those remain available through database-backed history/archive views.
- Do not auto-create destination fragments from the Features UI or server code.
- Do not treat FEATURES.md as the final source of implemented product truth.

## 9. Template Construction Rules

### Placeholder Syntax

- `{{NAME}}`: required single value.
- `{{NAME:OPTION_A|OPTION_B}}`: select one allowed value.
- `{{NAME:0..1}}`: optional value or optional block.
- `{{NAME:0..N}}`: repeatable value, list, array, or repeated markdown block.
- Placeholders used as full JSON values must be replaced with valid JSON objects, arrays, strings, numbers, booleans, or `null` that match the surrounding structure.
- `<!-- REPEAT {{NAME:0..N}} --> ... <!-- END REPEAT {{NAME}} -->` marks a repeatable markdown region.
- Keep the `APM:DATA` and `APM:OPERATIONS` blocks structurally valid after replacement.

### FEATURES.template.md

- Template Version: `1.4`
- Last Updated: `2026-04-25`
- Template Role: `document`
- Generated Artifact: `FEATURES.md`
- Consumption Goal: A filled template should read like the final managed document body and keep the managed metadata block intact.
- Fill-In Slots:
  - `{{PROJECT_NAME}}`: Required single fill-in.
  - `{{DOC_VERSION:1}}`: Fill using `1` semantics.
  - `{{FEATURES_JSON:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{MERMAID_BODY:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{FEATURE_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{FEATURE_CODE}}`: Required single fill-in.
  - `{{FEATURE_TITLE}}`: Required single fill-in.
  - `{{PLANNING_BUCKET:considered|planned|phase}}`: Select one allowed value: `considered`, `planned`, `phase`.
  - `{{FEATURE_STATUS:proposed|planned|in_progress|blocked|completed}}`: Select one allowed value: `proposed`, `planned`, `in_progress`, `blocked`, `completed`.
  - `{{ROADMAP_PHASE_ID:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{TASK_ID:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{FEATURE_SUMMARY}}`: Required single fill-in.
  - `{{ASSOCIATED_DOCUMENT_IDS:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{MERMAID_BODY}}`: Required single fill-in.

### FEATURES_FRAGMENT.template.md

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
  - `{{FEATURE_UPDATE_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{DOCUMENT_ASSOCIATION_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{OPEN_QUESTION_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{MERGE_GUIDANCE}}`: Required single fill-in.
