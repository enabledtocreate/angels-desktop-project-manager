# ROADMAP.md: {{PROJECT_NAME}}

> Managed document. Must comply with template ROADMAP.template.md.

<!-- APM:DATA
{
  "docType": "roadmap",
  "version": {{DOC_VERSION:1}},
  "phases": {{PHASES_JSON:0..N}},
  "tasks": {{TASKS_JSON:0..N}},
  "features": {{FEATURES_JSON:0..N}},
  "bugs": {{BUGS_JSON:0..N}},
  "templateVersion": "{{TEMPLATE_VERSION}}",
  "mermaid": "{{MERMAID_BODY:0..1}}"
}
-->

## 1. Executive Summary

{{EXECUTIVE_SUMMARY}}

## 2. Phased Implementation Plan

### 2.1 Phases

<!-- REPEAT {{PHASE_BLOCK:0..N}} -->
#### {{PHASE_CODE}}

- Name: {{PHASE_NAME}}
- Goal: {{PHASE_GOAL}}
- Status: {{PHASE_STATUS:planned|in_progress|blocked|completed}}
- Target Date: {{PHASE_TARGET_DATE}}
- Summary: {{PHASE_SUMMARY}}
- Features: {{PHASE_FEATURE_LINE:0..N}}
- Tasks: {{PHASE_TASK_LINE:0..N}}
<!-- END REPEAT PHASE_BLOCK -->

## 3. Planned Features

<!-- REPEAT {{PLANNED_FEATURE_BLOCK:0..N}} -->
- {{FEATURE_ID}}: {{FEATURE_TITLE}} ({{FEATURE_STATUS:considered|planned|in_progress|blocked|completed}})
<!-- END REPEAT PLANNED_FEATURE_BLOCK -->

## 4. Considered Features

<!-- REPEAT {{CONSIDERED_FEATURE_BLOCK:0..N}} -->
- {{FEATURE_ID}}: {{FEATURE_TITLE}} ({{FEATURE_STATUS:considered|planned|in_progress|blocked|completed}})
<!-- END REPEAT CONSIDERED_FEATURE_BLOCK -->

## Mermaid

```mermaid
{{MERMAID_BODY}}
```
