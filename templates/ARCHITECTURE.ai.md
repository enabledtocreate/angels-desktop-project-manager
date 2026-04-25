# Architecture Module AI

> Module AI file. Keep filename `ARCHITECTURE.ai.md`; APM discovers and syncs module AI files by this name.
> Read this file after `AI_ENVIRONMENT.md` and before generating or updating Architecture documents or fragments.

## 1. AI File Metadata

- AI File Name: `ARCHITECTURE.ai.md`
- AI File Version: `1.2`
- Last Updated: `2026-04-23`
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

## 9. Imported Template Guidance

- Use token references where helpful: `@stable-id` for persisted targets, `#module-or-section` for document/module scope, `$work-item-code` for provenance, `/operation` for intended action, `?question` for review points, and `!guardrail` for constraints.
- Token references supplement structured operations and target ids; they do not replace explicit fields such as operation, targetSection, targetItemId, sourceRefs, or managed payload data.
- Focus on system structure, workflows, boundaries, major components, and cross-module impact.
- Record new libraries, runtime dependencies, and external integrations explicitly.
- Call out whether the architecture change should also create or update an ADR record.
- Link downstream impacts to Persistence, Technical Design, Experience Design, ADR, or Test Strategy when relevant.
- For section-targeted changes, include an `APM:OPERATIONS` HTML comment block with JSON operations such as `add`, `update`, `remove`, `reorder`, `move`, `link`, and `unlink`.
- Use stable target item ids when updating existing architecture entries so fragments stay resilient to reordering.
- Use stable ids for persisted document items, fragment targets, graph nodes, graph edges, models, and projections.
- Keep titles concise; put long detail in description or body fields.
- Keep the `APM:DATA` managed block intact and valid JSON.
- Keep the top compliance note intact.
- Preserve the section order defined in this template.
- Keep Mermaid text valid and aligned with the component and connection map maintained in the architecture editor.
- If this template structure changes, update the version section before making any other structural edits.
- AI Agent instruction: Whenever this template is updated, update the template version and last updated date before changing any section definitions.
- `ARCHITECTURE.md` is a managed document generated from application state.
- The application database is the source of truth for architecture editor fields, generated markdown, and Mermaid content.
- Architecture should support both single-application projects and larger systems with sub-architectures.
- Architecture should describe system structure, workflows, stack, persistence strategy, and module interdependence.
- Significant architectural decisions should also create or update ADR records.
- If a disk file conflicts with database state, the application may regenerate this file from the database.
