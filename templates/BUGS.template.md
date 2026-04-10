# BUGS Template

This document defines the required structure for `BUGS.md`.

Rules:
- Keep the `APM:DATA` managed block intact and valid JSON.
- Preserve the workflow-first structure with `## 1. Bug Workflow` before any bug entries.
- Preserve the approved lifecycle vocabulary and active/archive rules.
- Each bug must preserve its tracking ID.
- Each bug must include both `Current Behavior` and `Expected Behavior`.
- Only active bugs belong in `BUGS.md`.
- Resolved and closed bugs move into archived workspace follow-up notes under `.apm/_WORKSPACE` instead of remaining in the main document.
- Completed and regressed states must stay explicit.
- Preserve optional `@item-id` association hints when they exist.
- Preserve the `## Mermaid` section.
