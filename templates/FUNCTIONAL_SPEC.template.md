# Functional Spec Template

> Template Contract. Keep filename `FUNCTIONAL_SPEC.template.md`; APM discovers and syncs templates by this name.
> Managed document. Must comply with template FUNCTIONAL_SPEC.template.md.

## 1. Template Contract Metadata

- Template Name: `FUNCTIONAL_SPEC.template.md`
- Template Version: `2.4`
- Last Updated: `2026-04-23`
- Template Kind: `document`
- Owning Module: `Functional Spec`
- Generated Artifact: `FUNCTIONAL_SPEC.md`

## 2. Contract / Allowed Schema

### Required Contract Rules

- Keep `Template Name`, `Template Version`, and `Last Updated` present and current.
- Keep the managed-document compliance note in generated artifacts.
- Preserve `APM:DATA` managed blocks when present, and keep JSON valid.

### Allowed Target Sections

- This is a generated document contract; update module state or consume fragments instead of editing generated output directly.

## 3. Actual Template

# Functional Specification

## Purpose

Describe how the software should behave in precise, testable terms.

## Required Sections

1. Executive Summary
2. Functional Areas
3. Logical Workflows
4. Flow Nodes and Connections
5. Flow Endpoints and Return Points
6. User Actions and System Responses
7. Validation Rules
8. Interface Expectations
9. Edge Cases
10. Open Questions
11. Applied Fragments

## Versioning

- The template version is the contract for generated Functional Specification documents and fragments.
- When this template changes, update `Template Version` and `Last Updated`.
- Project-local copies in `data/projects/<project-id>/templates` must be replaced when the source template version or content hash changes.

## Functional Flowchart Action Vocabulary

Functional workflows are descriptive, not implementation code. Use these standard actions so the UI and markdown document can represent the same workflow consistently.

### Node Types

- Start: Begins a logical workflow.
- User Action: Describes an intentional user behavior, command, selection, input, or gesture.
- System Action: Describes behavior the system performs in response to a trigger or condition.
- Decision: Describes a conditional branch such as if, else, switch, yes/no, valid/invalid, or available/unavailable.
- Validation: Describes a rule that checks input, state, permissions, data shape, or readiness before continuing.
- Loop: Describes repeated behavior until a stop condition is met.
- Input: Describes data, events, commands, files, selections, or external signals entering the flow.
- Output: Describes data, messages, files, screen changes, events, or results produced by the flow.
- Endpoint: Describes an attachable control point that other modules may reference as an input, output, or integration point.
- Return: Describes where the flow returns control, state, data, or user focus.
- Error Path: Describes expected failure handling, recovery, fallback behavior, or user-visible error messaging.
- Log / Audit: Describes logging, audit trail, diagnostics, telemetry, or error reporting behavior.
- External Interaction: Describes interaction with another system, service, API, file system, database, device, or module.
- Formula: Describes a calculation, derivation, comparison, transformation, or logical expression.
- Model Reference: Describes a relationship to a shared domain model, schema model, external payload, or data concept.
- AI Placeholder: Describes a freeform placeholder with a stable id where an AI agent should later generate a fragment that replaces or expands it into a more precise logical workflow structure.
- Open Question: Describes an unresolved design question attached to a flow, node, edge, endpoint, Functional Area, or the document as a whole.

### Connection Types

- Continue: Moves from one action to the next without a special condition.
- If / Then: Continues only when the stated condition is true or satisfied.
- Else: Continues when the prior condition is false or not satisfied.
- Loop Until: Repeats until the stated condition is met.
- On Success: Continues after the previous action succeeds.
- On Failure: Continues after the previous action fails or cannot complete.
- Returns To: Connects a flow back to a caller, return point, parent flow, or previous user context.
- Emits: Indicates that the source produces an event, message, file, data object, signal, or output.
- Consumes: Indicates that the target reads, receives, or depends on an event, message, file, data object, signal, or input.

### Canvas Actions

- Create Node: Add a typed node to a workflow using the standard node vocabulary.
- Move Node: Reposition a node without changing its meaning or id.
- Resize Node: Change the visual size of a node without changing its meaning or id.
- Delete Node: Remove the node while preserving affected connections as unattached draft edges when possible.
- Connect Nodes: Create a typed connection between source and target handles.
- Create Draft Edge: Create an unattached connection when the target is not known yet.
- Remove Draft Edge: Delete an unattached connection.
- Clean Layout: Reposition visible workflow nodes to reduce overlap while preserving ids and relationships.
- Hide Flow: Exclude a flow from the current visual view without deleting it from the document.
- Group Flows: Organize flows into a Functional Area or reusable shared flow group.
- Attach Comment: Attach an open question or note to a workflow, group, node, edge, endpoint, or document scope.
- Reference Model: Link a node, edge, formula, or flow to a shared domain model by stable id.
- Reference Module Item: Link a control point or workflow element to another module item by stable id.

### Smart Text Keywords

- `@model`: Reference a shared domain model or model field.
- `@if`, `@then`, `@else`: Express conditional logic in human-readable form.
- `@and`, `@or`, `@not`: Express logical operators.
- `@equals`, `@notEquals`, `@greaterThan`, `@lessThan`, `@greaterOrEqual`, `@lessOrEqual`: Express comparison operators.
- `@add`, `@subtract`, `@multiply`, `@divide`: Express arithmetic operators when a formula needs them.
- `@set`, `@assign`, `@copy`, `@transform`: Express assignment or transformation behavior.
- `@input`, `@output`, `@emit`, `@consume`, `@return`: Express data or control movement.
- `@log`, `@audit`, `@error`, `@recover`: Express observability and error-handling behavior.
- `@module`, `@flow`, `@node`, `@edge`, `@endpoint`: Reference stable ids from the Functional Spec or another module.

## 4. Examples

```md
# FUNCTIONAL_SPEC.md: {{PROJECT_NAME}}

> Managed document. Must comply with template FUNCTIONAL_SPEC.template.md.
```

## 5. Merge / Consumption Rules

- APM copies this template into the active project workspace and records its version/hash in the template registry.
- If this is a fragment template, APM discovers matching fragment files from the configured project fragments folder and shared fragments folder.
- The consuming module validates managed metadata and applies supported operations to structured module state.
- After consumption, generated markdown is regenerated from module state; stale fragment files may be archived or deleted according to the module workflow.

## 6. Version / Migration Notes

- Version `2.4` moves AI-facing instructions and restrictions into the paired module AI file so this template stays artifact-focused.
- Version `2.3` moves AI behavior guidance into the paired module AI file and keeps this template artifact-focused.
- Version `2.2` adds the standardized Template Contract structure.
- Fragment consumers must migrate older payload versions through explicit migrators before listing or consumption.
- When this template changes again, update `Template Version`, `Last Updated`, and any migrator guidance needed for older unconsumed fragments.
