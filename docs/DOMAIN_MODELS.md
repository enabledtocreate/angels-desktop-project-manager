# DOMAIN_MODELS: Angel's Project Manager

> Managed document. Must comply with template DOMAIN_MODELS.template.md.

<!-- APM:DATA
{
  "docType": "domain_models",
  "version": 1,
  "markdown": "",
  "editorState": {
    "overview": {
      "summary": "Domain models for Angel's Project Manager are still being defined.",
      "versionDate": "2026-04-14T03:28:31.682Z",
      "stableId": "domain-models-overview-summary-executive-summary",
      "sourceRefs": []
    },
    "models": [
      {
        "id": "domain-model-fragment-integration-request",
        "stableId": "domain-models-model-fragment-integration-request",
        "name": "Fragment Integration Request",
        "summary": "A proposed managed-document change packaged as a reviewable fragment.",
        "description": "A Fragment Integration Request is the conceptual object that carries a proposed update from an AI agent or user into a module document. It contains enough target information for the application to review, consume, archive, and trace the update without directly editing canonical markdown by hand.",
        "modelType": "command",
        "fields": [
          {
            "id": "domain-field-fragment-integration-request-fragment-code",
            "name": "fragmentCode",
            "displayName": "Fragment Code",
            "description": "Stable fragment code or file-derived identifier used for review and archive history.",
            "conceptualType": "identifier",
            "required": true,
            "stableId": "domain-models-field-fragment-integration-request-fragmentcode",
            "defaultValue": "",
            "allowedValues": [],
            "constraints": [],
            "sourceRefs": [],
            "versionDate": ""
          },
          {
            "id": "domain-field-fragment-integration-request-target-doc-type",
            "name": "targetDocType",
            "displayName": "Target Document Type",
            "description": "Managed document type the fragment intends to update.",
            "conceptualType": "identifier",
            "required": true,
            "stableId": "domain-models-field-fragment-integration-request-targetdoctype",
            "defaultValue": "",
            "allowedValues": [],
            "constraints": [],
            "sourceRefs": [],
            "versionDate": ""
          },
          {
            "id": "domain-field-fragment-integration-request-target-section",
            "name": "targetSection",
            "displayName": "Target Section",
            "description": "Module-specific section key used by fragment operations.",
            "conceptualType": "identifier",
            "required": false,
            "stableId": "domain-models-field-fragment-integration-request-targetsection",
            "defaultValue": "",
            "allowedValues": [],
            "constraints": [],
            "sourceRefs": [],
            "versionDate": ""
          },
          {
            "id": "domain-field-fragment-integration-request-operations",
            "name": "operations",
            "displayName": "Operations",
            "description": "Structured add, update, remove, move, reorder, link, or unlink operations requested by the fragment.",
            "conceptualType": "collection",
            "required": false,
            "stableId": "domain-models-field-fragment-integration-request-operations",
            "defaultValue": "",
            "allowedValues": [],
            "constraints": [],
            "sourceRefs": [],
            "versionDate": ""
          },
          {
            "id": "domain-field-fragment-integration-request-review-status",
            "name": "reviewStatus",
            "displayName": "Review Status",
            "description": "Current user-visible state of the fragment before and after consumption.",
            "conceptualType": "enum",
            "required": true,
            "allowedValues": [
              "draft",
              "ready",
              "integrated",
              "archived",
              "superseded"
            ],
            "stableId": "domain-models-field-fragment-integration-request-reviewstatus",
            "defaultValue": "",
            "constraints": [],
            "sourceRefs": [],
            "versionDate": ""
          }
        ],
        "relationships": [
          {
            "id": "domain-relationship-fragment-integration-request-targets-managed-document",
            "title": "Targets Managed Document",
            "description": "Each fragment integration request targets one managed document, even if the work item that caused it affects several documents.",
            "relationshipType": "targets",
            "targetModelName": "Managed Document",
            "targetModelStableId": "domain-models-model-managed-document",
            "stableId": "domain-models-relationship-fragment-integration-request-targets-managed-document",
            "sourceRefs": [],
            "versionDate": ""
          }
        ],
        "rules": [
          {
            "id": "domain-rule-fragment-integration-request-no-direct-doc-write",
            "title": "No Direct Canonical Write",
            "description": "Fragments propose changes that the application consumes into structured state before regenerating canonical markdown.",
            "versionDate": "",
            "stableId": "domain-models-model-fragment-integration-request-rules-no-direct-canonical-write",
            "sourceRefs": []
          },
          {
            "id": "domain-rule-fragment-integration-request-preserve-history",
            "title": "Preserve Integration History",
            "description": "Consumed fragments remain traceable through fragment history even after the source file is removed.",
            "versionDate": "",
            "stableId": "domain-models-model-fragment-integration-request-rules-preserve-integration-history",
            "sourceRefs": []
          }
        ],
        "examples": [
          {
            "id": "domain-example-fragment-integration-request-functional-flow",
            "title": "Functional Flow Fragment",
            "description": "A Functional Spec fragment can add a workflow and its visual node graph as one reviewable integration request.",
            "versionDate": "",
            "stableId": "domain-models-model-fragment-integration-request-examples-functional-flow-fragment",
            "sourceRefs": []
          }
        ],
        "versionDate": "2026-04-11T18:47:13.779Z",
        "sourceRefs": [
          "DOMAIN_MODELS_FRAGMENT_20260411_fragment_integration_request_001",
          "DOC-TEST-001"
        ]
      },
      {
        "id": "domain-model-fragment-refresh-event",
        "stableId": "domain-models-model-fragment-refresh-event",
        "name": "Fragment Refresh Event",
        "summary": "A watched fragment-file change that tells a module UI to refresh its fragment list.",
        "description": "A Fragment Refresh Event is the conceptual signal produced when a watched fragment markdown file is added, changed, or removed. The Functional Spec uses it to describe how file watcher activity causes a module to debounce, reload, migrate older payloads when needed, and return an updated fragment list.",
        "modelType": "event",
        "fields": [
          {
            "name": "eventType",
            "displayName": "Event Type",
            "description": "The kind of file-system event observed for the fragment file.",
            "conceptualType": "enum",
            "required": true,
            "allowedValues": [
              "added",
              "changed",
              "removed"
            ],
            "defaultValue": "changed",
            "id": "domain-models-field-fragment-refresh-event-eventtype",
            "stableId": "domain-models-field-fragment-refresh-event-eventtype",
            "constraints": [],
            "sourceRefs": [],
            "versionDate": ""
          },
          {
            "name": "fileName",
            "displayName": "File Name",
            "description": "The markdown fragment file name that changed.",
            "conceptualType": "text",
            "required": true,
            "id": "domain-models-field-fragment-refresh-event-filename",
            "stableId": "domain-models-field-fragment-refresh-event-filename",
            "defaultValue": "",
            "allowedValues": [],
            "constraints": [],
            "sourceRefs": [],
            "versionDate": ""
          },
          {
            "name": "sourceScope",
            "displayName": "Source Scope",
            "description": "Where the fragment was discovered from the module perspective.",
            "conceptualType": "enum",
            "required": true,
            "allowedValues": [
              "project",
              "shared",
              "history"
            ],
            "id": "domain-models-field-fragment-refresh-event-sourcescope",
            "stableId": "domain-models-field-fragment-refresh-event-sourcescope",
            "defaultValue": "",
            "constraints": [],
            "sourceRefs": [],
            "versionDate": ""
          },
          {
            "name": "moduleKey",
            "displayName": "Module Key",
            "description": "The module whose fragment browser should refresh.",
            "conceptualType": "identifier",
            "required": true,
            "id": "domain-models-field-fragment-refresh-event-modulekey",
            "stableId": "domain-models-field-fragment-refresh-event-modulekey",
            "defaultValue": "",
            "allowedValues": [],
            "constraints": [],
            "sourceRefs": [],
            "versionDate": ""
          },
          {
            "name": "watchedPath",
            "displayName": "Watched Path",
            "description": "The configured project or shared fragments path being watched.",
            "conceptualType": "text",
            "required": true,
            "id": "domain-models-field-fragment-refresh-event-watchedpath",
            "stableId": "domain-models-field-fragment-refresh-event-watchedpath",
            "defaultValue": "",
            "allowedValues": [],
            "constraints": [],
            "sourceRefs": [],
            "versionDate": ""
          },
          {
            "name": "debounceMs",
            "displayName": "Debounce Milliseconds",
            "description": "The delay used to avoid refreshing repeatedly while related file events settle.",
            "conceptualType": "number",
            "required": false,
            "defaultValue": "250",
            "id": "domain-models-field-fragment-refresh-event-debouncems",
            "stableId": "domain-models-field-fragment-refresh-event-debouncems",
            "allowedValues": [],
            "constraints": [],
            "sourceRefs": [],
            "versionDate": ""
          }
        ],
        "relationships": [
          {
            "title": "Refreshes Fragment Review State",
            "description": "The event causes the active module fragment browser to reload pending and archived fragment review state.",
            "relationshipType": "triggers",
            "targetModelName": "Fragment Integration Request",
            "targetModelStableId": "domain-models-model-fragment-integration-request",
            "id": "domain-models-relationship-fragment-refresh-event-refreshes-fragment-review-state",
            "stableId": "domain-models-relationship-fragment-refresh-event-refreshes-fragment-review-state",
            "sourceRefs": [],
            "versionDate": ""
          }
        ],
        "rules": [
          {
            "title": "Debounce before refresh",
            "description": "The UI should debounce file watcher events before requesting the refreshed fragment list.",
            "id": "",
            "versionDate": "",
            "stableId": "domain-models-model-fragment-refresh-event-rules-debounce-before-refresh",
            "sourceRefs": []
          },
          {
            "title": "Do not consume automatically",
            "description": "The event refreshes the visible fragment list only; it must not integrate or archive a fragment without explicit user action.",
            "id": "",
            "versionDate": "",
            "stableId": "domain-models-model-fragment-refresh-event-rules-do-not-consume-automatically",
            "sourceRefs": []
          }
        ],
        "examples": [
          {
            "title": "Domain Models fragment added",
            "description": "A DOMAIN_MODELS_FRAGMENT file appears in the project fragments folder, causing the Domain Models fragment browser to show one new pending item.",
            "id": "",
            "versionDate": "",
            "stableId": "domain-models-model-fragment-refresh-event-examples-domain-models-fragment-added",
            "sourceRefs": []
          }
        ],
        "versionDate": "2026-04-22",
        "sourceRefs": [
          "DOMAIN_MODELS_FRAGMENT_20260422_functional_workflow_models_001",
          "FUNCTIONAL_SPEC_FRAGMENT_20260414_fragment_migration_refresh_001",
          "functional-spec-logical-flows-load-migrated-fragment",
          "functional-spec-logical-flows-refresh-fragments-on-file-change"
        ]
      }
    ],
    "projections": [
      {
        "id": "domain-projection-functional-fragment-integration-request",
        "stableId": "domain-models-projection-functional-fragment-integration-request",
        "baseModelId": "domain-model-fragment-integration-request",
        "baseModelStableId": "domain-models-model-fragment-integration-request",
        "baseModelName": "Fragment Integration Request",
        "owningModule": "functional_spec",
        "projectionType": "functional",
        "name": "Functional Fragment Integration Request",
        "description": "Functional Spec uses this projection to describe how a fragment is discovered, reviewed, validated, consumed, archived, and reflected back to the user.",
        "fieldMappings": [
          {
            "id": "domain-projection-field-fragment-code-identifies-review-item",
            "title": "fragmentCode identifies the review item",
            "description": "The UI and fragment history use fragmentCode as the readable identifier for the pending change.",
            "versionDate": "",
            "stableId": "domain-models-projection-functional-fragment-integration-request-field-mappings-fragmentcode-identifies-the-review-item",
            "sourceRefs": []
          },
          {
            "id": "domain-projection-field-operations-drive-consumption",
            "title": "operations drive consumption",
            "description": "The consuming flow applies operations to structured document state before regenerating markdown.",
            "versionDate": "",
            "stableId": "domain-models-projection-functional-fragment-integration-request-field-mappings-operations-drive-consumption",
            "sourceRefs": []
          }
        ],
        "constraints": [
          {
            "id": "domain-projection-constraint-operations-need-targets",
            "title": "Operations need stable targets",
            "description": "Update, remove, move, reorder, link, and unlink operations should use stable target ids when modifying existing items.",
            "versionDate": "",
            "stableId": "domain-models-projection-functional-fragment-integration-request-constraints-operations-need-stable-targets",
            "sourceRefs": []
          }
        ],
        "versionDate": "2026-04-11T18:47:13.779Z",
        "sourceRefs": [
          "DOMAIN_MODELS_FRAGMENT_20260411_fragment_integration_request_001",
          "DOC-TEST-001"
        ],
        "excludedFields": [],
        "additionalFields": []
      },
      {
        "id": "domain-projection-functional-fragment-refresh-event",
        "stableId": "domain-models-projection-functional-fragment-refresh-event",
        "baseModelId": "domain-model-fragment-refresh-event",
        "baseModelStableId": "domain-models-model-fragment-refresh-event",
        "baseModelName": "Fragment Refresh Event",
        "owningModule": "functional_spec",
        "projectionType": "functional",
        "name": "Functional Fragment Refresh Event",
        "description": "Functional Spec uses this projection to connect file watcher events to the Load Migrated Fragment and Refresh Fragments On File Change workflows.",
        "fieldMappings": [
          {
            "title": "Event source to fragment scan",
            "description": "`fileName`, `sourceScope`, and `moduleKey` provide the input used by the fragment scan and migration flow.",
            "id": "",
            "versionDate": "",
            "stableId": "domain-models-projection-functional-fragment-refresh-event-field-mappings-event-source-to-fragment-scan",
            "sourceRefs": []
          },
          {
            "title": "Debounce to return point",
            "description": "`debounceMs` expresses the wait before the UI requests and receives the refreshed fragment list.",
            "id": "",
            "versionDate": "",
            "stableId": "domain-models-projection-functional-fragment-refresh-event-field-mappings-debounce-to-return-point",
            "sourceRefs": []
          }
        ],
        "constraints": [
          {
            "title": "Refresh only",
            "description": "This projection must not imply automatic fragment consumption; it only refreshes review state.",
            "id": "",
            "versionDate": "",
            "stableId": "domain-models-projection-functional-fragment-refresh-event-constraints-refresh-only",
            "sourceRefs": []
          }
        ],
        "versionDate": "2026-04-22",
        "sourceRefs": [
          "DOMAIN_MODELS_FRAGMENT_20260422_functional_workflow_models_001",
          "FUNCTIONAL_SPEC_FRAGMENT_20260414_fragment_migration_refresh_001",
          "functional-spec-logical-flows-load-migrated-fragment",
          "functional-spec-logical-flows-refresh-fragments-on-file-change"
        ],
        "excludedFields": [],
        "additionalFields": []
      }
    ],
    "openQuestions": [],
    "fragmentHistory": [
      {
        "id": "project:DOMAIN_MODELS_FRAGMENT_20260422_functional_workflow_models_001.md",
        "code": "DOMAIN_MODELS_FRAGMENT_20260422_functional_workflow_models_001",
        "title": "Functional Workflow Event Models",
        "status": "integrated",
        "sourceScope": "project",
        "integratedAt": "2026-04-22T22:34:27.869Z",
        "summary": "Adds a Fragment Refresh Event model and a Functional Spec projection tied to the current fragment migration and file-watcher workflows.",
        "revision": 1,
        "lineageKey": "DOMAIN_MODELS_FRAGMENT_20260422_functional_workflow_models",
        "supersedesCode": "",
        "supersedesRevision": null
      },
      {
        "id": "project:DOMAIN_MODELS_FRAGMENT_20260411_fragment_integration_request_001.md",
        "code": "DOMAIN_MODELS_FRAGMENT_20260411_fragment_integration_request_001",
        "title": "Fragment Integration Request",
        "status": "integrated",
        "sourceScope": "project",
        "integratedAt": "2026-04-11T19:56:37.314Z",
        "summary": "Adds a shared domain model for fragment-backed document updates so the Functional Spec can describe fragment consumption with stronger vocabulary.",
        "revision": 1,
        "lineageKey": "DOMAIN_MODELS_FRAGMENT_20260411_fragment_integration_request",
        "supersedesCode": "",
        "supersedesRevision": null
      }
    ]
  }
}
-->

## 1. Executive Summary

<!--
APM-ID: domain-models-overview-summary-executive-summary
APM-LAST-UPDATED: 2026-04-14
-->

Domain models for Angel's Project Manager are still being defined.

## 2. Domain Model Catalog

### 2.1 Fragment Integration Request

- Type: command
- Fields: 5
- Relationships: 1
- Summary: A proposed managed-document change packaged as a reviewable fragment.

### 2.2 Fragment Refresh Event

- Type: event
- Fields: 6
- Relationships: 1
- Summary: A watched fragment-file change that tells a module UI to refresh its fragment list.

## 3. Domain Models

<!--
APM-ID: domain-models-model-fragment-integration-request
APM-REFS: DOMAIN_MODELS_FRAGMENT_20260411_fragment_integration_request_001, DOC-TEST-001
APM-LAST-UPDATED: 2026-04-11
-->

### 3.1 Fragment Integration Request

- Model Type: command
- Summary: A proposed managed-document change packaged as a reviewable fragment.

A Fragment Integration Request is the conceptual object that carries a proposed update from an AI agent or user into a module document. It contains enough target information for the application to review, consume, archive, and trace the update without directly editing canonical markdown by hand.

#### 3.1.1 Fields

<!--
APM-ID: domain-models-field-fragment-integration-request-fragmentcode
-->

#### 3.1.1.1 Field: fragmentCode

- Display Name: Fragment Code
- Conceptual Type: identifier
- Required: Yes

Stable fragment code or file-derived identifier used for review and archive history.

<!--
APM-ID: domain-models-field-fragment-integration-request-targetdoctype
-->

#### 3.1.1.2 Field: targetDocType

- Display Name: Target Document Type
- Conceptual Type: identifier
- Required: Yes

Managed document type the fragment intends to update.

<!--
APM-ID: domain-models-field-fragment-integration-request-targetsection
-->

#### 3.1.1.3 Field: targetSection

- Display Name: Target Section
- Conceptual Type: identifier
- Required: No

Module-specific section key used by fragment operations.

<!--
APM-ID: domain-models-field-fragment-integration-request-operations
-->

#### 3.1.1.4 Field: operations

- Display Name: Operations
- Conceptual Type: collection
- Required: No

Structured add, update, remove, move, reorder, link, or unlink operations requested by the fragment.

<!--
APM-ID: domain-models-field-fragment-integration-request-reviewstatus
-->

#### 3.1.1.5 Field: reviewStatus

- Display Name: Review Status
- Conceptual Type: enum
- Required: Yes
- Allowed Values: draft, ready, integrated, archived, superseded

Current user-visible state of the fragment before and after consumption.

#### 3.1.2 Relationships

<!--
APM-ID: domain-models-relationship-fragment-integration-request-targets-managed-document
-->

#### 3.1.2.1 Relationship: Targets Managed Document

- Type: targets
- Target Model: Managed Document
- Target Model ID: domain-models-model-managed-document

Each fragment integration request targets one managed document, even if the work item that caused it affects several documents.

#### 3.1.3 Rules

<!--
APM-ID: domain-models-model-fragment-integration-request-rules-no-direct-canonical-write
-->

### 3.1.3.1 No Direct Canonical Write

Fragments propose changes that the application consumes into structured state before regenerating canonical markdown.

<!--
APM-ID: domain-models-model-fragment-integration-request-rules-preserve-integration-history
-->

### 3.1.3.2 Preserve Integration History

Consumed fragments remain traceable through fragment history even after the source file is removed.

#### 3.1.4 Examples

<!--
APM-ID: domain-models-model-fragment-integration-request-examples-functional-flow-fragment
-->

### 3.1.4.1 Functional Flow Fragment

A Functional Spec fragment can add a workflow and its visual node graph as one reviewable integration request.

<!--
APM-ID: domain-models-model-fragment-refresh-event
APM-REFS: DOMAIN_MODELS_FRAGMENT_20260422_functional_workflow_models_001, FUNCTIONAL_SPEC_FRAGMENT_20260414_fragment_migration_refresh_001, functional-spec-logical-flows-load-migrated-fragment, functional-spec-logical-flows-refresh-fragments-on-file-change
APM-LAST-UPDATED: 2026-04-22
-->

### 3.2 Fragment Refresh Event

- Model Type: event
- Summary: A watched fragment-file change that tells a module UI to refresh its fragment list.

A Fragment Refresh Event is the conceptual signal produced when a watched fragment markdown file is added, changed, or removed. The Functional Spec uses it to describe how file watcher activity causes a module to debounce, reload, migrate older payloads when needed, and return an updated fragment list.

#### 3.2.1 Fields

<!--
APM-ID: domain-models-field-fragment-refresh-event-eventtype
-->

#### 3.2.1.1 Field: eventType

- Display Name: Event Type
- Conceptual Type: enum
- Required: Yes
- Default Value: changed
- Allowed Values: added, changed, removed

The kind of file-system event observed for the fragment file.

<!--
APM-ID: domain-models-field-fragment-refresh-event-filename
-->

#### 3.2.1.2 Field: fileName

- Display Name: File Name
- Conceptual Type: text
- Required: Yes

The markdown fragment file name that changed.

<!--
APM-ID: domain-models-field-fragment-refresh-event-sourcescope
-->

#### 3.2.1.3 Field: sourceScope

- Display Name: Source Scope
- Conceptual Type: enum
- Required: Yes
- Allowed Values: project, shared, history

Where the fragment was discovered from the module perspective.

<!--
APM-ID: domain-models-field-fragment-refresh-event-modulekey
-->

#### 3.2.1.4 Field: moduleKey

- Display Name: Module Key
- Conceptual Type: identifier
- Required: Yes

The module whose fragment browser should refresh.

<!--
APM-ID: domain-models-field-fragment-refresh-event-watchedpath
-->

#### 3.2.1.5 Field: watchedPath

- Display Name: Watched Path
- Conceptual Type: text
- Required: Yes

The configured project or shared fragments path being watched.

<!--
APM-ID: domain-models-field-fragment-refresh-event-debouncems
-->

#### 3.2.1.6 Field: debounceMs

- Display Name: Debounce Milliseconds
- Conceptual Type: number
- Required: No
- Default Value: 250

The delay used to avoid refreshing repeatedly while related file events settle.

#### 3.2.2 Relationships

<!--
APM-ID: domain-models-relationship-fragment-refresh-event-refreshes-fragment-review-state
-->

#### 3.2.2.1 Relationship: Refreshes Fragment Review State

- Type: triggers
- Target Model: Fragment Integration Request
- Target Model ID: domain-models-model-fragment-integration-request

The event causes the active module fragment browser to reload pending and archived fragment review state.

#### 3.2.3 Rules

<!--
APM-ID: domain-models-model-fragment-refresh-event-rules-debounce-before-refresh
-->

### 3.2.3.1 Debounce before refresh

The UI should debounce file watcher events before requesting the refreshed fragment list.

<!--
APM-ID: domain-models-model-fragment-refresh-event-rules-do-not-consume-automatically
-->

### 3.2.3.2 Do not consume automatically

The event refreshes the visible fragment list only; it must not integrate or archive a fragment without explicit user action.

#### 3.2.4 Examples

<!--
APM-ID: domain-models-model-fragment-refresh-event-examples-domain-models-fragment-added
-->

### 3.2.4.1 Domain Models fragment added

A DOMAIN_MODELS_FRAGMENT file appears in the project fragments folder, causing the Domain Models fragment browser to show one new pending item.

## 4. Model Projections

<!--
APM-ID: domain-models-projection-functional-fragment-integration-request
APM-REFS: DOMAIN_MODELS_FRAGMENT_20260411_fragment_integration_request_001, DOC-TEST-001
APM-LAST-UPDATED: 2026-04-11
-->

### 4.1 Functional Fragment Integration Request

- Projection Type: functional
- Owning Module: functional_spec
- Base Model: Fragment Integration Request
- Base Model ID: domain-models-model-fragment-integration-request

Functional Spec uses this projection to describe how a fragment is discovered, reviewed, validated, consumed, archived, and reflected back to the user.

#### Field Mappings

<!--
APM-ID: domain-models-projection-functional-fragment-integration-request-field-mappings-fragmentcode-identifies-the-review-item
-->

### 4.1.1.1 fragmentCode identifies the review item

The UI and fragment history use fragmentCode as the readable identifier for the pending change.

<!--
APM-ID: domain-models-projection-functional-fragment-integration-request-field-mappings-operations-drive-consumption
-->

### 4.1.1.2 operations drive consumption

The consuming flow applies operations to structured document state before regenerating markdown.

#### Additional Fields

No additional fields defined yet.

#### Constraints

<!--
APM-ID: domain-models-projection-functional-fragment-integration-request-constraints-operations-need-stable-targets
-->

### 4.1.3.1 Operations need stable targets

Update, remove, move, reorder, link, and unlink operations should use stable target ids when modifying existing items.

<!--
APM-ID: domain-models-projection-functional-fragment-refresh-event
APM-REFS: DOMAIN_MODELS_FRAGMENT_20260422_functional_workflow_models_001, FUNCTIONAL_SPEC_FRAGMENT_20260414_fragment_migration_refresh_001, functional-spec-logical-flows-load-migrated-fragment, functional-spec-logical-flows-refresh-fragments-on-file-change
APM-LAST-UPDATED: 2026-04-22
-->

### 4.2 Functional Fragment Refresh Event

- Projection Type: functional
- Owning Module: functional_spec
- Base Model: Fragment Refresh Event
- Base Model ID: domain-models-model-fragment-refresh-event

Functional Spec uses this projection to connect file watcher events to the Load Migrated Fragment and Refresh Fragments On File Change workflows.

#### Field Mappings

<!--
APM-ID: domain-models-projection-functional-fragment-refresh-event-field-mappings-event-source-to-fragment-scan
-->

### 4.2.1.1 Event source to fragment scan

`fileName`, `sourceScope`, and `moduleKey` provide the input used by the fragment scan and migration flow.

<!--
APM-ID: domain-models-projection-functional-fragment-refresh-event-field-mappings-debounce-to-return-point
-->

### 4.2.1.2 Debounce to return point

`debounceMs` expresses the wait before the UI requests and receives the refreshed fragment list.

#### Additional Fields

No additional fields defined yet.

#### Constraints

<!--
APM-ID: domain-models-projection-functional-fragment-refresh-event-constraints-refresh-only
-->

### 4.2.3.1 Refresh only

This projection must not imply automatic fragment consumption; it only refreshes review state.

## 5. Open Questions

No open questions yet.
## 6. Applied Fragments

### DOMAIN_MODELS_FRAGMENT_20260422_functional_workflow_models_001: Functional Workflow Event Models

- Status: integrated
- Source: project
- Integrated: 2026-04-22T22:34:27.869Z

Adds a Fragment Refresh Event model and a Functional Spec projection tied to the current fragment migration and file-watcher workflows.

### DOMAIN_MODELS_FRAGMENT_20260411_fragment_integration_request_001: Fragment Integration Request

- Status: integrated
- Source: project
- Integrated: 2026-04-11T19:56:37.314Z

Adds a shared domain model for fragment-backed document updates so the Functional Spec can describe fragment consumption with stronger vocabulary.
