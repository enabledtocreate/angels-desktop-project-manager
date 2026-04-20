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

function ParentDashboardWorkspace({ project, onSelectProject }) {
  const childProjects = Array.isArray(project.childProjects) ? project.childProjects : [];
  const rollup = project.familyRollup || project.projectFamilyRollup || {};
  const childTotal = Number(project.descendantCount || childProjects.length || 0);
  const [selectedRollupKey, setSelectedRollupKey] = useState('pendingFragments');
  const [rollupDetails, setRollupDetails] = useState(null);
  const [rollupStatus, setRollupStatus] = useState('idle');
  const [rollupError, setRollupError] = useState(null);

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

  const selectedRollup = PARENT_ROLLUP_SECTIONS[selectedRollupKey] || PARENT_ROLLUP_SECTIONS.pendingFragments;
  const getRollupCount = (key, fallback) => {
    const items = rollupDetails && Array.isArray(rollupDetails[key]) ? rollupDetails[key] : null;
    return items ? items.length : Number(fallback || 0);
  };
  const openRollupItem = (item) => {
    if (!item?.projectId) return;
    onSelectProject?.(item.projectId, item.moduleKey || null);
  };

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

export function ProjectWorkspaceShell({ project, onRefresh, onProjectUpdated, preferredCoreView = null, onSelectProject, onBack }) {
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
          ? <ParentDashboardWorkspace project={project} onSelectProject={onSelectProject} />
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
