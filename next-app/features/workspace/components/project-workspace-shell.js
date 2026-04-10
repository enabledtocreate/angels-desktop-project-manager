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

export function ProjectWorkspaceShell({ project, onRefresh, onProjectUpdated, preferredCoreView = DEFAULT_SURFACE_KEY, onBack }) {
  const [activeSurfaceKey, setActiveSurfaceKey] = useState(DEFAULT_SURFACE_KEY);
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
    setActiveSurfaceKey(preferredCoreView || DEFAULT_SURFACE_KEY);
  }, [preferredCoreView, project.id]);

  useEffect(() => {
    const activeModuleStillExists = [...enabledSoftwareModules, ...aiModules].some((module) => module.moduleKey === activeSurfaceKey);
    const activeCoreView = ['project_brief_root', 'roadmap_core', 'kanban_core', 'gantt_core', 'work_items_core', 'documents_core', 'integrations_core'].includes(activeSurfaceKey);
    if (!activeCoreView && !activeModuleStillExists) {
      setActiveSurfaceKey(DEFAULT_SURFACE_KEY);
    }
  }, [activeSurfaceKey, enabledSoftwareModules, aiModules]);

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
                  activeSurfaceKey === 'project_brief_root'
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
