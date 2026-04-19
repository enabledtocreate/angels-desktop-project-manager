# AI Environment

> Managed document. Must comply with template AI_ENVIRONMENT.template.md.

- Template Version: `1.1`
- Last Updated: `2026-04-14`

## Purpose

This document governs how AI agents should operate within the project.

## Top-Level Fragment Rule

- Generate managed fragments in the runtime fragments directory, not in project `docs`.
- Use `data/projects/<project-id>/fragments/` for project-specific fragments.
- Use `data/projects/shared/fragments/` only for intentionally shared fragment library files.
- Generated markdown documents in `docs` are outputs, not the place to draft new fragments.

## Required Sections

1. Mission
2. Operating Model
3. Communication Style
4. APM Term Dictionary
5. Custom Instructions
6. Applied Shared Profiles
7. Directive Template References
8. Locked System Directives
9. Module Directive Index
10. Project-Level Required Behaviors
11. Project-Level Module Update Rules
12. Project-Level Data Structure and Phrasing Rules
13. Project-Level Avoid / Guardrails
14. Handoff Checklist

## Guidance

- Treat this as AI-readable operating context.
- Put non-directive project context before directive sections so agents understand APM terminology, purpose, and operating model before reading rules.
- Include a markdown table for the APM term dictionary with term, definition, stable ID, and source refs.
- Include references to module template files that own emitted AI directives.
- Keep instructions deterministic, explicit, and safe for structured updates.
- Prefer short titles with clear descriptions for repeatable rules.
