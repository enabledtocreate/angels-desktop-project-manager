# Domain Models Fragment Template

> Managed document. Must comply with template DOMAIN_MODELS_FRAGMENT.template.md.

- Template Version: `1.0`
- Last Updated: `2026-04-11`

## Purpose

Use this fragment to propose shared model changes without editing `DOMAIN_MODELS.md` directly.

## Required Sections

1. Executive Summary
2. Domain Model Updates
3. Model Projection Updates
4. Open Questions
5. Merge Guidance

## Operation Guidance

Prefer `APM:OPERATIONS` for precise updates.

Supported first-pass target sections:

- `models`
- `projections`
- `open-questions`

Example:

```json
[
  {
    "operation": "add",
    "targetSection": "models",
    "item": {
      "name": "Person",
      "summary": "A person represented by the system.",
      "modelType": "entity",
      "fields": [
        {
          "name": "firstName",
          "displayName": "First Name",
          "description": "The person's given name.",
          "conceptualType": "text",
          "required": true
        }
      ]
    },
    "sourceRefs": ["FEAT-001"]
  }
]
```

## Guidance

- Keep base models conceptual and technology-neutral.
- Put database-specific shape in Database Schema projections.
- Put UI-specific shape in Experience Design projections.
- Put implementation-specific shape in Technical Design projections.
