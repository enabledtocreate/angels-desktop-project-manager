# Roadmap Fragment: {{FRAGMENT_CODE}} - {{FRAGMENT_TITLE}}

> Managed document. Must comply with template ROADMAP_FRAGMENT.template.md.

<!-- APM:DATA
{
  "docType": "roadmap_fragment",
  "version": {{DOC_VERSION:1}},
  "fragment": {
    "id": "{{FRAGMENT_ID}}",
    "projectId": "{{PROJECT_ID:0..1}}",
    "sourceFeatureId": "{{SOURCE_FEATURE_ID:0..1}}",
    "sourcePhaseId": "{{SOURCE_PHASE_ID:0..1}}",
    "code": "{{FRAGMENT_CODE}}",
    "title": "{{FRAGMENT_TITLE}}",
    "markdown": {{FRAGMENT_MARKDOWN_JSON:0..1}},
    "mermaid": "{{MERMAID_BODY:0..1}}",
    "payload": {
      "phaseChanges": {{PHASE_CHANGES_JSON:0..N}},
      "featureAssignments": {{FEATURE_ASSIGNMENTS_JSON:0..N}},
      "taskAssignments": {{TASK_ASSIGNMENTS_JSON:0..N}}
    },
    "status": "{{FRAGMENT_STATUS:draft|proposed|approved|rejected|merged|archived}}",
    "merged": {{MERGED_JSON:0..1}},
    "mergedAt": {{MERGED_AT_JSON:0..1}},
    "integratedAt": {{INTEGRATED_AT_JSON:0..1}},
    "fileName": "{{FILE_NAME:0..1}}",
    "createdAt": {{CREATED_AT_JSON:0..1}},
    "updatedAt": {{UPDATED_AT_JSON:0..1}}
  }
}
-->

## Executive Summary

{{EXECUTIVE_SUMMARY}}

## Phase Changes

{{PHASE_CHANGES_MARKDOWN:0..N}}

## Feature Assignments

{{FEATURE_ASSIGNMENTS_MARKDOWN:0..N}}

## Task Assignments

{{TASK_ASSIGNMENTS_MARKDOWN:0..N}}

## Mermaid

```mermaid
{{MERMAID_BODY:0..1}}
```

## Merge Guidance

{{MERGE_GUIDANCE}}
