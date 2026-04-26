# Domain Models Fragment: {{FRAGMENT_CODE}} - {{FRAGMENT_TITLE}}

> Managed document. Must comply with template DOMAIN_MODELS_FRAGMENT.template.md.

<!-- APM:DATA
{
  "docType": "domain_models_fragment",
  "version": {{DOC_VERSION:1}},
  "fragment": {
    "id": "{{FRAGMENT_ID}}",
    "code": "{{FRAGMENT_CODE}}",
    "title": "{{FRAGMENT_TITLE}}",
    "summary": "{{FRAGMENT_SUMMARY}}",
    "status": "{{FRAGMENT_STATUS:draft|proposed|approved|rejected|merged|archived}}",
    "revision": {{FRAGMENT_REVISION:1}},
    "lineageKey": "{{LINEAGE_KEY}}",
    "sourceLabel": "{{SOURCE_LABEL}}",
    "templateName": "DOMAIN_MODELS_FRAGMENT.template.md",
    "templateVersion": "{{TEMPLATE_VERSION}}",
    "payload": {{PAYLOAD_JSON:0..1}}
  }
}
-->

<!-- APM:OPERATIONS
[
  {
    "operation": "{{OPERATION:add|update|remove|reorder|move|link|unlink}}",
    "targetSection": "{{TARGET_SECTION:models|projections|shared-model-projections|open-questions}}",
    "fromSection": "{{FROM_SECTION:0..1}}",
    "targetItemId": "{{TARGET_ITEM_ID:0..1}}",
    "beforeItemId": "{{BEFORE_ITEM_ID:0..1}}",
    "afterItemId": "{{AFTER_ITEM_ID:0..1}}",
    "orderedIds": {{ORDERED_IDS_JSON:0..N}},
    "versionDate": "{{VERSION_DATE:0..1}}",
    "item": {
      "id": "{{ITEM_ID:0..1}}",
      "stableId": "{{ITEM_STABLE_ID:0..1}}",
      "name": "{{ITEM_NAME:0..1}}",
      "title": "{{ITEM_TITLE:0..1}}",
      "summary": "{{ITEM_SUMMARY:0..1}}",
      "description": "{{ITEM_DESCRIPTION:0..1}}",
      "modelType": "{{MODEL_TYPE:entity|value-object|aggregate|event|command|concept|external-resource}}",
      "fields": {{MODEL_FIELDS_JSON:0..N}},
      "relationships": {{MODEL_RELATIONSHIPS_JSON:0..N}},
      "rules": {{MODEL_RULES_JSON:0..N}},
      "examples": {{MODEL_EXAMPLES_JSON:0..N}},
      "baseModelId": "{{BASE_MODEL_ID:0..1}}",
      "baseModelStableId": "{{BASE_MODEL_STABLE_ID:0..1}}",
      "baseModelName": "{{BASE_MODEL_NAME:0..1}}",
      "owningModule": "{{OWNING_MODULE:0..1}}",
      "projectionType": "{{PROJECTION_TYPE:functional|experience|persistence|technical|api-request|api-response|event|message|test-fixture}}",
      "fieldMappings": {{PROJECTION_FIELD_MAPPINGS_JSON:0..N}},
      "excludedFields": {{PROJECTION_EXCLUDED_FIELDS_JSON:0..N}},
      "additionalFields": {{PROJECTION_ADDITIONAL_FIELDS_JSON:0..N}},
      "constraints": {{PROJECTION_CONSTRAINTS_JSON:0..N}}
    },
    "sourceRefs": {{SOURCE_REFS_JSON:0..N}}
  }{{ADDITIONAL_OPERATION_BLOCK:0..N}}
]
-->

## Executive Summary

{{EXECUTIVE_SUMMARY}}

## Model Updates

{{MODEL_UPDATE_BLOCK:0..N}}

## Projection Updates

{{PROJECTION_UPDATE_BLOCK:0..N}}

## Shared Projection Updates

{{SHARED_PROJECTION_UPDATE_BLOCK:0..N}}

## Open Questions

{{OPEN_QUESTION_BLOCK:0..N}}

## Merge Guidance

{{MERGE_GUIDANCE}}
