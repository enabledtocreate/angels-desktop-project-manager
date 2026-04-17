# TECHNICAL_DESIGN: Angel's Project Manager

> Managed document. Must comply with template TECHNICAL_DESIGN.template.md.

<!-- APM:DATA
{
  "docType": "technical_design",
  "version": 1,
  "markdown": "",
  "editorState": {
    "overview": {
      "summary": "Technical Design for Angel's Project Manager is still being defined.",
      "versionDate": "2026-04-14T03:28:55.229Z",
      "stableId": "technical-design-overview-summary-executive-summary",
      "sourceRefs": []
    },
    "workingContent": "### Functional Flowchart Adapter\n\n# Technical Design Fragment: Functional Flowchart Adapter\n\n> Documents the current flowchart library choice and the implementation boundary for swapping flowchart renderers.\n\n## 1. Executive Summary\n\nThe Functional Spec module currently renders logical workflow diagrams with React Flow through the `@xyflow/react` package. The flowchart renderer should be treated as a replaceable implementation detail, not as the Functional Spec module contract.\n\n## 2. Scope and Design Updates\n\n- Current library: `@xyflow/react`.\n- Current implementation concern: the Functional Spec workspace directly imports React Flow primitives and owns canvas-specific behavior in the same component that owns Functional Spec document editing.\n- Desired design: split the flowchart surface into a renderer interface and a concrete React Flow implementation.\n- The Functional Spec workspace should depend on a stable flowchart adapter component/contract for nodes, edges, selection, movement, resizing, connection creation, and layout actions.\n- The React Flow implementation should remain available as the default renderer so the current UI can keep working while alternate libraries are evaluated.\n\n## 3. Internal Flow Changes\n\n1. Functional Spec state continues to own logical flows, flow visuals, nodes, edges, hidden flags, and hierarchy selections.\n2. The workspace passes normalized node and edge data into a flowchart interface component.\n3. The active flowchart implementation renders the canvas and raises generic callbacks such as node select, edge select, node move, node resize, and connect nodes.\n4. Layout actions remain workspace-owned unless a renderer-specific implementation is explicitly selected later.\n\n## 4. Data and Interface Impact\n\nNo schema migration is required for this first implementation. The existing `flowVisuals.nodes` and `flowVisuals.edges` data remains the shared contract between the document state and the renderer.\n\nThe adapter contract should support at minimum:\n\n- `nodes`\n- `edges`\n- `selectedNodeId`\n- `selectedEdgeId`\n- `nodeTypes` or equivalent custom node rendering\n- `onSelectNode`\n- `onSelectEdge`\n- `onMoveNode`\n- `onResizeNode`\n- `onConnectNodes`\n\n## 5. Risks and Open Questions\n\n- Different flowchart libraries may model handles, node dimensions, and edge routing differently.\n- The adapter should not leak React Flow-specific event payloads into the Functional Spec workspace.\n- If another renderer cannot support resizing or connection handles cleanly, the UI may need a capability flag system.\n\n## 6. Merge Guidance\n\nMerge this fragment into Technical Design before or alongside the adapter refactor so the implementation choice and swap boundary are visible in project documentation.\n\n### TECHNICAL_DESIGN_FRAGMENT_20260412_functional_flowchart_mouse_controls_006\n\n# Technical Design Fragment: Functional Flowchart Mouse Controls\n\n## Summary\n\nUpdate Technical Design to record that FunctionalFlowchartCanvas now includes renderer-neutral mouse wheel zoom and hold-drag pan options.\n\n### TECHNICAL_DESIGN_FRAGMENT_20260412_functional_flowchart_pan_controls_005\n\n# Technical Design Fragment: Functional Flowchart Pan Controls\n\n## Summary\n\nUpdate Technical Design to record that FunctionalFlowchartCanvas now carries renderer-neutral pan options and the active React Canvas flowchart renderer implements pan controls.\n\n### TECHNICAL_DESIGN_FRAGMENT_20260412_functional_flowchart_react_canvas_default_003\n\n# Technical Design Fragment: Functional Flowchart React Canvas Default\n\n## Summary\n\nUpdate Technical Design to record that the Functional Spec flowchart adapter now defaults to the internal React/SVG canvas renderer instead of tldraw due to licensing concerns.\n\n### TECHNICAL_DESIGN_FRAGMENT_20260412_functional_flowchart_tldraw_renderer_002\n\n# Technical Design Fragment: Functional Flowchart tldraw Renderer\n\n## Summary\n\nUpdate Technical Design to record that the Functional Spec flowchart adapter now defaults to the `tldraw` renderer while preserving React Flow and React/SVG canvas implementations behind the same interface.\n\n### TECHNICAL_DESIGN_FRAGMENT_20260412_functional_flowchart_zoom_controls_004\n\n# Technical Design Fragment: Functional Flowchart Zoom Controls\n\n## Summary\n\nUpdate Technical Design to record that FunctionalFlowchartCanvas now carries renderer-neutral zoom options and the active React Canvas flowchart renderer implements zoom controls.\n\n### Fragment Migrators And Watchers\n\n# Technical Design Fragment: Fragment Migrators And Watchers\n\n> Managed document. Must comply with template TECHNICAL_DESIGN_FRAGMENT.template.md.\n\n## Executive Summary\n\nFragment loading now migrates managed payloads before consumers inspect them. Module fragment discovery can find files by managed docType metadata when filenames do not match the latest prefix. Client hooks subscribe to project fragment watcher events and refresh fragment lists when relevant markdown files change.\n\n## Scope and Design Updates\n\n- `workspace-docs` owns fragment docType aliases and versioned managed-payload migrators.\n- `readManagedFileSnapshot` applies migration when parsing `APM:DATA`.\n- `listFragmentFilesForModuleInDir` scans markdown files and includes fragments whose managed docType matches the requested module.\n- `server-app` registers a project fragment watcher for normal app sessions.\n- `use-fragment-file-watcher` debounces fragment file events and calls module refresh handlers.\n\n## Internal Flow Changes\n\n- Read fragment file.\n- Parse `APM:DATA`.\n- Infer or normalize fragment docType.\n- Apply the matching migrator.\n- List or consume the migrated fragment.\n- Refresh the UI when watched fragment files change.\n\n## Data and Interface Impact\n\n- No new database table was added for this change.\n- The fragment payload migrator registry is code-based and version keyed.\n\n## Risks and Open Questions\n\n- Test sessions disable automatic server fragment watchers to avoid Windows file-locking during temporary project-root relocation tests.\n- A future UI could expose parse warnings and migration warnings in the fragment browser.\n\n## Merge Guidance\n\n- Consume through Technical Design when that module is ready.",
    "openQuestions": "",
    "fragmentHistory": [
      {
        "id": "project:TECHNICAL_DESIGN_FRAGMENT_20260414_fragment_migrators_and_watchers_001.md",
        "code": "TECHNICAL_DESIGN_FRAGMENT_20260414_fragment_migrators_and_watchers_001",
        "title": "Fragment Migrators And Watchers",
        "status": "integrated",
        "sourceScope": "project",
        "integratedAt": "2026-04-14T03:26:58.006Z",
        "summary": "Documents the implementation design for managed fragment payload migration, content-aware discovery, and UI file watcher refresh.",
        "revision": 1,
        "lineageKey": "TECHNICAL_DESIGN_FRAGMENT_20260414_fragment_migrators_and_watchers",
        "supersedesCode": "",
        "supersedesRevision": null
      },
      {
        "id": "project:TECHNICAL_DESIGN_FRAGMENT_20260412_functional_flowchart_zoom_controls_004.md",
        "code": "TECHNICAL_DESIGN_FRAGMENT_20260412_functional_flowchart_zoom_controls_004",
        "title": "TECHNICAL_DESIGN_FRAGMENT_20260412_functional_flowchart_zoom_controls_004",
        "status": "integrated",
        "sourceScope": "project",
        "integratedAt": "2026-04-14T01:58:51.899Z",
        "summary": "Update Technical Design to record that FunctionalFlowchartCanvas now carries renderer-neutral zoom options and the active React Canvas flowchart renderer implements zoom controls.",
        "revision": 1,
        "lineageKey": "TECHNICAL_DESIGN_FRAGMENT_20260412_functional_flowchart_zoom_controls_004",
        "supersedesCode": "",
        "supersedesRevision": null
      },
      {
        "id": "project:TECHNICAL_DESIGN_FRAGMENT_20260412_functional_flowchart_tldraw_renderer_002.md",
        "code": "TECHNICAL_DESIGN_FRAGMENT_20260412_functional_flowchart_tldraw_renderer_002",
        "title": "TECHNICAL_DESIGN_FRAGMENT_20260412_functional_flowchart_tldraw_renderer_002",
        "status": "integrated",
        "sourceScope": "project",
        "integratedAt": "2026-04-14T01:58:50.902Z",
        "summary": "Update Technical Design to record that the Functional Spec flowchart adapter now defaults to the `tldraw` renderer while preserving React Flow and React/SVG canvas implementations behind the same interface.",
        "revision": 1,
        "lineageKey": "TECHNICAL_DESIGN_FRAGMENT_20260412_functional_flowchart_tldraw_renderer_002",
        "supersedesCode": "",
        "supersedesRevision": null
      },
      {
        "id": "project:TECHNICAL_DESIGN_FRAGMENT_20260412_functional_flowchart_react_canvas_default_003.md",
        "code": "TECHNICAL_DESIGN_FRAGMENT_20260412_functional_flowchart_react_canvas_default_003",
        "title": "TECHNICAL_DESIGN_FRAGMENT_20260412_functional_flowchart_react_canvas_default_003",
        "status": "integrated",
        "sourceScope": "project",
        "integratedAt": "2026-04-14T01:58:50.091Z",
        "summary": "Update Technical Design to record that the Functional Spec flowchart adapter now defaults to the internal React/SVG canvas renderer instead of tldraw due to licensing concerns.",
        "revision": 1,
        "lineageKey": "TECHNICAL_DESIGN_FRAGMENT_20260412_functional_flowchart_react_canvas_default_003",
        "supersedesCode": "",
        "supersedesRevision": null
      },
      {
        "id": "project:TECHNICAL_DESIGN_FRAGMENT_20260412_functional_flowchart_pan_controls_005.md",
        "code": "TECHNICAL_DESIGN_FRAGMENT_20260412_functional_flowchart_pan_controls_005",
        "title": "TECHNICAL_DESIGN_FRAGMENT_20260412_functional_flowchart_pan_controls_005",
        "status": "integrated",
        "sourceScope": "project",
        "integratedAt": "2026-04-14T01:58:49.262Z",
        "summary": "Update Technical Design to record that FunctionalFlowchartCanvas now carries renderer-neutral pan options and the active React Canvas flowchart renderer implements pan controls.",
        "revision": 1,
        "lineageKey": "TECHNICAL_DESIGN_FRAGMENT_20260412_functional_flowchart_pan_controls_005",
        "supersedesCode": "",
        "supersedesRevision": null
      },
      {
        "id": "project:TECHNICAL_DESIGN_FRAGMENT_20260412_functional_flowchart_mouse_controls_006.md",
        "code": "TECHNICAL_DESIGN_FRAGMENT_20260412_functional_flowchart_mouse_controls_006",
        "title": "TECHNICAL_DESIGN_FRAGMENT_20260412_functional_flowchart_mouse_controls_006",
        "status": "integrated",
        "sourceScope": "project",
        "integratedAt": "2026-04-14T01:58:48.191Z",
        "summary": "Update Technical Design to record that FunctionalFlowchartCanvas now includes renderer-neutral mouse wheel zoom and hold-drag pan options.",
        "revision": 1,
        "lineageKey": "TECHNICAL_DESIGN_FRAGMENT_20260412_functional_flowchart_mouse_controls_006",
        "supersedesCode": "",
        "supersedesRevision": null
      },
      {
        "id": "project:TECHNICAL_DESIGN_FRAGMENT_20260412_functional_flowchart_adapter_001.md",
        "code": "TECHNICAL_DESIGN_FRAGMENT_20260412_functional_flowchart_adapter_001",
        "title": "Functional Flowchart Adapter",
        "status": "integrated",
        "sourceScope": "project",
        "integratedAt": "2026-04-12T22:44:30.165Z",
        "summary": "Record that the Functional Spec visual workflow canvas currently uses React Flow through @xyflow/react, and that the implementation should be isolated behind a flowchart adapter interface so another renderer can be evaluated without rewriting the Functional Spec workspace.",
        "revision": 1,
        "lineageKey": "technical-design-functional-flowchart-adapter",
        "supersedesCode": "",
        "supersedesRevision": null
      }
    ],
    "workingContentMeta": {
      "stableId": "technical-design-working-content-working-content",
      "sourceRefs": []
    },
    "openQuestionsMeta": {
      "stableId": "technical-design-open-questions-open-questions",
      "sourceRefs": []
    }
  }
}
-->

## Executive Summary

<!--
APM-ID: technical-design-overview-summary-executive-summary
APM-LAST-UPDATED: 2026-04-14
-->

Technical Design for Angel's Project Manager is still being defined.

## Working Content

<!--
APM-ID: technical-design-working-content-working-content
APM-LAST-UPDATED: 2026-04-14
-->

### Functional Flowchart Adapter

# Technical Design Fragment: Functional Flowchart Adapter

> Documents the current flowchart library choice and the implementation boundary for swapping flowchart renderers.

## 1. Executive Summary

The Functional Spec module currently renders logical workflow diagrams with React Flow through the `@xyflow/react` package. The flowchart renderer should be treated as a replaceable implementation detail, not as the Functional Spec module contract.

## 2. Scope and Design Updates

- Current library: `@xyflow/react`.
- Current implementation concern: the Functional Spec workspace directly imports React Flow primitives and owns canvas-specific behavior in the same component that owns Functional Spec document editing.
- Desired design: split the flowchart surface into a renderer interface and a concrete React Flow implementation.
- The Functional Spec workspace should depend on a stable flowchart adapter component/contract for nodes, edges, selection, movement, resizing, connection creation, and layout actions.
- The React Flow implementation should remain available as the default renderer so the current UI can keep working while alternate libraries are evaluated.

## 3. Internal Flow Changes

1. Functional Spec state continues to own logical flows, flow visuals, nodes, edges, hidden flags, and hierarchy selections.
2. The workspace passes normalized node and edge data into a flowchart interface component.
3. The active flowchart implementation renders the canvas and raises generic callbacks such as node select, edge select, node move, node resize, and connect nodes.
4. Layout actions remain workspace-owned unless a renderer-specific implementation is explicitly selected later.

## 4. Data and Interface Impact

No schema migration is required for this first implementation. The existing `flowVisuals.nodes` and `flowVisuals.edges` data remains the shared contract between the document state and the renderer.

The adapter contract should support at minimum:

- `nodes`
- `edges`
- `selectedNodeId`
- `selectedEdgeId`
- `nodeTypes` or equivalent custom node rendering
- `onSelectNode`
- `onSelectEdge`
- `onMoveNode`
- `onResizeNode`
- `onConnectNodes`

## 5. Risks and Open Questions

- Different flowchart libraries may model handles, node dimensions, and edge routing differently.
- The adapter should not leak React Flow-specific event payloads into the Functional Spec workspace.
- If another renderer cannot support resizing or connection handles cleanly, the UI may need a capability flag system.

## 6. Merge Guidance

Merge this fragment into Technical Design before or alongside the adapter refactor so the implementation choice and swap boundary are visible in project documentation.

### TECHNICAL_DESIGN_FRAGMENT_20260412_functional_flowchart_mouse_controls_006

# Technical Design Fragment: Functional Flowchart Mouse Controls

## Summary

Update Technical Design to record that FunctionalFlowchartCanvas now includes renderer-neutral mouse wheel zoom and hold-drag pan options.

### TECHNICAL_DESIGN_FRAGMENT_20260412_functional_flowchart_pan_controls_005

# Technical Design Fragment: Functional Flowchart Pan Controls

## Summary

Update Technical Design to record that FunctionalFlowchartCanvas now carries renderer-neutral pan options and the active React Canvas flowchart renderer implements pan controls.

### TECHNICAL_DESIGN_FRAGMENT_20260412_functional_flowchart_react_canvas_default_003

# Technical Design Fragment: Functional Flowchart React Canvas Default

## Summary

Update Technical Design to record that the Functional Spec flowchart adapter now defaults to the internal React/SVG canvas renderer instead of tldraw due to licensing concerns.

### TECHNICAL_DESIGN_FRAGMENT_20260412_functional_flowchart_tldraw_renderer_002

# Technical Design Fragment: Functional Flowchart tldraw Renderer

## Summary

Update Technical Design to record that the Functional Spec flowchart adapter now defaults to the `tldraw` renderer while preserving React Flow and React/SVG canvas implementations behind the same interface.

### TECHNICAL_DESIGN_FRAGMENT_20260412_functional_flowchart_zoom_controls_004

# Technical Design Fragment: Functional Flowchart Zoom Controls

## Summary

Update Technical Design to record that FunctionalFlowchartCanvas now carries renderer-neutral zoom options and the active React Canvas flowchart renderer implements zoom controls.

### Fragment Migrators And Watchers

# Technical Design Fragment: Fragment Migrators And Watchers

> Managed document. Must comply with template TECHNICAL_DESIGN_FRAGMENT.template.md.

## Executive Summary

Fragment loading now migrates managed payloads before consumers inspect them. Module fragment discovery can find files by managed docType metadata when filenames do not match the latest prefix. Client hooks subscribe to project fragment watcher events and refresh fragment lists when relevant markdown files change.

## Scope and Design Updates

- `workspace-docs` owns fragment docType aliases and versioned managed-payload migrators.
- `readManagedFileSnapshot` applies migration when parsing `APM:DATA`.
- `listFragmentFilesForModuleInDir` scans markdown files and includes fragments whose managed docType matches the requested module.
- `server-app` registers a project fragment watcher for normal app sessions.
- `use-fragment-file-watcher` debounces fragment file events and calls module refresh handlers.

## Internal Flow Changes

- Read fragment file.
- Parse `APM:DATA`.
- Infer or normalize fragment docType.
- Apply the matching migrator.
- List or consume the migrated fragment.
- Refresh the UI when watched fragment files change.

## Data and Interface Impact

- No new database table was added for this change.
- The fragment payload migrator registry is code-based and version keyed.

## Risks and Open Questions

- Test sessions disable automatic server fragment watchers to avoid Windows file-locking during temporary project-root relocation tests.
- A future UI could expose parse warnings and migration warnings in the fragment browser.

## Merge Guidance

- Consume through Technical Design when that module is ready.

## Applied Fragments

### TECHNICAL_DESIGN_FRAGMENT_20260414_fragment_migrators_and_watchers_001: Fragment Migrators And Watchers

- Status: integrated
- Source: project
- Integrated: 2026-04-14T03:26:58.006Z

Documents the implementation design for managed fragment payload migration, content-aware discovery, and UI file watcher refresh.

### TECHNICAL_DESIGN_FRAGMENT_20260412_functional_flowchart_zoom_controls_004: TECHNICAL_DESIGN_FRAGMENT_20260412_functional_flowchart_zoom_controls_004

- Status: integrated
- Source: project
- Integrated: 2026-04-14T01:58:51.899Z

Update Technical Design to record that FunctionalFlowchartCanvas now carries renderer-neutral zoom options and the active React Canvas flowchart renderer implements zoom controls.

### TECHNICAL_DESIGN_FRAGMENT_20260412_functional_flowchart_tldraw_renderer_002: TECHNICAL_DESIGN_FRAGMENT_20260412_functional_flowchart_tldraw_renderer_002

- Status: integrated
- Source: project
- Integrated: 2026-04-14T01:58:50.902Z

Update Technical Design to record that the Functional Spec flowchart adapter now defaults to the `tldraw` renderer while preserving React Flow and React/SVG canvas implementations behind the same interface.

### TECHNICAL_DESIGN_FRAGMENT_20260412_functional_flowchart_react_canvas_default_003: TECHNICAL_DESIGN_FRAGMENT_20260412_functional_flowchart_react_canvas_default_003

- Status: integrated
- Source: project
- Integrated: 2026-04-14T01:58:50.091Z

Update Technical Design to record that the Functional Spec flowchart adapter now defaults to the internal React/SVG canvas renderer instead of tldraw due to licensing concerns.

### TECHNICAL_DESIGN_FRAGMENT_20260412_functional_flowchart_pan_controls_005: TECHNICAL_DESIGN_FRAGMENT_20260412_functional_flowchart_pan_controls_005

- Status: integrated
- Source: project
- Integrated: 2026-04-14T01:58:49.262Z

Update Technical Design to record that FunctionalFlowchartCanvas now carries renderer-neutral pan options and the active React Canvas flowchart renderer implements pan controls.

### TECHNICAL_DESIGN_FRAGMENT_20260412_functional_flowchart_mouse_controls_006: TECHNICAL_DESIGN_FRAGMENT_20260412_functional_flowchart_mouse_controls_006

- Status: integrated
- Source: project
- Integrated: 2026-04-14T01:58:48.191Z

Update Technical Design to record that FunctionalFlowchartCanvas now includes renderer-neutral mouse wheel zoom and hold-drag pan options.

### TECHNICAL_DESIGN_FRAGMENT_20260412_functional_flowchart_adapter_001: Functional Flowchart Adapter

- Status: integrated
- Source: project
- Integrated: 2026-04-12T22:44:30.165Z

Record that the Functional Spec visual workflow canvas currently uses React Flow through @xyflow/react, and that the implementation should be isolated behind a flowchart adapter interface so another renderer can be evaluated without rewriting the Functional Spec workspace.

## Open Questions

<!--
APM-ID: technical-design-open-questions-open-questions
APM-LAST-UPDATED: 2026-04-14
-->

No open questions yet.
