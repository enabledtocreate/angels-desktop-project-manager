# Project Brief Module AI

> Module AI file. Keep filename `PROJECT_BRIEF.ai.md`; APM discovers and syncs module AI files by this name.
> Read this file after `AI_ENVIRONMENT.md` and before generating or updating Project Brief documents or fragments.

## 1. AI File Metadata

- AI File Name: `PROJECT_BRIEF.ai.md`
- AI File Version: `1.2`
- Last Updated: `2026-04-23`
- Owning Module: `Project Brief`
- Document Template: `PROJECT_BRIEF.template.md`
- Fragment Template: `PROJECT_BRIEF_FRAGMENT.template.md`

## 2. Module Purpose

Use Project Brief to establish the root context for what the project is, why it exists, and how the rest of the managed documents should inherit that framing.

## 3. Source Of Truth

- Read `AI_ENVIRONMENT.md` first for global operating rules, fragment-path rules, stable-id rules, and standards references.
- Read `PROJECT_BRIEF.template.md` for the literal document shape that APM generates.
- Read `PROJECT_BRIEF_FRAGMENT.template.md` for the literal fragment shape that APM can consume.
- Treat generated markdown as an output of module state; prefer module saves or compliant fragments over direct edits.

## 4. Document Rules

- Generate PROJECT_BRIEF.md as the root human-readable context document for the project.
- Keep the brief high-level and stable; move operational or rapidly changing detail into downstream modules.
- Prefer concise section summaries and durable language over implementation chatter.

## 5. Fragment Rules

- Use PROJECT_BRIEF fragments for scoped changes to the brief rather than editing generated markdown directly.
- Target explicit stable ids and target sections whenever a fragment changes structured items.
- Use the fragment only to change project brief context, not to smuggle downstream module updates.

## 6. Allowed Values / Contracts

- Preserve stable ids for persisted brief items.
- Treat Project Brief as a root-context document, not a delivery tracker.
- Keep document and fragment payloads aligned with the paired templates.

## 7. Cross-Module Rules

- Project Brief informs PRD, Roadmap, AI Environment, and Architecture.
- If a change alters the project mission or scope, check downstream modules for follow-up edits.

## 8. Guardrails

- Do not turn Project Brief into a changelog, feature register, or bug list.
- Do not edit PROJECT_BRIEF.md directly when the module state or fragment workflow should own the change.

## 9. Imported Template Guidance

- Use token references where helpful: `@stable-id` for persisted targets, `#module-or-section` for document/module scope, `$work-item-code` for provenance, `/operation` for intended action, `?question` for review points, and `!guardrail` for constraints.
- Token references supplement structured operations and target ids; they do not replace explicit fields such as operation, targetSection, targetItemId, sourceRefs, or managed payload data.
- Describe what changed about the project identity, goals, constraints, or context.
- Keep the wording stable and high-signal so downstream modules can read it safely.
- Put uncertainty in `Open Questions` instead of guessing.
- Merge this fragment into the Project Brief module instead of editing the canonical document directly.
- Use stable ids for persisted document items, fragment targets, graph nodes, graph edges, models, and projections.
- Keep titles concise; put long detail in description or body fields.
