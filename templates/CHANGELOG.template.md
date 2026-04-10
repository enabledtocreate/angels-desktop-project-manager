# Change Log Template

This document defines the required structure for `CHANGELOG.md`.

## Compliance Rules

- Keep the `APM:DATA` managed block intact and valid JSON.
- Keep the top compliance note intact.
- Preserve the section order defined in this template.
- Each change entry must include work item codes, a target document, a target section number, and a stable target item id.
- Change history should remain human-readable and should not replace the canonical source documents.
- If this template structure changes, update the version section before making any other structural edits.

## Version

- Template Name: `CHANGELOG.template.md`
- Template Version: `1.0`
- Last Updated: `2026-04-04`
- AI Agent instruction: Whenever this template is updated, update the template version and last updated date before changing any section definitions.

## Model Context Protocol

- `CHANGELOG.md` is a managed document generated from application state.
- The application database is the source of truth for change log editor fields and generated markdown.
- The change log is a human-readable history layer that references feature and bug work item codes and points back to stable document item ids.
- Canonical product and system truth still lives in the corresponding managed docs such as `PRD.md`, `ARCHITECTURE.md`, `DATABASE_SCHEMA.md`, and others.
- If a disk file conflicts with database state, the application may regenerate this file from the database.

## Structure Definition

The generated `CHANGELOG.md` must contain the following sections in this order.

1. `# CHANGELOG: {{PROJECT_NAME}}`
2. Compliance note
3. Managed data block
4. `## 1. Executive Summary`
5. `## 2. Change Entries`
6. `## 3. Applied Fragments`
7. `## 4. Open Questions`

Each change entry should use numbered subsection entries and include:
- change date
- work item code or codes
- operation
- target document
- target section number
- stable target item id
- optional fragment code
- human-readable summary
