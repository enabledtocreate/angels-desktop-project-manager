# CHANGELOG: Angel's Project Manager

> Managed document. Must comply with template CHANGELOG.template.md.

<!-- APM:DATA
{
  "docType": "changelog",
  "version": 1,
  "markdown": "",
  "editorState": {
    "overview": {
      "summary": "Records the documentation and persistence changes for Functional Spec action vocabulary and project template version tracking.",
      "versionDate": "2026-04-14T03:27:52.126Z",
      "stableId": "changelog-overview-summary-executive-summary",
      "sourceRefs": []
    },
    "entries": [
      {
        "id": "changelog-entry-20260414-functional-spec-action-vocabulary",
        "stableId": "functional-spec-action-vocabulary",
        "changeDate": "2026-04-14",
        "workItemCodes": "TASK-TEMPLATE-VERSIONING-20260414",
        "operation": "update",
        "targetDoc": "FUNCTIONAL_SPEC",
        "targetSectionNumber": "1.1",
        "targetItemId": "functional-spec-action-vocabulary",
        "fragmentCode": "FUNCTIONAL_SPEC_FRAGMENT_20260414_template_action_vocabulary_001",
        "summary": "Functional Spec templates and generated documents now expose standard node, connection, canvas, and smart-text actions for humans and AI agents.",
        "versionDate": "2026-04-14T01:44:54.400Z",
        "sourceRefs": [
          "CHANGELOG_FRAGMENT_20260414_template_registry_and_functional_actions_001",
          "TASK-TEMPLATE-VERSIONING-20260414"
        ]
      },
      {
        "id": "changelog-entry-20260414-project-template-files",
        "stableId": "database-schema-entity-project-template-files",
        "changeDate": "2026-04-14",
        "workItemCodes": "TASK-TEMPLATE-VERSIONING-20260414",
        "operation": "add",
        "targetDoc": "DATABASE_SCHEMA",
        "targetSectionNumber": "project_template_files",
        "targetItemId": "database-schema-entity-project-template-files",
        "fragmentCode": "DATABASE_SCHEMA_FRAGMENT_20260414_project_template_files_001",
        "summary": "A project-scoped `project_template_files` table now records copied template names, kinds, versions, source hashes, target hashes, paths, and sync timestamps.",
        "versionDate": "2026-04-14T01:44:54.400Z",
        "sourceRefs": [
          "CHANGELOG_FRAGMENT_20260414_template_registry_and_functional_actions_001",
          "TASK-TEMPLATE-VERSIONING-20260414"
        ]
      },
      {
        "id": "changelog-entry-20260414-template-sync-architecture",
        "stableId": "architecture-application-workflows-versioned-template-sync",
        "changeDate": "2026-04-14",
        "workItemCodes": "TASK-TEMPLATE-VERSIONING-20260414",
        "operation": "update",
        "targetDoc": "ARCHITECTURE",
        "targetSectionNumber": "application-workflows",
        "targetItemId": "architecture-application-workflows-versioned-template-sync",
        "fragmentCode": "ARCHITECTURE_FRAGMENT_20260414_template_registry_001",
        "summary": "Architecture now describes source templates as authoritative workspace-copy contracts that are checked, replaced, and recorded during document sync.",
        "versionDate": "2026-04-14T01:44:54.400Z",
        "sourceRefs": [
          "CHANGELOG_FRAGMENT_20260414_template_registry_and_functional_actions_001",
          "TASK-TEMPLATE-VERSIONING-20260414"
        ]
      },
      {
        "id": "changelog-entry-20260414-ai-template-versioning-directive",
        "stableId": "ai-environment-module-update-rules-template-registry-migrations",
        "changeDate": "2026-04-14",
        "workItemCodes": "TASK-TEMPLATE-VERSIONING-20260414",
        "operation": "update",
        "targetDoc": "AI_ENVIRONMENT",
        "targetSectionNumber": "module-update-rules",
        "targetItemId": "ai-environment-module-update-rules-template-registry-migrations",
        "fragmentCode": "AI_ENVIRONMENT_FRAGMENT_20260414_template_versioning_001",
        "summary": "AI Environment now instructs agents to version template changes, keep Functional Spec actions readable, and pair persisted template sync state with migrations.",
        "versionDate": "2026-04-14T01:44:54.400Z",
        "sourceRefs": [
          "CHANGELOG_FRAGMENT_20260414_template_registry_and_functional_actions_001",
          "TASK-TEMPLATE-VERSIONING-20260414"
        ]
      }
    ],
    "openQuestions": [
      {
        "id": "changelog-open-question-1776137272126",
        "title": "Template Registry And Functional Actions",
        "description": "- Should `TASK-TEMPLATE-VERSIONING-20260414` be converted into a formal task or feature record in the work item module?",
        "versionDate": "2026-04-14T03:27:52.126Z",
        "stableId": "changelog-open-questions-template-registry-and-functional-actions",
        "sourceRefs": []
      }
    ],
    "fragmentHistory": [
      {
        "id": "project:CHANGELOG_FRAGMENT_20260414_template_registry_and_functional_actions_001.md",
        "code": "CHANGELOG_FRAGMENT_20260414_template_registry_and_functional_actions_001",
        "title": "Template Registry And Functional Actions",
        "status": "integrated",
        "sourceScope": "project",
        "integratedAt": "2026-04-14T03:27:52.126Z",
        "summary": "Records the documentation and persistence changes for Functional Spec action vocabulary and project template version tracking.",
        "revision": 1,
        "lineageKey": "CHANGELOG_FRAGMENT_20260414_template_registry_and_functional_actions",
        "supersedesCode": "",
        "supersedesRevision": null
      }
    ]
  }
}
-->

## 1. Executive Summary

<!--
APM-ID: changelog-overview-summary-executive-summary
APM-LAST-UPDATED: 2026-04-14
-->

Records the documentation and persistence changes for Functional Spec action vocabulary and project template version tracking.

## 2. Change Entries

<!--
APM-ID: functional-spec-action-vocabulary
APM-REFS: CHANGELOG_FRAGMENT_20260414_template_registry_and_functional_actions_001, TASK-TEMPLATE-VERSIONING-20260414
APM-LAST-UPDATED: 2026-04-14
-->

### 2.1 TASK-TEMPLATE-VERSIONING-20260414

- Change Date: 2026-04-14
- Operation: update
- Target Document: FUNCTIONAL_SPEC
- Target Section: 1.1
- Target Item ID: functional-spec-action-vocabulary
- Fragment Code: FUNCTIONAL_SPEC_FRAGMENT_20260414_template_action_vocabulary_001
- Version Date: 2026-04-14

Functional Spec templates and generated documents now expose standard node, connection, canvas, and smart-text actions for humans and AI agents.

<!--
APM-ID: database-schema-entity-project-template-files
APM-REFS: CHANGELOG_FRAGMENT_20260414_template_registry_and_functional_actions_001, TASK-TEMPLATE-VERSIONING-20260414
APM-LAST-UPDATED: 2026-04-14
-->

### 2.2 TASK-TEMPLATE-VERSIONING-20260414

- Change Date: 2026-04-14
- Operation: add
- Target Document: DATABASE_SCHEMA
- Target Section: project_template_files
- Target Item ID: database-schema-entity-project-template-files
- Fragment Code: DATABASE_SCHEMA_FRAGMENT_20260414_project_template_files_001
- Version Date: 2026-04-14

A project-scoped `project_template_files` table now records copied template names, kinds, versions, source hashes, target hashes, paths, and sync timestamps.

<!--
APM-ID: architecture-application-workflows-versioned-template-sync
APM-REFS: CHANGELOG_FRAGMENT_20260414_template_registry_and_functional_actions_001, TASK-TEMPLATE-VERSIONING-20260414
APM-LAST-UPDATED: 2026-04-14
-->

### 2.3 TASK-TEMPLATE-VERSIONING-20260414

- Change Date: 2026-04-14
- Operation: update
- Target Document: ARCHITECTURE
- Target Section: application-workflows
- Target Item ID: architecture-application-workflows-versioned-template-sync
- Fragment Code: ARCHITECTURE_FRAGMENT_20260414_template_registry_001
- Version Date: 2026-04-14

Architecture now describes source templates as authoritative workspace-copy contracts that are checked, replaced, and recorded during document sync.

<!--
APM-ID: ai-environment-module-update-rules-template-registry-migrations
APM-REFS: CHANGELOG_FRAGMENT_20260414_template_registry_and_functional_actions_001, TASK-TEMPLATE-VERSIONING-20260414
APM-LAST-UPDATED: 2026-04-14
-->

### 2.4 TASK-TEMPLATE-VERSIONING-20260414

- Change Date: 2026-04-14
- Operation: update
- Target Document: AI_ENVIRONMENT
- Target Section: module-update-rules
- Target Item ID: ai-environment-module-update-rules-template-registry-migrations
- Fragment Code: AI_ENVIRONMENT_FRAGMENT_20260414_template_versioning_001
- Version Date: 2026-04-14

AI Environment now instructs agents to version template changes, keep Functional Spec actions readable, and pair persisted template sync state with migrations.

## 3. Applied Fragments

### CHANGELOG_FRAGMENT_20260414_template_registry_and_functional_actions_001: Template Registry And Functional Actions

- Status: integrated
- Source: project
- Integrated: 2026-04-14T03:27:52.126Z

Records the documentation and persistence changes for Functional Spec action vocabulary and project template version tracking.

## 4. Open Questions

<!--
APM-ID: changelog-open-questions-template-registry-and-functional-actions
APM-LAST-UPDATED: 2026-04-14
-->

### 4.1 Template Registry And Functional Actions

- Should `TASK-TEMPLATE-VERSIONING-20260414` be converted into a formal task or feature record in the work item module?

- Version Date: 2026-04-14

