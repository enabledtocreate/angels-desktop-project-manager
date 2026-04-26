# PROJECT_BRIEF.md: {{PROJECT_NAME}}

> Managed document. Must comply with template PROJECT_BRIEF.template.md.

<!-- APM:DATA
{
  "docType": "project_brief",
  "version": {{DOC_VERSION:1}},
  "templateName": "PROJECT_BRIEF.template.md",
  "templateVersion": "{{TEMPLATE_VERSION}}",
  "sourceOfTruth": "{{SOURCE_OF_TRUTH:database|generated|hybrid}}",
  "editorState": {{EDITOR_STATE_JSON:0..1}}
}
-->

## 1. Identity

- Project Name: {{PROJECT_NAME}}
- Project Type: {{PROJECT_TYPE:software|general|design|research|operations|other}}
- Primary Workspace Path: {{PROJECT_PATH}}

## 2. Operating Context

{{OPERATING_CONTEXT}}

## 3. Goals and Constraints

### 3.1 Goals

<!-- REPEAT {{GOAL_BLOCK:0..N}} -->
- {{GOAL_ITEM}}
<!-- END REPEAT GOAL_BLOCK -->

### 3.2 Constraints

<!-- REPEAT {{CONSTRAINT_BLOCK:0..N}} -->
- {{CONSTRAINT_ITEM}}
<!-- END REPEAT CONSTRAINT_BLOCK -->

## 4. Branching Documents

<!-- REPEAT {{BRANCH_DOCUMENT_BLOCK:0..N}} -->
- {{BRANCH_DOCUMENT_NAME}} -> {{BRANCH_DOCUMENT_PURPOSE}}
<!-- END REPEAT BRANCH_DOCUMENT_BLOCK -->
