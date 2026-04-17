# Functional Spec Fragment Template

> Managed document. Must comply with template FUNCTIONAL_SPEC_FRAGMENT.template.md.

- Template Version: `1.0`
- Last Updated: `2026-04-02`

## Purpose

Use this fragment to propose functional behavior changes without editing `FUNCTIONAL_SPEC.md` directly.

## Required Sections

1. Executive Summary
2. Functional Area Updates
3. Logical Flow Updates
4. Flow Node Updates
5. Flow Connection Updates
6. Flow Endpoints and Return Points
7. Open Questions
8. Merge Guidance

## Guidance

- Keep the fragment behavior-focused and testable.
- Note dependencies on PRD, Features, Bugs, Experience Design, or Test Strategy where relevant.
- Prefer stable ids and fragment operations when updating an existing functional flow.
- Prefer graph-aware operations for workflows, nodes, edges, control points, model references, and open questions once those ids exist.
- Use `targetSection: "flow-visuals"` when a fragment needs to create or replace the visual node and connection graph for a logical workflow.
- Put user actions, system responses, validation, decisions, edge cases, errors, logging, inputs, and outputs into node or connection updates instead of separate legacy text sections.
- Use Domain Models references when behavior manipulates shared conceptual objects.

