# Architecture Module AI

> Module AI file. Keep filename `ARCHITECTURE.ai.md`; APM discovers and syncs module AI files by this name.
> Read this file after `AI_ENVIRONMENT.md` and before generating or updating Architecture documents or fragments.

## 1. AI File Metadata

- AI File Name: `ARCHITECTURE.ai.md`
- AI File Version: `1.10`
- Last Updated: `2026-04-25`
- Owning Module: `Architecture`
- Document Template: `ARCHITECTURE.template.md`
- Fragment Template: `ARCHITECTURE_FRAGMENT.template.md`

## 2. Module Purpose

Use Architecture to describe system boundaries, layers, components, connections, and orchestration between modules or projects.

## 3. Source Of Truth

- Read `AI_ENVIRONMENT.md` first for global operating rules, fragment-path rules, stable-id rules, and standards references.
- Read `ARCHITECTURE.template.md` for the literal document shape that APM generates.
- Read `ARCHITECTURE_FRAGMENT.template.md` for the literal fragment shape that APM can consume.
- Treat generated markdown as an output of module state; prefer module saves or compliant fragments over direct edits.

## 4. Document Rules

- Generate ARCHITECTURE.md as a structured system design document with stable ids for addressable elements.
- Keep architecture focused on system structure and relationships rather than low-level implementation detail.
- Reflect parent-child project orchestration and cross-module boundaries where relevant.

## 5. Fragment Rules

- Use ARCHITECTURE fragments for component, layer, boundary, and connection updates.
- Target explicit architecture item ids so downstream references remain stable.
- Significant architectural changes should also create or update ADR records.

## 6. Allowed Values / Contracts

- Preserve stable ids for components, layers, edges, and notes.
- Use clear architectural labels and keep work-item references supplemental.
- Follow supported fragment operations.

## 7. Cross-Module Rules

- Architecture should reference Domain Models, Functional Flows, Persistence, external systems, and project-family relationships where applicable.
- Major architecture changes may require ADR, Technical Design, and Test Strategy follow-up.

## 8. Guardrails

- Do not turn Architecture into a dump of implementation code details.
- Do not edit generated ARCHITECTURE.md directly.

## 9. Template Construction Rules

### Placeholder Syntax

- `{{NAME}}`: required single value.
- `{{NAME:OPTION_A|OPTION_B}}`: select one allowed value.
- `{{NAME:0..1}}`: optional value or optional block.
- `{{NAME:0..N}}`: repeatable value, list, array, or repeated markdown block.
- Placeholders used as full JSON values must be replaced with valid JSON objects, arrays, strings, numbers, booleans, or `null` that match the surrounding structure.
- `<!-- REPEAT {{NAME:0..N}} --> ... <!-- END REPEAT {{NAME}} -->` marks a repeatable markdown region.
- Keep the `APM:DATA` and `APM:OPERATIONS` blocks structurally valid after replacement.

### ARCHITECTURE.template.md

- Template Version: `1.4`
- Last Updated: `2026-04-25`
- Template Role: `document`
- Generated Artifact: `ARCHITECTURE.md`
- Consumption Goal: A filled template should read like the final managed document body and keep the managed metadata block intact.
- Fill-In Slots:
  - `{{PROJECT_NAME}}`: Required single fill-in.
  - `{{DOC_VERSION:1}}`: Fill using `1` semantics.
  - `{{TEMPLATE_VERSION}}`: Required single fill-in.
  - `{{SOURCE_OF_TRUTH:database|generated|hybrid}}`: Select one allowed value: `database`, `generated`, `hybrid`.
  - `{{MERMAID_JSON:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{EDITOR_STATE_JSON:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{ARCHITECTURE_OVERVIEW}}`: Required single fill-in.
  - `{{ARCHITECTURE_REGISTRY_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{TECH_STACK_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{COMPONENT_AND_BOUNDARY_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{WORKFLOW_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{MODULE_INTERDEPENDENCE_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{PERSISTENCE_AND_STATE_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{CROSS_CUTTING_CONCERN_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{DECISION_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{CONSTRAINT_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{RUNTIME_AND_DEPLOYMENT_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{OPEN_QUESTION_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{MERMAID_BODY}}`: Required single fill-in.

### ARCHITECTURE_FRAGMENT.template.md

- Template Version: `1.4`
- Last Updated: `2026-04-25`
- Template Role: `fragment`
- Fragment Merge Mode: `apm-operations`
- Allowed Target Sections: `tech-stack`, `external-dependencies`, `boundaries`, `application-workflows`, `architecture-workflows`, `module-interactions`, `project-family-orchestration`, `child-project-boundaries`, `cross-project-interfaces`, `cross-cutting-concerns`, `decisions`, `constraints`, `open-questions`
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
  - `{{TARGET_SECTION:tech-stack|external-dependencies|boundaries|application-workflows|architecture-workflows|module-interactions|project-family-orchestration|child-project-boundaries|cross-project-interfaces|cross-cutting-concerns|decisions|constraints|open-questions}}`: Select one allowed value: `tech-stack`, `external-dependencies`, `boundaries`, `application-workflows`, `architecture-workflows`, `module-interactions`, `project-family-orchestration`, `child-project-boundaries`, `cross-project-interfaces`, `cross-cutting-concerns`, `decisions`, `constraints`, `open-questions`.
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
  - `{{ARCHITECTURE_SCOPE_UPDATE_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{TECH_STACK_UPDATE_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{COMPONENT_AND_BOUNDARY_UPDATE_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{WORKFLOW_AND_DEPENDENCY_UPDATE_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{RUNTIME_OR_DEPLOYMENT_IMPACT}}`: Required single fill-in.
  - `{{OPEN_QUESTION_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{MERGE_GUIDANCE}}`: Required single fill-in.
