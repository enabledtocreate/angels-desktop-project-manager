# Change Log Fragment: {{FRAGMENT_CODE}} - {{FRAGMENT_TITLE}}

> Managed document. Must comply with template CHANGELOG_FRAGMENT.template.md.

<!-- APM:DATA
{
  "docType": "changelog_fragment",
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
    "templateName": "CHANGELOG_FRAGMENT.template.md",
    "templateVersion": "{{TEMPLATE_VERSION}}",
    "payload": {{PAYLOAD_JSON:0..1}}
  }
}
-->

<!-- APM:OPERATIONS
[
  {
    "operation": "{{OPERATION:add|update|remove|reorder|move|link|unlink}}",
    "targetSection": "{{TARGET_SECTION:entries|open-questions}}",
    "fromSection": "{{FROM_SECTION:0..1}}",
    "targetItemId": "{{TARGET_ITEM_ID:0..1}}",
    "beforeItemId": "{{BEFORE_ITEM_ID:0..1}}",
    "afterItemId": "{{AFTER_ITEM_ID:0..1}}",
    "orderedIds": {{ORDERED_IDS_JSON:0..N}},
    "versionDate": "{{VERSION_DATE:0..1}}",
    "workItemCodes": "{{WORK_ITEM_CODES:0..N}}",
    "targetDoc": "{{TARGET_DOC:0..1}}",
    "targetSectionNumber": "{{TARGET_SECTION_NUMBER:0..1}}",
    "fragmentCode": "{{RELATED_FRAGMENT_CODE:0..1}}",
    "summary": "{{CHANGE_SUMMARY:0..1}}"
    "item": {
      "id": "{{ITEM_ID:0..1}}",
      "stableId": "{{ITEM_STABLE_ID:0..1}}",
      "title": "{{ITEM_TITLE:0..1}}",
      "summary": "{{ITEM_SUMMARY:0..1}}",
      "description": "{{ITEM_DESCRIPTION:0..1}}",
      "changeDate": "{{CHANGE_DATE:0..1}}",
      "workItemCodes": "{{WORK_ITEM_CODES:0..N}}",
      "targetDoc": "{{TARGET_DOC:0..1}}",
      "targetSectionNumber": "{{TARGET_SECTION_NUMBER:0..1}}",
      "targetItemId": "{{TARGET_ITEM_ID:0..1}}",
      "fragmentCode": "{{RELATED_FRAGMENT_CODE:0..1}}",
      "operation": "{{ITEM_OPERATION:add|update|remove|reorder|move|link|unlink}}"
    },
    "sourceRefs": {{SOURCE_REFS_JSON:0..N}}
  }{{ADDITIONAL_OPERATION_BLOCK:0..N}}
]
-->

## Executive Summary

{{EXECUTIVE_SUMMARY}}

## Entry Updates

{{ENTRY_UPDATE_BLOCK:0..N}}

## Open Questions

{{OPEN_QUESTION_BLOCK:0..N}}

## Merge Guidance

{{MERGE_GUIDANCE}}
