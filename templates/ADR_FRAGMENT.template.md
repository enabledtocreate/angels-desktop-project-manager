# ADR Fragment: {{FRAGMENT_CODE}} - {{FRAGMENT_TITLE}}

> Managed document. Must comply with template ADR_FRAGMENT.template.md.

<!-- APM:DATA
{
  "docType": "adr_fragment",
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
    "templateName": "ADR_FRAGMENT.template.md",
    "templateVersion": "{{TEMPLATE_VERSION}}",
    "payload": {{PAYLOAD_JSON:0..1}}
  }
}
-->

<!-- APM:OPERATIONS
[
  {
    "operation": "{{OPERATION:add|update|remove|reorder|move|link|unlink}}",
    "targetSection": "{{TARGET_SECTION:alternatives|consequences|related-architecture|related-modules|open-questions}}",
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
      "text": "{{ITEM_TEXT:0..1}}",
      "risk": "{{ITEM_RISK:0..1}}",
      "mitigation": "{{ITEM_MITIGATION:0..1}}",
      "type": "{{ITEM_TYPE:0..1}}"
    },
    "sourceRefs": {{SOURCE_REFS_JSON:0..N}}
  }{{ADDITIONAL_OPERATION_BLOCK:0..N}}
]
-->

## Executive Summary

{{EXECUTIVE_SUMMARY}}

## Decision Metadata

{{DECISION_METADATA_UPDATES}}

## Proposed Decision

{{PROPOSED_DECISION}}

## Context and Rationale

{{CONTEXT_AND_RATIONALE_UPDATES}}

## Alternatives and Consequences

{{ALTERNATIVE_AND_CONSEQUENCE_BLOCK:0..N}}

## Related Architecture and Modules

{{RELATED_ARCHITECTURE_AND_MODULE_BLOCK:0..N}}

## Open Questions

{{OPEN_QUESTION_BLOCK:0..N}}

## Merge Guidance

{{MERGE_GUIDANCE}}
