# Domain Models Module AI

> Module AI file. Keep filename `DOMAIN_MODELS.ai.md`; APM discovers and syncs module AI files by this name.
> Read this file after `AI_ENVIRONMENT.md` and before generating or updating Domain Models documents or fragments.

## 1. AI File Metadata

- AI File Name: `DOMAIN_MODELS.ai.md`
- AI File Version: `1.2`
- Last Updated: `2026-04-23`
- Owning Module: `Domain Models`
- Document Template: `DOMAIN_MODELS.template.md`
- Fragment Template: `DOMAIN_MODELS_FRAGMENT.template.md`

## 2. Module Purpose

Use Domain Models as the shared conceptual model layer that other modules can project from before implementation-specific shapes are known.

## 3. Source Of Truth

- Read `AI_ENVIRONMENT.md` first for global operating rules, fragment-path rules, stable-id rules, and standards references.
- Read `DOMAIN_MODELS.template.md` for the literal document shape that APM generates.
- Read `DOMAIN_MODELS_FRAGMENT.template.md` for the literal fragment shape that APM can consume.
- Treat generated markdown as an output of module state; prefer module saves or compliant fragments over direct edits.

## 4. Document Rules

- Generate DOMAIN_MODELS.md from structured model and projection state.
- Keep models conceptual first and implementation-neutral.
- Use projections to express how the conceptual model appears in schema, UI, APIs, flows, or technical design.

## 5. Fragment Rules

- Use DOMAIN_MODELS fragments for adding, updating, removing, linking, or reordering models, projections, and open questions.
- Target model ids or projection ids explicitly when they already exist.
- Prefer precise operations over freeform narrative when the fragment intends to change structured state.

## 6. Allowed Values / Contracts

- Allowed `conceptualType` values are `unknown`, `text`, `number`, `boolean`, `date`, `datetime`, `identifier`, `enum`, `object`, `collection`, and `reference`.
- These are conceptual types, not database, API, UI, or programming-language contracts.
- Keep model stable ids distinct from projection stable ids and work-item codes.

## 7. Cross-Module Rules

- Domain Models should inform Database Schema, Functional Spec, Experience Design, Technical Design, and Architecture.
- Use projections instead of mutating the base conceptual model into stack-specific shapes.

## 8. Guardrails

- Do not treat Domain Models as database tables, UI forms, API payloads, or implementation classes.
- Do not treat DOMAIN_MODELS.md as a direct database-schema generator without review.
- Do not edit generated DOMAIN_MODELS.md directly when the module or fragments should own the change.

## 9. Imported Template Guidance

- Use token references where helpful: `@stable-id` for persisted targets, `#module-or-section` for document/module scope, `$work-item-code` for provenance, `/operation` for intended action, `?question` for review points, and `!guardrail` for constraints.
- Token references supplement structured operations and target ids; they do not replace explicit fields such as operation, targetSection, targetItemId, sourceRefs, or managed payload data.
- Keep base models conceptual and technology-neutral.
- Put database-specific shape in Database Schema projections.
- Put UI-specific shape in Experience Design projections.
- Put implementation-specific shape in Technical Design projections.
- Use stable ids for persisted document items, fragment targets, graph nodes, graph edges, models, and projections.
- Keep titles concise; put long detail in description or body fields.
- Treat Domain Models as the central meaning layer.
- Use projections to connect a base model to Functional Spec, Experience Design, Persistence, Technical Design, APIs, events, and tests.
- Keep every model, field, relationship, projection, and open question stable-id addressable.
