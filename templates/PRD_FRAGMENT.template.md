# PRD Fragment: {{FRAGMENT_CODE}} - {{FRAGMENT_TITLE}}

> Managed document. Must comply with template PRD_FRAGMENT.template.md.

<!-- APM:DATA
{
  "docType": "prd_fragment",
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
    "templateName": "PRD_FRAGMENT.template.md",
    "templateVersion": "{{TEMPLATE_VERSION}}",
    "mermaid": "{{MERMAID_BODY:0..1}}",
    "payload": {{PAYLOAD_JSON:0..1}}
  }
}
-->

## Executive Summary

{{EXECUTIVE_SUMMARY}}

## Product Overview Updates

{{PRODUCT_OVERVIEW_UPDATE_BLOCK:0..N}}

## Functional Requirement Updates

{{FUNCTIONAL_REQUIREMENT_UPDATE_BLOCK:0..N}}

## Technical and Implementation Updates

{{TECHNICAL_AND_IMPLEMENTATION_UPDATE_BLOCK:0..N}}

## Risk and Future Enhancement Updates

{{RISK_AND_FUTURE_UPDATE_BLOCK:0..N}}

## Mermaid

```mermaid
{{MERMAID_BODY:0..1}}
```

## Merge Guidance

{{MERGE_GUIDANCE}}
