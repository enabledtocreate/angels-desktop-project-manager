# Product Requirements Document: {{PROJECT_NAME}}

> Template Contract. Keep filename `PRD.template.md`; APM discovers and syncs templates by this name.
> Managed document. Must comply with template PRD.template.md.

## 1. Template Contract Metadata

- Template Name: `PRD.template.md`
- Template Version: `1.3`
- Last Updated: `2026-04-23`
- Template Kind: `document`
- Owning Module: `PRD`
- Generated Artifact: `PRD.md`

## 2. Contract / Allowed Schema

### Required Contract Rules

- Keep `Template Name`, `Template Version`, and `Last Updated` present and current.
- Keep the managed-document compliance note in generated artifacts.
- Preserve `APM:DATA` managed blocks when present, and keep JSON valid.

### Allowed Target Sections

- This is a generated document contract; update module state or consume fragments instead of editing generated output directly.

## 3. Actual Template

## 1. Executive Summary

Summarize the product and the outcome it should create.

## 2. Product Overview

### 2.1 Product Name
{{PROJECT_NAME}}

### 2.2 Product Vision

Describe the long-term vision.

### 2.3 Target Audience

- Primary audience
- Secondary audience

### 2.4 Key Value Propositions

- Value proposition 1
- Value proposition 2

## 3. Functional Requirements

Describe core workflows, user actions, and system behavior.

## 4. Non-Functional Requirements

Describe usability, reliability, accessibility, security, and performance needs.

## 5. Technical Architecture

Describe the expected technical shape at a high level.

## 6. Implementation Plan

Describe sequencing, dependencies, and milestones.

## 7. Success Metrics

Describe how success will be measured.

## 8. Risks and Mitigations

List major risks and how the project intends to manage them.

## 9. Future Enhancements

Planned and implemented feature work is tracked in `FEATURES.md`. Keep only product-facing future references here when they materially affect the product definition.

## 10. Conclusion

Close with the intended direction for the product.

## 4. Examples

```md
# PRD.md: {{PROJECT_NAME}}

> Managed document. Must comply with template PRD.template.md.
```

## 5. Merge / Consumption Rules

- APM copies this template into the active project workspace and records its version/hash in the template registry.
- If this is a fragment template, APM discovers matching fragment files from the configured project fragments folder and shared fragments folder.
- The consuming module validates managed metadata and applies supported operations to structured module state.
- After consumption, generated markdown is regenerated from module state; stale fragment files may be archived or deleted according to the module workflow.

## 6. Version / Migration Notes

- Version `1.3` moves AI-facing instructions and restrictions into the paired module AI file so this template stays artifact-focused.
- Version `1.2` moves AI behavior guidance into the paired module AI file and keeps this template artifact-focused.
- Version `1.1` adds the standardized Template Contract structure.
- Fragment consumers must migrate older payload versions through explicit migrators before listing or consumption.
- When this template changes again, update `Template Version`, `Last Updated`, and any migrator guidance needed for older unconsumed fragments.
