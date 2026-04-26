# PRD.md: {{PROJECT_NAME}}

> Managed document. Must comply with template PRD.template.md.

<!-- APM:DATA
{
  "docType": "prd",
  "version": {{DOC_VERSION:1}},
  "templateName": "PRD.template.md",
  "templateVersion": "{{TEMPLATE_VERSION}}",
  "sourceOfTruth": "{{SOURCE_OF_TRUTH:database|generated|hybrid}}",
  "editorState": {{EDITOR_STATE_JSON:0..1}}
}
-->

## 1. Executive Summary

{{EXECUTIVE_SUMMARY}}

## 2. Product Overview

### 2.1 Product Name

{{PRODUCT_NAME}}

### 2.2 Product Vision

{{PRODUCT_VISION}}

### 2.3 Target Audience

<!-- REPEAT {{TARGET_AUDIENCE_BLOCK:0..N}} -->
- {{TARGET_AUDIENCE_ITEM}}
<!-- END REPEAT TARGET_AUDIENCE_BLOCK -->

### 2.4 Key Value Propositions

<!-- REPEAT {{VALUE_PROPOSITION_BLOCK:0..N}} -->
- {{VALUE_PROPOSITION_ITEM}}
<!-- END REPEAT VALUE_PROPOSITION_BLOCK -->

## 3. Functional Requirements

### 3.1 Workflows

{{WORKFLOW_BLOCK:0..N}}

### 3.2 User Actions

{{USER_ACTION_BLOCK:0..N}}

### 3.3 System Behaviors

{{SYSTEM_BEHAVIOR_BLOCK:0..N}}

## 4. Data and Reporting

{{DATA_REPORTING_BLOCK:0..N}}

## 5. Non-Functional Requirements

{{NON_FUNCTIONAL_REQUIREMENT_BLOCK:0..N}}

## 6. Technical Architecture

{{TECHNICAL_ARCHITECTURE_BLOCK:0..N}}

## 7. Implementation Plan

### 7.1 Sequencing

{{SEQUENCING_BLOCK:0..N}}

### 7.2 Dependencies

{{DEPENDENCY_BLOCK:0..N}}

### 7.3 Milestones

{{MILESTONE_BLOCK:0..N}}

## 8. Success Metrics

{{SUCCESS_METRIC_BLOCK:0..N}}

## 9. Risks and Mitigations

{{RISK_BLOCK:0..N}}

## 10. Future Enhancements

{{FUTURE_ENHANCEMENT_BLOCK:0..N}}

## 11. Open Questions

{{OPEN_QUESTION_BLOCK:0..N}}
