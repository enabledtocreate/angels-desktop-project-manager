'use client';

import { useEffect, useMemo, useState } from 'react';
import { ProjectLinkIcons } from '@/components/ui/project-link-icons';
import { ActionButton } from '@/components/ui/action-button';
import { StatusBadge } from '@/components/ui/status-badge';
import { SurfaceCard } from '@/components/ui/surface-card';
import { ArchitectureWorkspace } from '@/features/architecture/components/architecture-workspace';
import { AiEnvironmentWorkspace } from '@/features/ai/components/ai-environment-workspace';
import { AdrWorkspace } from '@/features/adr/components/adr-workspace';
import { BugsWorkspace } from '@/features/bugs/components/bugs-workspace';
import { ChangelogWorkspace } from '@/features/changelog/components/changelog-workspace';
import { DatabaseSchemaWorkspace } from '@/features/database-schema/components/database-schema-workspace';
import { DomainModelsWorkspace } from '@/features/domain-models/components/domain-models-workspace';
import { FeaturesWorkspace } from '@/features/features/components/features-workspace';
import { FunctionalSpecWorkspace } from '@/features/functional-spec/components/functional-spec-workspace';
import { PrdWorkspace } from '@/features/prd/components/prd-workspace';
import { RoadmapWorkspace } from '@/features/roadmap/components/roadmap-workspace';
import { SoftwareModuleNav } from '@/features/software/components/software-module-nav';
import { ModuleDocumentWorkspace } from '@/features/software/components/module-document-workspace';
import { SoftwareModuleSurface } from '@/features/software/components/software-module-surface';
import { useProjectModules } from '@/features/software/hooks/use-project-modules';
import { CoreNav } from '@/features/workspace/components/core-nav';
import { DocumentsWorkspace } from '@/features/workspace/components/documents-workspace';
import { GanttWorkspace } from '@/features/workspace/components/gantt-workspace';
import { IntegrationsWorkspace } from '@/features/workspace/components/integrations-workspace';
import { KanbanWorkspace } from '@/features/workspace/components/kanban-workspace';
import { ProjectBriefWorkspace } from '@/features/workspace/components/project-brief-workspace';
import { ProjectSettingsModal } from '@/features/workspace/components/project-settings-modal';
import { WorkItemsWorkspace } from '@/features/workspace/components/work-items-workspace';
import { fetchJson } from '@/lib/api-client';
import { useFileWatcher } from '@/hooks/use-file-watcher';

const DEFAULT_SURFACE_KEY = 'project_brief_root';
const PARENT_DASHBOARD_SURFACE_KEY = 'parent_dashboard';
const CORE_SURFACE_KEYS = [
  PARENT_DASHBOARD_SURFACE_KEY,
  DEFAULT_SURFACE_KEY,
  'roadmap_core',
  'kanban_core',
  'gantt_core',
  'work_items_core',
  'documents_core',
  'integrations_core',
];

function getDefaultSurfaceKey(project, preferredCoreView) {
  if (preferredCoreView) return preferredCoreView;
  return project?.isParentProject ? PARENT_DASHBOARD_SURFACE_KEY : DEFAULT_SURFACE_KEY;
}

function MetricTile({ label, value, tone = 'neutral', active = false, onClick }) {
  const toneClass = tone === 'alert'
    ? 'border-amber-400/45 bg-amber-400/12 text-amber-100'
    : tone === 'good'
      ? 'border-emerald-400/35 bg-emerald-400/10 text-emerald-100'
      : 'border-white/10 bg-white/5 text-ink';
  const className = [
    'parent-dashboard-metric rounded-2xl border p-4 text-left transition',
    toneClass,
    active ? 'ring-1 ring-accent/60' : '',
    onClick ? 'hover:border-accent/50 hover:bg-accent/10' : '',
  ].join(' ');
  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick}>
        <p className="text-2xl font-semibold">{Number(value || 0)}</p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] opacity-75">{label}</p>
      </button>
    );
  }
  return (
    <div className={className}>
      <p className="text-2xl font-semibold">{Number(value || 0)}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] opacity-75">{label}</p>
    </div>
  );
}

const PARENT_ROLLUP_SECTIONS = {
  pendingFragments: { label: 'Pending Fragments', empty: 'No pending child fragments.', tone: 'alert' },
  activeBugs: { label: 'Active Bugs', empty: 'No active child bugs.', tone: 'alert' },
  activeFeatures: { label: 'Active Features', empty: 'No active child features.', tone: 'neutral' },
  activeRoadmapPhases: { label: 'Active Phases', empty: 'No active child roadmap phases.', tone: 'neutral' },
  blockedWork: { label: 'Blocked Work', empty: 'No blocked child work.', tone: 'alert' },
  recentChanges: { label: 'Recent Changes', empty: 'No recent child changes.', tone: 'neutral' },
};

const INHERITANCE_LABELS = {
  aiDirectives: 'AI directives',
  standards: 'Standards',
  templatePolicy: 'Template policy',
  moduleDefaults: 'Module defaults',
  uiPreferences: 'UI preferences',
  integrationDefaults: 'Integration defaults',
};

const PROJECT_RELATIONSHIP_TYPES = [
  { value: 'depends_on_project', label: 'Depends on project' },
  { value: 'exposes_api_to', label: 'Exposes API to' },
  { value: 'consumes_api_from', label: 'Consumes API from' },
  { value: 'shares_domain_model_with', label: 'Shares domain model with' },
  { value: 'emits_event_to', label: 'Emits event to' },
  { value: 'consumes_event_from', label: 'Consumes event from' },
  { value: 'owns_subsystem', label: 'Owns subsystem' },
  { value: 'deploys_with', label: 'Deploys with' },
];

function getEnabledInheritanceLabels(flags) {
  if (!flags || typeof flags !== 'object') return [];
  return Object.entries(INHERITANCE_LABELS)
    .filter(([key]) => Boolean(flags[key]))
    .map(([, label]) => label);
}

function RollupDetailPanel({ title, items, emptyMessage, onOpenItem }) {
  const visibleItems = Array.isArray(items) ? items.slice(0, 12) : [];
  return (
    <SurfaceCard id={`parent-dashboard-rollup-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="parent-dashboard-rollup-detail">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">Rollup Detail</p>
          <h2 className="mt-1 text-xl font-semibold text-ink">{title}</h2>
        </div>
        <StatusBadge tone="foundation">{Array.isArray(items) ? items.length : 0} items</StatusBadge>
      </div>
      {visibleItems.length ? (
        <div className="space-y-2">
          {visibleItems.map((item) => (
            <button
              key={`${item.projectId}-${item.moduleKey}-${item.id}`}
              type="button"
              className="parent-dashboard-rollup-row w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-left transition hover:border-accent/45 hover:bg-accent/10"
              onClick={() => onOpenItem?.(item)}
            >
              <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
                <span className="truncate">{item.title || item.code || item.fileName || 'Untitled item'}</span>
                {item.code ? <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-ink/65">{item.code}</span> : null}
                {item.status ? <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-ink/65">{item.status}</span> : null}
              </span>
              <span className="mt-1 block text-xs text-ink/60">
                {item.projectName || 'Child project'}{item.moduleKey ? ` | ${item.moduleKey}` : ''}
              </span>
              {item.summary ? <span className="mt-2 block line-clamp-2 text-xs leading-5 text-ink/65">{item.summary}</span> : null}
            </button>
          ))}
          {items.length > visibleItems.length ? (
            <p className="text-xs text-ink/55">Showing first {visibleItems.length} of {items.length} items.</p>
          ) : null}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-ink/70">{emptyMessage}</div>
      )}
    </SurfaceCard>
  );
}

function ProjectFamilyInheritanceSummary({ project }) {
  const projectFamily = project?.integrations?.projectFamily || {};
  const offeredLabels = getEnabledInheritanceLabels(projectFamily.offeredInheritance);
  const inheritedLabels = getEnabledInheritanceLabels(projectFamily.inheritedFromParent);

  if (!project?.parentSummary && !project?.isParentProject && offeredLabels.length === 0 && inheritedLabels.length === 0) {
    return null;
  }

  return (
    <div id="project-family-inheritance-summary" className="project-family-inheritance-summary space-y-3 border-t border-white/10 pt-4 text-sm">
      <p className="project-workspace-section-label text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">Project Family</p>
      {project.parentSummary ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/50">Parent</p>
          <p className="mt-1 truncate font-semibold text-ink">{project.parentSummary.name}</p>
        </div>
      ) : null}
      {project.isParentProject ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/50">Children</p>
          <p className="mt-1 font-semibold text-ink">{Number(project.childCount || 0)} direct, {Number(project.descendantCount || 0)} total</p>
        </div>
      ) : null}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/50">Inherited by this project</p>
        <div className="flex flex-wrap gap-1.5">
          {inheritedLabels.length ? inheritedLabels.map((label) => (
            <span key={label} className="rounded-full border border-sky-300/35 bg-sky-400/10 px-2 py-0.5 text-[11px] font-semibold text-sky-100">{label}</span>
          )) : <span className="text-xs text-ink/50">No inherited settings enabled.</span>}
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/50">Offered to children</p>
        <div className="flex flex-wrap gap-1.5">
          {offeredLabels.length ? offeredLabels.map((label) => (
            <span key={label} className="rounded-full border border-emerald-300/35 bg-emerald-400/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-100">{label}</span>
          )) : <span className="text-xs text-ink/50">No inheritance offers configured.</span>}
        </div>
      </div>
    </div>
  );
}

function ParentDashboardWorkspace({ project, onSelectProject, onCreateChildProject }) {
  const childProjects = Array.isArray(project.childProjects) ? project.childProjects : [];
  const rollup = project.familyRollup || project.projectFamilyRollup || {};
  const childTotal = Number(project.descendantCount || childProjects.length || 0);
  const [selectedRollupKey, setSelectedRollupKey] = useState('pendingFragments');
  const [rollupDetails, setRollupDetails] = useState(null);
  const [rollupStatus, setRollupStatus] = useState('idle');
  const [rollupError, setRollupError] = useState(null);
  const [relationships, setRelationships] = useState([]);
  const [relationshipStatus, setRelationshipStatus] = useState('idle');
  const [relationshipDraft, setRelationshipDraft] = useState({
    sourceEntityId: project.id,
    relationshipType: PROJECT_RELATIONSHIP_TYPES[0].value,
    targetEntityId: '',
    note: '',
  });
  const familyWatchIds = useMemo(
    () => new Set(
      [project.id, ...childProjects.map((child) => child.id)]
        .filter(Boolean)
        .flatMap((projectId) => [`project-fragments:${projectId}`, `project-events:${projectId}`])
    ),
    [childProjects, project.id]
  );

  async function refreshRollups() {
    if (!project?.id || !project.isParentProject) return;
    setRollupStatus('loading');
    setRollupError(null);
    try {
      const payload = await fetchJson(`/api/projects/${project.id}/rollups`);
      setRollupDetails(payload || null);
      setRollupStatus('ready');
    } catch (error) {
      setRollupError(error);
      setRollupStatus('error');
    }
  }

  useFileWatcher({
    enabled: Boolean(project?.isParentProject),
    maxEvents: 20,
    onEvent: (event) => {
      if (familyWatchIds.has(event?.watchId)) refreshRollups();
    },
  });

  useEffect(() => {
    let cancelled = false;
    async function loadRollups() {
      if (!project?.id || !project.isParentProject) return;
      setRollupStatus('loading');
      setRollupError(null);
      try {
        const payload = await fetchJson(`/api/projects/${project.id}/rollups`);
        if (cancelled) return;
        setRollupDetails(payload || null);
        setRollupStatus('ready');
      } catch (error) {
        if (cancelled) return;
        setRollupError(error);
        setRollupStatus('error');
      }
    }
    loadRollups();
    return () => {
      cancelled = true;
    };
  }, [project.id, project.isParentProject]);

  useEffect(() => {
    setRelationshipDraft({
      sourceEntityId: project.id,
      relationshipType: PROJECT_RELATIONSHIP_TYPES[0].value,
      targetEntityId: '',
      note: '',
    });
  }, [project.id]);

  useEffect(() => {
    let cancelled = false;
    async function loadRelationships() {
      if (!project?.id || !project.isParentProject) return;
      setRelationshipStatus('loading');
      try {
        const payload = await fetchJson(`/api/projects/${project.id}/relationships?sourceEntityType=project`);
        if (cancelled) return;
        setRelationships(Array.isArray(payload) ? payload : []);
        setRelationshipStatus('ready');
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to load project family relationships:', error);
        setRelationshipStatus('error');
      }
    }
    loadRelationships();
    return () => {
      cancelled = true;
    };
  }, [project.id, project.isParentProject]);

  const selectedRollup = PARENT_ROLLUP_SECTIONS[selectedRollupKey] || PARENT_ROLLUP_SECTIONS.pendingFragments;
  const getRollupCount = (key, fallback) => {
    const items = rollupDetails && Array.isArray(rollupDetails[key]) ? rollupDetails[key] : null;
    return items ? items.length : Number(fallback || 0);
  };
  const openRollupItem = (item) => {
    if (!item?.projectId) return;
    onSelectProject?.(item.projectId, item.moduleKey || null);
  };
  const projectOptions = useMemo(() => [project, ...childProjects], [childProjects, project]);
  const projectNameById = useMemo(() => new Map(projectOptions.map((entry) => [entry.id, entry.name])), [projectOptions]);
  const relationshipTypeByValue = useMemo(() => new Map(PROJECT_RELATIONSHIP_TYPES.map((entry) => [entry.value, entry.label])), []);

  async function refreshRelationships() {
    const payload = await fetchJson(`/api/projects/${project.id}/relationships?sourceEntityType=project`);
    setRelationships(Array.isArray(payload) ? payload : []);
    setRelationshipStatus('ready');
  }

  async function handleSaveRelationship() {
    if (!relationshipDraft.sourceEntityId || !relationshipDraft.targetEntityId || !relationshipDraft.relationshipType) return;
    setRelationshipStatus('saving');
    await fetchJson(`/api/projects/${project.id}/relationships`, {
      method: 'POST',
      body: JSON.stringify({
        sourceEntityType: 'project',
        sourceEntityId: relationshipDraft.sourceEntityId,
        relationshipType: relationshipDraft.relationshipType,
        targetEntityType: 'project',
        targetEntityId: relationshipDraft.targetEntityId,
        metadata: { note: relationshipDraft.note },
      }),
    });
    setRelationshipDraft((current) => ({ ...current, targetEntityId: '', note: '' }));
    await refreshRelationships();
  }

  async function handleDeleteRelationship(relationshipId) {
    if (!relationshipId) return;
    setRelationshipStatus('saving');
    await fetchJson(`/api/projects/${project.id}/relationships/${relationshipId}`, { method: 'DELETE' });
    await refreshRelationships();
  }

  return (
    <div id={`parent-dashboard-workspace-${project.id}`} className="parent-dashboard-workspace space-y-5">
      <SurfaceCard id="parent-dashboard-summary" className="parent-dashboard-summary">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink/60">Parent Dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">{project.name}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-ink/75">
              This dashboard keeps the parent project focused on orchestration: child workspaces stay autonomous, while active fragments, bugs, features, phases, and blocked work roll up here for quick visibility.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone="foundation">{childProjects.length} direct children</StatusBadge>
            <StatusBadge tone="migration">{childTotal} total descendants</StatusBadge>
            <ActionButton variant="subtle" size="sm" onClick={() => onCreateChildProject?.(project)}>Create Child Project</ActionButton>
          </div>
        </div>
      </SurfaceCard>

      <div id="parent-dashboard-metrics" className="parent-dashboard-metrics grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Child Projects" value={childProjects.length} />
        <MetricTile label="Pending Fragments" value={getRollupCount('pendingFragments', rollup.pendingFragmentCount)} tone={getRollupCount('pendingFragments', rollup.pendingFragmentCount) > 0 ? 'alert' : 'good'} active={selectedRollupKey === 'pendingFragments'} onClick={() => setSelectedRollupKey('pendingFragments')} />
        <MetricTile label="Active Bugs" value={getRollupCount('activeBugs', rollup.activeBugCount)} tone={getRollupCount('activeBugs', rollup.activeBugCount) > 0 ? 'alert' : 'good'} active={selectedRollupKey === 'activeBugs'} onClick={() => setSelectedRollupKey('activeBugs')} />
        <MetricTile label="Active Features" value={getRollupCount('activeFeatures', rollup.activeFeatureCount)} active={selectedRollupKey === 'activeFeatures'} onClick={() => setSelectedRollupKey('activeFeatures')} />
        <MetricTile label="Active Phases" value={getRollupCount('activeRoadmapPhases', rollup.activeRoadmapPhaseCount)} active={selectedRollupKey === 'activeRoadmapPhases'} onClick={() => setSelectedRollupKey('activeRoadmapPhases')} />
        <MetricTile label="Blocked Work" value={getRollupCount('blockedWork', rollup.blockedWorkCount)} tone={getRollupCount('blockedWork', rollup.blockedWorkCount) > 0 ? 'alert' : 'good'} active={selectedRollupKey === 'blockedWork'} onClick={() => setSelectedRollupKey('blockedWork')} />
        <MetricTile label="Recent Changes" value={getRollupCount('recentChanges', rollup.recentChangeCount)} active={selectedRollupKey === 'recentChanges'} onClick={() => setSelectedRollupKey('recentChanges')} />
        <MetricTile label="Enabled Modules" value={rollup.enabledModuleCount} />
      </div>

      {rollupStatus === 'error' ? (
        <SurfaceCard id="parent-dashboard-rollup-error" className="parent-dashboard-rollup-error">
          <p className="text-sm leading-6 text-rose-200">Failed to load child rollup details: {rollupError?.message || 'Unknown error'}</p>
        </SurfaceCard>
      ) : (
        <RollupDetailPanel
          title={selectedRollup.label}
          items={rollupDetails?.[selectedRollupKey] || []}
          emptyMessage={rollupStatus === 'loading' ? 'Loading child rollup details...' : selectedRollup.empty}
          onOpenItem={openRollupItem}
        />
      )}

      <SurfaceCard id="parent-dashboard-inheritance" className="parent-dashboard-inheritance">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">Inheritance</p>
            <h2 className="mt-1 text-xl font-semibold text-ink">Parent offers and child opt-ins</h2>
          </div>
          <StatusBadge tone="foundation">Optional only</StatusBadge>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-semibold text-ink">This parent offers</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {getEnabledInheritanceLabels(project.integrations?.projectFamily?.offeredInheritance).length ? (
                getEnabledInheritanceLabels(project.integrations?.projectFamily?.offeredInheritance).map((label) => (
                  <span key={label} className="rounded-full border border-emerald-300/35 bg-emerald-400/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-100">{label}</span>
                ))
              ) : (
                <span className="text-sm text-ink/60">No inheritable settings are offered yet.</span>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-semibold text-ink">Child opt-ins</p>
            <div className="mt-3 space-y-2">
              {childProjects.length ? childProjects.map((child) => {
                const inheritedLabels = getEnabledInheritanceLabels(child.integrations?.projectFamily?.inheritedFromParent);
                return (
                  <div key={child.id} className="rounded-xl border border-white/10 bg-black/10 p-3">
                    <p className="truncate text-sm font-semibold text-ink">{child.name}</p>
                    <p className="mt-1 text-xs leading-5 text-ink/60">
                      {inheritedLabels.length ? inheritedLabels.join(', ') : 'No inherited settings enabled.'}
                    </p>
                  </div>
                );
              }) : <p className="text-sm text-ink/60">No child projects are attached.</p>}
            </div>
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard id="parent-dashboard-relationships" className="parent-dashboard-relationships">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">Cross-Project Relationships</p>
            <h2 className="mt-1 text-xl font-semibold text-ink">Project family relationship map</h2>
          </div>
          <StatusBadge tone={relationshipStatus === 'error' ? 'caution' : 'foundation'}>
            {relationshipStatus === 'saving' ? 'Saving' : `${relationships.length} links`}
          </StatusBadge>
        </div>
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-2">
            {relationships.length ? relationships.map((relationship) => (
              <div key={relationship.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-ink">
                    {projectNameById.get(relationship.sourceEntityId) || relationship.sourceEntityId}
                    <span className="mx-2 text-ink/40">{'->'}</span>
                    {projectNameById.get(relationship.targetEntityId) || relationship.targetEntityId}
                  </p>
                  <button
                    type="button"
                    className="rounded-full border border-rose-300/30 bg-rose-400/10 px-2 py-0.5 text-xs font-semibold text-rose-100 transition hover:border-rose-200/60"
                    onClick={() => handleDeleteRelationship(relationship.id)}
                  >
                    Delete
                  </button>
                </div>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-ink/50">
                  {relationshipTypeByValue.get(relationship.relationshipType) || relationship.relationshipType}
                </p>
                {relationship.metadata?.note ? <p className="mt-2 text-xs leading-5 text-ink/65">{relationship.metadata.note}</p> : null}
              </div>
            )) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-ink/70">
                No cross-project relationships have been recorded yet.
              </div>
            )}
          </div>
          <div className="space-y-3 rounded-2xl border border-white/10 bg-black/10 p-4">
            <p className="text-sm font-semibold text-ink">Add relationship</p>
            <label className="block space-y-1 text-xs text-ink/60">
              <span>From</span>
              <select
                className="w-full rounded-xl border border-white/10 bg-slate px-3 py-2 text-sm text-ink outline-none focus:border-accent/60"
                value={relationshipDraft.sourceEntityId}
                onChange={(event) => setRelationshipDraft((current) => ({ ...current, sourceEntityId: event.target.value }))}
              >
                {projectOptions.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
              </select>
            </label>
            <label className="block space-y-1 text-xs text-ink/60">
              <span>Relationship</span>
              <select
                className="w-full rounded-xl border border-white/10 bg-slate px-3 py-2 text-sm text-ink outline-none focus:border-accent/60"
                value={relationshipDraft.relationshipType}
                onChange={(event) => setRelationshipDraft((current) => ({ ...current, relationshipType: event.target.value }))}
              >
                {PROJECT_RELATIONSHIP_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
              </select>
            </label>
            <label className="block space-y-1 text-xs text-ink/60">
              <span>To</span>
              <select
                className="w-full rounded-xl border border-white/10 bg-slate px-3 py-2 text-sm text-ink outline-none focus:border-accent/60"
                value={relationshipDraft.targetEntityId}
                onChange={(event) => setRelationshipDraft((current) => ({ ...current, targetEntityId: event.target.value }))}
              >
                <option value="">Choose target project</option>
                {projectOptions
                  .filter((option) => option.id !== relationshipDraft.sourceEntityId)
                  .map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
              </select>
            </label>
            <label className="block space-y-1 text-xs text-ink/60">
              <span>Note</span>
              <textarea
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-slate px-3 py-2 text-sm text-ink outline-none focus:border-accent/60"
                value={relationshipDraft.note}
                onChange={(event) => setRelationshipDraft((current) => ({ ...current, note: event.target.value }))}
              />
            </label>
            <ActionButton variant="accent" onClick={handleSaveRelationship} disabled={!relationshipDraft.targetEntityId || relationshipStatus === 'saving'}>
              Add Relationship
            </ActionButton>
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard id="parent-dashboard-children" className="parent-dashboard-children">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">Child Workspaces</p>
            <h2 className="mt-1 text-xl font-semibold text-ink">Autonomous project surfaces</h2>
          </div>
          <StatusBadge tone="foundation">Live rollup</StatusBadge>
        </div>

        {childProjects.length ? (
          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {childProjects.map((child) => {
              const childMetrics = child.projectMetrics || {};
              const childFragments = Number(childMetrics.pendingFragmentCount || child.pendingFragmentCount || 0);
              return (
                <button
                  key={child.id}
                  type="button"
                  id={`parent-dashboard-child-${child.id}`}
                  className="parent-dashboard-child-tile rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-accent/45 hover:bg-accent/10"
                  onClick={() => onSelectProject?.(child.id)}
                >
                  <span className="block truncate text-base font-semibold text-ink">{child.name}</span>
                  <span className="mt-1 block truncate text-xs text-ink/60">{child.category || child.projectType || 'Project'}</span>
                  <span className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-semibold">
                    <span className={`rounded-full border px-2 py-0.5 ${childFragments > 0 ? 'border-amber-400/45 bg-amber-400/12 text-amber-100' : 'border-white/10 bg-white/5 text-ink/60'}`}>
                      {childFragments} fragments
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-ink/60">
                      {Number(childMetrics.activeBugCount || 0)} bugs
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-ink/60">
                      {Number(childMetrics.activeFeatureCount || 0)} features
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-ink/70">
            No child projects are attached to this parent yet.
          </div>
        )}
      </SurfaceCard>
    </div>
  );
}

export function ProjectWorkspaceShell({ project, onRefresh, onProjectUpdated, preferredCoreView = null, onSelectProject, onCreateChildProject, onBack }) {
  const [activeSurfaceKey, setActiveSurfaceKey] = useState(() => getDefaultSurfaceKey(project, preferredCoreView));
  const [isProjectSettingsOpen, setIsProjectSettingsOpen] = useState(false);
  const { modules, dependencies, refresh: refreshModules } = useProjectModules(project.id);

  const moduleRegistry = useMemo(() => {
    if (Array.isArray(modules) && modules.length) return modules;
    if (Array.isArray(project.modules) && project.modules.length) return project.modules;
    return [];
  }, [modules, project.modules]);

  const softwareModules = useMemo(
    () => moduleRegistry.filter((module) => !module.core && module.enabled),
    [moduleRegistry]
  );
  const aiModules = useMemo(
    () => moduleRegistry.filter((module) => module.group === 'ai' && module.enabled),
    [moduleRegistry]
  );
  const enabledSoftwareModules = useMemo(
    () => softwareModules.filter((module) => module.group === 'software'),
    [softwareModules]
  );

  useEffect(() => {
    setActiveSurfaceKey(getDefaultSurfaceKey(project, preferredCoreView));
  }, [preferredCoreView, project.id, project.isParentProject]);

  useEffect(() => {
    const activeModuleStillExists = [...enabledSoftwareModules, ...aiModules].some((module) => module.moduleKey === activeSurfaceKey);
    const activeCoreView = CORE_SURFACE_KEYS.includes(activeSurfaceKey);
    if (activeSurfaceKey === PARENT_DASHBOARD_SURFACE_KEY && !project.isParentProject) {
      setActiveSurfaceKey(DEFAULT_SURFACE_KEY);
      return;
    }
    if (!activeCoreView && !activeModuleStillExists) {
      setActiveSurfaceKey(getDefaultSurfaceKey(project, preferredCoreView));
    }
  }, [activeSurfaceKey, aiModules, enabledSoftwareModules, preferredCoreView, project.id, project.isParentProject]);

  const activeSoftwareModule = useMemo(
    () => [...enabledSoftwareModules, ...aiModules].find((module) => module.moduleKey === activeSurfaceKey) || null,
    [enabledSoftwareModules, aiModules, activeSurfaceKey]
  );

  async function handleSaveProjectSettings(nextState) {
    if (!onProjectUpdated) return;
    if (nextState?.projectPayload) {
      await onProjectUpdated(project.id, nextState.projectPayload);
    }
    if (nextState?.modulePayload) {
      await fetchJson(`/api/projects/${project.id}/modules`, {
        method: 'PUT',
        body: JSON.stringify(nextState.modulePayload),
      });
    }
    if (typeof onRefresh === 'function') {
      await onRefresh();
    }
    await refreshModules();
  }

  const imageSource = project.imageUrl || (project.imagePath ? `/api/project-image/${project.id}` : null);

  const surfaceContent = (() => {
    switch (activeSurfaceKey) {
      case PARENT_DASHBOARD_SURFACE_KEY:
        return project.isParentProject
          ? <ParentDashboardWorkspace project={project} onSelectProject={onSelectProject} onCreateChildProject={onCreateChildProject} />
          : <ProjectBriefWorkspace project={project} modules={moduleRegistry} onProjectUpdated={onProjectUpdated} />;
      case 'project_brief_root':
        return <ProjectBriefWorkspace project={project} modules={moduleRegistry} onProjectUpdated={onProjectUpdated} />;
      case 'roadmap_core':
        return <RoadmapWorkspace project={project} />;
      case 'kanban_core':
        return <KanbanWorkspace project={project} />;
      case 'gantt_core':
        return <GanttWorkspace project={project} />;
      case 'work_items_core':
        return <WorkItemsWorkspace project={project} />;
      case 'documents_core':
        return <DocumentsWorkspace project={project} modules={moduleRegistry} />;
      case 'integrations_core':
        return <IntegrationsWorkspace project={project} onProjectUpdated={onProjectUpdated} onStatusChange={() => {}} />;
      case 'ai_environment':
        return activeSoftwareModule?.moduleKey === 'ai_environment'
          ? <AiEnvironmentWorkspace project={project} />
          : <ProjectBriefWorkspace project={project} modules={moduleRegistry} onProjectUpdated={onProjectUpdated} />;
      case 'prd':
        return activeSoftwareModule?.moduleKey === 'prd'
          ? <PrdWorkspace project={project} />
          : <ProjectBriefWorkspace project={project} modules={moduleRegistry} onProjectUpdated={onProjectUpdated} />;
      case 'architecture':
        return activeSoftwareModule?.moduleKey === 'architecture'
          ? <ArchitectureWorkspace project={project} />
          : <ProjectBriefWorkspace project={project} modules={moduleRegistry} onProjectUpdated={onProjectUpdated} />;
      case 'features':
        return activeSoftwareModule?.moduleKey === 'features'
          ? <FeaturesWorkspace project={project} />
          : <ProjectBriefWorkspace project={project} modules={moduleRegistry} onProjectUpdated={onProjectUpdated} />;
      case 'bugs':
        return activeSoftwareModule?.moduleKey === 'bugs'
          ? <BugsWorkspace project={project} />
          : <ProjectBriefWorkspace project={project} modules={moduleRegistry} onProjectUpdated={onProjectUpdated} />;
      case 'changelog':
        return activeSoftwareModule?.moduleKey === 'changelog'
          ? <ChangelogWorkspace project={project} />
          : <ProjectBriefWorkspace project={project} modules={moduleRegistry} onProjectUpdated={onProjectUpdated} />;
      case 'database_schema':
        return activeSoftwareModule?.moduleKey === 'database_schema'
          ? <DatabaseSchemaWorkspace project={project} />
          : <ProjectBriefWorkspace project={project} modules={moduleRegistry} onProjectUpdated={onProjectUpdated} />;
      case 'functional_spec':
        return activeSoftwareModule?.moduleKey === 'functional_spec'
          ? <FunctionalSpecWorkspace project={project} module={activeSoftwareModule} />
          : <ProjectBriefWorkspace project={project} modules={moduleRegistry} onProjectUpdated={onProjectUpdated} />;
      case 'domain_models':
        return activeSoftwareModule?.moduleKey === 'domain_models'
          ? <DomainModelsWorkspace project={project} module={activeSoftwareModule} />
          : <ProjectBriefWorkspace project={project} modules={moduleRegistry} onProjectUpdated={onProjectUpdated} />;
      case 'technical_design':
      case 'experience_design':
      case 'test_strategy':
        return activeSoftwareModule?.moduleKey === activeSurfaceKey
          ? <ModuleDocumentWorkspace project={project} module={activeSoftwareModule} />
          : <ProjectBriefWorkspace project={project} modules={moduleRegistry} onProjectUpdated={onProjectUpdated} />;
      case 'adr':
        return activeSoftwareModule?.moduleKey === 'adr'
          ? <AdrWorkspace project={project} />
          : <ProjectBriefWorkspace project={project} modules={moduleRegistry} onProjectUpdated={onProjectUpdated} />;
      default:
        return <SoftwareModuleSurface project={project} module={activeSoftwareModule} dependencies={dependencies} />;
    }
  })();

  return (
    <>
      <div id={`project-workspace-shell-${project.id}`} className="project-workspace-shell space-y-3">
        {onBack ? (
          <button
            type="button"
            id="project-workspace-back-button"
            className="project-workspace-back-button inline-flex text-sm font-medium text-ink/70 transition hover:text-ink"
            onClick={onBack}
          >
            Back to Projects
          </button>
        ) : null}

        {project.parentSummary ? (
          <nav id="project-workspace-breadcrumb" className="project-workspace-breadcrumb flex flex-wrap items-center gap-2 text-sm text-ink/65" aria-label="Project hierarchy">
            <button
              type="button"
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-ink/75 transition hover:border-accent/45 hover:bg-accent/10 hover:text-ink"
              onClick={() => onSelectProject?.(project.parentSummary.id, PARENT_DASHBOARD_SURFACE_KEY)}
            >
              {project.parentSummary.name}
            </button>
            <span className="text-ink/40">/</span>
            <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-ink">{project.name}</span>
          </nav>
        ) : null}

        <div className="project-workspace-layout grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside id="project-workspace-sidebar" className="project-workspace-sidebar space-y-4 xl:sticky xl:top-4 xl:self-start">

            <SurfaceCard id="project-workspace-sidebar-card" className="project-workspace-sidebar-card flex max-h-[calc(100vh-12rem)] flex-col overflow-hidden">
            <div className="project-workspace-sidebar-header flex items-start justify-between gap-3">
              <div className="project-workspace-sidebar-project flex min-w-0 items-start gap-3">
                {imageSource ? (
                  <img
                    src={imageSource}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-lg font-semibold text-ink">
                    {(project.name || '?').slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="project-workspace-sidebar-project-copy space-y-2">
                  <p className="project-workspace-sidebar-label text-xs font-semibold uppercase tracking-[0.24em] text-ink/60">Project Workspace</p>
                  <h2 className="project-workspace-sidebar-title text-3xl font-semibold tracking-tight text-ink">{project.name}</h2>
                  <p className="project-workspace-sidebar-description text-sm leading-7 text-ink/70">
                    {project.description || 'Use the hierarchy on the left to move between the root project context and its planning and software branches.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="project-workspace-settings-button"
                className="project-workspace-settings-button inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-transparent text-lg text-ink/75 transition hover:bg-white/8 hover:text-ink"
                onClick={() => setIsProjectSettingsOpen(true)}
                aria-label="Open project settings"
              >
                &#9881;
              </button>
            </div>

            <div className="project-workspace-sidebar-status mt-5 flex flex-wrap gap-2">
              <StatusBadge tone="foundation">{project.projectType || 'general'}</StatusBadge>
              <StatusBadge tone="migration">{project.type === 'folder' ? 'Folder project' : 'URL project'}</StatusBadge>
              <ActionButton variant="subtle" size="sm" onClick={onRefresh}>Refresh backend data</ActionButton>
            </div>

            <div id="project-workspace-navigation" className="project-workspace-navigation mt-4 min-h-0 space-y-4 overflow-y-auto pr-1">
              <ProjectFamilyInheritanceSummary project={project} />

              {Array.isArray(project.links) && project.links.length ? (
                <div id="project-workspace-links-section" className="project-workspace-links-section space-y-2 border-t border-white/10 pt-4">
                  <p className="project-workspace-section-label text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">Links</p>
                  <ProjectLinkIcons links={project.links} />
                </div>
              ) : null}

              <CoreNav
                activeView={
                  activeSurfaceKey === PARENT_DASHBOARD_SURFACE_KEY
                    ? 'Parent Dashboard'
                    : activeSurfaceKey === 'project_brief_root'
                    ? 'Project Brief'
                    : activeSurfaceKey === 'roadmap_core'
                      ? 'Roadmap'
                      : activeSurfaceKey === 'kanban_core'
                        ? 'Kanban'
                        : activeSurfaceKey === 'gantt_core'
                          ? 'Gantt'
                          : activeSurfaceKey === 'work_items_core'
                            ? 'Work Items'
                            : activeSurfaceKey === 'documents_core'
                              ? 'Documents'
                              : activeSurfaceKey === 'integrations_core'
                                ? 'Integrations'
                                : ''
                }
                onSelect={(view) => {
                  const mapping = {
                    'Parent Dashboard': PARENT_DASHBOARD_SURFACE_KEY,
                    'Project Brief': 'project_brief_root',
                    Roadmap: 'roadmap_core',
                    Kanban: 'kanban_core',
                    Gantt: 'gantt_core',
                    'Work Items': 'work_items_core',
                    Documents: 'documents_core',
                    Integrations: 'integrations_core',
                  };
                  setActiveSurfaceKey(mapping[view] || DEFAULT_SURFACE_KEY);
                }}
                showParentDashboard={Boolean(project.isParentProject)}
              />

              {aiModules.length ? (
                <div id="project-workspace-ai-section" className="project-workspace-ai-section space-y-3 border-t border-white/10 pt-4">
                  <p className="project-workspace-section-label text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">AI</p>
                  <SoftwareModuleNav
                    modules={aiModules}
                    activeModuleKey={activeSoftwareModule ? activeSoftwareModule.moduleKey : activeSurfaceKey}
                    onSelect={setActiveSurfaceKey}
                    introText="AI workspace governs how agents should operate on this project, what they should update, and how they should phrase structured changes."
                  />
                </div>
              ) : null}

              {enabledSoftwareModules.length ? (
                <div id="project-workspace-software-section" className="project-workspace-software-section space-y-3 border-t border-white/10 pt-4">
                  <p className="project-workspace-section-label text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">Software</p>
                  <SoftwareModuleNav
                    modules={enabledSoftwareModules}
                    activeModuleKey={activeSoftwareModule ? activeSoftwareModule.moduleKey : activeSurfaceKey}
                    onSelect={setActiveSurfaceKey}
                  />
                </div>
              ) : null}
            </div>
            </SurfaceCard>
          </aside>

          <div id="project-workspace-content" className="project-workspace-content min-w-0 space-y-6">{surfaceContent}</div>
        </div>
      </div>

      <ProjectSettingsModal
        project={project}
        modules={moduleRegistry}
        isOpen={isProjectSettingsOpen}
        onClose={() => setIsProjectSettingsOpen(false)}
        onSave={handleSaveProjectSettings}
      />
    </>
  );
}
