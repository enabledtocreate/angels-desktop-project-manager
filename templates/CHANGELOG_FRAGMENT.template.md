# Change Log Fragment Template

> Managed document. Must comply with template CHANGELOG_FRAGMENT.template.md.

- Template Version: `1.0`
- Last Updated: `2026-04-04`

## Purpose

Use this fragment to propose one or more human-readable change log entries without editing `CHANGELOG.md` directly.

## Required Sections

1. Executive Summary
2. Change Details
3. Open Questions
4. Merge Guidance

## Change Details Format

Use bullet metadata in `Change Details` so the importer can recover the target cleanly:

- Work Item Codes: `FEAT-001` or `FEAT-001, BUG-004`
- Change Date: `YYYY-MM-DD` or ISO timestamp
- Operation: `add`, `update`, `remove`, or another short action label
- Target Document: `PRD`, `ARCHITECTURE`, `DATABASE_SCHEMA`, etc.
- Target Section: `2.1.3`
- Target Item ID: `stable-item-id`
- Fragment Code: `Optional fragment code`

Then follow with a short human-readable summary paragraph describing what changed and why it matters.

## Guidance

- Prefer stable target item ids over section numbers when deciding what changed.
- Use section numbers as human-readable helpers, not as the only locator.
- Keep the fragment focused on one logical change set.
- Reference feature and bug codes whenever the change came from tracked work.
- For targeted updates to existing change entries, include an `APM:OPERATIONS` HTML comment block with JSON operations such as `add`, `update`, `remove`, `reorder`, `move`, `link`, and `unlink`.
