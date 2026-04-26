# Database Schema Fragment: {{FRAGMENT_CODE}} - {{FRAGMENT_TITLE}}

> Managed document. Must comply with template DATABASE_SCHEMA_FRAGMENT.template.md.

<!-- APM:DATA
{
  "docType": "database_schema_fragment",
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
    "templateName": "DATABASE_SCHEMA_FRAGMENT.template.md",
    "templateVersion": "{{TEMPLATE_VERSION}}",
    "payload": {
      "source": {
        "sourceType": "{{SOURCE_TYPE:sqlite_database|schema_sql|dbml|migration_files|orm_code|mixed}}",
        "sourceLabel": "{{SOURCE_LABEL_PAYLOAD}}",
        "dialect": "{{SOURCE_DIALECT}}",
        "observedAt": "{{SOURCE_OBSERVED_AT:0..1}}",
        "schemaFingerprint": "{{SCHEMA_FINGERPRINT}}",
        "confidence": "{{SOURCE_CONFIDENCE:observed|mixed|inferred}}"
      },
      "summary": "{{PAYLOAD_SUMMARY}}",
      "entities": {{ENTITIES_JSON:0..N}},
      "relationships": {{RELATIONSHIPS_JSON:0..N}},
      "indexes": {{INDEXES_JSON:0..N}},
      "constraints": {{CONSTRAINTS_JSON:0..N}},
      "migrationNotes": {{MIGRATION_NOTES_JSON:0..N}},
      "openQuestions": {{OPEN_QUESTIONS_JSON:0..N}},
      "dbml": {{DBML_JSON}},
      "mermaid": {{MERMAID_JSON}},
      "importMode": "{{IMPORT_MODE:full_schema|partial_schema|0..1}}"
    }
  }
}
-->

## Import Summary

{{EXECUTIVE_SUMMARY}}

## Source Metadata

{{SOURCE_METADATA_MARKDOWN}}

## Observed Schema Summary

{{OBSERVED_SCHEMA_SUMMARY}}

## Entities

{{ENTITY_MARKDOWN_BLOCK:0..N}}

## Relationships

{{RELATIONSHIP_MARKDOWN_BLOCK:0..N}}

## Indexes and Constraints

{{INDEX_AND_CONSTRAINT_MARKDOWN_BLOCK:0..N}}

## Migration Notes

{{MIGRATION_NOTES_MARKDOWN:0..N}}

## Open Questions

{{OPEN_QUESTION_BLOCK:0..N}}

## DBML

```dbml
{{DBML_BODY}}
```

## Mermaid

```mermaid
{{MERMAID_BODY}}
```

## Merge Guidance

{{MERGE_GUIDANCE}}
