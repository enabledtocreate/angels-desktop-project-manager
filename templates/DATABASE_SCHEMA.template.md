# DATABASE_SCHEMA.md: {{PROJECT_NAME}}

> Managed document. Must comply with template DATABASE_SCHEMA.template.md.

<!-- APM:DATA
{
  "docType": "database_schema",
  "version": {{DOC_VERSION:1}},
  "templateName": "DATABASE_SCHEMA.template.md",
  "templateVersion": "{{TEMPLATE_VERSION}}",
  "sourceOfTruth": "{{SOURCE_OF_TRUTH:database|generated|hybrid}}",
  "mermaid": {{MERMAID_JSON:0..1}},
  "editorState": {{EDITOR_STATE_JSON:0..1}}
}
-->

## 1. Schema Overview

### 1.1 Purpose

{{SCHEMA_PURPOSE}}

### 1.2 Storage Strategy

{{STORAGE_STRATEGY}}

### 1.3 Sync Status

{{SYNC_STATUS_SUMMARY}}

## 2. Entities

<!-- REPEAT {{ENTITY_BLOCK:0..N}} -->
### {{ENTITY_NAME}} ({{ENTITY_KIND:table|view|index|constraint|trigger|other}})

{{ENTITY_DESCRIPTION}}

#### Fields

{{FIELD_BLOCK:0..N}}
<!-- END REPEAT ENTITY_BLOCK -->

## 3. Relationships

{{RELATIONSHIP_BLOCK:0..N}}

## 4. Indexes and Constraints

{{INDEX_AND_CONSTRAINT_BLOCK:0..N}}

## 5. Migration Notes

{{MIGRATION_NOTE_BLOCK:0..N}}

## 6. Open Questions

{{OPEN_QUESTION_BLOCK:0..N}}

## DBML

```dbml
{{DBML_BODY}}
```

## Mermaid

```mermaid
{{MERMAID_BODY}}
```
