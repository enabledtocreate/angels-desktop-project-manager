# Database Schema Module AI

> Module AI file. Keep filename `DATABASE_SCHEMA.ai.md`; APM discovers and syncs module AI files by this name.
> Read this file after `AI_ENVIRONMENT.md` and before generating or updating Database Schema documents or fragments.

## 1. AI File Metadata

- AI File Name: `DATABASE_SCHEMA.ai.md`
- AI File Version: `1.2`
- Last Updated: `2026-04-23`
- Owning Module: `Database Schema`
- Document Template: `DATABASE_SCHEMA.template.md`
- Fragment Template: `DATABASE_SCHEMA_FRAGMENT.template.md`

## 2. Module Purpose

Use Database Schema to describe persistence structure and schema narrative while keeping full-schema and fragment workflows strict.

## 3. Source Of Truth

- Read `AI_ENVIRONMENT.md` first for global operating rules, fragment-path rules, stable-id rules, and standards references.
- Read `DATABASE_SCHEMA.template.md` for the literal document shape that APM generates.
- Read `DATABASE_SCHEMA_FRAGMENT.template.md` for the literal fragment shape that APM can consume.
- Treat generated markdown as an output of module state; prefer module saves or compliant fragments over direct edits.

## 4. Document Rules

- Generate DATABASE_SCHEMA.md and related schema artifacts from schema-owned state.
- Keep schema wording aligned with actual persistence shape and supported import rules.
- Treat the schema module as the owner of additive or replacement schema changes.

## 5. Fragment Rules

- Use DATABASE_SCHEMA fragments only for supported schema operations and fragment shapes.
- Partial fragments must not replace the full schema unless explicitly supported.
- Schema changes should remain precise and avoid invented tables or constraints.

## 6. Allowed Values / Contracts

- Respect schema-specific import and fragment validation rules.
- Do not invent database structures that are not grounded in current project intent.
- Use stable ids and source refs where the schema workflow supports them.

## 7. Cross-Module Rules

- Database Schema should align with Domain Models and Technical Design, but it is not derived blindly from either.
- Schema changes can affect Functional Spec, Architecture, and tests.

## 8. Guardrails

- Do not edit `DATABASE_SCHEMA.md`, `DATABASE_SCHEMA.dbml`, or the canonical schema model directly when proposing imported or AI-assisted schema updates.
- Do not invent tables, fields, keys, defaults, indexes, or constraints when they are not supported by the source material.
- Do not edit generated DATABASE_SCHEMA.md or DBML directly outside schema workflows.
- Do not treat migration-sized fragments as full replacements.

## 9. Imported Template Guidance

- Keep the `APM:DATA` managed block intact and valid JSON.
- Keep the top compliance note intact.
- Use stable IDs for entities, fields, indexes, constraints, and relationships whenever they are known.
- Distinguish clearly between `observed`, `inferred`, and `unknown` information.
- Put unresolved uncertainty in `Open Questions` instead of filling gaps with guessed schema structure.
- Keep the DBML section valid and keep Mermaid text valid.
- Use token references where helpful: `@stable-id` for persisted targets, `#module-or-section` for document/module scope, `$work-item-code` for provenance, `/operation` for intended action, `?question` for review points, and `!guardrail` for constraints.
- Token references supplement structured operations and target ids; they do not replace explicit fields such as entity ids, field ids, relationship ids, sourceRefs, or managed payload data.
- AI Agent instruction: Whenever this template is updated, update the template version and last updated date before changing anything else.
- `DATABASE_SCHEMA_FRAGMENT_*.md` is a proposal/import document, not the canonical schema.
- The application database is the source of truth after a fragment is reviewed and merged.
- The purpose of this fragment is to safely move schema knowledge from an existing application, database, migration set, or AI-assisted analysis into the manager.
- Prefer facts from a live database first, then migrations, then schema SQL, then ORM/model code, and only then AI inference.
- If a value is not directly supported by the source, mark it as `inferred` or add an open question.
- The application should be able to reconstruct `DATABASE_SCHEMA.dbml`, `DATABASE_SCHEMA.md`, and Mermaid ER output from the merged schema model.
- If you are reading an existing application schema, prefer extraction and normalization over reinterpretation.
- Preserve exact names for entities, fields, indexes, and constraints when they are observed directly.
- Mark inferred items clearly and keep them minimal.
- If you cannot prove a relationship, type, or default, put that uncertainty in `Open Questions`.
- Generate valid DBML that the manager can later consume as a portable schema artifact.
- The markdown explanation should help a human understand what was imported and where uncertainty remains.
- Include token references in the markdown body when they help the AI agent or reviewer understand module scope, target ids, work item provenance, or intended merge action.
- Use stable ids for persisted document items, fragment targets, graph nodes, graph edges, models, and projections.
- Keep titles concise; put long detail in description or body fields.
- Preserve the section order defined in this template.
- Keep Mermaid text valid and aligned with the schema editor state in the application.
- Treat `DATABASE_SCHEMA.md` as the schema design narrative; structural portability should be represented through generated DBML and schema fragments.
- If this template structure changes, update the version section before making any other structural edits.
- AI Agent instruction: Whenever this template is updated, update the template version and last updated date before changing any section definitions.
- `DATABASE_SCHEMA.md` is a managed document generated from application state.
- The application database is the source of truth for schema editor fields, generated markdown, and Mermaid content.
- AI agents should preserve section headings and use the existing structure instead of inventing new top-level sections.
- Schema changes should remain consistent with architecture decisions, work-item relationships, migrations, and source-of-truth rules.
- Imported or AI-proposed schema changes should flow through `DATABASE_SCHEMA_FRAGMENT.template.md` rather than editing this narrative document directly.
- If a disk file conflicts with database state, the application may regenerate this file from the database.
