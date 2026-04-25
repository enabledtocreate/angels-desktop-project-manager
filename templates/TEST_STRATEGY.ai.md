# Test Strategy Module AI

> Module AI file. Keep filename `TEST_STRATEGY.ai.md`; APM discovers and syncs module AI files by this name.
> Read this file after `AI_ENVIRONMENT.md` and before generating or updating Test Strategy documents or fragments.

## 1. AI File Metadata

- AI File Name: `TEST_STRATEGY.ai.md`
- AI File Version: `1.2`
- Last Updated: `2026-04-23`
- Owning Module: `Test Strategy`
- Document Template: `TEST_STRATEGY.template.md`
- Fragment Template: `TEST_STRATEGY_FRAGMENT.template.md`

## 2. Module Purpose

Use Test Strategy to capture how the project verifies behavior, prevents regressions, and translates features or bug fixes into validation work.

## 3. Source Of Truth

- Read `AI_ENVIRONMENT.md` first for global operating rules, fragment-path rules, stable-id rules, and standards references.
- Read `TEST_STRATEGY.template.md` for the literal document shape that APM generates.
- Read `TEST_STRATEGY_FRAGMENT.template.md` for the literal fragment shape that APM can consume.
- Treat generated markdown as an output of module state; prefer module saves or compliant fragments over direct edits.

## 4. Document Rules

- Generate TEST_STRATEGY.md as structured verification guidance rather than ad hoc notes.
- Keep testing layers, coverage expectations, regression guidance, environments, and open risks clear.
- Tie important testing expectations back to features, bugs, and module behavior.

## 5. Fragment Rules

- Use TEST_STRATEGY fragments to add, revise, or retire test guidance as implementation evolves.
- Bug fixes should usually produce regression-test follow-up here.
- Use explicit target sections and stable ids for updates.

## 6. Allowed Values / Contracts

- Test Strategy owns verification guidance, not product requirements.
- Keep traceability to work-item codes and affected modules visible.
- Respect paired template structure and fragment operations.

## 7. Cross-Module Rules

- Test Strategy should follow changes in PRD, Functional Spec, Technical Design, Bugs, and Architecture.
- Regression expectations often need to be attached to bug and feature work.

## 8. Guardrails

- Do not leave regression expectations implied only in bug history.
- Do not edit generated TEST_STRATEGY.md directly.

## 9. Imported Template Guidance

- Use token references where helpful: `@stable-id` for persisted targets, `#module-or-section` for document/module scope, `$work-item-code` for provenance, `/operation` for intended action, `?question` for review points, and `!guardrail` for constraints.
- Token references supplement structured operations and target ids; they do not replace explicit fields such as operation, targetSection, targetItemId, sourceRefs, or managed payload data.
- Keep the fragment focused on how the project should be validated.
- Call out which modules or requirements are affected by the proposed changes.
- Use stable ids for persisted document items, fragment targets, graph nodes, graph edges, models, and projections.
- Keep titles concise; put long detail in description or body fields.
- Tie validation effort back to Functional Spec, Architecture, Features, and Bugs.
- Focus on proving behavior and reducing project risk.
