# ADR Module AI

> Module AI file. Keep filename `ADR.ai.md`; APM discovers and syncs module AI files by this name.
> Read this file after `AI_ENVIRONMENT.md` and before generating or updating ADR documents or fragments.

## 1. AI File Metadata

- AI File Name: `ADR.ai.md`
- AI File Version: `1.10`
- Last Updated: `2026-04-25`
- Owning Module: `ADR`
- Document Template: `ADR.template.md`
- Fragment Template: `ADR_FRAGMENT.template.md`

## 2. Module Purpose

Use ADR to capture durable architectural decisions, their context, alternatives, and consequences.

## 3. Source Of Truth

- Read `AI_ENVIRONMENT.md` first for global operating rules, fragment-path rules, stable-id rules, and standards references.
- Read `ADR.template.md` for the literal document shape that APM generates.
- Read `ADR_FRAGMENT.template.md` for the literal fragment shape that APM can consume.
- Treat generated markdown as an output of module state; prefer module saves or compliant fragments over direct edits.

## 4. Document Rules

- Generate ADR.md as a structured register of architecture decisions rather than a loose narrative.
- Each ADR entry should clearly state status, context, decision, consequences, and references.
- Keep ADRs durable and revision-friendly.

## 5. Fragment Rules

- Use ADR fragments to add, revise, supersede, or annotate architectural decisions.
- Link ADR changes to Architecture and any affected work-item codes.
- Use stable ids for ADR entries when present.

## 6. Allowed Values / Contracts

- ADR entries are architecture-decision records, not implementation tickets.
- Keep statuses and cross-references explicit.
- Follow fragment operation and section rules from the paired templates.

## 7. Cross-Module Rules

- ADR follows Architecture changes and may influence Technical Design and Test Strategy.
- Significant architecture shifts should usually produce or update ADR records.

## 8. Guardrails

- Do not bury architecture decisions only inside Architecture or Technical Design if they deserve an ADR.
- Do not edit generated ADR.md directly when fragments or module state should own the change.

## 9. Template Construction Rules

### Placeholder Syntax

- `{{NAME}}`: required single value.
- `{{NAME:OPTION_A|OPTION_B}}`: select one allowed value.
- `{{NAME:0..1}}`: optional value or optional block.
- `{{NAME:0..N}}`: repeatable value, list, array, or repeated markdown block.
- Placeholders used as full JSON values must be replaced with valid JSON objects, arrays, strings, numbers, booleans, or `null` that match the surrounding structure.
- `<!-- REPEAT {{NAME:0..N}} --> ... <!-- END REPEAT {{NAME}} -->` marks a repeatable markdown region.
- Keep the `APM:DATA` and `APM:OPERATIONS` blocks structurally valid after replacement.

### ADR.template.md

- Template Version: `1.4`
- Last Updated: `2026-04-25`
- Template Role: `document`
- Generated Artifact: `ADR.md`
- Consumption Goal: A filled template should read like the final managed document body and keep the managed metadata block intact.
- Fill-In Slots:
  - `{{PROJECT_NAME}}`: Required single fill-in.
  - `{{DOC_VERSION:1}}`: Fill using `1` semantics.
  - `{{TEMPLATE_VERSION}}`: Required single fill-in.
  - `{{SOURCE_OF_TRUTH:database|generated|hybrid}}`: Select one allowed value: `database`, `generated`, `hybrid`.
  - `{{EDITOR_STATE_JSON:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{EXECUTIVE_SUMMARY}}`: Required single fill-in.
  - `{{DECISION_TITLE}}`: Required single fill-in.
  - `{{DECISION_STATUS:proposed|accepted|superseded|deprecated|rejected}}`: Select one allowed value: `proposed`, `accepted`, `superseded`, `deprecated`, `rejected`.
  - `{{DECISION_SCOPE}}`: Required single fill-in.
  - `{{DECISION_OWNERS}}`: Required single fill-in.
  - `{{DECISION_DATE}}`: Required single fill-in.
  - `{{CONTEXT_BODY}}`: Required single fill-in.
  - `{{DECISION_BODY}}`: Required single fill-in.
  - `{{RATIONALE_BODY}}`: Required single fill-in.
  - `{{ALTERNATIVE_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{CONSEQUENCE_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{RELATED_ARCHITECTURE_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{RELATED_MODULE_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{FOLLOW_UP_NOTES}}`: Required single fill-in.
  - `{{APPLIED_FRAGMENT_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{OPEN_QUESTION_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.

### ADR_FRAGMENT.template.md

- Template Version: `1.4`
- Last Updated: `2026-04-25`
- Template Role: `fragment`
- Fragment Merge Mode: `apm-operations`
- Allowed Target Sections: `alternatives`, `consequences`, `related-architecture`, `related-modules`, `open-questions`
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
  - `{{TARGET_SECTION:alternatives|consequences|related-architecture|related-modules|open-questions}}`: Select one allowed value: `alternatives`, `consequences`, `related-architecture`, `related-modules`, `open-questions`.
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
  - `{{DECISION_METADATA_UPDATES}}`: Required single fill-in.
  - `{{PROPOSED_DECISION}}`: Required single fill-in.
  - `{{CONTEXT_AND_RATIONALE_UPDATES}}`: Required single fill-in.
  - `{{ALTERNATIVE_AND_CONSEQUENCE_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{RELATED_ARCHITECTURE_AND_MODULE_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{OPEN_QUESTION_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{MERGE_GUIDANCE}}`: Required single fill-in.
