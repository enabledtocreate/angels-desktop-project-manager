# CHANGELOG.md: {{PROJECT_NAME}}

> Managed document. Must comply with template CHANGELOG.template.md.

<!-- APM:DATA
{
  "docType": "changelog",
  "version": {{DOC_VERSION:1}},
  "templateName": "CHANGELOG.template.md",
  "templateVersion": "{{TEMPLATE_VERSION}}",
  "sourceOfTruth": "{{SOURCE_OF_TRUTH:database|generated|hybrid}}",
  "editorState": {{EDITOR_STATE_JSON:0..1}}
}
-->

## 1. Executive Summary

{{EXECUTIVE_SUMMARY}}

## 2. Entries

<!-- REPEAT {{CHANGELOG_ENTRY_BLOCK:0..N}} -->
### {{ENTRY_DATE}} - {{ENTRY_TITLE}}

- Change Type: {{CHANGE_TYPE:feature|bug|task|document|schema|refactor|other}}
- Source Ref: {{SOURCE_REF}}
- Target Section Id: {{TARGET_SECTION_ID}}

{{ENTRY_SUMMARY}}
<!-- END REPEAT CHANGELOG_ENTRY_BLOCK -->

## 3. Open Questions

{{OPEN_QUESTION_BLOCK:0..N}}
