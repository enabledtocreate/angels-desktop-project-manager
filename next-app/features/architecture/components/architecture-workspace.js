'use client';

import { useEffect, useMemo, useState } from 'react';
import { Background, Controls, MarkerType, MiniMap, ReactFlow } from '@xyflow/react';
import { ActionButton } from '@/components/ui/action-button';
import { DocumentFieldMeta } from '@/components/ui/document-field-meta';
import { DialogFrame } from '@/components/ui/dialog-frame';
import { FragmentBrowserModal } from '@/components/ui/fragment-browser-modal';
import { InfoTile } from '@/components/ui/info-tile';
import { SectionShell } from '@/components/ui/section-shell';
import { StatisticsDisclosure } from '@/components/ui/statistics-disclosure';
import { StatusBadge } from '@/components/ui/status-badge';
import { StructuredEntryListEditor } from '@/components/ui/structured-entry-list-editor';
import { SurfaceCard } from '@/components/ui/surface-card';
import { ArchitectureFlowNode } from '@/features/architecture/components/architecture-flow-node';
import { useArchitecture } from '@/features/architecture/hooks/use-architecture';
import { useProjectWorkItemLookup } from '@/hooks/use-project-work-item-lookup';
import { countActiveFragments } from '@/lib/fragment-utils';

const nodeTypes = {
  architectureComponent: ArchitectureFlowNode,
};

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function defaultPosition(index) {
  const column = index % 3;
  const row = Math.floor(index / 3);
  return {
    x: column * 300,
    y: row * 220,
  };
}

function normalizeComponents(items) {
  return (Array.isArray(items) ? items : []).map((item, index) => ({
    id: String(item?.id || createId('architecture-component')),
    stableId: String(item?.stableId || ''),
    sourceRefs: Array.isArray(item?.sourceRefs) ? item.sourceRefs : [],
    title: String(item?.title || ''),
    description: String(item?.description || ''),
    kind: String(item?.kind || ''),
    versionDate: String(item?.versionDate || ''),
    position: item?.position && Number.isFinite(Number(item.position.x)) && Number.isFinite(Number(item.position.y))
      ? { x: Number(item.position.x), y: Number(item.position.y) }
      : defaultPosition(index),
  }));
}

function normalizeConnections(items, components) {
  const titleToId = new Map(components.map((component) => [component.title, component.id]));
  const componentById = new Map(components.map((component) => [component.id, component]));
  return (Array.isArray(items) ? items : [])
    .map((item) => {
      const sourceId = String(item?.sourceId || titleToId.get(String(item?.source || '')) || '');
      const targetId = String(item?.targetId || titleToId.get(String(item?.target || '')) || '');
      return {
        id: String(item?.id || createId('architecture-connection')),
        stableId: String(item?.stableId || ''),
        sourceRefs: Array.isArray(item?.sourceRefs) ? item.sourceRefs : [],
        sourceId,
        targetId,
        source: componentById.get(sourceId)?.title || String(item?.source || ''),
        target: componentById.get(targetId)?.title || String(item?.target || ''),
        label: String(item?.label || ''),
        versionDate: String(item?.versionDate || ''),
      };
    })
    .filter((item) => item.sourceId && item.targetId);
}

function buildEditableState(editorState) {
  const state = editorState || {};
  const components = normalizeComponents(state.components);
  return {
    systemPurpose: state.overview?.systemPurpose || '',
    architecturalVision: state.overview?.architecturalVision || '',
    architecturalStyle: state.overview?.architecturalStyle || '',
    overviewItemIds: {
      systemPurpose: state.overview?.itemIds?.systemPurpose || '',
      architecturalVision: state.overview?.itemIds?.architecturalVision || '',
      architecturalStyle: state.overview?.itemIds?.architecturalStyle || '',
    },
    overviewItemSourceRefs: {
      systemPurpose: Array.isArray(state.overview?.itemSourceRefs?.systemPurpose) ? state.overview.itemSourceRefs.systemPurpose : [],
      architecturalVision: Array.isArray(state.overview?.itemSourceRefs?.architecturalVision) ? state.overview.itemSourceRefs.architecturalVision : [],
      architecturalStyle: Array.isArray(state.overview?.itemSourceRefs?.architecturalStyle) ? state.overview.itemSourceRefs.architecturalStyle : [],
    },
    primaryArchitecture: state.structure?.primaryArchitecture || '',
    architectureType: state.structure?.architectureType || 'application',
    architectureScope: state.structure?.architectureScope || 'single_application',
    systemContext: state.structure?.systemContext || '',
    structureItemIds: {
      primaryArchitecture: state.structure?.itemIds?.primaryArchitecture || '',
      architectureType: state.structure?.itemIds?.architectureType || '',
      architectureScope: state.structure?.itemIds?.architectureScope || '',
      systemContext: state.structure?.itemIds?.systemContext || '',
    },
    structureItemSourceRefs: {
      primaryArchitecture: Array.isArray(state.structure?.itemSourceRefs?.primaryArchitecture) ? state.structure.itemSourceRefs.primaryArchitecture : [],
      architectureType: Array.isArray(state.structure?.itemSourceRefs?.architectureType) ? state.structure.itemSourceRefs.architectureType : [],
      architectureScope: Array.isArray(state.structure?.itemSourceRefs?.architectureScope) ? state.structure.itemSourceRefs.architectureScope : [],
      systemContext: Array.isArray(state.structure?.itemSourceRefs?.systemContext) ? state.structure.itemSourceRefs.systemContext : [],
    },
    techStack: Array.isArray(state.techStack) ? state.techStack : [],
    components,
    componentConnections: normalizeConnections(state.componentConnections, components),
    subArchitectures: Array.isArray(state.subArchitectures) ? state.subArchitectures : [],
    externalDependencies: Array.isArray(state.externalDependencies || state.integrations) ? (state.externalDependencies || state.integrations) : [],
    applicationWorkflows: Array.isArray(state.applicationWorkflows || state.runtimeScenarios) ? (state.applicationWorkflows || state.runtimeScenarios) : [],
    architectureWorkflows: Array.isArray(state.architectureWorkflows) ? state.architectureWorkflows : [],
    moduleInteractions: Array.isArray(state.moduleInteractions) ? state.moduleInteractions : [],
    boundaries: Array.isArray(state.boundaries) ? state.boundaries : [],
    persistenceSummary: state.persistenceStrategy?.summary || '',
    persistenceSourceOfTruth: state.persistenceStrategy?.sourceOfTruth || '',
    persistenceSyncExpectations: state.persistenceStrategy?.syncExpectations || '',
    persistenceItemIds: {
      summary: state.persistenceStrategy?.itemIds?.summary || '',
      sourceOfTruth: state.persistenceStrategy?.itemIds?.sourceOfTruth || '',
      syncExpectations: state.persistenceStrategy?.itemIds?.syncExpectations || '',
    },
    persistenceItemSourceRefs: {
      summary: Array.isArray(state.persistenceStrategy?.itemSourceRefs?.summary) ? state.persistenceStrategy.itemSourceRefs.summary : [],
      sourceOfTruth: Array.isArray(state.persistenceStrategy?.itemSourceRefs?.sourceOfTruth) ? state.persistenceStrategy.itemSourceRefs.sourceOfTruth : [],
      syncExpectations: Array.isArray(state.persistenceStrategy?.itemSourceRefs?.syncExpectations) ? state.persistenceStrategy.itemSourceRefs.syncExpectations : [],
    },
    crossCuttingConcerns: Array.isArray(state.crossCuttingConcerns || state.operationalConcerns) ? (state.crossCuttingConcerns || state.operationalConcerns) : [],
    decisions: Array.isArray(state.decisions) ? state.decisions : [],
    constraints: Array.isArray(state.constraints) ? state.constraints : [],
    runtimeTopology: state.deployment?.runtimeTopology || '',
    environmentNotes: state.deployment?.environmentNotes || '',
    deploymentItemIds: {
      runtimeTopology: state.deployment?.itemIds?.runtimeTopology || '',
      environmentNotes: state.deployment?.itemIds?.environmentNotes || '',
    },
    deploymentItemSourceRefs: {
      runtimeTopology: Array.isArray(state.deployment?.itemSourceRefs?.runtimeTopology) ? state.deployment.itemSourceRefs.runtimeTopology : [],
      environmentNotes: Array.isArray(state.deployment?.itemSourceRefs?.environmentNotes) ? state.deployment.itemSourceRefs.environmentNotes : [],
    },
    openQuestions: Array.isArray(state.openQuestions) ? state.openQuestions : [],
  };
}

function buildEditorState(editableState, currentState = null) {
  const now = new Date().toISOString();
  return {
    ...(currentState || {}),
    overview: {
      ...(currentState?.overview || {}),
      systemPurpose: editableState.systemPurpose,
      architecturalVision: editableState.architecturalVision,
      architecturalStyle: editableState.architecturalStyle,
      itemIds: editableState.overviewItemIds,
      itemSourceRefs: editableState.overviewItemSourceRefs,
      versionDate: now,
    },
    structure: {
      ...(currentState?.structure || {}),
      primaryArchitecture: editableState.primaryArchitecture,
      architectureType: editableState.architectureType,
      architectureScope: editableState.architectureScope,
      systemContext: editableState.systemContext,
      itemIds: editableState.structureItemIds,
      itemSourceRefs: editableState.structureItemSourceRefs,
      versionDate: now,
    },
    techStack: editableState.techStack,
    components: editableState.components.map((component) => ({
      id: component.id,
      stableId: component.stableId,
      sourceRefs: component.sourceRefs,
      title: component.title,
      description: component.description,
      kind: component.kind,
      position: component.position,
      versionDate: now,
    })),
    componentConnections: editableState.componentConnections.map((connection) => ({
      id: connection.id,
      stableId: connection.stableId,
      sourceRefs: connection.sourceRefs,
      sourceId: connection.sourceId,
      targetId: connection.targetId,
      source: connection.source,
      target: connection.target,
      label: connection.label,
      versionDate: now,
    })),
    subArchitectures: editableState.subArchitectures,
    externalDependencies: editableState.externalDependencies,
    applicationWorkflows: editableState.applicationWorkflows,
    architectureWorkflows: editableState.architectureWorkflows,
    moduleInteractions: editableState.moduleInteractions,
    boundaries: editableState.boundaries,
    persistenceStrategy: {
      ...(currentState?.persistenceStrategy || {}),
      summary: editableState.persistenceSummary,
      sourceOfTruth: editableState.persistenceSourceOfTruth,
      syncExpectations: editableState.persistenceSyncExpectations,
      itemIds: editableState.persistenceItemIds,
      itemSourceRefs: editableState.persistenceItemSourceRefs,
      versionDate: now,
    },
    crossCuttingConcerns: editableState.crossCuttingConcerns,
    decisions: editableState.decisions,
    constraints: editableState.constraints,
    deployment: {
      ...(currentState?.deployment || {}),
      runtimeTopology: editableState.runtimeTopology,
      environmentNotes: editableState.environmentNotes,
      itemIds: editableState.deploymentItemIds,
      itemSourceRefs: editableState.deploymentItemSourceRefs,
      versionDate: now,
    },
    openQuestions: editableState.openQuestions,
    fragmentHistory: Array.isArray(currentState?.fragmentHistory) ? currentState.fragmentHistory : [],
  };
}

function ArchitectureTextArea({ label, value, onChange, rows = 4, help, stableId = '', sourceRefs = [], workItemLookup = {} }) {
  return (
    <label className="space-y-2 text-sm text-sky-100/75">
      <span className="font-medium text-white">{label}</span>
      {help ? <p className="text-xs leading-5 text-sky-100/55">{help}</p> : null}
      <textarea
        rows={rows}
        className="min-h-24 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-accent/60"
        value={value}
        onChange={onChange}
      />
      <DocumentFieldMeta stableId={stableId} sourceRefs={sourceRefs} workItemLookup={workItemLookup} />
    </label>
  );
}

function ArchitectureInput({ label, value, onChange, help, stableId = '', sourceRefs = [], workItemLookup = {} }) {
  return (
    <label className="space-y-2 text-sm text-sky-100/75">
      <span className="font-medium text-white">{label}</span>
      {help ? <p className="text-xs leading-5 text-sky-100/55">{help}</p> : null}
      <input
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-accent/60"
        value={value}
        onChange={onChange}
      />
      <DocumentFieldMeta stableId={stableId} sourceRefs={sourceRefs} workItemLookup={workItemLookup} />
    </label>
  );
}

function ArchitectureCanvas({
  components,
  connections,
  selectedComponentId,
  selectedConnectionId,
  onSelectComponent,
  onSelectConnection,
  onMoveComponent,
  onConnectComponents,
}) {
  const nodes = useMemo(
    () => components.map((component, index) => ({
      id: component.id,
      type: 'architectureComponent',
      position: component.position || defaultPosition(index),
      data: { component },
      selected: component.id === selectedComponentId,
    })),
    [components, selectedComponentId]
  );

  const edges = useMemo(
    () => connections.map((connection) => ({
      id: connection.id,
      source: connection.sourceId,
      target: connection.targetId,
      label: connection.label || 'flows to',
      labelStyle: { fill: 'rgb(var(--color-ink))', fontWeight: 700, fontSize: 12 },
      labelBgStyle: { fill: 'rgba(255,255,255,0.92)', fillOpacity: 0.96 },
      labelBgPadding: [6, 4],
      labelBgBorderRadius: 999,
      type: 'step',
      markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
      style: {
        strokeWidth: connection.id === selectedConnectionId ? 2.4 : 1.8,
        stroke: connection.id === selectedConnectionId ? 'rgba(34, 211, 238, 0.95)' : 'rgba(148, 163, 184, 0.88)',
      },
      selected: connection.id === selectedConnectionId,
    })),
    [connections, selectedConnectionId]
  );

  return (
    <div className="h-[34rem] rounded-[1.4rem] border border-white/10 bg-slate/40">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.35}
        onlyRenderVisibleElements
        onNodeClick={(_, node) => onSelectComponent?.(node.id)}
        onEdgeClick={(_, edge) => onSelectConnection?.(edge.id)}
        onPaneClick={() => {
          onSelectComponent?.(null);
          onSelectConnection?.(null);
        }}
        onNodeDragStop={(_, node) => onMoveComponent?.(node.id, { x: node.position.x, y: node.position.y })}
        onConnect={(params) => onConnectComponents?.(params)}
      >
        <MiniMap pannable zoomable />
        <Background gap={20} size={1} color="rgba(148, 163, 184, 0.16)" />
        <Controls showInteractive={false} position="bottom-right" />
      </ReactFlow>
    </div>
  );
}

export function ArchitectureWorkspace({ project }) {
  const { architecture, fragments, status, error, saveStatus, refresh, saveArchitecture, consumeArchitectureFragment } = useArchitecture(project, project.type === 'folder');
  const { byCode: workItemLookup } = useProjectWorkItemLookup(project, project.type === 'folder');
  const [editableState, setEditableState] = useState(() => buildEditableState(null));
  const [isFragmentsOpen, setIsFragmentsOpen] = useState(false);
  const [selectedComponentId, setSelectedComponentId] = useState(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState(null);
  const activeFragmentCount = useMemo(() => countActiveFragments(fragments), [fragments]);

  useEffect(() => {
    if (architecture?.editorState) {
      setEditableState(buildEditableState(architecture.editorState));
      setSelectedComponentId(null);
      setSelectedConnectionId(null);
    }
  }, [architecture]);

  const selectedComponent = useMemo(
    () => editableState.components.find((component) => component.id === selectedComponentId) || null,
    [editableState.components, selectedComponentId]
  );

  const selectedConnection = useMemo(
    () => editableState.componentConnections.find((connection) => connection.id === selectedConnectionId) || null,
    [editableState.componentConnections, selectedConnectionId]
  );

  function updateComponent(componentId, updates) {
    setEditableState((current) => {
      const nextComponents = current.components.map((component) => {
        if (component.id !== componentId) return component;
        const updatedComponent = { ...component, ...updates };
        return updatedComponent;
      });
      const updatedComponent = nextComponents.find((component) => component.id === componentId);
      const nextConnections = current.componentConnections.map((connection) => {
        if (connection.sourceId === componentId) {
          return { ...connection, source: updatedComponent?.title || connection.source };
        }
        if (connection.targetId === componentId) {
          return { ...connection, target: updatedComponent?.title || connection.target };
        }
        return connection;
      });
      return {
        ...current,
        components: nextComponents,
        componentConnections: nextConnections,
      };
    });
  }

  function addComponent() {
    const component = {
      id: createId('architecture-component'),
      title: `New Component ${editableState.components.length + 1}`,
      description: '',
      kind: 'component',
      position: defaultPosition(editableState.components.length),
    };
    setEditableState((current) => ({
      ...current,
      components: [...current.components, component],
    }));
    setSelectedConnectionId(null);
    setSelectedComponentId(component.id);
  }

  function removeSelectedComponent() {
    if (!selectedComponentId) return;
    setEditableState((current) => ({
      ...current,
      components: current.components.filter((component) => component.id !== selectedComponentId),
      componentConnections: current.componentConnections.filter((connection) => connection.sourceId !== selectedComponentId && connection.targetId !== selectedComponentId),
    }));
    setSelectedComponentId(null);
  }

  function moveComponent(componentId, position) {
    updateComponent(componentId, { position });
  }

  function connectComponents(params) {
    if (!params?.source || !params?.target) return;
    setEditableState((current) => {
      const sourceComponent = current.components.find((component) => component.id === params.source);
      const targetComponent = current.components.find((component) => component.id === params.target);
      if (!sourceComponent || !targetComponent) return current;
      const nextConnection = {
        id: createId('architecture-connection'),
        sourceId: sourceComponent.id,
        targetId: targetComponent.id,
        source: sourceComponent.title,
        target: targetComponent.title,
        label: 'flows to',
      };
      return {
        ...current,
        componentConnections: [...current.componentConnections, nextConnection],
      };
    });
    setSelectedComponentId(null);
    setSelectedConnectionId(null);
  }

  function removeSelectedConnection() {
    if (!selectedConnectionId) return;
    setEditableState((current) => ({
      ...current,
      componentConnections: current.componentConnections.filter((connection) => connection.id !== selectedConnectionId),
    }));
    setSelectedConnectionId(null);
  }

  function updateSelectedConnection(updates) {
    if (!selectedConnectionId) return;
    setEditableState((current) => ({
      ...current,
      componentConnections: current.componentConnections.map((connection) => (
        connection.id === selectedConnectionId ? { ...connection, ...updates } : connection
      )),
    }));
  }

  async function handleSave() {
    await saveArchitecture(buildEditorState(editableState, architecture?.editorState), architecture?.mermaid || null);
  }

  if (status === 'loading' || status === 'idle') {
    return <SectionShell eyebrow="Architecture" title="Loading architecture..." description="Fetching architecture state from the current backend." />;
  }

  if (status === 'error') {
    return <SectionShell eyebrow="Architecture" title="Architecture load failed" description={error ? error.message : 'Unknown architecture error'} />;
  }

  return (
    <div className="space-y-6">
      <SectionShell
        eyebrow="Architecture"
        title="Architecture workspace"
        description="This workspace now includes a visual system canvas so you can place components, connect them, and then keep the surrounding workflows and constraints documented underneath."
        actions={(
          <>
            <StatusBadge tone="foundation">{project.name}</StatusBadge>
            <StatusBadge tone="migration">{saveStatus === 'saving' ? 'Saving' : 'Ready'}</StatusBadge>
            <ActionButton variant="ghost" onClick={() => setIsFragmentsOpen(true)}>
              {`Load Fragments${activeFragmentCount ? ` (${activeFragmentCount})` : ''}`}
            </ActionButton>
            <ActionButton variant="subtle" onClick={refresh}>Refresh architecture</ActionButton>
            <ActionButton variant="accent" onClick={handleSave} disabled={saveStatus === 'saving'}>
              {saveStatus === 'saving' ? 'Saving...' : 'Save architecture'}
            </ActionButton>
          </>
        )}
      >
        <StatisticsDisclosure>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoTile eyebrow="Components" title={`${editableState.components.length}`} body="Visual nodes that represent parts of the system." />
            <InfoTile eyebrow="Connections" title={`${editableState.componentConnections.length}`} body="Directed links between architecture components." />
            <InfoTile eyebrow="Workflows" title={`${(architecture?.editorState?.applicationWorkflows?.length || 0) + (architecture?.editorState?.architectureWorkflows?.length || 0)}`} body="Application and architecture workflows tracked together." />
            <InfoTile eyebrow="Sub-Arch" title={`${architecture?.editorState?.subArchitectures?.length || 0}`} body="Child or related architectures linked from this one." />
          </div>
        </StatisticsDisclosure>
      </SectionShell>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.8fr)]">
        <SectionShell
          eyebrow="Visual Canvas"
          title="Component flow"
          description="Drag components to reposition them. Drag from one component handle to another to create a connection."
          actions={(
            <>
              <ActionButton variant="subtle" onClick={addComponent}>Add component</ActionButton>
              <ActionButton variant="ghost" onClick={removeSelectedComponent} disabled={!selectedComponentId}>Remove component</ActionButton>
              <ActionButton variant="ghost" onClick={removeSelectedConnection} disabled={!selectedConnectionId}>Remove connection</ActionButton>
            </>
          )}
        >
          <ArchitectureCanvas
            components={editableState.components}
            connections={editableState.componentConnections}
            selectedComponentId={selectedComponentId}
            selectedConnectionId={selectedConnectionId}
            onSelectComponent={(componentId) => {
              setSelectedConnectionId(null);
              setSelectedComponentId(componentId);
            }}
            onSelectConnection={(connectionId) => {
              setSelectedComponentId(null);
              setSelectedConnectionId(connectionId);
            }}
            onMoveComponent={moveComponent}
            onConnectComponents={connectComponents}
          />
        </SectionShell>

        <div className="space-y-4">
          <SurfaceCard>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100/60">Inspector</p>
            {selectedComponent ? (
              <div className="mt-4 space-y-3">
                <ArchitectureInput
                  label="Component Name"
                  stableId={selectedComponent.stableId}
                  sourceRefs={selectedComponent.sourceRefs}
                  workItemLookup={workItemLookup}
                  value={selectedComponent.title}
                  onChange={(event) => updateComponent(selectedComponent.id, { title: event.target.value })}
                />
                <ArchitectureInput
                  label="Component Kind"
                  help="Examples: frontend, backend, service, store, external."
                  stableId={selectedComponent.stableId}
                  sourceRefs={selectedComponent.sourceRefs}
                  workItemLookup={workItemLookup}
                  value={selectedComponent.kind || ''}
                  onChange={(event) => updateComponent(selectedComponent.id, { kind: event.target.value })}
                />
                <ArchitectureTextArea
                  label="Component Description"
                  rows={5}
                  stableId={selectedComponent.stableId}
                  sourceRefs={selectedComponent.sourceRefs}
                  workItemLookup={workItemLookup}
                  value={selectedComponent.description || ''}
                  onChange={(event) => updateComponent(selectedComponent.id, { description: event.target.value })}
                />
              </div>
            ) : selectedConnection ? (
              <div className="mt-4 space-y-3">
                <p className="text-sm leading-6 text-sky-100/75">
                  <span className="font-semibold text-white">{selectedConnection.source || 'Unknown source'}</span>
                  {' -> '}
                  <span className="font-semibold text-white">{selectedConnection.target || 'Unknown target'}</span>
                </p>
                <ArchitectureInput
                  label="Connection Label"
                  help="This label appears in the canvas, Mermaid output, and markdown."
                  stableId={selectedConnection.stableId}
                  sourceRefs={selectedConnection.sourceRefs}
                  workItemLookup={workItemLookup}
                  value={selectedConnection.label || ''}
                  onChange={(event) => updateSelectedConnection({ label: event.target.value })}
                />
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-sky-100/75">
                Select a component or connection in the canvas to edit it here.
              </p>
            )}
          </SurfaceCard>

          <DialogFrame
            eyebrow="Why This Matters"
            title="Architecture is more than text now"
            description="The visual canvas defines the structural map. The structured fields below explain the workflows, constraints, persistence strategy, and module relationships that sit around that map."
          >
            <SurfaceCard className="p-4" tone="muted">
              <p className="text-sm leading-7 text-sky-100/75">
                This gives us the best of both worlds: visual system design for components and connections, plus structured narrative fields for the workflow and decision context that cannot be expressed by boxes alone.
              </p>
            </SurfaceCard>
          </DialogFrame>
        </div>
      </div>

      <SectionShell eyebrow="Structured Editor" title="System design notes" description="These fields support the visual canvas with workflow, scope, persistence, and architecture context.">
        <div className="grid gap-4 md:grid-cols-2">
          <ArchitectureTextArea label="System Purpose" stableId={editableState.overviewItemIds?.systemPurpose} sourceRefs={editableState.overviewItemSourceRefs?.systemPurpose} workItemLookup={workItemLookup} value={editableState.systemPurpose} onChange={(event) => setEditableState((current) => ({ ...current, systemPurpose: event.target.value }))} />
          <ArchitectureTextArea label="Architectural Vision" stableId={editableState.overviewItemIds?.architecturalVision} sourceRefs={editableState.overviewItemSourceRefs?.architecturalVision} workItemLookup={workItemLookup} value={editableState.architecturalVision} onChange={(event) => setEditableState((current) => ({ ...current, architecturalVision: event.target.value }))} />
          <ArchitectureTextArea label="Architectural Style" stableId={editableState.overviewItemIds?.architecturalStyle} sourceRefs={editableState.overviewItemSourceRefs?.architecturalStyle} workItemLookup={workItemLookup} value={editableState.architecturalStyle} onChange={(event) => setEditableState((current) => ({ ...current, architecturalStyle: event.target.value }))} />
          <ArchitectureTextArea label="Primary Architecture" stableId={editableState.structureItemIds?.primaryArchitecture} sourceRefs={editableState.structureItemSourceRefs?.primaryArchitecture} workItemLookup={workItemLookup} value={editableState.primaryArchitecture} onChange={(event) => setEditableState((current) => ({ ...current, primaryArchitecture: event.target.value }))} />
          <ArchitectureTextArea label="Architecture Type" help="Examples: application, system, service, subsystem." stableId={editableState.structureItemIds?.architectureType} sourceRefs={editableState.structureItemSourceRefs?.architectureType} workItemLookup={workItemLookup} value={editableState.architectureType} onChange={(event) => setEditableState((current) => ({ ...current, architectureType: event.target.value }))} />
          <ArchitectureTextArea label="Architecture Scope" help="Examples: single_application, platform, subsystem." stableId={editableState.structureItemIds?.architectureScope} sourceRefs={editableState.structureItemSourceRefs?.architectureScope} workItemLookup={workItemLookup} value={editableState.architectureScope} onChange={(event) => setEditableState((current) => ({ ...current, architectureScope: event.target.value }))} />
          <ArchitectureTextArea label="System Context" stableId={editableState.structureItemIds?.systemContext} sourceRefs={editableState.structureItemSourceRefs?.systemContext} workItemLookup={workItemLookup} value={editableState.systemContext} onChange={(event) => setEditableState((current) => ({ ...current, systemContext: event.target.value }))} />
          <div className="md:col-span-2">
            <StructuredEntryListEditor label="Technology Stack" entries={editableState.techStack} workItemLookup={workItemLookup} onChange={(value) => setEditableState((current) => ({ ...current, techStack: value }))} emptyLabel="No stack entries yet." />
          </div>
          <div className="md:col-span-2">
            <StructuredEntryListEditor label="Sub-Architectures" entries={editableState.subArchitectures} workItemLookup={workItemLookup} onChange={(value) => setEditableState((current) => ({ ...current, subArchitectures: value }))} emptyLabel="No sub-architectures yet." />
          </div>
          <div className="md:col-span-2">
            <StructuredEntryListEditor label="External Dependencies" entries={editableState.externalDependencies} workItemLookup={workItemLookup} onChange={(value) => setEditableState((current) => ({ ...current, externalDependencies: value }))} emptyLabel="No external dependencies yet." />
          </div>
          <div className="md:col-span-2">
            <StructuredEntryListEditor label="Application Workflows" entries={editableState.applicationWorkflows} workItemLookup={workItemLookup} onChange={(value) => setEditableState((current) => ({ ...current, applicationWorkflows: value }))} emptyLabel="No application workflows yet." />
          </div>
          <div className="md:col-span-2">
            <StructuredEntryListEditor label="Architecture Workflows" entries={editableState.architectureWorkflows} workItemLookup={workItemLookup} onChange={(value) => setEditableState((current) => ({ ...current, architectureWorkflows: value }))} emptyLabel="No architecture workflows yet." />
          </div>
          <div className="md:col-span-2">
            <StructuredEntryListEditor label="Module Interdependence" entries={editableState.moduleInteractions} workItemLookup={workItemLookup} onChange={(value) => setEditableState((current) => ({ ...current, moduleInteractions: value }))} emptyLabel="No module interdependence rules yet." />
          </div>
          <div className="md:col-span-2">
            <StructuredEntryListEditor label="Boundaries" entries={editableState.boundaries} workItemLookup={workItemLookup} onChange={(value) => setEditableState((current) => ({ ...current, boundaries: value }))} emptyLabel="No boundaries yet." />
          </div>
          <ArchitectureTextArea label="Persistence Strategy" stableId={editableState.persistenceItemIds?.summary} sourceRefs={editableState.persistenceItemSourceRefs?.summary} workItemLookup={workItemLookup} value={editableState.persistenceSummary} onChange={(event) => setEditableState((current) => ({ ...current, persistenceSummary: event.target.value }))} />
          <ArchitectureTextArea label="Persistence Source of Truth" stableId={editableState.persistenceItemIds?.sourceOfTruth} sourceRefs={editableState.persistenceItemSourceRefs?.sourceOfTruth} workItemLookup={workItemLookup} value={editableState.persistenceSourceOfTruth} onChange={(event) => setEditableState((current) => ({ ...current, persistenceSourceOfTruth: event.target.value }))} />
          <ArchitectureTextArea label="Persistence Sync Expectations" stableId={editableState.persistenceItemIds?.syncExpectations} sourceRefs={editableState.persistenceItemSourceRefs?.syncExpectations} workItemLookup={workItemLookup} value={editableState.persistenceSyncExpectations} onChange={(event) => setEditableState((current) => ({ ...current, persistenceSyncExpectations: event.target.value }))} />
          <div className="md:col-span-2">
            <StructuredEntryListEditor label="Cross-Cutting Concerns" entries={editableState.crossCuttingConcerns} workItemLookup={workItemLookup} onChange={(value) => setEditableState((current) => ({ ...current, crossCuttingConcerns: value }))} emptyLabel="No cross-cutting concerns yet." />
          </div>
          <div className="md:col-span-2">
            <StructuredEntryListEditor label="Decisions" entries={editableState.decisions} workItemLookup={workItemLookup} onChange={(value) => setEditableState((current) => ({ ...current, decisions: value }))} emptyLabel="No decision notes yet." />
          </div>
          <div className="md:col-span-2">
            <StructuredEntryListEditor label="Constraints" entries={editableState.constraints} workItemLookup={workItemLookup} onChange={(value) => setEditableState((current) => ({ ...current, constraints: value }))} emptyLabel="No constraints yet." />
          </div>
          <ArchitectureTextArea label="Runtime Topology" stableId={editableState.deploymentItemIds?.runtimeTopology} sourceRefs={editableState.deploymentItemSourceRefs?.runtimeTopology} workItemLookup={workItemLookup} value={editableState.runtimeTopology} onChange={(event) => setEditableState((current) => ({ ...current, runtimeTopology: event.target.value }))} />
          <div className="md:col-span-2">
            <ArchitectureTextArea label="Environment Notes" rows={5} stableId={editableState.deploymentItemIds?.environmentNotes} sourceRefs={editableState.deploymentItemSourceRefs?.environmentNotes} workItemLookup={workItemLookup} value={editableState.environmentNotes} onChange={(event) => setEditableState((current) => ({ ...current, environmentNotes: event.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <StructuredEntryListEditor label="Open Questions" entries={editableState.openQuestions} workItemLookup={workItemLookup} onChange={(value) => setEditableState((current) => ({ ...current, openQuestions: value }))} emptyLabel="No open questions yet." />
          </div>
        </div>
      </SectionShell>

      <FragmentBrowserModal
        title="Architecture Fragments"
        eyebrow="Fragment Browser"
        isOpen={isFragmentsOpen}
        fragments={fragments}
        onClose={() => setIsFragmentsOpen(false)}
        onIntegrate={(fragment) => consumeArchitectureFragment(fragment)}
        storageKey={`${project.id}-architecture-fragments`}
      />
    </div>
  );
}
