# FEATURES.md: {{PROJECT_NAME}}

> Managed document. Must comply with template FEATURES.template.md.

<!-- APM:DATA
{
  "docType": "features",
  "version": {{DOC_VERSION:1}},
  "features": {{FEATURES_JSON:0..N}},
  "mermaid": "{{MERMAID_BODY:0..1}}"
}
-->

## 1. Active Features

<!-- REPEAT {{FEATURE_BLOCK:0..N}} -->
### {{FEATURE_CODE}}: {{FEATURE_TITLE}}

- Planning Bucket: {{PLANNING_BUCKET:considered|planned|phase}}
- Status: {{FEATURE_STATUS:proposed|planned|in_progress|blocked|completed}}
- Roadmap Phase: {{ROADMAP_PHASE_ID:0..1}}
- Linked Task: {{TASK_ID:0..1}}
- Summary: {{FEATURE_SUMMARY}}
- Associated Document Ids: {{ASSOCIATED_DOCUMENT_IDS:0..N}}
<!-- END REPEAT FEATURE_BLOCK -->

## Mermaid

```mermaid
{{MERMAID_BODY}}
```
