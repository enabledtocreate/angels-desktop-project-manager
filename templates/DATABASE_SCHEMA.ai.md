# Database Schema Module AI

> Module AI file. Keep filename `DATABASE_SCHEMA.ai.md`; APM discovers and syncs module AI files by this name.
> Read this file after `AI_ENVIRONMENT.md` and before generating or updating Database Schema documents or fragments.

## 1. AI File Metadata

- AI File Name: `DATABASE_SCHEMA.ai.md`
- AI File Version: `1.10`
- Last Updated: `2026-04-25`
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

## 9. Template Construction Rules

### Placeholder Syntax

- `{{NAME}}`: required single value.
- `{{NAME:OPTION_A|OPTION_B}}`: select one allowed value.
- `{{NAME:0..1}}`: optional value or optional block.
- `{{NAME:0..N}}`: repeatable value, list, array, or repeated markdown block.
- Placeholders used as full JSON values must be replaced with valid JSON objects, arrays, strings, numbers, booleans, or `null` that match the surrounding structure.
- `<!-- REPEAT {{NAME:0..N}} --> ... <!-- END REPEAT {{NAME}} -->` marks a repeatable markdown region.
- Keep the `APM:DATA` and `APM:OPERATIONS` blocks structurally valid after replacement.

### DATABASE_SCHEMA.template.md

- Template Version: `1.4`
- Last Updated: `2026-04-25`
- Template Role: `document`
- Generated Artifact: `DATABASE_SCHEMA.md`
- Consumption Goal: A filled template should read like the final managed document body and keep the managed metadata block intact.
- Fill-In Slots:
  - `{{PROJECT_NAME}}`: Required single fill-in.
  - `{{DOC_VERSION:1}}`: Fill using `1` semantics.
  - `{{TEMPLATE_VERSION}}`: Required single fill-in.
  - `{{SOURCE_OF_TRUTH:database|generated|hybrid}}`: Select one allowed value: `database`, `generated`, `hybrid`.
  - `{{MERMAID_JSON:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{EDITOR_STATE_JSON:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{SCHEMA_PURPOSE}}`: Required single fill-in.
  - `{{STORAGE_STRATEGY}}`: Required single fill-in.
  - `{{SYNC_STATUS_SUMMARY}}`: Required single fill-in.
  - `{{ENTITY_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{ENTITY_NAME}}`: Required single fill-in.
  - `{{ENTITY_KIND:table|view|index|constraint|trigger|other}}`: Select one allowed value: `table`, `view`, `index`, `constraint`, `trigger`, `other`.
  - `{{ENTITY_DESCRIPTION}}`: Required single fill-in.
  - `{{FIELD_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{RELATIONSHIP_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{INDEX_AND_CONSTRAINT_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{MIGRATION_NOTE_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{OPEN_QUESTION_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{DBML_BODY}}`: Required single fill-in.
  - `{{MERMAID_BODY}}`: Required single fill-in.

### DATABASE_SCHEMA_FRAGMENT.template.md

- Template Version: `1.4`
- Last Updated: `2026-04-25`
- Template Role: `fragment`
- Fragment Merge Mode: `database-import`
- Consumption Goal: A filled template should preserve valid fragment metadata and a complete schema payload suitable for import.
- Fill-In Slots:
  - `{{FRAGMENT_CODE}}`: Required single fill-in.
  - `{{FRAGMENT_TITLE}}`: Required single fill-in.
  - `{{DOC_VERSION:1}}`: Fill using `1` semantics.
  - `{{FRAGMENT_ID}}`: Required single fill-in.
  - `{{FRAGMENT_SUMMARY}}`: Required single fill-in.
  - `{{FRAGMENT_STATUS:draft|proposed|approved|rejected|merged|archived}}`: Select one allowed value: `draft`, `proposed`, `approved`, `rejected`, `merged`, `archived`.
  - `{{FRAGMENT_REVISION:1}}`: Fill using `1` semantics.
  - `{{LINEAGE_KEY}}`: Required single fill-in.
  - `{{SOURCE_LABEL}}`: Required single fill-in.
  - `{{TEMPLATE_VERSION}}`: Required single fill-in.
  - `{{SOURCE_TYPE:sqlite_database|schema_sql|dbml|migration_files|orm_code|mixed}}`: Select one allowed value: `sqlite_database`, `schema_sql`, `dbml`, `migration_files`, `orm_code`, `mixed`.
  - `{{SOURCE_LABEL_PAYLOAD}}`: Required single fill-in.
  - `{{SOURCE_DIALECT}}`: Required single fill-in.
  - `{{SOURCE_OBSERVED_AT:0..1}}`: Optional value or block. Remove the surrounding optional region when omitted.
  - `{{SCHEMA_FINGERPRINT}}`: Required single fill-in.
  - `{{SOURCE_CONFIDENCE:observed|mixed|inferred}}`: Select one allowed value: `observed`, `mixed`, `inferred`.
  - `{{PAYLOAD_SUMMARY}}`: Required single fill-in.
  - `{{ENTITIES_JSON:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{RELATIONSHIPS_JSON:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{INDEXES_JSON:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{CONSTRAINTS_JSON:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{MIGRATION_NOTES_JSON:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{OPEN_QUESTIONS_JSON:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{DBML_JSON}}`: Required single fill-in.
  - `{{MERMAID_JSON}}`: Required single fill-in.
  - `{{IMPORT_MODE:full_schema|partial_schema|0..1}}`: Select one allowed value: `full_schema`, `partial_schema`, `0..1`.
  - `{{EXECUTIVE_SUMMARY}}`: Required single fill-in.
  - `{{SOURCE_METADATA_MARKDOWN}}`: Required single fill-in.
  - `{{OBSERVED_SCHEMA_SUMMARY}}`: Required single fill-in.
  - `{{ENTITY_MARKDOWN_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{RELATIONSHIP_MARKDOWN_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{INDEX_AND_CONSTRAINT_MARKDOWN_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{MIGRATION_NOTES_MARKDOWN:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{OPEN_QUESTION_BLOCK:0..N}}`: Repeatable block or collection. Replace with zero or more valid entries.
  - `{{DBML_BODY}}`: Required single fill-in.
  - `{{MERMAID_BODY}}`: Required single fill-in.
  - `{{MERGE_GUIDANCE}}`: Required single fill-in.
