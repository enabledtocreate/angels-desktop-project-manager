'use client';

import { useEffect, useMemo, useState } from 'react';
import { ActionButton } from '@/components/ui/action-button';
import { DocumentFieldMeta } from '@/components/ui/document-field-meta';
import { FragmentBrowserModal } from '@/components/ui/fragment-browser-modal';
import { InfoTile } from '@/components/ui/info-tile';
import { SectionShell } from '@/components/ui/section-shell';
import { StatisticsDisclosure } from '@/components/ui/statistics-disclosure';
import { StatusBadge } from '@/components/ui/status-badge';
import { StructuredEntryListEditor } from '@/components/ui/structured-entry-list-editor';
import { SurfaceCard } from '@/components/ui/surface-card';
import { FunctionalFlowchartCanvas } from '@/features/functional-spec/components/flowchart/functional-flowchart-interface';
import { WorkflowNodeIcon } from '@/features/functional-spec/components/flowchart/workflow-node-visuals';
import { useModuleDocument } from '@/features/software/hooks/use-module-document';
import { ProjectFamilyDocumentContext } from '@/features/workspace/components/project-family-document-context';
import { useProjectWorkItemLookup } from '@/hooks/use-project-work-item-lookup';
import { countActiveFragments } from '@/lib/fragment-utils';

const TABS = [
  { id: 'overview', label: 'Overview', title: 'Executive Summary', description: 'Keep the behavioral intent clear before you get into flow details.' },
  { id: 'flows', label: 'Flows', title: 'Logical Flows', description: 'Design logical flows visually, then let the generated document describe them in strict language.' },
  { id: 'preview', label: 'Preview', title: 'Generated Functional Spec', description: 'Review the markdown that will drive fragments and downstream modules.' },
];

const NODE_ORDER = ['start', 'user_action', 'system_action', 'decision', 'validation', 'loop', 'input', 'output', 'endpoint', 'return', 'error_path', 'log_audit', 'external_interaction', 'formula', 'model_reference', 'open_question'];
const EDGE_TYPES = ['continue', 'if_then', 'else', 'loop_until', 'on_success', 'on_failure', 'returns_to', 'emits', 'consumes'];
const NODE_DRAG_DATA_TYPE = 'application/x-apm-functional-node';

function createId(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
function flowKey(flow, fallback = '') { return String(flow?.id || flow?.stableId || fallback || '').trim(); }
function nodeType(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'action') return 'system_action';
  return NODE_ORDER.includes(normalized) ? normalized : 'system_action';
}
function nodeTypeLabel(value) {
  return {
    start: 'Start',
    user_action: 'User Action',
    system_action: 'System Action',
    action: 'Action',
    decision: 'Decision',
    validation: 'Validation',
    loop: 'Loop',
    input: 'Input',
    output: 'Output',
    endpoint: 'Endpoint',
    return: 'Return',
    error_path: 'Error Path',
    log_audit: 'Log / Audit',
    external_interaction: 'External Interaction',
    formula: 'Formula',
    model_reference: 'Model Reference',
    open_question: 'Open Question',
  }[nodeType(value)] || 'Action';
}
function edgeType(value) { const normalized = String(value || '').trim().toLowerCase(); return EDGE_TYPES.includes(normalized) ? normalized : 'continue'; }
function edgeTypeLabel(value) {
  return {
    continue: 'Continue',
    if_then: 'If / Then',
    else: 'Else',
    loop_until: 'Loop Until',
    on_success: 'On Success',
    on_failure: 'On Failure',
    returns_to: 'Returns To',
    emits: 'Emits',
    consumes: 'Consumes',
  }[edgeType(value)] || 'Continue';
}
function nodePosition(index) { return { x: (index % 3) * 280, y: Math.floor(index / 3) * 180 }; }
function normalizeDesignerId(value, prefix) {
  const current = String(value || '').trim();
  return current || createId(prefix);
}
function areaKey(area, index = 0) { return String(area?.id || area?.stableId || `area-${index + 1}`).trim(); }
function areaTitle(area, index = 0) { return String(area?.title || area?.name || `Functional Area ${index + 1}`).trim(); }
function isSpecialHierarchyKey(value) { return ['all', 'shared', 'unassigned'].includes(String(value || '')); }
function hierarchyKeyForArea(area, index) { return `area:${areaKey(area, index)}`; }
function hierarchyKeyForFlow(flow, index) { return `flow:${flowKey(flow, `flow-${index + 1}`)}`; }
function selectedHierarchyType(value) {
  const key = String(value || 'all');
  if (key.startsWith('area:')) return 'area';
  if (key.startsWith('flow:')) return 'flow';
  return isSpecialHierarchyKey(key) ? key : 'all';
}
function selectedHierarchyValue(value) {
  const key = String(value || '');
  return key.includes(':') ? key.slice(key.indexOf(':') + 1) : key;
}
function normalizeAreaEntries(items) {
  return (Array.isArray(items) ? items : []).map((area, index) => ({
    ...(area && typeof area === 'object' ? area : {}),
    id: normalizeDesignerId(area?.id || area?.stableId, 'functional-area'),
    title: String(area?.title || area?.name || '').trim(),
    description: String(area?.description || area?.summary || ''),
    parentAreaId: String(area?.parentAreaId || area?.parentAreaStableId || ''),
    collapsed: Boolean(area?.collapsed),
  }));
}
function normalizeFlowEntries(items) {
  return (Array.isArray(items) ? items : []).map((flow, index) => ({
    ...(flow && typeof flow === 'object' ? flow : {}),
    id: normalizeDesignerId(flow?.id || flow?.stableId, 'functional-flow'),
    title: String(flow?.title || flow?.name || '').trim(),
    description: String(flow?.description || flow?.summary || ''),
    functionalAreaId: String(flow?.functionalAreaId || flow?.functionalAreaStableId || ''),
    isShared: Boolean(flow?.isShared),
    hiddenInDesigner: Boolean(flow?.hiddenInDesigner),
  }));
}
function descendantAreaKeys(areas, rootKey) {
  const allAreas = Array.isArray(areas) ? areas : [];
  const childrenByParent = new Map();
  allAreas.forEach((area, index) => {
    const parent = String(area?.parentAreaId || '');
    if (!childrenByParent.has(parent)) childrenByParent.set(parent, []);
    childrenByParent.get(parent).push(areaKey(area, index));
  });
  const result = new Set([rootKey]);
  const visit = (key) => {
    (childrenByParent.get(key) || []).forEach((childKey) => {
      if (result.has(childKey)) return;
      result.add(childKey);
      visit(childKey);
    });
  };
  visit(rootKey);
  return result;
}
function buildAreaChildrenMap(areas) {
  const map = new Map();
  (Array.isArray(areas) ? areas : []).forEach((area, index) => {
    const parent = String(area?.parentAreaId || '');
    if (!map.has(parent)) map.set(parent, []);
    map.get(parent).push({ area, index, key: areaKey(area, index) });
  });
  return map;
}
function flowAreaKey(flow) { return String(flow?.functionalAreaId || flow?.functionalAreaStableId || ''); }
function flowMatchesHierarchy(flow, flowIndex, hierarchyKey, areas) {
  const type = selectedHierarchyType(hierarchyKey);
  const value = selectedHierarchyValue(hierarchyKey);
  if (flow?.hiddenInDesigner) return false;
  if (type === 'all') return true;
  if (type === 'shared') return Boolean(flow?.isShared);
  if (type === 'unassigned') return !flowAreaKey(flow);
  if (type === 'flow') return flowKey(flow, `flow-${flowIndex + 1}`) === value;
  if (type === 'area') return descendantAreaKeys(areas, value).has(flowAreaKey(flow));
  return true;
}
function layoutNodes(nodes = [], edges = []) {
  const nodeList = Array.isArray(nodes) ? nodes : [];
  const incoming = new Map(nodeList.map((node) => [node.id, 0]));
  const outgoing = new Map(nodeList.map((node) => [node.id, []]));
  (Array.isArray(edges) ? edges : []).forEach((edge) => {
    if (!incoming.has(edge.target) || !outgoing.has(edge.source)) return;
    incoming.set(edge.target, (incoming.get(edge.target) || 0) + 1);
    outgoing.get(edge.source).push(edge.target);
  });
  const levels = new Map();
  const queue = nodeList.filter((node) => !incoming.get(node.id)).map((node) => node.id);
  nodeList.forEach((node) => {
    if (!queue.includes(node.id) && String(node.type || '') === 'start') queue.unshift(node.id);
  });
  if (!queue.length && nodeList[0]) queue.push(nodeList[0].id);
  while (queue.length) {
    const id = queue.shift();
    const currentLevel = levels.get(id) || 0;
    (outgoing.get(id) || []).forEach((targetId) => {
      const nextLevel = Math.max(levels.get(targetId) || 0, currentLevel + 1);
      levels.set(targetId, nextLevel);
      incoming.set(targetId, (incoming.get(targetId) || 1) - 1);
      if ((incoming.get(targetId) || 0) <= 0) queue.push(targetId);
    });
  }
  const buckets = new Map();
  nodeList.forEach((node, index) => {
    const level = levels.has(node.id) ? levels.get(node.id) : Math.floor(index / 3);
    if (!buckets.has(level)) buckets.set(level, []);
    buckets.get(level).push(node.id);
  });
  return nodeList.map((node, index) => {
    const level = levels.has(node.id) ? levels.get(node.id) : Math.floor(index / 3);
    const lane = (buckets.get(level) || []).indexOf(node.id);
    return {
      ...node,
      position: {
        x: level * 340,
        y: lane * 190,
      },
    };
  });
}

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
    width: Number.isFinite(Number(value?.width)) ? Number(value.width) : undefined,
    height: Number.isFinite(Number(value?.height)) ? Number(value.height) : undefined,
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
      sourceHandle: String(edge?.sourceHandle || 'output'),
      targetHandle: String(edge?.targetHandle || 'input'),
      type: edgeType(edge?.type),
      label: String(edge?.label || ''),
      conditionText: String(edge?.conditionText || ''),
      parsedExpressionHint: edge?.parsedExpressionHint || null,
      draft: Boolean(edge?.draft),
      hidden: Boolean(edge?.hidden),
      versionDate: String(edge?.versionDate || ''),
    })).filter((edge) => (
      (edge.source || edge.target)
      && (!edge.source || nodeIds.has(edge.source))
      && (!edge.target || nodeIds.has(edge.target))
    ));
    return { flowId: key, flowStableId: stableId, nodes, edges };
  });
}

function deriveEndpoints(logicalFlows, visuals) {
  const titles = new Map((Array.isArray(logicalFlows) ? logicalFlows : []).map((flow, index) => [flowKey(flow, `flow-${index + 1}`), flow.title || `Flow ${index + 1}`]));
  return (Array.isArray(visuals) ? visuals : []).flatMap((visual) => (Array.isArray(visual?.nodes) ? visual.nodes : [])
    .filter((node) => ['endpoint', 'return'].includes(nodeType(node?.type)))
    .map((node) => {
      const nodeStableId = String(node.stableId || '').trim();
      return {
        id: `derived-endpoint-${node.id}`,
        stableId: nodeStableId ? `${nodeStableId}-endpoint` : '',
        sourceRefs: Array.isArray(node.sourceRefs) ? node.sourceRefs : [],
        title: `${titles.get(String(visual?.flowId || '')) || 'Flow'}: ${node.label || nodeTypeLabel(node.type)}`,
        description: node.description || `${nodeTypeLabel(node.type)} hook point.`,
        versionDate: node.versionDate || '',
      };
    }));
}

function editableStateFromDocument(editorState) {
  const state = editorState || {};
  const logicalFlows = normalizeFlowEntries(Array.isArray(state.logicalFlows) ? state.logicalFlows : (Array.isArray(state.workflows) ? state.workflows : splitLegacyTextToEntries(state.workingContent)));
  return {
    executiveSummary: state.overview?.summary || '',
    executiveSummaryMeta: { stableId: state.overview?.stableId || '', sourceRefs: Array.isArray(state.overview?.sourceRefs) ? state.overview.sourceRefs : [] },
    functionalAreas: normalizeAreaEntries(state.functionalAreas),
    logicalFlows,
    crossProjectFlows: Array.isArray(state.crossProjectFlows) ? state.crossProjectFlows : [],
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
  const logicalFlows = normalizeFlowEntries(editableState.logicalFlows);
  const functionalAreas = normalizeAreaEntries(editableState.functionalAreas);
  const derived = deriveEndpoints(logicalFlows, editableState.flowVisuals);
  const endpointNodeStableIds = new Set();
  (Array.isArray(editableState.flowVisuals) ? editableState.flowVisuals : []).forEach((visual) => {
    (Array.isArray(visual?.nodes) ? visual.nodes : []).forEach((node) => {
      if (!['endpoint', 'return'].includes(nodeType(node?.type))) return;
      const stableId = String(node?.stableId || '').trim();
      if (stableId) endpointNodeStableIds.add(stableId);
    });
  });
  const normalizeEndpoint = (entry) => {
    const id = String(entry?.id || '').trim();
    const stableId = String(entry?.stableId || '').trim();
    if (id.startsWith('derived-endpoint-') && stableId && endpointNodeStableIds.has(stableId) && !stableId.endsWith('-endpoint')) {
      return { ...entry, stableId: `${stableId}-endpoint` };
    }
    return entry;
  };
  const seen = new Set();
  const flowEndpoints = [...derived, ...(Array.isArray(editableState.flowEndpoints) ? editableState.flowEndpoints : [])].map(normalizeEndpoint).filter((entry, index) => {
    const key = String(entry?.stableId || `${entry?.title || ''}::${entry?.description || ''}` || `endpoint-${index}`).trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return {
    ...(currentState || {}),
    overview: { ...(currentState?.overview || {}), summary: editableState.executiveSummary, stableId: editableState.executiveSummaryMeta?.stableId, sourceRefs: editableState.executiveSummaryMeta?.sourceRefs, versionDate: new Date().toISOString() },
    functionalAreas,
    logicalFlows,
    crossProjectFlows: editableState.crossProjectFlows,
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

function WorkflowActionPalette({ onAddNode }) {
  const actionTypes = NODE_ORDER.filter((type) => !['open_question'].includes(type));
  return (
    <SurfaceCard className="space-y-3">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100/60">Workflow Node Actions</p>
        <p className="text-sm leading-6 text-sky-100/72">Add descriptive control points to the selected logical flow. These are not code; they are structured intent for the generated Functional Spec.</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {actionTypes.map((type) => (
          <button
            key={type}
            type="button"
            draggable
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = 'copy';
              event.dataTransfer.setData(NODE_DRAG_DATA_TYPE, type);
              event.dataTransfer.setData('text/plain', type);
            }}
            onClick={() => onAddNode(type)}
            className="group flex cursor-grab items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-left transition active:cursor-grabbing hover:border-cyan-200/45 hover:bg-cyan-200/10"
          >
            <span className="rounded-xl border border-white/10 bg-white/10 p-2 text-cyan-100 group-hover:text-white">
              <WorkflowNodeIcon type={type} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-white">{nodeTypeLabel(type)}</span>
              <span className="block truncate text-[11px] uppercase tracking-[0.12em] text-sky-100/45">{type.replace(/_/g, ' ')}</span>
            </span>
          </button>
        ))}
      </div>
    </SurfaceCard>
  );
}

function FunctionalAreaTree({
  areas,
  flows,
  selectedHierarchyKey,
  selectedFlowKey,
  onSelectHierarchy,
  onSelectFlow,
  onToggleAreaCollapse,
}) {
  const childrenByParent = useMemo(() => buildAreaChildrenMap(areas), [areas]);
  const flowsByArea = useMemo(() => {
    const map = new Map();
    (Array.isArray(flows) ? flows : []).forEach((flow, index) => {
      const key = flowAreaKey(flow);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push({ flow, index, key: flowKey(flow, `flow-${index + 1}`) });
    });
    return map;
  }, [flows]);

  function renderArea(entry, depth = 0) {
    const area = entry.area;
    const key = entry.key;
    const childAreas = childrenByParent.get(key) || [];
    const areaFlows = flowsByArea.get(key) || [];
    const selected = selectedHierarchyKey === `area:${key}`;
    const collapsed = Boolean(area?.collapsed);
    return (
      <div key={key} className="space-y-1">
        <div className="flex items-center gap-1" style={{ paddingLeft: depth * 12 }}>
          <button
            type="button"
            onClick={() => onToggleAreaCollapse?.(key)}
            className="h-7 w-7 rounded-lg border border-white/10 bg-white/5 text-xs font-bold text-sky-100/65 hover:bg-white/10"
            aria-label={collapsed ? 'Expand functional area' : 'Collapse functional area'}
          >
            {childAreas.length || areaFlows.length ? (collapsed ? '+' : '-') : ''}
          </button>
          <button
            type="button"
            onClick={() => onSelectHierarchy(`area:${key}`)}
            className={['min-w-0 flex-1 rounded-xl border px-3 py-2 text-left transition', selected ? 'border-cyan-200/70 bg-cyan-200/14 text-white' : 'border-white/10 bg-white/5 text-sky-100/72 hover:border-white/20 hover:bg-white/10'].join(' ')}
          >
            <span className="block truncate text-sm font-semibold">{areaTitle(area, entry.index)}</span>
            <span className="block text-[11px] uppercase tracking-[0.12em] text-sky-100/45">{areaFlows.length} direct flows</span>
          </button>
        </div>
        {!collapsed ? (
          <div className="space-y-1">
            {areaFlows.map((flowEntry) => renderFlow(flowEntry, depth + 1))}
            {childAreas.map((child) => renderArea(child, depth + 1))}
          </div>
        ) : null}
      </div>
    );
  }

  function renderFlow(entry, depth = 0) {
    const selected = selectedFlowKey === entry.key && selectedHierarchyKey === `flow:${entry.key}`;
    return (
      <button
        key={entry.key}
        type="button"
        onClick={() => { onSelectFlow(entry.key); onSelectHierarchy(`flow:${entry.key}`); }}
        className={['flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left transition', selected ? 'border-cyan-200/70 bg-cyan-200/12 text-white' : 'border-white/10 bg-white/[0.03] text-sky-100/68 hover:border-white/20 hover:bg-white/10'].join(' ')}
        style={{ paddingLeft: 18 + depth * 12 }}
      >
        <WorkflowNodeIcon type="system_action" className="shrink-0 text-sky-100/55" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{entry.flow?.title || 'Untitled flow'}</span>
          <span className="block text-[11px] uppercase tracking-[0.12em] text-sky-100/40">{entry.flow?.isShared ? 'shared flow' : 'flow'}</span>
        </span>
        {entry.flow?.hiddenInDesigner ? <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-sky-100/50">hidden</span> : null}
      </button>
    );
  }

  const rootAreas = childrenByParent.get('') || [];
  const unassigned = flowsByArea.get('') || [];
  const sharedCount = (Array.isArray(flows) ? flows : []).filter((flow) => flow?.isShared && !flow?.hiddenInDesigner).length;
  return (
    <SurfaceCard className="space-y-3">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100/60">Functional Area Hierarchy</p>
        <p className="text-sm leading-6 text-sky-100/70">Click an area to load all descendant flows. Click a flow to isolate it.</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          ['all', 'All'],
          ['shared', `Shared (${sharedCount})`],
          ['unassigned', 'Unassigned'],
        ].map(([key, label]) => (
          <button key={key} type="button" onClick={() => onSelectHierarchy(key)} className={['rounded-xl border px-2 py-2 text-xs font-semibold transition', selectedHierarchyKey === key ? 'border-cyan-200/70 bg-cyan-200/14 text-white' : 'border-white/10 bg-white/5 text-sky-100/65 hover:bg-white/10'].join(' ')}>
            {label}
          </button>
        ))}
      </div>
      <div className="max-h-[34rem] space-y-2 overflow-auto pr-1">
        {rootAreas.map((entry) => renderArea(entry))}
        {unassigned.length ? (
          <div className="space-y-1 border-t border-white/10 pt-2">
            {unassigned.map((entry) => renderFlow(entry))}
          </div>
        ) : null}
        {!rootAreas.length && !unassigned.length ? <p className="text-sm leading-6 text-sky-100/65">No areas or flows have been defined yet.</p> : null}
      </div>
    </SurfaceCard>
  );
}

function FlowCanvasGroup({ flow, visual, selectedFlowKey, selectedNodeId, selectedEdgeId, hookPoints, workItemLookup, onSelectFlow, onSelectNode, onSelectEdge, onMoveNode, onResizeNode, onConnectNodes, onCreateNode, onDeleteNode, onRemoveEdge, onLayoutFlow, onUpdateFlow }) {
  const key = String(visual?.flowId || '');
  const selected = key === selectedFlowKey;
  const flowHookPoints = hookPoints.filter((entry) => entry.title.startsWith(`${flow?.title || 'Untitled flow'}:`));
  return (
    <div className={['rounded-[1.6rem] border p-3 shadow-panel', selected ? 'border-cyan-200/55 bg-cyan-200/[0.06]' : 'border-white/10 bg-white/[0.035]'].join(' ')}>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <button type="button" className="min-w-0 text-left" onClick={() => onSelectFlow(key)}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100/55">{flow?.isShared ? 'Shared Logical Flow' : 'Logical Flow'}</p>
          <h3 className="mt-1 truncate text-lg font-semibold text-white">{flow?.title || 'Untitled flow'}</h3>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-sky-100/72">{flow?.description || 'No flow description yet.'}</p>
        </button>
        <div className="flex flex-wrap gap-2">
          <ActionButton variant="subtle" onClick={() => onLayoutFlow(key)}>Clean Layout</ActionButton>
          <ActionButton variant="ghost" onClick={() => onUpdateFlow(key, { hiddenInDesigner: true })}>Hide Flow</ActionButton>
        </div>
      </div>
      <FunctionalFlowchartCanvas
        nodes={visual?.nodes || []}
        edges={visual?.edges || []}
        selectedNodeId={selected ? selectedNodeId : null}
        selectedEdgeId={selected ? selectedEdgeId : null}
        onSelectNode={(nodeId) => { onSelectFlow(key); onSelectNode(nodeId); }}
        onSelectEdge={(edgeId) => { onSelectFlow(key); onSelectEdge(edgeId); }}
        onMoveNode={(nodeId, position) => onMoveNode(key, nodeId, position)}
        onResizeNode={(nodeId, size) => onResizeNode(key, nodeId, size)}
        onConnectNodes={(params) => onConnectNodes(key, params)}
        onCreateNode={(type, position) => onCreateNode(key, type, position)}
        onDeleteNode={(nodeId) => onDeleteNode(key, nodeId)}
        onRemoveEdge={(edgeId) => onRemoveEdge(key, edgeId)}
      />
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <DocumentFieldMeta stableId={flow?.stableId} sourceRefs={flow?.sourceRefs} workItemLookup={workItemLookup} />
        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-100/50">Hook Points</p>
          <p className="mt-1 text-sm text-sky-100/72">{flowHookPoints.length ? `${flowHookPoints.length} endpoint / return hooks available.` : 'Add endpoint or return nodes to create hook points.'}</p>
        </div>
      </div>
    </div>
  );
}

export function FunctionalSpecWorkspace({ project, module }) {
  const { documentState, fragments, status, error, saveStatus, refresh, saveModuleDocument, consumeModuleFragment } = useModuleDocument(project, 'functional_spec', Boolean(project?.id));
  const { byCode: workItemLookup } = useProjectWorkItemLookup(project, Boolean(project?.id));
  const [editableState, setEditableState] = useState(() => editableStateFromDocument(null));
  const [isFragmentsOpen, setIsFragmentsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [selectedFlowKey, setSelectedFlowKey] = useState('');
  const [selectedHierarchyKey, setSelectedHierarchyKey] = useState('all');
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
  const visibleFlowEntries = useMemo(() => editableState.logicalFlows
    .map((flow, index) => {
      const key = flowKey(flow, `flow-${index + 1}`);
      const visual = editableState.flowVisuals.find((entry) => String(entry?.flowId || '') === key);
      return { flow, index, key, visual };
    })
    .filter((entry) => flowMatchesHierarchy(entry.flow, entry.index, selectedHierarchyKey, editableState.functionalAreas)), [editableState.logicalFlows, editableState.flowVisuals, editableState.functionalAreas, selectedHierarchyKey]);

  useEffect(() => {
    if (!visibleFlowEntries.length) return;
    if (!visibleFlowEntries.some((entry) => entry.key === selectedFlowKey)) {
      setSelectedFlowKey(visibleFlowEntries[0].key);
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
    }
  }, [visibleFlowEntries, selectedFlowKey]);

  async function handleSave() { await saveModuleDocument(buildEditorState(editableState, documentState?.editorState), null); }
  function updateSelectedFlow(updates) {
    if (!selectedFlowKey) return;
    updateFlowByKey(selectedFlowKey, updates);
  }
  function updateFlowByKey(key, updates) {
    if (!key) return;
    setEditableState((current) => ({
      ...current,
      logicalFlows: current.logicalFlows.map((flow, index) => (
        flowKey(flow, `flow-${index + 1}`) === key
          ? { ...flow, ...updates, versionDate: new Date().toISOString() }
          : flow
      )),
    }));
  }
  function updateVisual(key, updater) { setEditableState((current) => ({ ...current, flowVisuals: current.flowVisuals.map((visual) => String(visual?.flowId || '') === key ? updater(visual) : visual) })); }
  function addNodeToFlow(flowKeyValue, type, position = null) {
    const key = flowKeyValue || selectedFlowKey;
    if (!key) return;
    updateVisual(key, (visual) => ({
      ...visual,
      nodes: [...visual.nodes, {
        id: createId('functional-node'),
        stableId: '',
        sourceRefs: [],
        type,
        label: ['start', 'endpoint', 'return', 'input', 'output'].includes(type) ? nodeTypeLabel(type) : '',
        description: '',
        command: '',
        versionDate: '',
        width: 230,
        height: 130,
        position: position || nodePosition(visual.nodes.length),
      }],
    }));
  }
  function addNode(type) { addNodeToFlow(selectedFlowKey, type); }
  function updateNode(updates) { if (!selectedFlowKey || !selectedNodeId) return; updateVisual(selectedFlowKey, (visual) => ({ ...visual, nodes: visual.nodes.map((node) => node.id === selectedNodeId ? { ...node, ...updates } : node) })); }
  function deleteNodePreservingEdges(flowKeyValue, nodeId) {
    const key = flowKeyValue || selectedFlowKey;
    if (!key || !nodeId) return;
    updateVisual(key, (visual) => ({
      ...visual,
      nodes: visual.nodes.filter((node) => node.id !== nodeId),
      edges: visual.edges
        .map((edge) => ({
          ...edge,
          source: edge.source === nodeId ? '' : edge.source,
          target: edge.target === nodeId ? '' : edge.target,
          draft: edge.source === nodeId || edge.target === nodeId ? true : edge.draft,
        }))
        .filter((edge) => edge.source || edge.target),
    }));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  }
  function removeNode() { if (!selectedFlowKey || !selectedNodeId) return; deleteNodePreservingEdges(selectedFlowKey, selectedNodeId); }
  function updateEdge(updates) { if (!selectedFlowKey || !selectedEdgeId) return; updateVisual(selectedFlowKey, (visual) => ({ ...visual, edges: visual.edges.map((edge) => edge.id === selectedEdgeId ? { ...edge, ...updates } : edge) })); }
  function removeEdge() { if (!selectedFlowKey || !selectedEdgeId) return; updateVisual(selectedFlowKey, (visual) => ({ ...visual, edges: visual.edges.filter((edge) => edge.id !== selectedEdgeId) })); setSelectedEdgeId(null); }
  function removeEdgeFromFlow(flowKeyValue, edgeId) {
    if (!flowKeyValue || !edgeId) return;
    updateVisual(flowKeyValue, (visual) => ({ ...visual, edges: visual.edges.filter((edge) => edge.id !== edgeId) }));
    if (selectedEdgeId === edgeId) setSelectedEdgeId(null);
  }
  function moveNode(flowKeyValue, nodeId, position) { updateVisual(flowKeyValue || selectedFlowKey, (visual) => ({ ...visual, nodes: visual.nodes.map((node) => node.id === nodeId ? { ...node, position } : node) })); }
  function resizeNode(flowKeyValue, nodeId, size) { updateVisual(flowKeyValue || selectedFlowKey, (visual) => ({ ...visual, nodes: visual.nodes.map((node) => node.id === nodeId ? { ...node, ...size } : node) })); }
  function layoutFlow(flowKeyValue) { updateVisual(flowKeyValue || selectedFlowKey, (visual) => ({ ...visual, nodes: layoutNodes(visual.nodes, visual.edges) })); }
  function layoutVisibleFlows() { visibleFlowEntries.forEach((entry) => layoutFlow(entry.key)); }
  function toggleAreaCollapse(key) {
    setEditableState((current) => ({
      ...current,
      functionalAreas: current.functionalAreas.map((area, index) => areaKey(area, index) === key ? { ...area, collapsed: !area.collapsed } : area),
    }));
  }
  function connectNodes(flowKeyValue, params) {
    const source = String(params?.source || '').trim();
    const target = String(params?.target || '').trim();
    const sourceHandle = String(params?.sourceHandle || 'output');
    const targetHandle = String(params?.targetHandle || 'input');
    const type = edgeType(params?.type);
    const draft = Boolean(params?.draft);
    const replaceDraft = Boolean(params?.replaceDraft);
    const key = flowKeyValue || selectedFlowKey;
    if (!key || (!source && !target) || (source && target && source === target)) return;
    const nextEdge = { id: createId('functional-edge'), stableId: '', sourceRefs: [], source, target, sourceHandle, targetHandle, type, label: '', conditionText: '', parsedExpressionHint: null, draft, hidden: false, versionDate: '' };
    updateVisual(key, (visual) => {
      const hasCompleteDuplicate = source && target && visual.edges.some((edge) => edge.source === source && edge.target === target && !edge.draft);
      if (hasCompleteDuplicate) {
        if (!replaceDraft) return visual;
        return {
          ...visual,
          edges: visual.edges.filter((edge) => !(
            edge.draft
            && ((source && edge.source === source && !edge.target) || (target && edge.target === target && !edge.source))
          )),
        };
      }
      if (replaceDraft) {
        let replaced = false;
        const edges = visual.edges.map((edge) => {
          const matchesSourceDraft = source && edge.draft && edge.source === source && !edge.target;
          const matchesTargetDraft = target && edge.draft && edge.target === target && !edge.source;
          if (!replaced && (matchesSourceDraft || matchesTargetDraft)) {
            replaced = true;
            return { ...nextEdge, draft: false };
          }
          return edge;
        });
        return replaced ? { ...visual, edges } : { ...visual, edges: [...edges, { ...nextEdge, draft: false }] };
      }
      const hasDraftDuplicate = draft && visual.edges.some((edge) => edge.draft && edge.source === source && edge.target === target);
      if (hasDraftDuplicate) return visual;
      return { ...visual, edges: [...visual.edges, nextEdge] };
    });
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

      <ProjectFamilyDocumentContext project={project} moduleLabel="Functional Spec" />

      <SectionShell eyebrow="Workflow Designer" title={activeTabMeta.title} description={activeTabMeta.description}>
        <div className="flex flex-wrap gap-2">{TABS.map((tab) => <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={['rounded-full border px-3 py-2 text-xs font-semibold tracking-[0.12em] transition', tab.id === activeTab ? 'border-cyan-200/80 bg-cyan-200 text-slate shadow-[0_0_0_1px_rgba(186,230,253,0.2)]' : 'border-white/10 bg-white/5 text-sky-100/65 hover:border-white/20 hover:bg-white/10 hover:text-white'].join(' ')}>{tab.label}</button>)}</div>
        <div className="mt-5 space-y-4">
          {activeTab === 'overview' ? (
            <div className="space-y-4">
              <FunctionalSpecTextArea label="Executive Summary" rows={6} help="Describe the behavioral scope this functional spec is defining, without dropping into implementation details." stableId={editableState.executiveSummaryMeta?.stableId} sourceRefs={editableState.executiveSummaryMeta?.sourceRefs} workItemLookup={workItemLookup} value={editableState.executiveSummary} onChange={(event) => setEditableState((current) => ({ ...current, executiveSummary: event.target.value }))} />
              <StructuredEntryListEditor label="Cross-Project Flow Attachments" help="Use this when a workflow in this project starts in, ends in, or coordinates with a parent project or sibling child project." entries={editableState.crossProjectFlows} onChange={(crossProjectFlows) => setEditableState((current) => ({ ...current, crossProjectFlows }))} workItemLookup={workItemLookup} primaryLabel="Attachment Title" primaryPlaceholder="Settings flow hands off to platform authentication" secondaryLabel="Attachment Description" secondaryPlaceholder="The parent platform invokes this child flow, then control returns through a shared endpoint after authentication succeeds." emptyLabel="No cross-project flow attachments defined yet." />
              <SurfaceCard className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100/60">Unattached Functional Notes</p>
                <p className="text-sm leading-6 text-sky-100/72">Use this only for functional details that cannot yet be attached to a flow node, edge, or group. Prefer modeling user actions, validation, interface expectations, and edge cases directly in the flowchart.</p>
              </SurfaceCard>
              <StructuredEntryListEditor label="Unattached User Actions and System Responses" help="Use only when the behavior cannot yet be represented as User Action and System Action nodes connected in a flow." entries={editableState.userActionsAndSystemResponses} onChange={(userActionsAndSystemResponses) => setEditableState((current) => ({ ...current, userActionsAndSystemResponses }))} workItemLookup={workItemLookup} primaryLabel="Action / Response Title" primaryPlaceholder="Import fragment confirmation" secondaryLabel="Behavior Description" secondaryPlaceholder="When a fragment is imported, the system confirms the source file, target module, and integration result." emptyLabel="No unattached user action or system response notes defined yet." />
              <StructuredEntryListEditor label="Unattached Validation Rules" help="Use only when the rule cannot yet be represented as a Validation node or condition on an edge." entries={editableState.validationRules} onChange={(validationRules) => setEditableState((current) => ({ ...current, validationRules }))} workItemLookup={workItemLookup} primaryLabel="Rule Title" primaryPlaceholder="Required title and description" secondaryLabel="Rule Description" secondaryPlaceholder="The system must reject incomplete structured entries before saving generated documentation." emptyLabel="No unattached validation rules defined yet." />
              <StructuredEntryListEditor label="Unattached Interface Expectations" help="Use only when the expectation cannot yet be attached to a user action, input, output, endpoint, error path, or flow group." entries={editableState.interfaceExpectations} onChange={(interfaceExpectations) => setEditableState((current) => ({ ...current, interfaceExpectations }))} workItemLookup={workItemLookup} primaryLabel="Expectation Title" primaryPlaceholder="Visible save state" secondaryLabel="Expectation Description" secondaryPlaceholder="The interface must show whether changes are saved, saving, or blocked by validation." emptyLabel="No unattached interface expectations defined yet." />
              <StructuredEntryListEditor label="Unattached Edge Cases" help="Use only when the exception cannot yet be represented as a branch, error path, alternate path, or attached open question in a flow." entries={editableState.edgeCases} onChange={(edgeCases) => setEditableState((current) => ({ ...current, edgeCases }))} workItemLookup={workItemLookup} primaryLabel="Edge Case Title" primaryPlaceholder="Missing target document" secondaryLabel="Expected Behavior" secondaryPlaceholder="If a target document is missing, the system regenerates it from the database-backed module state." emptyLabel="No unattached edge cases defined yet." />
              <StructuredEntryListEditor label="Unattached Open Questions" help="Use only for questions that are not yet attached to a flow node, edge, group, or endpoint." entries={editableState.openQuestions} onChange={(openQuestions) => setEditableState((current) => ({ ...current, openQuestions }))} workItemLookup={workItemLookup} primaryLabel="Question Title" primaryPlaceholder="Fragment conflict strategy" secondaryLabel="Question Detail" secondaryPlaceholder="Should conflicting fragments create a review task automatically or block integration?" emptyLabel="No unattached open questions defined yet." />
            </div>
          ) : null}

          {activeTab === 'flows' ? (
            <div className="space-y-5">
              <StructuredEntryListEditor label="Functional Areas" help="Group related workflows into application areas. Use the hierarchy panel below to nest areas under each other." entries={editableState.functionalAreas} onChange={(functionalAreas) => setEditableState((current) => ({ ...current, functionalAreas: normalizeAreaEntries(functionalAreas) }))} workItemLookup={workItemLookup} primaryLabel="Functional Area" primaryPlaceholder="Fragment Management" secondaryLabel="Area Summary" secondaryPlaceholder="Flows for discovering, reviewing, consuming, and archiving fragments." emptyLabel="No functional areas defined yet." />
              <StructuredEntryListEditor label="Logical Flows" help="Define reusable logical flows. The hierarchy panel controls which flows are visible in the canvas area." entries={editableState.logicalFlows} onChange={(logicalFlows) => setEditableState((current) => { const nextFlows = normalizeFlowEntries(logicalFlows); return { ...current, logicalFlows: nextFlows, flowVisuals: normalizeVisuals(current.flowVisuals, nextFlows) }; })} workItemLookup={workItemLookup} primaryLabel="Flow Name" primaryPlaceholder="Save PRD document state" secondaryLabel="Flow Description" secondaryPlaceholder="Validate the change, persist state, regenerate managed output, and return the updated result." emptyLabel="No logical flows defined yet." />
              {editableState.logicalFlows.length ? (
                <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
                  <div className="space-y-4">
                    <FunctionalAreaTree areas={editableState.functionalAreas} flows={editableState.logicalFlows} selectedHierarchyKey={selectedHierarchyKey} selectedFlowKey={selectedFlowKey} onSelectHierarchy={(key) => { setSelectedHierarchyKey(key); setSelectedNodeId(null); setSelectedEdgeId(null); }} onSelectFlow={(key) => { setSelectedFlowKey(key); setSelectedNodeId(null); setSelectedEdgeId(null); }} onToggleAreaCollapse={toggleAreaCollapse} />
                    {selectedFlow ? <SurfaceCard className="space-y-3"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100/60">Selected Flow</p><h3 className="text-lg font-semibold text-white">{selectedFlow.title || 'Untitled flow'}</h3><p className="text-sm leading-6 text-sky-100/75">{selectedFlow.description || 'No flow description yet.'}</p><label className="space-y-2 text-sm text-sky-100/75"><span className="font-medium text-white">Functional Area</span><select className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-accent/60" value={selectedFlow.functionalAreaId || ''} onChange={(event) => updateSelectedFlow({ functionalAreaId: event.target.value })}><option value="">Unassigned</option>{editableState.functionalAreas.map((area, index) => { const key = areaKey(area, index); return <option key={key} value={key}>{areaTitle(area, index)}</option>; })}</select></label><label className="space-y-2 text-sm text-sky-100/75"><span className="font-medium text-white">Parent Area</span><select className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-accent/60" value={(editableState.functionalAreas.find((area, index) => areaKey(area, index) === selectedFlow.functionalAreaId) || {})?.parentAreaId || ''} onChange={(event) => { const flowArea = selectedFlow.functionalAreaId || ''; setEditableState((current) => ({ ...current, functionalAreas: current.functionalAreas.map((area, index) => areaKey(area, index) === flowArea ? { ...area, parentAreaId: event.target.value } : area) })); }}><option value="">Top level</option>{editableState.functionalAreas.filter((area, index) => areaKey(area, index) !== selectedFlow.functionalAreaId).map((area, index) => { const key = areaKey(area, index); return <option key={key} value={key}>{areaTitle(area, index)}</option>; })}</select></label><label className="flex items-center gap-2 text-sm text-sky-100/75"><input type="checkbox" checked={Boolean(selectedFlow.isShared)} onChange={(event) => updateSelectedFlow({ isShared: event.target.checked })} /><span>Shared reusable flow</span></label><label className="flex items-center gap-2 text-sm text-sky-100/75"><input type="checkbox" checked={Boolean(selectedFlow.hiddenInDesigner)} onChange={(event) => updateSelectedFlow({ hiddenInDesigner: event.target.checked })} /><span>Hide / exclude from current designer views</span></label><DocumentFieldMeta stableId={selectedFlow.stableId} sourceRefs={selectedFlow.sourceRefs} workItemLookup={workItemLookup} /></SurfaceCard> : null}
                    <SurfaceCard className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100/60">Hidden Flows</p>
                      <div className="space-y-2">
                        {editableState.logicalFlows.filter((flow) => flow.hiddenInDesigner).length ? editableState.logicalFlows.filter((flow) => flow.hiddenInDesigner).map((flow, index) => {
                          const key = flowKey(flow, `flow-${index + 1}`);
                          return <button key={key} type="button" onClick={() => updateFlowByKey(key, { hiddenInDesigner: false })} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-sky-100/70 hover:bg-white/10">Show {flow.title || 'Untitled flow'}</button>;
                        }) : <p className="text-sm leading-6 text-sky-100/65">No flows hidden from the designer view.</p>}
                      </div>
                    </SurfaceCard>
                  </div>
                  <div className="space-y-4">
                    <SurfaceCard className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm leading-6 text-sky-100/72">Showing {visibleFlowEntries.length} flow{visibleFlowEntries.length === 1 ? '' : 's'} for this hierarchy selection. Drag nodes live; resize selected nodes from their handles.</p>
                      <ActionButton variant="accent" onClick={layoutVisibleFlows}>Clean Visible Layouts</ActionButton>
                    </SurfaceCard>
                    {visibleFlowEntries.length ? visibleFlowEntries.map((entry) => (
                      <FlowCanvasGroup
                        key={entry.key}
                        flow={entry.flow}
                        visual={entry.visual}
                        selectedFlowKey={selectedFlowKey}
                        selectedNodeId={selectedNodeId}
                        selectedEdgeId={selectedEdgeId}
                        hookPoints={hookPoints}
                        workItemLookup={workItemLookup}
                        onSelectFlow={(key) => { setSelectedFlowKey(key); setSelectedNodeId(null); setSelectedEdgeId(null); }}
                        onSelectNode={(nodeId) => { setSelectedNodeId(nodeId); setSelectedEdgeId(null); }}
                        onSelectEdge={(edgeId) => { setSelectedEdgeId(edgeId); setSelectedNodeId(null); }}
                        onMoveNode={moveNode}
                        onResizeNode={resizeNode}
                        onConnectNodes={connectNodes}
                        onCreateNode={addNodeToFlow}
                        onDeleteNode={deleteNodePreservingEdges}
                        onRemoveEdge={removeEdgeFromFlow}
                        onLayoutFlow={layoutFlow}
                        onUpdateFlow={updateFlowByKey}
                      />
                    )) : <SurfaceCard><p className="text-sm leading-6 text-sky-100/70">No visible flows match this hierarchy selection. Select a different area or unhide a flow.</p></SurfaceCard>}
                    <WorkflowActionPalette onAddNode={addNode} />
                    <div className="grid gap-4 xl:grid-cols-2">
                    {selectedNode ? <SurfaceCard className="space-y-3"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100/60">Selected Node</p><label className="space-y-2 text-sm text-sky-100/75"><span className="font-medium text-white">Node Type</span><select className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-accent/60" value={selectedNode.type} onChange={(event) => updateNode({ type: event.target.value })}>{NODE_ORDER.map((type) => <option key={type} value={type}>{nodeTypeLabel(type)}</option>)}</select></label><label className="space-y-2 text-sm text-sky-100/75"><span className="font-medium text-white">Label</span><input className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-accent/60" value={selectedNode.label} onChange={(event) => updateNode({ label: event.target.value })} /></label><label className="space-y-2 text-sm text-sky-100/75"><span className="font-medium text-white">Description</span><textarea rows={4} className="min-h-24 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-accent/60" value={selectedNode.description} onChange={(event) => updateNode({ description: event.target.value })} /></label><label className="space-y-2 text-sm text-sky-100/75"><span className="font-medium text-white">Command / Intent</span><input className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-accent/60" placeholder="Open, save, validate, retry..." value={selectedNode.command} onChange={(event) => updateNode({ command: event.target.value })} /></label><DocumentFieldMeta stableId={selectedNode.stableId} sourceRefs={selectedNode.sourceRefs} workItemLookup={workItemLookup} /><ActionButton variant="ghost" onClick={removeNode}>Delete Node</ActionButton></SurfaceCard> : null}
                    {selectedEdge ? <SurfaceCard className="space-y-3"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100/60">Selected Connection</p><label className="space-y-2 text-sm text-sky-100/75"><span className="font-medium text-white">Connection Type</span><select className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-accent/60" value={selectedEdge.type || 'continue'} onChange={(event) => updateEdge({ type: event.target.value })}>{EDGE_TYPES.map((type) => <option key={type} value={type}>{edgeTypeLabel(type)}</option>)}</select></label><label className="space-y-2 text-sm text-sky-100/75"><span className="font-medium text-white">Label</span><input className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-accent/60" placeholder="success, failure, yes, no..." value={selectedEdge.label} onChange={(event) => updateEdge({ label: event.target.value })} /></label><label className="space-y-2 text-sm text-sky-100/75"><span className="font-medium text-white">Condition / Logic Hint</span><textarea rows={3} className="min-h-20 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-accent/60" placeholder="If @model.field is greater than..." value={selectedEdge.conditionText || ''} onChange={(event) => updateEdge({ conditionText: event.target.value })} /></label><label className="flex items-center gap-2 text-sm text-sky-100/75"><input type="checkbox" checked={Boolean(selectedEdge.hidden)} onChange={(event) => updateEdge({ hidden: event.target.checked })} /><span>Hide this connection in the canvas</span></label><DocumentFieldMeta stableId={selectedEdge.stableId} sourceRefs={selectedEdge.sourceRefs} workItemLookup={workItemLookup} /><ActionButton variant="ghost" onClick={removeEdge}>Delete Connection</ActionButton></SurfaceCard> : null}
                    <SurfaceCard className="xl:col-span-2"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100/60">Shared Flow References</p><div className="mt-3 space-y-2">{editableState.logicalFlows.filter((flow) => flow.isShared).length ? editableState.logicalFlows.filter((flow) => flow.isShared).map((flow, index) => { const area = editableState.functionalAreas.find((entry, areaIndex) => areaKey(entry, areaIndex) === flowAreaKey(flow)); return <div key={flowKey(flow, `shared-flow-${index}`)} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3"><p className="text-sm font-semibold text-white">{flow.title || 'Untitled shared flow'}</p><p className="mt-1 text-xs leading-5 text-sky-100/70">Referenced by {area ? areaTitle(area) : 'Unassigned'}.</p></div>; }) : <p className="text-sm leading-6 text-sky-100/68">Mark a flow as shared to track where it is reused.</p>}</div></SurfaceCard>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {activeTab === 'preview' ? <SurfaceCard tone="muted"><pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap text-sm leading-6 text-sky-100/80">{documentState?.markdown || 'No generated functional spec markdown yet.'}</pre></SurfaceCard> : null}
        </div>
      </SectionShell>

      <FragmentBrowserModal title="Functional Spec Fragments" eyebrow="Fragment Browser" isOpen={isFragmentsOpen} fragments={fragments} onClose={() => setIsFragmentsOpen(false)} onIntegrate={(fragment) => consumeModuleFragment(fragment)} storageKey={`${project.id}-functional-spec-fragments`} />
    </div>
  );
}
