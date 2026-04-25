# Functional Spec Module AI

> Module AI file. Keep filename `FUNCTIONAL_SPEC.ai.md`; APM discovers and syncs module AI files by this name.
> Read this file after `AI_ENVIRONMENT.md` and before generating or updating Functional Spec documents or fragments.

## 1. AI File Metadata

- AI File Name: `FUNCTIONAL_SPEC.ai.md`
- AI File Version: `1.2`
- Last Updated: `2026-04-23`
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

## 9. Imported Template Guidance

- Prefer stable ids and fragment operations when updating an existing functional flow.
- Prefer graph-aware operations for workflows, nodes, edges, control points, model references, and open questions once those ids exist.
- Use token references where helpful: `@stable-id` for persisted targets, `#module-or-section` for document/module scope, `$work-item-code` for provenance, `/operation` for intended action, `?question` for review points, and `!guardrail` for constraints.
- Token references supplement structured operations and target ids; they do not replace explicit fields such as operation, targetSection, targetItemId, sourceRefs, or managed payload data.
- Keep the fragment behavior-focused and testable.
- Note dependencies on PRD, Features, Bugs, Experience Design, or Test Strategy where relevant.
- Use `targetSection: "flow-visuals"` when a fragment needs to create or replace the visual node and connection graph for a logical workflow.
- Put user actions, system responses, validation, decisions, edge cases, errors, logging, inputs, and outputs into node or connection updates instead of separate legacy text sections.
- Use Domain Models references when behavior manipulates shared conceptual objects.
- Use stable ids for persisted document items, fragment targets, graph nodes, graph edges, models, and projections.
- Keep titles concise; put long detail in description or body fields.
- AI agents must follow the latest copied template before generating or applying Functional Specification fragments.
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
