'use client';

import { useEffect, useMemo, useState } from 'react';
import { Background, Controls, MarkerType, MiniMap, ReactFlow } from '@xyflow/react';
import { ActionButton } from '@/components/ui/action-button';
import { DocumentFieldMeta } from '@/components/ui/document-field-meta';
import { FragmentBrowserModal } from '@/components/ui/fragment-browser-modal';
import { InfoTile } from '@/components/ui/info-tile';
import { SectionShell } from '@/components/ui/section-shell';
import { StatisticsDisclosure } from '@/components/ui/statistics-disclosure';
import { StatusBadge } from '@/components/ui/status-badge';
import { StructuredEntryListEditor } from '@/components/ui/structured-entry-list-editor';
import { SurfaceCard } from '@/components/ui/surface-card';
import { FunctionalFlowNode } from '@/features/functional-spec/components/functional-flow-node';
import { useModuleDocument } from '@/features/software/hooks/use-module-document';
import { useProjectWorkItemLookup } from '@/hooks/use-project-work-item-lookup';
import { countActiveFragments } from '@/lib/fragment-utils';

const TABS = [
  { id: 'overview', label: 'Overview', title: 'Executive Summary', description: 'Keep the behavioral intent clear before you get into flow details.' },
  { id: 'flows', label: 'Flows', title: 'Logical Flows', description: 'Design logical flows visually, then let the generated document describe them in strict language.' },
  { id: 'behavior', label: 'Behavior', title: 'User Actions and System Responses', description: 'Map user triggers to the system response they should cause.' },
  { id: 'rules', label: 'Rules', title: 'Rules and Edge Cases', description: 'Capture validation, interface expectations, exceptions, and unresolved questions.' },
  { id: 'preview', label: 'Preview', title: 'Generated Functional Spec', description: 'Review the markdown that will drive fragments and downstream modules.' },
];

const NODE_ORDER = ['start', 'action', 'decision', 'endpoint', 'return'];
const NODE_TYPES = { functionalFlowNode: FunctionalFlowNode };

function createId(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
function flowKey(flow, fallback = '') { return String(flow?.id || flow?.stableId || fallback || '').trim(); }
function nodeType(value) { const normalized = String(value || '').trim().toLowerCase(); return NODE_ORDER.includes(normalized) ? normalized : 'action'; }
function nodeTypeLabel(value) { return { start: 'Start', action: 'Action', decision: 'Decision', endpoint: 'Endpoint', return: 'Return' }[nodeType(value)]; }
function nodePosition(index) { return { x: (index % 3) * 280, y: Math.floor(index / 3) * 180 }; }

function splitLegacyTextToEntries(value) {
  const text = String(value || '').trim();
  if (!text) return [];
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const bullets = lines.filter((line) => /^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line)).map((line) => line.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '').trim()).filter(Boolean);
  const parts = bullets.length ? bullets : text.split(/\n\s*\n/).map((part) => part.replace(/\s+/g, ' ').trim()).filter(Boolean);
  return parts.map((description) => ({ title: '', description }));
}

function normalizeNode(value = {}, index = 0) {
  return {
    id: String(value?.id || createId('functional-node')),
    stableId: String(value?.stableId || ''),
    sourceRefs: Array.isArray(value?.sourceRefs) ? value.sourceRefs : [],
    type: nodeType(value?.type),
    label: String(value?.label || value?.title || '').trim() || `${nodeTypeLabel(value?.type)} ${index + 1}`,
    description: String(value?.description || ''),
    command: String(value?.command || ''),
    versionDate: String(value?.versionDate || ''),
    position: value?.position && Number.isFinite(Number(value.position.x)) && Number.isFinite(Number(value.position.y)) ? { x: Number(value.position.x), y: Number(value.position.y) } : nodePosition(index),
  };
}

function normalizeVisuals(rawVisuals, logicalFlows) {
  const visuals = Array.isArray(rawVisuals) ? rawVisuals : [];
  return (Array.isArray(logicalFlows) ? logicalFlows : []).map((flow, index) => {
    const key = flowKey(flow, `flow-${index + 1}`);
    const stableId = String(flow?.stableId || '').trim();
    const existing = visuals.find((visual) => String(visual?.flowId || '') === key || (stableId && String(visual?.flowStableId || '') === stableId)) || {};
    const nodes = (Array.isArray(existing.nodes) ? existing.nodes : []).map((node, nodeIndex) => normalizeNode(node, nodeIndex));
    const nodeIds = new Set(nodes.map((node) => node.id));
    const edges = (Array.isArray(existing.edges) ? existing.edges : []).map((edge) => ({
      id: String(edge?.id || createId('functional-edge')),
      stableId: String(edge?.stableId || ''),
      sourceRefs: Array.isArray(edge?.sourceRefs) ? edge.sourceRefs : [],
      source: String(edge?.source || edge?.sourceId || ''),
      target: String(edge?.target || edge?.targetId || ''),
      label: String(edge?.label || ''),
      hidden: Boolean(edge?.hidden),
      versionDate: String(edge?.versionDate || ''),
    })).filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target));
    return { flowId: key, flowStableId: stableId, nodes, edges };
  });
}

function deriveEndpoints(logicalFlows, visuals) {
  const titles = new Map((Array.isArray(logicalFlows) ? logicalFlows : []).map((flow, index) => [flowKey(flow, `flow-${index + 1}`), flow.title || `Flow ${index + 1}`]));
  return (Array.isArray(visuals) ? visuals : []).flatMap((visual) => (Array.isArray(visual?.nodes) ? visual.nodes : [])
    .filter((node) => ['endpoint', 'return'].includes(nodeType(node?.type)))
    .map((node) => ({
      id: `derived-endpoint-${node.id}`,
      stableId: node.stableId || '',
      sourceRefs: Array.isArray(node.sourceRefs) ? node.sourceRefs : [],
      title: `${titles.get(String(visual?.flowId || '')) || 'Flow'}: ${node.label || nodeTypeLabel(node.type)}`,
      description: node.description || `${nodeTypeLabel(node.type)} hook point.`,
      versionDate: node.versionDate || '',
    })));
}

function editableStateFromDocument(editorState) {
  const state = editorState || {};
  const logicalFlows = Array.isArray(state.logicalFlows) ? state.logicalFlows : (Array.isArray(state.workflows) ? state.workflows : splitLegacyTextToEntries(state.workingContent));
  return {
    executiveSummary: state.overview?.summary || '',
    executiveSummaryMeta: { stableId: state.overview?.stableId || '', sourceRefs: Array.isArray(state.overview?.sourceRefs) ? state.overview.sourceRefs : [] },
    logicalFlows,
    flowVisuals: normalizeVisuals(state.flowVisuals, logicalFlows),
    flowEndpoints: Array.isArray(state.flowEndpoints) ? state.flowEndpoints : (Array.isArray(state.endpoints) ? state.endpoints : []),
    userActionsAndSystemResponses: Array.isArray(state.userActionsAndSystemResponses) ? state.userActionsAndSystemResponses : (Array.isArray(state.userActionResponses) ? state.userActionResponses : []),
    validationRules: Array.isArray(state.validationRules) ? state.validationRules : [],
    interfaceExpectations: Array.isArray(state.interfaceExpectations) ? state.interfaceExpectations : [],
    edgeCases: Array.isArray(state.edgeCases) ? state.edgeCases : [],
    openQuestions: Array.isArray(state.openQuestions) ? state.openQuestions : splitLegacyTextToEntries(state.openQuestions),
  };
}

function buildEditorState(editableState, currentState) {
  const derived = deriveEndpoints(editableState.logicalFlows, editableState.flowVisuals);
  const seen = new Set();
  const flowEndpoints = [...derived, ...(Array.isArray(editableState.flowEndpoints) ? editableState.flowEndpoints : [])].filter((entry, index) => {
    const key = String(entry?.stableId || `${entry?.title || ''}::${entry?.description || ''}` || `endpoint-${index}`).trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return {
    ...(currentState || {}),
    overview: { ...(currentState?.overview || {}), summary: editableState.executiveSummary, stableId: editableState.executiveSummaryMeta?.stableId, sourceRefs: editableState.executiveSummaryMeta?.sourceRefs, versionDate: new Date().toISOString() },
    logicalFlows: editableState.logicalFlows,
    flowVisuals: editableState.flowVisuals,
    flowEndpoints,
    userActionsAndSystemResponses: editableState.userActionsAndSystemResponses,
    validationRules: editableState.validationRules,
    interfaceExpectations: editableState.interfaceExpectations,
    edgeCases: editableState.edgeCases,
    openQuestions: editableState.openQuestions,
    fragmentHistory: Array.isArray(currentState?.fragmentHistory) ? currentState.fragmentHistory : [],
  };
}

function Canvas({ nodes, edges, selectedNodeId, selectedEdgeId, onSelectNode, onSelectEdge, onMoveNode, onConnectNodes }) {
  const canvasNodes = useMemo(() => (Array.isArray(nodes) ? nodes : []).map((node, index) => ({ id: node.id, type: 'functionalFlowNode', position: node.position || nodePosition(index), data: { node }, selected: node.id === selectedNodeId })), [nodes, selectedNodeId]);
  const canvasEdges = useMemo(() => (Array.isArray(edges) ? edges : []).map((edge) => ({ id: edge.id, source: edge.source, target: edge.target, label: edge.label || '', labelStyle: { fill: 'rgb(var(--color-ink))', fontWeight: 700, fontSize: 12 }, labelBgStyle: { fill: 'rgba(255,255,255,0.92)', fillOpacity: 0.96 }, labelBgPadding: [6, 4], labelBgBorderRadius: 999, type: 'step', markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 }, style: { strokeWidth: edge.id === selectedEdgeId ? 2.4 : 1.8, stroke: edge.id === selectedEdgeId ? 'rgba(34, 211, 238, 0.95)' : 'rgba(148, 163, 184, 0.88)' }, hidden: Boolean(edge.hidden), selected: edge.id === selectedEdgeId })), [edges, selectedEdgeId]);
  return (
    <div className="h-[34rem] rounded-[1.4rem] border border-white/10 bg-slate/40">
      <ReactFlow nodes={canvasNodes} edges={canvasEdges} nodeTypes={NODE_TYPES} fitView fitViewOptions={{ padding: 0.18 }} proOptions={{ hideAttribution: true }} minZoom={0.35} onlyRenderVisibleElements onNodeClick={(_, node) => onSelectNode?.(node.id)} onEdgeClick={(_, edge) => onSelectEdge?.(edge.id)} onPaneClick={() => { onSelectNode?.(null); onSelectEdge?.(null); }} onNodeDragStop={(_, node) => onMoveNode?.(node.id, { x: node.position.x, y: node.position.y })} onConnect={(params) => onConnectNodes?.(params)}>
        <MiniMap pannable zoomable />
        <Background gap={20} size={1} color="rgba(148, 163, 184, 0.16)" />
        <Controls showInteractive={false} position="bottom-right" />
      </ReactFlow>
    </div>
  );
}

function FunctionalSpecTextArea({ label, help, rows = 6, value, onChange, stableId = '', sourceRefs = [], workItemLookup = {} }) {
  return (
    <SurfaceCard className="space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-white">{label}</p>
        {help ? <p className="text-sm leading-6 text-sky-100/72">{help}</p> : null}
      </div>
      <textarea
        rows={rows}
        className="min-h-32 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm leading-6 text-white outline-none focus:border-accent/60"
        value={value}
        onChange={onChange}
      />
      <DocumentFieldMeta stableId={stableId} sourceRefs={sourceRefs} workItemLookup={workItemLookup} />
    </SurfaceCard>
  );
}

function FlowSelectorButton({ flow, active, nodeCount, onClick, workItemLookup = {} }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-[1.2rem] border px-4 py-3 text-left transition',
        active
          ? 'border-cyan-200/80 bg-cyan-200/12 shadow-[0_0_0_1px_rgba(186,230,253,0.15)]'
          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{flow?.title || 'Untitled flow'}</p>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-sky-100/70">{flow?.description || 'No flow description yet.'}</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/6 px-2 py-1 text-[11px] font-semibold tracking-[0.12em] text-sky-100/70">
          {nodeCount} nodes
        </span>
      </div>
      <div className="mt-3">
        <DocumentFieldMeta stableId={flow?.stableId} sourceRefs={flow?.sourceRefs} workItemLookup={workItemLookup} />
      </div>
    </button>
  );
}

export function FunctionalSpecWorkspace({ project, module }) {
  const { documentState, fragments, status, error, saveStatus, refresh, saveModuleDocument, consumeModuleFragment } = useModuleDocument(project, 'functional_spec', Boolean(project?.id));
  const { byCode: workItemLookup } = useProjectWorkItemLookup(project, Boolean(project?.id));
  const [editableState, setEditableState] = useState(() => editableStateFromDocument(null));
  const [isFragmentsOpen, setIsFragmentsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [selectedFlowKey, setSelectedFlowKey] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const activeFragmentCount = countActiveFragments(fragments);

  useEffect(() => { if (documentState?.editorState) setEditableState(editableStateFromDocument(documentState.editorState)); }, [documentState]);
  useEffect(() => {
    const keys = editableState.logicalFlows.map((flow, index) => flowKey(flow, `flow-${index + 1}`)).filter(Boolean);
    if (!keys.length) { if (selectedFlowKey) setSelectedFlowKey(''); return; }
    if (!selectedFlowKey || !keys.includes(selectedFlowKey)) { setSelectedFlowKey(keys[0]); setSelectedNodeId(null); setSelectedEdgeId(null); }
  }, [editableState.logicalFlows, selectedFlowKey]);

  const activeTabMeta = useMemo(() => TABS.find((tab) => tab.id === activeTab) || TABS[0], [activeTab]);
  const selectedFlow = useMemo(() => editableState.logicalFlows.find((flow, index) => flowKey(flow, `flow-${index + 1}`) === selectedFlowKey) || null, [editableState.logicalFlows, selectedFlowKey]);
  const selectedVisual = useMemo(() => editableState.flowVisuals.find((visual) => String(visual?.flowId || '') === selectedFlowKey) || null, [editableState.flowVisuals, selectedFlowKey]);
  const selectedNode = useMemo(() => (selectedVisual?.nodes || []).find((node) => node.id === selectedNodeId) || null, [selectedVisual, selectedNodeId]);
  const selectedEdge = useMemo(() => (selectedVisual?.edges || []).find((edge) => edge.id === selectedEdgeId) || null, [selectedVisual, selectedEdgeId]);
  const hookPoints = useMemo(() => deriveEndpoints(editableState.logicalFlows, editableState.flowVisuals), [editableState.logicalFlows, editableState.flowVisuals]);

  async function handleSave() { await saveModuleDocument(buildEditorState(editableState, documentState?.editorState), null); }
  function updateVisual(key, updater) { setEditableState((current) => ({ ...current, flowVisuals: current.flowVisuals.map((visual) => String(visual?.flowId || '') === key ? updater(visual) : visual) })); }
  function addNode(type) { if (!selectedFlowKey) return; updateVisual(selectedFlowKey, (visual) => ({ ...visual, nodes: [...visual.nodes, { id: createId('functional-node'), stableId: '', sourceRefs: [], type, label: ['start', 'endpoint', 'return'].includes(type) ? nodeTypeLabel(type) : '', description: '', command: '', versionDate: '', position: nodePosition(visual.nodes.length) }] })); }
  function updateNode(updates) { if (!selectedFlowKey || !selectedNodeId) return; updateVisual(selectedFlowKey, (visual) => ({ ...visual, nodes: visual.nodes.map((node) => node.id === selectedNodeId ? { ...node, ...updates } : node) })); }
  function removeNode() { if (!selectedFlowKey || !selectedNodeId) return; updateVisual(selectedFlowKey, (visual) => ({ ...visual, nodes: visual.nodes.filter((node) => node.id !== selectedNodeId), edges: visual.edges.filter((edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId) })); setSelectedNodeId(null); }
  function updateEdge(updates) { if (!selectedFlowKey || !selectedEdgeId) return; updateVisual(selectedFlowKey, (visual) => ({ ...visual, edges: visual.edges.map((edge) => edge.id === selectedEdgeId ? { ...edge, ...updates } : edge) })); }
  function removeEdge() { if (!selectedFlowKey || !selectedEdgeId) return; updateVisual(selectedFlowKey, (visual) => ({ ...visual, edges: visual.edges.filter((edge) => edge.id !== selectedEdgeId) })); setSelectedEdgeId(null); }
  function moveNode(nodeId, position) { updateVisual(selectedFlowKey, (visual) => ({ ...visual, nodes: visual.nodes.map((node) => node.id === nodeId ? { ...node, position } : node) })); }
  function connectNodes(params) {
    const source = String(params?.source || '').trim();
    const target = String(params?.target || '').trim();
    if (!selectedFlowKey || !source || !target || source === target) return;
    updateVisual(selectedFlowKey, (visual) => visual.edges.some((edge) => edge.source === source && edge.target === target) ? visual : { ...visual, edges: [...visual.edges, { id: createId('functional-edge'), stableId: '', sourceRefs: [], source, target, label: '', hidden: false, versionDate: '' }] });
  }

  if (status === 'loading' || status === 'idle') return <SectionShell eyebrow="Functional Spec" title="Loading functional spec..." description="Fetching the current managed functional behavior model." />;
  if (status === 'error') return <SectionShell eyebrow="Functional Spec" title="Functional spec load failed" description={error ? error.message : 'Unknown functional spec error'} />;

  return (
    <div className="space-y-6">
      <SectionShell eyebrow="Functional Spec" title="Functional behavior workspace" description={module?.description || 'Define logical flows, endpoints, and behavioral rules in a structured form that later modules can consume.'} actions={<><StatusBadge tone="foundation">{project.name}</StatusBadge><StatusBadge tone="migration">{saveStatus === 'saving' ? 'Saving' : 'Ready'}</StatusBadge><ActionButton variant="ghost" onClick={() => setIsFragmentsOpen(true)}>{`Load Fragments${activeFragmentCount ? ` (${activeFragmentCount})` : ''}`}</ActionButton><ActionButton variant="subtle" onClick={refresh}>Refresh</ActionButton><ActionButton variant="accent" onClick={handleSave} disabled={saveStatus === 'saving'}>{saveStatus === 'saving' ? 'Saving...' : 'Save Functional Spec'}</ActionButton></>}>
        <StatisticsDisclosure>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoTile eyebrow="Fragments" title={`${activeFragmentCount}`} body="Pending functional spec fragments ready for review and integration." />
            <InfoTile eyebrow="History" title={`${documentState?.editorState?.fragmentHistory?.length || 0}`} body="Integrated fragments recorded in functional spec state." />
            <InfoTile eyebrow="Flows" title={`${editableState.logicalFlows.length}`} body="Logical flows currently defined for this project." />
            <InfoTile eyebrow="Hook Points" title={`${hookPoints.length}`} body="Endpoint and return nodes currently available for cross-module attachment." />
          </div>
        </StatisticsDisclosure>
      </SectionShell>

      <SectionShell eyebrow="Structured Editor" title={activeTabMeta.title} description={activeTabMeta.description}>
        <div className="flex flex-wrap gap-2">{TABS.map((tab) => <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={['rounded-full border px-3 py-2 text-xs font-semibold tracking-[0.12em] transition', tab.id === activeTab ? 'border-cyan-200/80 bg-cyan-200 text-slate shadow-[0_0_0_1px_rgba(186,230,253,0.2)]' : 'border-white/10 bg-white/5 text-sky-100/65 hover:border-white/20 hover:bg-white/10 hover:text-white'].join(' ')}>{tab.label}</button>)}</div>
        <div className="mt-5 space-y-4">
          {activeTab === 'overview' ? <FunctionalSpecTextArea label="Executive Summary" rows={6} help="Describe the behavioral scope this functional spec is defining, without dropping into implementation details." stableId={editableState.executiveSummaryMeta?.stableId} sourceRefs={editableState.executiveSummaryMeta?.sourceRefs} workItemLookup={workItemLookup} value={editableState.executiveSummary} onChange={(event) => setEditableState((current) => ({ ...current, executiveSummary: event.target.value }))} /> : null}

          {activeTab === 'flows' ? (
            <div className="space-y-5">
              <StructuredEntryListEditor label="Logical Flows" help="Define the top-level flows first. Each one gets its own visual canvas below." entries={editableState.logicalFlows} onChange={(logicalFlows) => setEditableState((current) => ({ ...current, logicalFlows, flowVisuals: normalizeVisuals(current.flowVisuals, logicalFlows) }))} workItemLookup={workItemLookup} primaryLabel="Flow Name" primaryPlaceholder="Save PRD document state" secondaryLabel="Flow Description" secondaryPlaceholder="Validate the change, persist state, regenerate managed output, and return the updated result." emptyLabel="No logical flows defined yet." />
              {editableState.logicalFlows.length ? (
                <>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{editableState.logicalFlows.map((flow, index) => { const key = flowKey(flow, `flow-${index + 1}`); const visual = editableState.flowVisuals.find((entry) => String(entry?.flowId || '') === key); return <FlowSelectorButton key={key} flow={flow} active={key === selectedFlowKey} nodeCount={visual?.nodes?.length || 0} workItemLookup={workItemLookup} onClick={() => { setSelectedFlowKey(key); setSelectedNodeId(null); setSelectedEdgeId(null); }} />; })}</div>
                  {selectedFlow && selectedVisual ? (
                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_360px]">
                      <div className="space-y-4">
                        <SurfaceCard>
                          <div className="flex flex-wrap gap-2">
                            <ActionButton variant="subtle" onClick={() => addNode('start')}>Add Start</ActionButton>
                            <ActionButton variant="subtle" onClick={() => addNode('action')}>Add Action</ActionButton>
                            <ActionButton variant="subtle" onClick={() => addNode('decision')}>Add Decision</ActionButton>
                            <ActionButton variant="subtle" onClick={() => addNode('endpoint')}>Add Endpoint</ActionButton>
                            <ActionButton variant="subtle" onClick={() => addNode('return')}>Add Return</ActionButton>
                          </div>
                          <p className="mt-3 text-sm leading-6 text-sky-100/72">Drag nodes to place them. Drag from one node handle to another to connect the flow. Endpoint and return nodes become hook points other modules can attach to later.</p>
                        </SurfaceCard>
                        <Canvas nodes={selectedVisual.nodes} edges={selectedVisual.edges} selectedNodeId={selectedNodeId} selectedEdgeId={selectedEdgeId} onSelectNode={(nodeId) => { setSelectedNodeId(nodeId); setSelectedEdgeId(null); }} onSelectEdge={(edgeId) => { setSelectedEdgeId(edgeId); setSelectedNodeId(null); }} onMoveNode={moveNode} onConnectNodes={connectNodes} />
                      </div>
                      <div className="space-y-4">
                        <SurfaceCard><p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100/60">Selected Flow</p><h3 className="mt-3 text-lg font-semibold text-white">{selectedFlow.title || 'Untitled flow'}</h3><p className="mt-2 text-sm leading-6 text-sky-100/75">{selectedFlow.description || 'No flow description yet.'}</p></SurfaceCard>
                        {selectedNode ? <SurfaceCard className="space-y-3"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100/60">Selected Node</p><label className="space-y-2 text-sm text-sky-100/75"><span className="font-medium text-white">Node Type</span><select className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-accent/60" value={selectedNode.type} onChange={(event) => updateNode({ type: event.target.value })}>{NODE_ORDER.map((type) => <option key={type} value={type}>{nodeTypeLabel(type)}</option>)}</select></label><label className="space-y-2 text-sm text-sky-100/75"><span className="font-medium text-white">Label</span><input className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-accent/60" value={selectedNode.label} onChange={(event) => updateNode({ label: event.target.value })} /></label><label className="space-y-2 text-sm text-sky-100/75"><span className="font-medium text-white">Description</span><textarea rows={4} className="min-h-24 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-accent/60" value={selectedNode.description} onChange={(event) => updateNode({ description: event.target.value })} /></label><label className="space-y-2 text-sm text-sky-100/75"><span className="font-medium text-white">Command / Intent</span><input className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-accent/60" placeholder="Open, save, validate, retry..." value={selectedNode.command} onChange={(event) => updateNode({ command: event.target.value })} /></label><DocumentFieldMeta stableId={selectedNode.stableId} sourceRefs={selectedNode.sourceRefs} workItemLookup={workItemLookup} /><ActionButton variant="ghost" onClick={removeNode}>Delete Node</ActionButton></SurfaceCard> : null}
                        {selectedEdge ? <SurfaceCard className="space-y-3"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100/60">Selected Connection</p><label className="space-y-2 text-sm text-sky-100/75"><span className="font-medium text-white">Label</span><input className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-accent/60" placeholder="success, failure, yes, no..." value={selectedEdge.label} onChange={(event) => updateEdge({ label: event.target.value })} /></label><label className="flex items-center gap-2 text-sm text-sky-100/75"><input type="checkbox" checked={Boolean(selectedEdge.hidden)} onChange={(event) => updateEdge({ hidden: event.target.checked })} /><span>Hide this connection in the canvas</span></label><DocumentFieldMeta stableId={selectedEdge.stableId} sourceRefs={selectedEdge.sourceRefs} workItemLookup={workItemLookup} /><ActionButton variant="ghost" onClick={removeEdge}>Delete Connection</ActionButton></SurfaceCard> : null}
                        <SurfaceCard><p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100/60">Hook Points</p><div className="mt-3 space-y-3">{hookPoints.filter((entry) => entry.title.startsWith(`${selectedFlow.title || 'Untitled flow'}:`)).length ? hookPoints.filter((entry) => entry.title.startsWith(`${selectedFlow.title || 'Untitled flow'}:`)).map((entry) => <div key={entry.id} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3"><p className="text-sm font-semibold text-white">{entry.title}</p><p className="mt-1 text-xs leading-5 text-sky-100/70">{entry.description}</p><p className="mt-2 text-[11px] font-mono text-sky-100/45">ID: {entry.stableId || 'pending-save'}</p></div>) : <p className="text-sm leading-6 text-sky-100/68">Add endpoint or return nodes to create hook points other modules can attach to later.</p>}</div></SurfaceCard>
                      </div>
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
          ) : null}

          {activeTab === 'behavior' ? <>
            <StructuredEntryListEditor label="User Actions and System Responses" help="Title should be the user action. Description should be the system response that follows." entries={editableState.userActionsAndSystemResponses} onChange={(userActionsAndSystemResponses) => setEditableState((current) => ({ ...current, userActionsAndSystemResponses }))} workItemLookup={workItemLookup} primaryLabel="User Action" primaryPlaceholder="User clicks Save" secondaryLabel="System Response" secondaryPlaceholder="Persist the change, regenerate the managed document, and show confirmation." emptyLabel="No user actions and system responses defined yet." />
            <StructuredEntryListEditor label="Interface Expectations" help="Capture interface-facing expectations without turning this into a visual design document." entries={editableState.interfaceExpectations} onChange={(interfaceExpectations) => setEditableState((current) => ({ ...current, interfaceExpectations }))} workItemLookup={workItemLookup} primaryLabel="Expectation" primaryPlaceholder="Expose a clear saved-state indicator" secondaryLabel="Description" secondaryPlaceholder="Users should be able to tell when a flow completed and whether more action is needed." emptyLabel="No interface expectations defined yet." />
          </> : null}

          {activeTab === 'rules' ? <>
            <StructuredEntryListEditor label="Validation Rules" help="Define the rules that must hold true for the flow to proceed or complete successfully." entries={editableState.validationRules} onChange={(validationRules) => setEditableState((current) => ({ ...current, validationRules }))} workItemLookup={workItemLookup} primaryLabel="Rule Name" primaryPlaceholder="Require a writable project workspace" secondaryLabel="Rule Description" secondaryPlaceholder="Reject the flow if the target workspace path is missing or cannot be written." emptyLabel="No validation rules defined yet." />
            <StructuredEntryListEditor label="Edge Cases" help="Capture failure paths, exceptional conditions, or alternate branches that the flow must handle." entries={editableState.edgeCases} onChange={(edgeCases) => setEditableState((current) => ({ ...current, edgeCases }))} workItemLookup={workItemLookup} primaryLabel="Edge Case" primaryPlaceholder="Fragment target item is missing" secondaryLabel="Expected Handling" secondaryPlaceholder="Show a review-needed state instead of silently writing the change into the wrong section." emptyLabel="No edge cases defined yet." />
            <StructuredEntryListEditor label="Open Questions" help="Keep unresolved behavior questions visible while the spec is still evolving." entries={editableState.openQuestions} onChange={(openQuestions) => setEditableState((current) => ({ ...current, openQuestions }))} workItemLookup={workItemLookup} primaryLabel="Question" primaryPlaceholder="Should manual edits always create a rationale prompt?" secondaryLabel="Context" secondaryPlaceholder="This affects how strongly the workflow should push ADR creation." emptyLabel="No open questions yet." />
          </> : null}

          {activeTab === 'preview' ? <SurfaceCard tone="muted"><pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap text-sm leading-6 text-sky-100/80">{documentState?.markdown || 'No generated functional spec markdown yet.'}</pre></SurfaceCard> : null}
        </div>
      </SectionShell>

      <FragmentBrowserModal title="Functional Spec Fragments" eyebrow="Fragment Browser" isOpen={isFragmentsOpen} fragments={fragments} onClose={() => setIsFragmentsOpen(false)} onIntegrate={(fragment) => consumeModuleFragment(fragment)} storageKey={`${project.id}-functional-spec-fragments`} />
    </div>
  );
}
