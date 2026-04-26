# Functional Spec Module AI

> Module AI file. Keep filename `FUNCTIONAL_SPEC.ai.md`; APM discovers and syncs module AI files by this name.
> Read this file after `AI_ENVIRONMENT.md` and before generating or updating Functional Spec documents or fragments.

## 1. AI File Metadata

- AI File Name: `FUNCTIONAL_SPEC.ai.md`
- AI File Version: `1.10`
- Last Updated: `2026-04-25`
- Owning Module: `Functional Spec`
- Document Template: `FUNCTIONAL_SPEC.template.md`
- Fragment Template: `FUNCTIONAL_SPEC_FRAGMENT.template.md`

## 2. Module Purpose

Use Functional Spec to define logical workflows, control points, smart-text statements, and functional areas in a technology-neutral but precise way.

## 3. Source Of Truth

- Read `AI_ENVIRONMENT.md` first for global operating rules, fragment-path rules, stable-id rules, and standards references.
- Read `FUNCTIONAL_SPEC.template.md` for the literal document shape that APM generates.
- Read `FUNCTIONAL_SPEC_FRAGMENT.template.md` for the literal fragment shape that APM can consume.
- Treat generated markdown as an output of module state; prefer module saves or compliant fragments over direct edits.

## 4. Document Rules

- Generate FUNCTIONAL_SPEC.md from structured workflow state rather than from freeform prose alone.
- Keep stable ids on workflow areas, nodes, edges, control points, open questions, and related grouped sections.
- Treat user actions, system responses, validation, interface expectations, and edge cases as properties of the workflows where possible.

## 5. Fragment Rules

- Use FUNCTIONAL_SPEC fragments to add, update, remove, reorder, link, or move workflows and related items.
- Target workflow, node, edge, and control-point ids explicitly.
- AI placeholders may be used as intentional incomplete nodes that later fragments can expand into more detailed logic.

## 6. Allowed Values / Contracts

- Stable ids are required for workflows, nodes, edges, control points, AI placeholders, and open questions.
- Use the supported functional flow vocabulary and action types from the module templates.
- Keep logic technology-neutral unless a technical dependency truly matters.

## 7. Cross-Module Rules

- Functional Spec should connect to Domain Models, Experience Design, Architecture, and Test Strategy.
- Functional control points and io ids are meant to be attachable elsewhere in the system.

## 8. Guardrails

- Do not reduce Functional Spec to raw programming syntax.
- Do not edit generated FUNCTIONAL_SPEC.md directly when the workflow editor or fragments should own the change.

## 9. Template Construction Rules

### Placeholder Syntax

- `{{NAME}}`: required single value.
- `{{NAME:OPTION_A|OPTION_B}}`: select one allowed value.
- `{{NAME:0..1}}`: optional value or optional block.
- `{{NAME:0..N}}`: repeatable value, list, array, or repeated markdown block.
- Placeholders used as full JSON values must be replaced with valid JSON objects, arrays, strings, numbers, booleans, or `null` that match the surrounding structure.
- `<!-- REPEAT {{NAME:0..N}} --> ... <!-- END REPEAT {{NAME}} -->` marks a repeatable markdown region.
- Keep the `APM:DATA` and `APM:OPERATIONS` blocks structurally valid after replacement.

### FUNCTIONAL_SPEC.template.md

- Template Version: `1.4`
- Last Updated: `2026-04-25`
- Template Role: `document`
- Generated Artifact: `FUNCTIONAL_SPEC.md`
- Consumption Goal: A filled template should read like the final managed document body and keep the managed metadata block intact.
- Fill-In Slots:
  - `{{PROJECT_NAME}}`: Required single fill-in.
  - `{{DOC_VERSION:1}}`: Fill using `1` semantics.
  - `{{TEMPLATE_VERSION}}`: Required single fill-in.
  - `{{SOURCE_OF_TRUTH:database|generated|hybrid}}`: Select one allowed value: `database`, `generated`, `hybrid`.
  - `{{EDITOR_STATE_JSON:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{EXECUTIVE_SUMMARY}}`: Required single fill-in.
  - `{{FUNCTIONAL_AREA_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{LOGICAL_WORKFLOW_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{FLOW_VISUAL_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{FLOW_ENDPOINT_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{OPEN_QUESTION_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{APPLIED_FRAGMENT_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.

### FUNCTIONAL_SPEC_FRAGMENT.template.md

- Template Version: `1.4`
- Last Updated: `2026-04-25`
- Template Role: `fragment`
- Fragment Merge Mode: `apm-operations`
- Allowed Target Sections: `functional-areas`, `logical-flows`, `flow-visuals`, `flow-endpoints`, `user-actions-and-system-responses`, `validation-rules`, `interface-expectations`, `edge-cases`, `open-questions`
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
  - `{{TARGET_SECTION:functional-areas|logical-flows|flow-visuals|flow-endpoints|user-actions-and-system-responses|validation-rules|interface-expectations|edge-cases|open-questions}}`: Select one allowed value: `functional-areas`, `logical-flows`, `flow-visuals`, `flow-endpoints`, `user-actions-and-system-responses`, `validation-rules`, `interface-expectations`, `edge-cases`, `open-questions`.
  - `{{FROM_SECTION:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{TARGET_ITEM_ID:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{BEFORE_ITEM_ID:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{AFTER_ITEM_ID:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{ORDERED_IDS_JSON:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{VERSION_DATE:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{ITEM_ID:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{ITEM_STABLE_ID:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{ITEM_TITLE:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{ITEM_DESCRIPTION:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{FLOW_ID:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{FLOW_STABLE_ID:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{ITEM_TYPE:start|user_action|system_action|decision|validation|loop|input|output|endpoint|return|error_path|log_audit|external_interaction|formula|model_reference|ai_placeholder|open_question}}`: Select one allowed value: `start`, `user_action`, `system_action`, `decision`, `validation`, `loop`, `input`, `output`, `endpoint`, `return`, `error_path`, `log_audit`, `external_interaction`, `formula`, `model_reference`, `ai_placeholder`, `open_question`.
  - `{{ITEM_LABEL:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{ITEM_COMMAND:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{ITEM_POSITION_JSON:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{EDGE_SOURCE_ID:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{EDGE_TARGET_ID:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{EDGE_SOURCE_HANDLE:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{EDGE_TARGET_HANDLE:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{EDGE_CONDITION_TEXT:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{FLOW_NODES_JSON:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{FLOW_EDGES_JSON:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{FLOW_OPEN_QUESTIONS_JSON:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{SOURCE_REFS_JSON:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{ADDITIONAL_OPERATION_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{EXECUTIVE_SUMMARY}}`: Required single fill-in.
  - `{{FUNCTIONAL_AREA_UPDATE_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{LOGICAL_FLOW_UPDATE_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{FLOW_VISUAL_UPDATE_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{FLOW_ENDPOINT_UPDATE_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{OPEN_QUESTION_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{MERGE_GUIDANCE}}`: Required single fill-in.
