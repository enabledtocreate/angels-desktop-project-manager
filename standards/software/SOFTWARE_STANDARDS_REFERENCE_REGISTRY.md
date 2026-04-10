# Standards Reference Registry

## Purpose

This registry defines the baseline references APM should use when generating or updating canonical documents, fragments, templates, and AI directives.

The goal is to keep document wording tied to durable industry references instead of ad hoc phrasing.

## Resolution Order

When multiple references exist, resolve them in this order:

1. normative standard
2. official specification site or official maintainer
3. widely adopted community convention
4. APM internal convention

## Usage Rule

AI agents should consult the applicable registry entry before generating:

- document content
- fragment content
- template wording
- helper text in the UI
- AI directives that govern a document family

If no strong external standard exists, the generated content should say that it is following an APM internal convention.

## Reference Entries

### REQ-001

- `name`: ISO/IEC/IEEE 29148:2018
- `type`: normative
- `url`: https://www.iso.org/standard/72089.html
- `governs`:
  - requirements engineering
  - requirement quality
  - requirement information items
  - Functional Spec and requirements phrasing
- `usedBy`:
  - `PRD`
  - `Functional Spec`
  - `Features`
  - fragment templates that describe requirements
- `notes`:
  - official abstract page is the canonical public pointer
  - a licensed local copy can be added later as a preferred internal mirror

### ARCH-001

- `name`: ISO/IEC/IEEE 42010:2022
- `type`: normative
- `url`: https://www.iso.org/standard/74393.html
- `governs`:
  - architecture description concepts
  - viewpoints
  - model kinds
  - architecture description structure
- `usedBy`:
  - `Architecture`
  - `Technical Design`
  - architecture-related fragment templates

### ARCH-002

- `name`: arc42
- `type`: advisory
- `url`: https://arc42.org/documentation/
- `secondaryUrl`: https://github.com/arc42/arc42-template
- `governs`:
  - practical architecture document structure
  - architecture section boundaries
  - architecture writing conventions
- `usedBy`:
  - `Architecture`
  - `Technical Design`

### ARCH-003

- `name`: C4 Model
- `type`: advisory
- `url`: https://c4model.com/
- `governs`:
  - architecture hierarchy
  - system/context/container/component views
  - architecture visualization levels
- `usedBy`:
  - `Architecture`
  - architecture canvas templates
  - architecture visual helpers

### ADR-001

- `name`: MADR
- `type`: advisory
- `url`: https://adr.github.io/madr/
- `secondaryUrl`: https://github.com/joelparkerhenderson/architecture-decision-record
- `governs`:
  - ADR structure
  - ADR terminology
  - ADR workflow expectations
- `usedBy`:
  - `ADR`
  - architecture decision prompts
  - AI directives related to decision capture

### EXP-001

- `name`: WCAG 2.2
- `type`: normative
- `url`: https://www.w3.org/TR/WCAG22/
- `governs`:
  - accessibility wording
  - experience requirements affecting accessibility
  - user-facing interaction expectations
- `usedBy`:
  - `Experience Design`
  - `PRD`
  - `Functional Spec`

### EXP-002

- `name`: Design Tokens Community Group (DTCG)
- `type`: advisory
- `url`: https://www.designtokens.org/
- `secondaryUrl`: https://www.w3.org/groups/cg/design-tokens
- `governs`:
  - token terminology
  - cross-platform design-system interchange
  - design-token naming and structure
- `usedBy`:
  - `Experience Design`
  - `DESIGN.md`
  - token export/import

### FLOW-001

- `name`: BPMN 2.0
- `type`: advisory
- `url`: https://www.omg.org/spec/BPMN/2.0/About-BPMN/
- `secondaryUrl`: https://bpmn.io/
- `governs`:
  - logical flow notation
  - process terminology
  - optional symbol guidance for formal flow diagrams
- `usedBy`:
  - `Functional Spec`
  - flowchart templates
  - workflow design helpers

### TECH-001

- `name`: IEEE 1016 Software Design Description
- `type`: advisory
- `url`: https://ieeexplore.ieee.org/document/5981339
- `governs`:
  - software design description structure
  - technical design section guidance
- `usedBy`:
  - `Technical Design`
- `notes`:
  - treat this as advisory guidance for structure, not as the only template source

## Current APM Recommendation

Use these baselines by document family:

- `PRD`
  - `REQ-001`
  - `EXP-001` when accessibility expectations matter
- `Functional Spec`
  - `REQ-001`
  - `FLOW-001` when formal flow notation is needed
- `Experience Design`
  - `EXP-001`
  - `EXP-002`
- `Architecture`
  - `ARCH-001`
  - `ARCH-002`
  - `ARCH-003`
- `Technical Design`
  - `TECH-001`
  - `ARCH-001`
  - internal APM template rules where needed
- `ADR`
  - `ADR-001`

## Future Direction

APM should eventually let each module declare:

- its primary standards references
- its secondary references
- whether a local mirrored copy exists
- whether a project-specific override applies

That will make standards usage explicit in:

- AI directives
- templates
- fragment generation
- UI helper text
