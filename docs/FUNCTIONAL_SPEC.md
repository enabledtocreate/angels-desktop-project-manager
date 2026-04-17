# FUNCTIONAL_SPEC: Angel's Project Manager

> Managed document. Must comply with template FUNCTIONAL_SPEC.template.md.

<!-- APM:DATA
{
  "docType": "functional_spec",
  "version": 1,
  "markdown": "",
  "editorState": {
    "overview": {
      "summary": "Functional spec for Angel's Project Manager is still being defined.",
      "versionDate": "2026-04-14T03:28:27.674Z",
      "stableId": "functional-spec-overview-summary-executive-summary",
      "sourceRefs": []
    },
    "functionalAreas": [
      {
        "id": "functional-area-fragment-integration",
        "stableId": "functional-spec-functional-areas-fragment-integration",
        "title": "Fragment Integration",
        "description": "Flows for discovering, reviewing, consuming, archiving, and reflecting fragment-backed document updates.",
        "versionDate": "2026-04-11",
        "sourceRefs": [
          "FUNCTIONAL_SPEC_FRAGMENT_20260411_consume_module_fragment_001",
          "DOC-TEST-001"
        ],
        "parentAreaId": "",
        "collapsed": false
      },
      {
        "id": "functional-area-template-governance",
        "stableId": "functional-spec-functional-areas-template-governance",
        "title": "Template Governance",
        "description": "Functional behavior for keeping managed document templates readable, versioned, copied into project workspaces, and aligned with generated documents.",
        "versionDate": "2026-04-14",
        "sourceRefs": [
          "FUNCTIONAL_SPEC_FRAGMENT_20260414_template_action_vocabulary_001",
          "TASK-TEMPLATE-VERSIONING-20260414"
        ],
        "parentAreaId": "",
        "collapsed": false
      }
    ],
    "logicalFlows": [
      {
        "id": "functional-flow-consume-module-fragment",
        "stableId": "functional-spec-logical-flows-consume-module-fragment",
        "title": "Consume Module Fragment",
        "description": "When a user integrates a module fragment, the application validates the fragment target, applies supported operations to structured document state, archives the fragment source, regenerates the managed document, and returns the updated fragment list.",
        "functionalAreaId": "functional-area-fragment-integration",
        "versionDate": "2026-04-11",
        "sourceRefs": [
          "FUNCTIONAL_SPEC_FRAGMENT_20260411_consume_module_fragment_001",
          "DOC-TEST-001"
        ],
        "isShared": false,
        "hiddenInDesigner": false
      },
      {
        "id": "functional-flow-load-migrated-fragment",
        "stableId": "functional-spec-logical-flows-load-migrated-fragment",
        "title": "Load Migrated Fragment",
        "description": "When a module loads fragments, the application scans candidate markdown files, parses managed metadata, migrates older payload versions, includes content-matched fragments even when filenames are older, and returns the refreshed fragment list.",
        "versionDate": "2026-04-14",
        "sourceRefs": [
          "FUNCTIONAL_SPEC_FRAGMENT_20260414_fragment_migration_refresh_001",
          "TASK-FRAGMENT-MIGRATION-20260414"
        ],
        "functionalAreaId": "",
        "isShared": false,
        "hiddenInDesigner": false
      },
      {
        "id": "functional-flow-refresh-fragments-on-file-change",
        "stableId": "functional-spec-logical-flows-refresh-fragments-on-file-change",
        "title": "Refresh Fragments On File Change",
        "description": "When a watched fragment markdown file is added, changed, or removed, the UI debounces the event and refreshes the active module fragment list.",
        "versionDate": "2026-04-14",
        "sourceRefs": [
          "FUNCTIONAL_SPEC_FRAGMENT_20260414_fragment_migration_refresh_001",
          "TASK-FRAGMENT-MIGRATION-20260414"
        ],
        "functionalAreaId": "",
        "isShared": false,
        "hiddenInDesigner": false
      },
      {
        "id": "functional-flow-sync-versioned-project-templates",
        "stableId": "functional-spec-logical-flows-sync-versioned-project-templates",
        "title": "Sync Versioned Project Templates",
        "description": "When a workspace document sync occurs, the application compares source template hashes against project-local template copies, replaces stale copies, records template metadata in the database, and returns the current document state.",
        "functionalAreaId": "functional-area-template-governance",
        "versionDate": "2026-04-14",
        "sourceRefs": [
          "FUNCTIONAL_SPEC_FRAGMENT_20260414_template_action_vocabulary_001",
          "TASK-TEMPLATE-VERSIONING-20260414"
        ],
        "isShared": false,
        "hiddenInDesigner": false
      }
    ],
    "flowEndpoints": [
      {
        "id": "derived-endpoint-functional-node-consume-fragment-return",
        "stableId": "functional-spec-flow-node-return-updated-review-state-endpoint",
        "sourceRefs": [],
        "title": "Consume Module Fragment: Return Updated Review State",
        "description": "The UI receives the regenerated document state and refreshed active or archived fragment list.",
        "versionDate": "2026-04-11"
      },
      {
        "id": "derived-endpoint-functional-node-template-sync-return",
        "stableId": "functional-spec-flow-node-return-synced-document-endpoint",
        "sourceRefs": [],
        "title": "Sync Versioned Project Templates: Return Synced Document",
        "description": "The UI receives the regenerated document and current template registry state.",
        "versionDate": "2026-04-14"
      },
      {
        "id": "functional-endpoint-consume-module-fragment-return-updated-review-state",
        "stableId": "functional-spec-flow-endpoints-consume-module-fragment-return-updated-review-state",
        "title": "Consume Module Fragment: Return Updated Review State",
        "description": "Return point used by the fragment browser after a fragment has been integrated or rejected for review.",
        "versionDate": "2026-04-11",
        "sourceRefs": [
          "FUNCTIONAL_SPEC_FRAGMENT_20260411_consume_module_fragment_001",
          "DOC-TEST-001"
        ]
      }
    ],
    "userActionsAndSystemResponses": [],
    "validationRules": [],
    "interfaceExpectations": [],
    "edgeCases": [],
    "openQuestions": [
      {
        "id": "functional-question-fragment-dry-run-preview",
        "stableId": "functional-spec-open-questions-fragment-dry-run-preview",
        "title": "Dry-run preview for fragment operations",
        "description": "Should the fragment browser support a dry-run preview that shows the exact document items that will change before integration?",
        "versionDate": "2026-04-11",
        "sourceRefs": [
          "FUNCTIONAL_SPEC_FRAGMENT_20260411_consume_module_fragment_001",
          "DOC-TEST-001"
        ]
      }
    ],
    "fragmentHistory": [
      {
        "id": "project:FUNCTIONAL_SPEC_FRAGMENT_20260414_template_action_vocabulary_001.md",
        "code": "FUNCTIONAL_SPEC_FRAGMENT_20260414_template_action_vocabulary_001",
        "title": "Versioned Template Action Vocabulary",
        "status": "integrated",
        "sourceScope": "project",
        "integratedAt": "2026-04-14T03:26:20.971Z",
        "summary": "Adds functional behavior for the versioned template synchronization path and for rendering the Functional Spec action vocabulary into generated documents.",
        "revision": 1,
        "lineageKey": "FUNCTIONAL_SPEC_FRAGMENT_20260414_template_action_vocabulary",
        "supersedesCode": "",
        "supersedesRevision": null
      },
      {
        "id": "project:FUNCTIONAL_SPEC_FRAGMENT_20260414_fragment_migration_refresh_001.md",
        "code": "FUNCTIONAL_SPEC_FRAGMENT_20260414_fragment_migration_refresh_001",
        "title": "Fragment Migration And Refresh",
        "status": "integrated",
        "sourceScope": "project",
        "integratedAt": "2026-04-14T03:26:18.948Z",
        "summary": "Adds functional behavior for older fragment migration and file-watcher-driven fragment refresh.",
        "revision": 1,
        "lineageKey": "FUNCTIONAL_SPEC_FRAGMENT_20260414_fragment_migration_refresh",
        "supersedesCode": "",
        "supersedesRevision": null
      },
      {
        "id": "project:FUNCTIONAL_SPEC_FRAGMENT_20260411_consume_module_fragment_001.md",
        "code": "FUNCTIONAL_SPEC_FRAGMENT_20260411_consume_module_fragment_001",
        "title": "Consume Module Fragment",
        "status": "integrated",
        "sourceScope": "project",
        "integratedAt": "2026-04-11T19:56:12.028Z",
        "summary": "Adds a visual workflow for consuming a module fragment into structured managed document state.",
        "revision": 1,
        "lineageKey": "FUNCTIONAL_SPEC_FRAGMENT_20260411_consume_module_fragment",
        "supersedesCode": "",
        "supersedesRevision": null
      }
    ],
    "flowVisuals": [
      {
        "flowId": "functional-flow-consume-module-fragment",
        "flowStableId": "functional-spec-logical-flows-consume-module-fragment",
        "versionDate": "",
        "nodes": [
          {
            "id": "functional-node-consume-fragment-start",
            "stableId": "functional-spec-flow-node-integration-requested",
            "sourceRefs": [],
            "type": "start",
            "label": "Integration Requested",
            "description": "The user chooses a pending module fragment and requests integration.",
            "command": "Start",
            "versionDate": "2026-04-11",
            "position": {
              "x": -542.0143700485041,
              "y": 21.974008908778075
            }
          },
          {
            "id": "functional-node-consume-fragment-input",
            "stableId": "functional-spec-flow-node-receive-fragment-selection",
            "sourceRefs": [],
            "type": "input",
            "label": "Receive Fragment Selection",
            "description": "The system receives the fragment file name, source scope, module key, and current managed document state.",
            "command": "Receive",
            "versionDate": "2026-04-11",
            "position": {
              "x": -81.947670278835,
              "y": 22.87706401907778
            }
          },
          {
            "id": "functional-node-consume-fragment-model",
            "stableId": "functional-spec-flow-node-use-fragment-integration-request",
            "sourceRefs": [],
            "type": "model_reference",
            "label": "Use Fragment Integration Request",
            "description": "The flow uses the Fragment Integration Request model as the conceptual payload being consumed.",
            "command": "Reference",
            "versionDate": "2026-04-11",
            "position": {
              "x": 585.599563339934,
              "y": -291.4688700715885
            }
          },
          {
            "id": "functional-node-consume-fragment-validate",
            "stableId": "functional-spec-flow-node-validate-fragment-target",
            "sourceRefs": [],
            "type": "validation",
            "label": "Validate Fragment Target",
            "description": "The system confirms the fragment exists, belongs to the selected module, and contains supported operations or parseable section content.",
            "command": "Validate",
            "versionDate": "2026-04-11",
            "position": {
              "x": 534.328951467706,
              "y": 243.24382926120035
            }
          },
          {
            "id": "functional-node-consume-fragment-decision",
            "stableId": "functional-spec-flow-node-can-fragment-be-applied",
            "sourceRefs": [],
            "type": "decision",
            "label": "Can Fragment Be Applied?",
            "description": "The flow branches based on whether the fragment can safely update structured document state.",
            "command": "Decide",
            "versionDate": "2026-04-11",
            "position": {
              "x": 940.213636711996,
              "y": -6.616708882160701
            }
          },
          {
            "id": "functional-node-consume-fragment-apply",
            "stableId": "functional-spec-flow-node-apply-fragment-operations",
            "sourceRefs": [],
            "type": "system_action",
            "label": "Apply Fragment Operations",
            "description": "The system applies add, update, remove, move, reorder, link, or unlink operations to the target document editor state.",
            "command": "Apply",
            "versionDate": "2026-04-11",
            "position": {
              "x": 1234.6425261950258,
              "y": -346.3059219710284
            }
          },
          {
            "id": "functional-node-consume-fragment-archive",
            "stableId": "functional-spec-flow-node-archive-fragment-history",
            "sourceRefs": [],
            "type": "system_action",
            "label": "Archive Fragment History",
            "description": "The system records integration history and removes or marks the source fragment so it no longer appears as pending.",
            "command": "Archive",
            "versionDate": "2026-04-11",
            "position": {
              "x": 1400,
              "y": -120
            }
          },
          {
            "id": "functional-node-consume-fragment-return",
            "stableId": "functional-spec-flow-node-return-updated-review-state",
            "sourceRefs": [],
            "type": "return",
            "label": "Return Updated Review State",
            "description": "The UI receives the regenerated document state and refreshed active or archived fragment list.",
            "command": "Return",
            "versionDate": "2026-04-11",
            "position": {
              "x": 1801.152043029795,
              "y": 47.195451324774865
            }
          },
          {
            "id": "functional-node-consume-fragment-error",
            "stableId": "functional-spec-flow-node-show-review-error",
            "sourceRefs": [],
            "type": "error_path",
            "label": "Show Review Error",
            "description": "The system shows a readable review error when the fragment target or operations cannot be applied safely.",
            "command": "Show",
            "versionDate": "2026-04-11",
            "position": {
              "x": 1289.8839111328125,
              "y": 188.53826904296875
            }
          }
        ],
        "edges": [
          {
            "id": "functional-edge-consume-fragment-start-input",
            "stableId": "functional-spec-flow-edge-begin",
            "sourceRefs": [],
            "source": "functional-node-consume-fragment-start",
            "target": "functional-node-consume-fragment-input",
            "sourceHandle": "output",
            "targetHandle": "input",
            "type": "continue",
            "label": "begin",
            "conditionText": "",
            "parsedExpressionHint": null,
            "draft": false,
            "hidden": false,
            "versionDate": "2026-04-11"
          },
          {
            "id": "functional-edge-consume-fragment-input-model",
            "stableId": "functional-spec-flow-edge-fragment-payload",
            "sourceRefs": [],
            "source": "functional-node-consume-fragment-input",
            "target": "functional-node-consume-fragment-model",
            "sourceHandle": "output",
            "targetHandle": "input",
            "type": "consumes",
            "label": "fragment payload",
            "conditionText": "",
            "parsedExpressionHint": null,
            "draft": false,
            "hidden": false,
            "versionDate": "2026-04-11"
          },
          {
            "id": "functional-edge-consume-fragment-input-validate",
            "stableId": "functional-spec-flow-edge-selection-received",
            "sourceRefs": [],
            "source": "functional-node-consume-fragment-input",
            "target": "functional-node-consume-fragment-validate",
            "sourceHandle": "output",
            "targetHandle": "input",
            "type": "continue",
            "label": "selection received",
            "conditionText": "",
            "parsedExpressionHint": null,
            "draft": false,
            "hidden": false,
            "versionDate": "2026-04-11"
          },
          {
            "id": "functional-edge-consume-fragment-validate-decision",
            "stableId": "functional-spec-flow-edge-validated",
            "sourceRefs": [],
            "source": "functional-node-consume-fragment-validate",
            "target": "functional-node-consume-fragment-decision",
            "sourceHandle": "output",
            "targetHandle": "input",
            "type": "continue",
            "label": "validated",
            "conditionText": "",
            "parsedExpressionHint": null,
            "draft": false,
            "hidden": false,
            "versionDate": "2026-04-11"
          },
          {
            "id": "functional-edge-consume-fragment-decision-apply",
            "stableId": "functional-spec-flow-edge-safe-to-apply",
            "sourceRefs": [],
            "source": "functional-node-consume-fragment-decision",
            "target": "functional-node-consume-fragment-apply",
            "sourceHandle": "output",
            "targetHandle": "input",
            "type": "if_then",
            "label": "safe to apply",
            "conditionText": "If the fragment exists, targets the selected module, and contains supported operations or parseable section content.",
            "parsedExpressionHint": null,
            "draft": false,
            "hidden": false,
            "versionDate": "2026-04-11"
          },
          {
            "id": "functional-edge-consume-fragment-apply-archive",
            "stableId": "functional-spec-flow-edge-applied",
            "sourceRefs": [],
            "source": "functional-node-consume-fragment-apply",
            "target": "functional-node-consume-fragment-archive",
            "sourceHandle": "output",
            "targetHandle": "input",
            "type": "on_success",
            "label": "applied",
            "conditionText": "",
            "parsedExpressionHint": null,
            "draft": false,
            "hidden": false,
            "versionDate": "2026-04-11"
          },
          {
            "id": "functional-edge-consume-fragment-archive-return",
            "stableId": "functional-spec-flow-edge-updated-lists",
            "sourceRefs": [],
            "source": "functional-node-consume-fragment-archive",
            "target": "functional-node-consume-fragment-return",
            "sourceHandle": "output",
            "targetHandle": "input",
            "type": "returns_to",
            "label": "updated lists",
            "conditionText": "",
            "parsedExpressionHint": null,
            "draft": false,
            "hidden": false,
            "versionDate": "2026-04-11"
          },
          {
            "id": "functional-edge-consume-fragment-decision-error",
            "stableId": "functional-spec-flow-edge-needs-review",
            "sourceRefs": [],
            "source": "functional-node-consume-fragment-decision",
            "target": "functional-node-consume-fragment-error",
            "sourceHandle": "output",
            "targetHandle": "input",
            "type": "else",
            "label": "needs review",
            "conditionText": "If the fragment cannot be matched or applied safely.",
            "parsedExpressionHint": null,
            "draft": false,
            "hidden": false,
            "versionDate": "2026-04-11"
          }
        ]
      },
      {
        "flowId": "functional-flow-load-migrated-fragment",
        "flowStableId": "functional-spec-logical-flows-load-migrated-fragment",
        "versionDate": "",
        "nodes": [],
        "edges": []
      },
      {
        "flowId": "functional-flow-refresh-fragments-on-file-change",
        "flowStableId": "functional-spec-logical-flows-refresh-fragments-on-file-change",
        "versionDate": "",
        "nodes": [],
        "edges": []
      },
      {
        "flowId": "functional-flow-sync-versioned-project-templates",
        "flowStableId": "functional-spec-logical-flows-sync-versioned-project-templates",
        "versionDate": "",
        "nodes": [
          {
            "id": "functional-node-template-sync-start",
            "stableId": "functional-spec-flow-node-workspace-sync-requested",
            "sourceRefs": [],
            "type": "start",
            "label": "Workspace Sync Requested",
            "description": "A managed document or module workspace is opened, refreshed, or saved.",
            "command": "Start",
            "versionDate": "2026-04-14",
            "position": {
              "x": 0,
              "y": 0
            }
          },
          {
            "id": "functional-node-template-sync-decision",
            "stableId": "functional-spec-flow-node-template-copy-current",
            "sourceRefs": [],
            "type": "decision",
            "label": "Template Copy Current?",
            "description": "The flow branches based on whether the local template hash matches the application source template hash.",
            "command": "Decide",
            "versionDate": "2026-04-14",
            "position": {
              "x": 320,
              "y": 0
            }
          },
          {
            "id": "functional-node-template-sync-replace",
            "stableId": "functional-spec-flow-node-replace-stale-template",
            "sourceRefs": [],
            "type": "system_action",
            "label": "Replace Stale Template",
            "description": "The system overwrites a missing or stale project-local template with the application source template.",
            "command": "Replace",
            "versionDate": "2026-04-14",
            "position": {
              "x": 640,
              "y": -120
            }
          },
          {
            "id": "functional-node-template-sync-record",
            "stableId": "functional-spec-flow-node-record-template-registry",
            "sourceRefs": [],
            "type": "system_action",
            "label": "Record Template Registry",
            "description": "The system saves template name, kind, version, last-updated date, source hash, target hash, path, and sync timestamp.",
            "command": "Record",
            "versionDate": "2026-04-14",
            "position": {
              "x": 960,
              "y": -60
            }
          },
          {
            "id": "functional-node-template-sync-render-vocabulary",
            "stableId": "functional-spec-flow-node-render-action-vocabulary",
            "sourceRefs": [],
            "type": "system_action",
            "label": "Render Action Vocabulary",
            "description": "For Functional Spec documents, the system renders standard node, connection, canvas, and smart-text vocabulary into the generated document.",
            "command": "Render",
            "versionDate": "2026-04-14",
            "position": {
              "x": 1280,
              "y": -60
            }
          },
          {
            "id": "functional-node-template-sync-return",
            "stableId": "functional-spec-flow-node-return-synced-document",
            "sourceRefs": [],
            "type": "return",
            "label": "Return Synced Document",
            "description": "The UI receives the regenerated document and current template registry state.",
            "command": "Return",
            "versionDate": "2026-04-14",
            "position": {
              "x": 1600,
              "y": -60
            }
          }
        ],
        "edges": [
          {
            "id": "functional-edge-template-sync-start-decision",
            "stableId": "functional-spec-flow-edge-check-templates",
            "sourceRefs": [],
            "source": "functional-node-template-sync-start",
            "target": "functional-node-template-sync-decision",
            "sourceHandle": "output",
            "targetHandle": "input",
            "type": "continue",
            "label": "check templates",
            "conditionText": "",
            "parsedExpressionHint": null,
            "draft": false,
            "hidden": false,
            "versionDate": "2026-04-14"
          },
          {
            "id": "functional-edge-template-sync-decision-replace",
            "stableId": "functional-spec-flow-edge-missing-or-stale",
            "sourceRefs": [],
            "source": "functional-node-template-sync-decision",
            "target": "functional-node-template-sync-replace",
            "sourceHandle": "output",
            "targetHandle": "input",
            "type": "else",
            "label": "missing or stale",
            "conditionText": "If the target template is missing or its content hash differs from the application source template.",
            "parsedExpressionHint": null,
            "draft": false,
            "hidden": false,
            "versionDate": "2026-04-14"
          },
          {
            "id": "functional-edge-template-sync-replace-record",
            "stableId": "functional-spec-flow-edge-copy-updated",
            "sourceRefs": [],
            "source": "functional-node-template-sync-replace",
            "target": "functional-node-template-sync-record",
            "sourceHandle": "output",
            "targetHandle": "input",
            "type": "on_success",
            "label": "copy updated",
            "conditionText": "",
            "parsedExpressionHint": null,
            "draft": false,
            "hidden": false,
            "versionDate": "2026-04-14"
          },
          {
            "id": "functional-edge-template-sync-decision-record",
            "stableId": "functional-spec-flow-edge-already-current",
            "sourceRefs": [],
            "source": "functional-node-template-sync-decision",
            "target": "functional-node-template-sync-record",
            "sourceHandle": "output",
            "targetHandle": "input",
            "type": "if_then",
            "label": "already current",
            "conditionText": "If the project-local template already matches the source hash.",
            "parsedExpressionHint": null,
            "draft": false,
            "hidden": false,
            "versionDate": "2026-04-14"
          },
          {
            "id": "functional-edge-template-sync-record-render",
            "stableId": "functional-spec-flow-edge-registry-saved",
            "sourceRefs": [],
            "source": "functional-node-template-sync-record",
            "target": "functional-node-template-sync-render-vocabulary",
            "sourceHandle": "output",
            "targetHandle": "input",
            "type": "continue",
            "label": "registry saved",
            "conditionText": "",
            "parsedExpressionHint": null,
            "draft": false,
            "hidden": false,
            "versionDate": "2026-04-14"
          },
          {
            "id": "functional-edge-template-sync-render-return",
            "stableId": "functional-spec-flow-edge-document-ready",
            "sourceRefs": [],
            "source": "functional-node-template-sync-render-vocabulary",
            "target": "functional-node-template-sync-return",
            "sourceHandle": "output",
            "targetHandle": "input",
            "type": "returns_to",
            "label": "document ready",
            "conditionText": "",
            "parsedExpressionHint": null,
            "draft": false,
            "hidden": false,
            "versionDate": "2026-04-14"
          }
        ]
      }
    ]
  }
}
-->

## 1. Executive Summary

<!--
APM-ID: functional-spec-overview-summary-executive-summary
APM-LAST-UPDATED: 2026-04-14
-->

Functional spec for Angel's Project Manager is still being defined.

### 1.1 Functional Flowchart Action Vocabulary

These are the standard Functional Spec actions available to the visual editor, fragments, and AI agents.

#### 1.1.1 Node Types

- Start: Begins a logical workflow.
- User Action: User behavior, command, selection, input, or gesture.
- System Action: System behavior in response to a trigger or condition.
- Decision: Conditional branch such as if, else, switch, yes/no, valid/invalid, or available/unavailable.
- Validation: Rule that checks input, state, permissions, data shape, or readiness.
- Loop: Repeated behavior until a stop condition is met.
- Input: Data, events, commands, files, selections, or external signals entering the flow.
- Output: Data, messages, files, screen changes, events, or results produced by the flow.
- Endpoint: Attachable control point that other modules may reference as an input, output, or integration point.
- Return: Where the flow returns control, state, data, or user focus.
- Error Path: Failure handling, recovery, fallback behavior, or user-visible error messaging.
- Log / Audit: Logging, audit trail, diagnostics, telemetry, or error reporting behavior.
- External Interaction: Interaction with another system, service, API, file system, database, device, or module.
- Formula: Calculation, derivation, comparison, transformation, or logical expression.
- Model Reference: Relationship to a shared domain model, schema model, external payload, or data concept.
- Open Question: Unresolved design question attached to a flow, node, edge, endpoint, Functional Area, or document scope.

#### 1.1.2 Connection Types

- Continue: Moves from one action to the next without a special condition.
- If / Then: Continues only when the stated condition is true or satisfied.
- Else: Continues when the prior condition is false or not satisfied.
- Loop Until: Repeats until the stated condition is met.
- On Success: Continues after the previous action succeeds.
- On Failure: Continues after the previous action fails or cannot complete.
- Returns To: Connects a flow back to a caller, return point, parent flow, or previous user context.
- Emits: Source produces an event, message, file, data object, signal, or output.
- Consumes: Target reads, receives, or depends on an event, message, file, data object, signal, or input.

#### 1.1.3 Canvas Actions

- Create Node: Add a typed node to a workflow.
- Move Node: Reposition a node without changing its meaning or id.
- Resize Node: Change visual size without changing meaning or id.
- Delete Node: Remove the node while preserving affected connections as unattached draft edges when possible.
- Connect Nodes: Create a typed connection between source and target handles.
- Create Draft Edge: Create an unattached connection when the target is not known yet.
- Remove Draft Edge: Delete an unattached connection.
- Clean Layout: Reposition visible workflow nodes to reduce overlap while preserving ids and relationships.
- Hide Flow: Exclude a flow from the current visual view without deleting it from the document.
- Group Flows: Organize flows into a Functional Area or reusable shared flow group.
- Attach Comment: Attach an open question or note to a workflow, group, node, edge, endpoint, or document scope.
- Reference Model: Link a node, edge, formula, or flow to a shared domain model by stable id.
- Reference Module Item: Link a control point or workflow element to another module item by stable id.

## 2. Functional Areas

<!--
APM-ID: functional-spec-functional-areas-fragment-integration
APM-REFS: FUNCTIONAL_SPEC_FRAGMENT_20260411_consume_module_fragment_001, DOC-TEST-001
APM-LAST-UPDATED: 2026-04-11
-->

### 2.1 Fragment Integration

Flows for discovering, reviewing, consuming, archiving, and reflecting fragment-backed document updates.

- Version Date: 2026-04-11

<!--
APM-ID: functional-spec-functional-areas-template-governance
APM-REFS: FUNCTIONAL_SPEC_FRAGMENT_20260414_template_action_vocabulary_001, TASK-TEMPLATE-VERSIONING-20260414
APM-LAST-UPDATED: 2026-04-14
-->

### 2.2 Template Governance

Functional behavior for keeping managed document templates readable, versioned, copied into project workspaces, and aligned with generated documents.

- Version Date: 2026-04-14

## 3. Logical Workflows

<!--
APM-ID: functional-spec-logical-flows-consume-module-fragment
APM-REFS: FUNCTIONAL_SPEC_FRAGMENT_20260411_consume_module_fragment_001, DOC-TEST-001
APM-LAST-UPDATED: 2026-04-11
-->

### 3.1 Consume Module Fragment

When a user integrates a module fragment, the application validates the fragment target, applies supported operations to structured document state, archives the fragment source, regenerates the managed document, and returns the updated fragment list.

- Version Date: 2026-04-11

<!--
APM-ID: functional-spec-logical-flows-load-migrated-fragment
APM-REFS: FUNCTIONAL_SPEC_FRAGMENT_20260414_fragment_migration_refresh_001, TASK-FRAGMENT-MIGRATION-20260414
APM-LAST-UPDATED: 2026-04-14
-->

### 3.2 Load Migrated Fragment

When a module loads fragments, the application scans candidate markdown files, parses managed metadata, migrates older payload versions, includes content-matched fragments even when filenames are older, and returns the refreshed fragment list.

- Version Date: 2026-04-14

<!--
APM-ID: functional-spec-logical-flows-refresh-fragments-on-file-change
APM-REFS: FUNCTIONAL_SPEC_FRAGMENT_20260414_fragment_migration_refresh_001, TASK-FRAGMENT-MIGRATION-20260414
APM-LAST-UPDATED: 2026-04-14
-->

### 3.3 Refresh Fragments On File Change

When a watched fragment markdown file is added, changed, or removed, the UI debounces the event and refreshes the active module fragment list.

- Version Date: 2026-04-14

<!--
APM-ID: functional-spec-logical-flows-sync-versioned-project-templates
APM-REFS: FUNCTIONAL_SPEC_FRAGMENT_20260414_template_action_vocabulary_001, TASK-TEMPLATE-VERSIONING-20260414
APM-LAST-UPDATED: 2026-04-14
-->

### 3.4 Sync Versioned Project Templates

When a workspace document sync occurs, the application compares source template hashes against project-local template copies, replaces stale copies, records template metadata in the database, and returns the current document state.

- Version Date: 2026-04-14

## 4. Flow Nodes and Connections

### 4.1 Consume Module Fragment

#### Nodes

<!--
APM-ID: functional-spec-flow-node-integration-requested
APM-LAST-UPDATED: 2026-04-11
-->

##### 4.1.1.1 Integration Requested

- Type: start
- Command: Start

The user chooses a pending module fragment and requests integration.

<!--
APM-ID: functional-spec-flow-node-receive-fragment-selection
APM-LAST-UPDATED: 2026-04-11
-->

##### 4.1.1.2 Receive Fragment Selection

- Type: input
- Command: Receive

The system receives the fragment file name, source scope, module key, and current managed document state.

<!--
APM-ID: functional-spec-flow-node-use-fragment-integration-request
APM-LAST-UPDATED: 2026-04-11
-->

##### 4.1.1.3 Use Fragment Integration Request

- Type: model_reference
- Command: Reference

The flow uses the Fragment Integration Request model as the conceptual payload being consumed.

<!--
APM-ID: functional-spec-flow-node-validate-fragment-target
APM-LAST-UPDATED: 2026-04-11
-->

##### 4.1.1.4 Validate Fragment Target

- Type: validation
- Command: Validate

The system confirms the fragment exists, belongs to the selected module, and contains supported operations or parseable section content.

<!--
APM-ID: functional-spec-flow-node-can-fragment-be-applied
APM-LAST-UPDATED: 2026-04-11
-->

##### 4.1.1.5 Can Fragment Be Applied?

- Type: decision
- Command: Decide

The flow branches based on whether the fragment can safely update structured document state.

<!--
APM-ID: functional-spec-flow-node-apply-fragment-operations
APM-LAST-UPDATED: 2026-04-11
-->

##### 4.1.1.6 Apply Fragment Operations

- Type: system_action
- Command: Apply

The system applies add, update, remove, move, reorder, link, or unlink operations to the target document editor state.

<!--
APM-ID: functional-spec-flow-node-archive-fragment-history
APM-LAST-UPDATED: 2026-04-11
-->

##### 4.1.1.7 Archive Fragment History

- Type: system_action
- Command: Archive

The system records integration history and removes or marks the source fragment so it no longer appears as pending.

<!--
APM-ID: functional-spec-flow-node-return-updated-review-state
APM-LAST-UPDATED: 2026-04-11
-->

##### 4.1.1.8 Return Updated Review State

- Type: return
- Command: Return

The UI receives the regenerated document state and refreshed active or archived fragment list.

<!--
APM-ID: functional-spec-flow-node-show-review-error
APM-LAST-UPDATED: 2026-04-11
-->

##### 4.1.1.9 Show Review Error

- Type: error_path
- Command: Show

The system shows a readable review error when the fragment target or operations cannot be applied safely.

#### Connections

<!--
APM-ID: functional-spec-flow-edge-begin
APM-LAST-UPDATED: 2026-04-11
-->

##### 4.1.2.1 begin

- Type: continue
- Source: Integration Requested
- Target: Receive Fragment Selection

<!--
APM-ID: functional-spec-flow-edge-fragment-payload
APM-LAST-UPDATED: 2026-04-11
-->

##### 4.1.2.2 fragment payload

- Type: consumes
- Source: Receive Fragment Selection
- Target: Use Fragment Integration Request

<!--
APM-ID: functional-spec-flow-edge-selection-received
APM-LAST-UPDATED: 2026-04-11
-->

##### 4.1.2.3 selection received

- Type: continue
- Source: Receive Fragment Selection
- Target: Validate Fragment Target

<!--
APM-ID: functional-spec-flow-edge-validated
APM-LAST-UPDATED: 2026-04-11
-->

##### 4.1.2.4 validated

- Type: continue
- Source: Validate Fragment Target
- Target: Can Fragment Be Applied?

<!--
APM-ID: functional-spec-flow-edge-safe-to-apply
APM-LAST-UPDATED: 2026-04-11
-->

##### 4.1.2.5 safe to apply

- Type: if_then
- Source: Can Fragment Be Applied?
- Target: Apply Fragment Operations
- Condition: If the fragment exists, targets the selected module, and contains supported operations or parseable section content.

<!--
APM-ID: functional-spec-flow-edge-applied
APM-LAST-UPDATED: 2026-04-11
-->

##### 4.1.2.6 applied

- Type: on_success
- Source: Apply Fragment Operations
- Target: Archive Fragment History

<!--
APM-ID: functional-spec-flow-edge-updated-lists
APM-LAST-UPDATED: 2026-04-11
-->

##### 4.1.2.7 updated lists

- Type: returns_to
- Source: Archive Fragment History
- Target: Return Updated Review State

<!--
APM-ID: functional-spec-flow-edge-needs-review
APM-LAST-UPDATED: 2026-04-11
-->

##### 4.1.2.8 needs review

- Type: else
- Source: Can Fragment Be Applied?
- Target: Show Review Error
- Condition: If the fragment cannot be matched or applied safely.

### 4.2 Load Migrated Fragment

#### Nodes

No nodes defined yet.

#### Connections

No connections defined yet.

### 4.3 Refresh Fragments On File Change

#### Nodes

No nodes defined yet.

#### Connections

No connections defined yet.

### 4.4 Sync Versioned Project Templates

#### Nodes

<!--
APM-ID: functional-spec-flow-node-workspace-sync-requested
APM-LAST-UPDATED: 2026-04-14
-->

##### 4.4.1.1 Workspace Sync Requested

- Type: start
- Command: Start

A managed document or module workspace is opened, refreshed, or saved.

<!--
APM-ID: functional-spec-flow-node-template-copy-current
APM-LAST-UPDATED: 2026-04-14
-->

##### 4.4.1.2 Template Copy Current?

- Type: decision
- Command: Decide

The flow branches based on whether the local template hash matches the application source template hash.

<!--
APM-ID: functional-spec-flow-node-replace-stale-template
APM-LAST-UPDATED: 2026-04-14
-->

##### 4.4.1.3 Replace Stale Template

- Type: system_action
- Command: Replace

The system overwrites a missing or stale project-local template with the application source template.

<!--
APM-ID: functional-spec-flow-node-record-template-registry
APM-LAST-UPDATED: 2026-04-14
-->

##### 4.4.1.4 Record Template Registry

- Type: system_action
- Command: Record

The system saves template name, kind, version, last-updated date, source hash, target hash, path, and sync timestamp.

<!--
APM-ID: functional-spec-flow-node-render-action-vocabulary
APM-LAST-UPDATED: 2026-04-14
-->

##### 4.4.1.5 Render Action Vocabulary

- Type: system_action
- Command: Render

For Functional Spec documents, the system renders standard node, connection, canvas, and smart-text vocabulary into the generated document.

<!--
APM-ID: functional-spec-flow-node-return-synced-document
APM-LAST-UPDATED: 2026-04-14
-->

##### 4.4.1.6 Return Synced Document

- Type: return
- Command: Return

The UI receives the regenerated document and current template registry state.

#### Connections

<!--
APM-ID: functional-spec-flow-edge-check-templates
APM-LAST-UPDATED: 2026-04-14
-->

##### 4.4.2.1 check templates

- Type: continue
- Source: Workspace Sync Requested
- Target: Template Copy Current?

<!--
APM-ID: functional-spec-flow-edge-missing-or-stale
APM-LAST-UPDATED: 2026-04-14
-->

##### 4.4.2.2 missing or stale

- Type: else
- Source: Template Copy Current?
- Target: Replace Stale Template
- Condition: If the target template is missing or its content hash differs from the application source template.

<!--
APM-ID: functional-spec-flow-edge-copy-updated
APM-LAST-UPDATED: 2026-04-14
-->

##### 4.4.2.3 copy updated

- Type: on_success
- Source: Replace Stale Template
- Target: Record Template Registry

<!--
APM-ID: functional-spec-flow-edge-already-current
APM-LAST-UPDATED: 2026-04-14
-->

##### 4.4.2.4 already current

- Type: if_then
- Source: Template Copy Current?
- Target: Record Template Registry
- Condition: If the project-local template already matches the source hash.

<!--
APM-ID: functional-spec-flow-edge-registry-saved
APM-LAST-UPDATED: 2026-04-14
-->

##### 4.4.2.5 registry saved

- Type: continue
- Source: Record Template Registry
- Target: Render Action Vocabulary

<!--
APM-ID: functional-spec-flow-edge-document-ready
APM-LAST-UPDATED: 2026-04-14
-->

##### 4.4.2.6 document ready

- Type: returns_to
- Source: Render Action Vocabulary
- Target: Return Synced Document

## 5. Flow Endpoints and Return Points

<!--
APM-ID: functional-spec-flow-node-return-updated-review-state-endpoint
APM-LAST-UPDATED: 2026-04-11
-->

### 5.1 Consume Module Fragment: Return Updated Review State

The UI receives the regenerated document state and refreshed active or archived fragment list.

- Version Date: 2026-04-11

<!--
APM-ID: functional-spec-flow-node-return-synced-document-endpoint
APM-LAST-UPDATED: 2026-04-14
-->

### 5.2 Sync Versioned Project Templates: Return Synced Document

The UI receives the regenerated document and current template registry state.

- Version Date: 2026-04-14

<!--
APM-ID: functional-spec-flow-endpoints-consume-module-fragment-return-updated-review-state
APM-REFS: FUNCTIONAL_SPEC_FRAGMENT_20260411_consume_module_fragment_001, DOC-TEST-001
APM-LAST-UPDATED: 2026-04-11
-->

### 5.3 Consume Module Fragment: Return Updated Review State

Return point used by the fragment browser after a fragment has been integrated or rejected for review.

- Version Date: 2026-04-11

## 6. User Actions and System Responses

No standalone user action and system response notes yet.
## 7. Validation Rules

No standalone validation rules yet.
## 8. Interface Expectations

No standalone interface expectations yet.
## 9. Edge Cases

No standalone edge cases yet.
## 10. Open Questions

<!--
APM-ID: functional-spec-open-questions-fragment-dry-run-preview
APM-REFS: FUNCTIONAL_SPEC_FRAGMENT_20260411_consume_module_fragment_001, DOC-TEST-001
APM-LAST-UPDATED: 2026-04-11
-->

### 10.1 Dry-run preview for fragment operations

Should the fragment browser support a dry-run preview that shows the exact document items that will change before integration?

- Version Date: 2026-04-11

## 11. Applied Fragments

### FUNCTIONAL_SPEC_FRAGMENT_20260414_template_action_vocabulary_001: Versioned Template Action Vocabulary

- Status: integrated
- Source: project
- Integrated: 2026-04-14T03:26:20.971Z

Adds functional behavior for the versioned template synchronization path and for rendering the Functional Spec action vocabulary into generated documents.

### FUNCTIONAL_SPEC_FRAGMENT_20260414_fragment_migration_refresh_001: Fragment Migration And Refresh

- Status: integrated
- Source: project
- Integrated: 2026-04-14T03:26:18.948Z

Adds functional behavior for older fragment migration and file-watcher-driven fragment refresh.

### FUNCTIONAL_SPEC_FRAGMENT_20260411_consume_module_fragment_001: Consume Module Fragment

- Status: integrated
- Source: project
- Integrated: 2026-04-11T19:56:12.028Z

Adds a visual workflow for consuming a module fragment into structured managed document state.
