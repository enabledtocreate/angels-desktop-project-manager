# DOMAIN_MODELS.md: {{PROJECT_NAME}}

> Managed document. Must comply with template DOMAIN_MODELS.template.md.

<!-- APM:DATA
{
  "docType": "domain_models",
  "version": {{DOC_VERSION:1}},
  "templateName": "DOMAIN_MODELS.template.md",
  "templateVersion": "{{TEMPLATE_VERSION}}",
  "sourceOfTruth": "{{SOURCE_OF_TRUTH:database|generated|hybrid}}",
  "editorState": {{EDITOR_STATE_JSON:0..1}}
}
-->

## 1. Executive Summary

{{EXECUTIVE_SUMMARY}}

## 2. Models

<!-- REPEAT {{MODEL_BLOCK:0..N}} -->
### {{MODEL_NAME}}

- Stable Id: {{MODEL_ID}}
- Summary: {{MODEL_SUMMARY}}

#### Fields

{{FIELD_BLOCK:0..N}}
<!-- END REPEAT MODEL_BLOCK -->

## 3. Projections

{{PROJECTION_BLOCK:0..N}}

## 4. Shared Model Projections

{{SHARED_PROJECTION_BLOCK:0..N}}

## 5. Open Questions

{{OPEN_QUESTION_BLOCK:0..N}}
