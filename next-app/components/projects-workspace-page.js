'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppSettingsModal } from '@/components/app-settings-modal';
import { LogsModal } from '@/components/logs-modal';
import { AppToolbar } from '@/components/app-toolbar';
import { SurfaceCard } from '@/components/ui/surface-card';
import { ProjectList } from '@/features/projects/components/project-list';
import { useProjects } from '@/features/projects/hooks/use-projects';
import { ProjectSettingsModal } from '@/features/workspace/components/project-settings-modal';
import { ProjectWorkspaceShell } from '@/features/workspace/components/project-workspace-shell';
import { fetchJson } from '@/lib/api-client';

function matchesProject(project, searchQuery) {
  const normalized = String(searchQuery || '').trim().toLowerCase();
  if (!normalized) return true;
  const haystack = [
    project.name,
    project.description,
    project.category,
    project.projectType,
    project.path,
    project.url,
    ...(Array.isArray(project.tags) ? project.tags : []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(normalized);
}

function compareProjects(left, right, sortMode) {
  const pinCompare = Number(Boolean(right.pinned)) - Number(Boolean(left.pinned));
  if (pinCompare !== 0) return pinCompare;
  if (sortMode === 'dateAdded') {
    const leftTime = Date.parse(left.dateAdded || '') || 0;
    const rightTime = Date.parse(right.dateAdded || '') || 0;
    return rightTime - leftTime || String(left.name || '').localeCompare(String(right.name || ''));
  }
  if (sortMode === 'category') {
    const categoryCompare = String(left.category || 'Uncategorized').localeCompare(String(right.category || 'Uncategorized'));
    if (categoryCompare !== 0) return categoryCompare;
  }
  return String(left.name || '').localeCompare(String(right.name || ''));
}

function getProjectGroupLabel(project, groupMode) {
  if (groupMode === 'name') {
    return String(project.name || '#').trim().charAt(0).toUpperCase() || '#';
  }
  if (groupMode === 'dateAdded') {
    if (!project.dateAdded) return 'No Date Added';
    const date = new Date(project.dateAdded);
    if (Number.isNaN(date.getTime())) return 'No Date Added';
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
  }
  if (groupMode === 'category') {
    return project.category || 'Uncategorized';
  }
  return 'All Projects';
}

function buildProjectGroups(projects, groupMode) {
  const grouped = new Map();
  for (const project of projects) {
    const label = getProjectGroupLabel(project, groupMode);
    const bucket = grouped.get(label) || [];
    bucket.push(project);
    grouped.set(label, bucket);
  }

  return Array.from(grouped.entries())
    .sort(([left], [right]) => String(left).localeCompare(String(right)))
    .map(([label, groupProjects]) => ({
      label,
      projects: groupProjects,
    }));
}

function buildVisibleProjectHierarchy(projects, searchQuery, sortMode) {
  const sortedProjects = [...projects].sort((left, right) => compareProjects(left, right, sortMode));
  const byId = new Map(sortedProjects.map((project) => [project.id, project]));
  const hasSearch = Boolean(String(searchQuery || '').trim());
  const matchedIds = new Set(
    sortedProjects
      .filter((project) => matchesProject(project, searchQuery))
      .map((project) => project.id)
  );

  return sortedProjects
    .filter((project) => {
      const hasKnownParent = project.parentId && byId.has(project.parentId);
      if (!hasSearch) return !hasKnownParent;
      if (!matchedIds.has(project.id)) return false;
      return !(hasKnownParent && matchedIds.has(project.parentId));
    })
    .map((project) => {
      const projectMatches = !hasSearch || matchedIds.has(project.id);
      const childProjects = sortedProjects.filter((child) => child.parentId === project.id && (!hasSearch || projectMatches || matchedIds.has(child.id)));
      return {
        ...project,
        childProjects,
      };
    });
}

export default function ProjectsWorkspacePage() {
  const {
    projects,
    roots,
    selectedProject,
    selectedProjectId,
    setSelectedProjectId,
    updateProject,
    status,
    error,
    refresh,
  } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState('alphabetical');
  const [viewMode, setViewMode] = useState('list');
  const [groupMode, setGroupMode] = useState('none');
  const [toolbarStatus, setToolbarStatus] = useState('');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [projectSettingsProject, setProjectSettingsProject] = useState(null);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  const visibleProjects = useMemo(
    () => buildVisibleProjectHierarchy(projects, searchQuery, sortMode),
    [projects, searchQuery, sortMode]
  );

  const projectGroups = useMemo(
    () => buildProjectGroups(visibleProjects, groupMode),
    [visibleProjects, groupMode]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadPreferences() {
      try {
        const settings = await fetchJson('/api/settings');
        if (cancelled) return;
        setSortMode(settings?.ui?.projectListSortMode || 'alphabetical');
        setViewMode(settings?.ui?.projectListViewMode || 'list');
        setGroupMode(settings?.ui?.projectListGroupMode || 'none');
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to load project list preferences:', error);
      } finally {
        if (!cancelled) setPreferencesLoaded(true);
      }
    }

    loadPreferences();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!preferencesLoaded) return;
    const timeout = setTimeout(() => {
      fetchJson('/api/settings', {
        method: 'PUT',
        body: JSON.stringify({
          ui: {
            projectListSortMode: sortMode,
            projectListViewMode: viewMode,
            projectListGroupMode: groupMode,
          },
        }),
      }).catch((error) => {
        console.error('Failed to save project list preferences:', error);
      });
    }, 200);

    return () => clearTimeout(timeout);
  }, [groupMode, preferencesLoaded, sortMode, viewMode]);

  function handleViewLogs() {
    setIsLogsModalOpen(true);
    setToolbarStatus('Opened structured log viewer.');
  }

  async function handleRestartApp() {
    try {
      if (typeof window !== 'undefined' && window.electronAPI && typeof window.electronAPI.restartApp === 'function') {
        setToolbarStatus('Restarting the desktop app...');
        await window.electronAPI.restartApp();
      } else {
        setToolbarStatus('Restart is only available inside the Electron desktop shell.');
      }
    } catch (restartError) {
      console.error('Failed to restart app:', restartError);
      setToolbarStatus('Failed to restart the desktop app.');
    }
  }

  async function handleTogglePin(projectId, pinned) {
    try {
      await updateProject(projectId, { pinned });
      setToolbarStatus(pinned ? 'Pinned project.' : 'Unpinned project.');
    } catch (pinError) {
      console.error('Failed to update pin:', pinError);
      setToolbarStatus('Failed to update project pin state.');
    }
  }

  async function handleSaveProjectSettings(projectId, nextState) {
    if (!projectId) return;
    if (nextState?.projectPayload) {
      await updateProject(projectId, nextState.projectPayload);
    }
    if (nextState?.modulePayload) {
      await fetchJson(`/api/projects/${projectId}/modules`, {
        method: 'PUT',
        body: JSON.stringify(nextState.modulePayload),
      });
    }
    await refresh();
  }

  if (status === 'loading' || status === 'idle') {
    return (
      <main className="h-full overflow-hidden px-6 py-5 md:px-8">
        <div className="w-full">
          <SurfaceCard>
            <h1 className="text-2xl font-semibold text-ink">Loading project workspace...</h1>
            <p className="mt-3 text-sm leading-6 text-ink/75">
              The Next.js shell is fetching projects from the existing local backend.
            </p>
          </SurfaceCard>
        </div>
      </main>
    );
  }

  if (status === 'error') {
    return (
      <main className="h-full overflow-hidden px-6 py-5 md:px-8">
        <div className="w-full">
          <SurfaceCard>
            <h1 className="text-2xl font-semibold text-ink">Backend connection needed</h1>
            <p className="mt-3 text-sm leading-6 text-ink/75">
              The migrated workspace expects the existing local server to be running. Error: {error ? error.message : 'Unknown error'}
            </p>
          </SurfaceCard>
        </div>
      </main>
    );
  }

  return (
    <main id="projects-workspace-page" className="projects-workspace-page flex h-full min-h-0 flex-col overflow-hidden px-6 py-5 md:px-8">
      <div className="projects-workspace-shell flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        <AppToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortMode={sortMode}
          onSortModeChange={setSortMode}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          groupMode={groupMode}
          onGroupModeChange={setGroupMode}
          onOpenSettings={() => {
            setIsSettingsModalOpen(true);
            setToolbarStatus('Opened application settings.');
          }}
          onViewLogs={handleViewLogs}
          onRestartApp={handleRestartApp}
          statusMessage={toolbarStatus}
          showOrganizer={!selectedProject}
        />

        <AppSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          onStatusChange={setToolbarStatus}
          onOpenLogsModal={() => setIsLogsModalOpen(true)}
        />

        <LogsModal
          isOpen={isLogsModalOpen}
          onClose={() => setIsLogsModalOpen(false)}
          onStatusChange={setToolbarStatus}
        />

        <ProjectSettingsModal
          project={projectSettingsProject}
          modules={projectSettingsProject?.modules || []}
          isOpen={Boolean(projectSettingsProject)}
          onClose={() => setProjectSettingsProject(null)}
          onSave={(nextState) => handleSaveProjectSettings(projectSettingsProject?.id, nextState)}
        />

        <div id="projects-workspace-scroll-region" className="projects-workspace-scroll-region min-h-0 flex-1 overflow-y-auto pt-4">
          {selectedProject ? (
            <ProjectWorkspaceShell
              project={selectedProject}
              roots={roots}
              onRefresh={refresh}
              onProjectUpdated={updateProject}
              onSelectProject={setSelectedProjectId}
              onBack={() => setSelectedProjectId(null)}
            />
          ) : (
            <ProjectList
              projectGroups={projectGroups}
              selectedProjectId={selectedProjectId}
              onSelect={setSelectedProjectId}
              onTogglePin={handleTogglePin}
              onOpenSettings={setProjectSettingsProject}
              searchQuery={searchQuery}
              viewMode={viewMode}
            />
          )}
        </div>
      </div>
    </main>
  );
}
