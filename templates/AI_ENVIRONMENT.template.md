# AI Environment

> Managed document. Must comply with template AI_ENVIRONMENT.template.md.

- Template Version: `1.0`
- Last Updated: `2026-03-31`

## Purpose

This document governs how AI agents should operate within the project.

## Top-Level Fragment Rule

- Generate managed fragments in the runtime fragments directory, not in project `docs`.
- Use `data/Fragments/<project-id>/` for project-specific fragments.
- Use `data/Fragments/shared/` only for intentionally shared fragment library files.
- Generated markdown documents in `docs` are outputs, not the place to draft new fragments.

## Required Sections

1. Mission
2. Operating Model
3. Communication Style
4. Required Behaviors
5. Module Update Rules
6. Data Structure and Phrasing Rules
7. Avoid / Guardrails
8. Handoff Checklist

## Guidance

- Treat this as AI-readable operating context.
- Keep instructions deterministic, explicit, and safe for structured updates.
- Prefer short titles with clear descriptions for repeatable rules.
