# Roadmap Module AI

> Module AI file. Keep filename `ROADMAP.ai.md`; APM discovers and syncs module AI files by this name.
> Read this file after `AI_ENVIRONMENT.md` and before generating or updating Roadmap documents or fragments.

## 1. AI File Metadata

- AI File Name: `ROADMAP.ai.md`
- AI File Version: `1.2`
- Last Updated: `2026-04-23`
- Owning Module: `Roadmap`
- Document Template: `ROADMAP.template.md`
- Fragment Template: `ROADMAP_FRAGMENT.template.md`

## 2. Module Purpose

Use Roadmap to plan phases, sequencing, and active future work without duplicating implemented history.

## 3. Source Of Truth

- Read `AI_ENVIRONMENT.md` first for global operating rules, fragment-path rules, stable-id rules, and standards references.
- Read `ROADMAP.template.md` for the literal document shape that APM generates.
- Read `ROADMAP_FRAGMENT.template.md` for the literal fragment shape that APM can consume.
- Treat generated markdown as an output of module state; prefer module saves or compliant fragments over direct edits.

## 4. Document Rules

- Generate ROADMAP.md from live roadmap state and active unfinished work.
- Keep archived work out of the active roadmap views unless the document explicitly calls for history.
- Reflect planning buckets and phase structure consistently.

## 5. Fragment Rules

- Use ROADMAP fragments for phase, sequencing, and active planning changes.
- Fragments should target phases, planned features, considered items, or roadmap notes explicitly.
- When planning changes affect Features or PRD traceability, reference the work-item codes.

## 6. Allowed Values / Contracts

- Use stable ids for phases, roadmap notes, and targetable roadmap items.
- Respect supported operations and target sections from the fragment template.
- Keep roadmap phrasing planning-focused, not implementation-complete.

## 7. Cross-Module Rules

- Roadmap should align with active entries in FEATURES.md and BUGS.md.
- When a roadmap change implies canonical product behavior changes, downstream document fragments may also be needed.

## 8. Guardrails

- Do not edit `ROADMAP.md` directly when proposing roadmap changes through AI-assisted workflows.
- Do not use Roadmap as the implemented feature archive.
- Do not edit generated ROADMAP.md directly.

## 9. Imported Template Guidance

- Keep the `APM:DATA` managed block intact and valid JSON.
- Keep the top compliance note intact.
- Use stable IDs when referring to existing features, phases, and tasks.
- Keep Mermaid text valid.
- AI Agent instruction: Whenever this template is updated, update the template version and last updated date before changing anything else.
- `ROADMAP_FRAGMENT_*.md` is a proposal document, not the canonical roadmap.
- The application database is the source of truth.
- The application reads this fragment, stores it in SQLite, and can integrate the approved changes into roadmap phases, feature assignments, and task assignments.
- Use feature IDs from `FEATURES.md`.
- Use task IDs from the Kanban/Gantt task system.
- Prefer existing phase IDs or phase codes when modifying an existing phase.
- Use token references where helpful: `@stable-id` for persisted targets, `#module-or-section` for document/module scope, `$work-item-code` for provenance, `/operation` for intended action, `?question` for review points, and `!guardrail` for constraints.
- Token references supplement structured operations and target ids; they do not replace explicit fields such as phaseChanges, featureAssignments, taskAssignments, sourceRefs, or managed payload data.
- Create or update a roadmap fragment instead of editing `ROADMAP.md` directly.
- Keep the fragment compliant with this template.
- Put structural change intent in the managed payload.
- Use the human-readable markdown body to explain why the roadmap changes are being proposed.
- Include token references in the markdown body when they help the AI agent or reviewer understand the target scope, work item provenance, or intended merge action.
- Use stable ids for persisted document items, fragment targets, graph nodes, graph edges, models, and projections.
- Keep titles concise; put long detail in description or body fields.
- Preserve the section order defined in this template.
- Keep roadmap phases, linked task references, and feature references aligned with the application database.
- Mermaid text must remain valid.
- If the structure of this template changes, update the version section in both this template and the generated `ROADMAP.md` context that depends on it.
- AI Agent instruction: Whenever this template is updated, update the template version and last updated date before making any other structural edits.
- `ROADMAP.md` is a managed document generated from application state.
- The application database is the source of truth for phases, linked tasks, planned features, and considered features.
- The roadmap document must remain structurally readable by both the application and an AI agent.
- Feature IDs in `ROADMAP.md` refer to active unfinished entries in `FEATURES.md`.
- AI agents should use active feature IDs for planning and implementation context.
- AI agents should ignore implemented, completed, resolved, closed, and archived work unless explicitly asked to review project history.
- Tasks referenced in roadmap phases are linked to the Kanban board and Gantt/timeline scheduling.
- If a document edit conflicts with application data, the application may regenerate the file from the database.
- AI Agent instruction: Use feature IDs in this roadmap to cross-reference active planned entries in FEATURES.md. Implemented, completed, resolved, closed, and archived work is omitted unless explicitly asked to review history.
