# Domain Models

> Managed document. Must comply with template DOMAIN_MODELS.template.md.

- Template Version: `1.0`
- Last Updated: `2026-04-11`

## Purpose

Define shared conceptual models that other modules can reference before implementation-specific projections exist.

## Required Sections

1. Executive Summary
2. Domain Model Catalog
3. Domain Models
4. Model Projections
5. Open Questions
6. Applied Fragments

## Guidance

- Treat Domain Models as the central meaning layer.
- Do not treat Domain Models as database tables, UI forms, API payloads, or implementation classes.
- Use projections to connect a base model to Functional Spec, Experience Design, Persistence, Technical Design, APIs, events, and tests.
- Keep every model, field, relationship, projection, and open question stable-id addressable.
