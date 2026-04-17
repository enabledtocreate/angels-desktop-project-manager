# Functional Specification

> Managed document. Must comply with template FUNCTIONAL_SPEC.template.md.

- Template Version: `2.0`
- Last Updated: `2026-04-13`

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
- Project-local copies in `.apm/templates` must be replaced when the source template version or content hash changes.
- AI agents must follow the latest copied template before generating or applying Functional Specification fragments.

## Functional Flowchart Action Vocabulary

Functional workflows are descriptive, not implementation code. Use these standard actions so the UI, markdown document, and AI agents can translate the same workflow consistently.

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

## Guidance

- Focus on behavior, not implementation detail.
- Keep it aligned with the PRD and roadmap.
- Use language that can feed architecture, Experience Design, and test strategy work.
- Keep the terminology technology-neutral unless the technology itself changes the required behavior.
- Group workflows by Functional Area when the application has recognizable areas such as File Menu, Project List, Fragment Management, or SFTP Transfers.
- Put user actions, system responses, validation, decisions, edge cases, errors, logging, inputs, and outputs inside the flow graph as typed nodes or connections instead of maintaining duplicate standalone sections.
- Use standalone sections for unattached notes only when the item does not yet belong to a specific flow, node, edge, group, endpoint, or model reference.
- Every workflow, node, edge, control point, model reference, and open question should have stable ids so fragments can target them precisely.
- Treat open questions like comments that may attach to a workflow, node, edge, control point, Functional Area, or the document as a whole.
- Backend-only systems are valid Functional Spec targets; use inputs, outputs, validation, return points, errors, logging, external interactions, and control points even when there is no UI.

