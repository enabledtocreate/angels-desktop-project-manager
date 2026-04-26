# Functional Spec Fragment: {{FRAGMENT_CODE}} - {{FRAGMENT_TITLE}}

> Managed document. Must comply with template FUNCTIONAL_SPEC_FRAGMENT.template.md.

<!-- APM:DATA
{
  "docType": "functional_spec_fragment",
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
    "templateName": "FUNCTIONAL_SPEC_FRAGMENT.template.md",
    "templateVersion": "{{TEMPLATE_VERSION}}",
    "payload": {{PAYLOAD_JSON:0..1}}
  }
}
-->

<!-- APM:OPERATIONS
[
  {
    "operation": "{{OPERATION:add|update|remove|reorder|move|link|unlink}}",
    "targetSection": "{{TARGET_SECTION:functional-areas|logical-flows|flow-visuals|flow-endpoints|user-actions-and-system-responses|validation-rules|interface-expectations|edge-cases|open-questions}}",
    "fromSection": "{{FROM_SECTION:0..1}}",
    "targetItemId": "{{TARGET_ITEM_ID:0..1}}",
    "beforeItemId": "{{BEFORE_ITEM_ID:0..1}}",
    "afterItemId": "{{AFTER_ITEM_ID:0..1}}",
    "orderedIds": {{ORDERED_IDS_JSON:0..N}},
    "versionDate": "{{VERSION_DATE:0..1}}",
    "item": {
      "id": "{{ITEM_ID:0..1}}",
      "stableId": "{{ITEM_STABLE_ID:0..1}}",
      "title": "{{ITEM_TITLE:0..1}}",
      "description": "{{ITEM_DESCRIPTION:0..1}}",
      "flowId": "{{FLOW_ID:0..1}}",
      "flowStableId": "{{FLOW_STABLE_ID:0..1}}",
      "type": "{{ITEM_TYPE:start|user_action|system_action|decision|validation|loop|input|output|endpoint|return|error_path|log_audit|external_interaction|formula|model_reference|ai_placeholder|open_question}}",
      "label": "{{ITEM_LABEL:0..1}}",
      "command": "{{ITEM_COMMAND:0..1}}",
      "position": {{ITEM_POSITION_JSON:0..1}},
      "source": "{{EDGE_SOURCE_ID:0..1}}",
      "target": "{{EDGE_TARGET_ID:0..1}}",
      "sourceHandle": "{{EDGE_SOURCE_HANDLE:0..1}}",
      "targetHandle": "{{EDGE_TARGET_HANDLE:0..1}}",
      "conditionText": "{{EDGE_CONDITION_TEXT:0..1}}",
      "nodes": {{FLOW_NODES_JSON:0..N}},
      "edges": {{FLOW_EDGES_JSON:0..N}},
      "openQuestions": {{FLOW_OPEN_QUESTIONS_JSON:0..N}}
    },
    "sourceRefs": {{SOURCE_REFS_JSON:0..N}}
  }{{ADDITIONAL_OPERATION_BLOCK:0..N}}
]
-->

## Executive Summary

{{EXECUTIVE_SUMMARY}}

## Functional Area Updates

{{FUNCTIONAL_AREA_UPDATE_BLOCK:0..N}}

## Logical Flow Updates

{{LOGICAL_FLOW_UPDATE_BLOCK:0..N}}

## Flow Visual Updates

{{FLOW_VISUAL_UPDATE_BLOCK:0..N}}

## Flow Endpoint Updates

{{FLOW_ENDPOINT_UPDATE_BLOCK:0..N}}

## Open Questions

{{OPEN_QUESTION_BLOCK:0..N}}

## Merge Guidance

{{MERGE_GUIDANCE}}
