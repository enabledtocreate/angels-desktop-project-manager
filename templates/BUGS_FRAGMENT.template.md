# Bugs Fragment: {{FRAGMENT_CODE}} - {{FRAGMENT_TITLE}}

> Managed document. Must comply with template BUGS_FRAGMENT.template.md.

<!-- APM:DATA
{
  "docType": "bugs_fragment",
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
    "templateName": "BUGS_FRAGMENT.template.md",
    "templateVersion": "{{TEMPLATE_VERSION}}",
    "payload": {{PAYLOAD_JSON:0..1}}
  }
}
-->

## Executive Summary

{{EXECUTIVE_SUMMARY}}

## Bug Updates

{{BUG_UPDATE_BLOCK:0..N}}

## Expected vs Current Behavior

{{BEHAVIOR_UPDATE_BLOCK:0..N}}

## Fix and Validation Notes

{{FIX_AND_VALIDATION_NOTES}}

## Open Questions

{{OPEN_QUESTION_BLOCK:0..N}}

## Merge Guidance

{{MERGE_GUIDANCE}}
