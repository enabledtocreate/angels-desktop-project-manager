# ADR Module AI

> Module AI file. Keep filename `ADR.ai.md`; APM discovers and syncs module AI files by this name.
> Read this file after `AI_ENVIRONMENT.md` and before generating or updating ADR documents or fragments.

## 1. AI File Metadata

- AI File Name: `ADR.ai.md`
- AI File Version: `1.2`
- Last Updated: `2026-04-23`
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

## 9. Imported Template Guidance

- Use token references where helpful: `@stable-id` for persisted targets, `#module-or-section` for document/module scope, `$work-item-code` for provenance, `/operation` for intended action, `?question` for review points, and `!guardrail` for constraints.
- Token references supplement structured operations and target ids; they do not replace explicit fields such as operation, targetSection, targetItemId, sourceRefs, or managed payload data.
- Keep the fragment focused on one decision at a time.
- Reference the affected architecture area, rationale, and downstream tradeoffs clearly.
- Use this fragment when a significant architectural decision is introduced, changed, or reversed.
- For section-targeted changes, include an `APM:OPERATIONS` HTML comment block with JSON operations such as `add`, `update`, `remove`, `reorder`, `move`, `link`, and `unlink`.
- Use stable ids for persisted document items, fragment targets, graph nodes, graph edges, models, and projections.
- Keep titles concise; put long detail in description or body fields.
- Keep the `APM:DATA` managed block intact and valid JSON.
- Keep the top compliance note intact.
- Preserve the section order defined in this template.
- ADRs should record important decisions, not replace the Architecture document.
- If this template structure changes, update the version section before making any other structural edits.
- AI Agent instruction: Whenever this template is updated, update the template version and last updated date before changing any section definitions.
- `ADR.md` is a managed document generated from application state.
- The application database is the source of truth for ADR editor fields and generated markdown.
- Architecture describes the broader system design; ADR records explain significant architectural decisions and their tradeoffs.
- Significant architecture changes should update Architecture and create or update ADR entries.
- If a disk file conflicts with database state, the application may regenerate this file from the database.
