import { SectionShell } from '@/components/ui/section-shell';
import { ProjectCard } from '@/features/projects/components/project-card';

function PinBadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
      <path d="m14.5 4.5 5 5-2.5 2.5v4L13 12l-6 6-1-1 6-6-4-4h4z" />
    </svg>
  );
}

function splitPinnedGroups(projectGroups) {
  const pinnedGroups = [];
  const otherGroups = [];

  for (const group of projectGroups) {
    const pinnedProjects = group.projects.filter((project) => project.pinned);
    const otherProjects = group.projects.filter((project) => !project.pinned);
    if (pinnedProjects.length) pinnedGroups.push({ label: group.label, projects: pinnedProjects });
    if (otherProjects.length) otherGroups.push({ label: group.label, projects: otherProjects });
  }

  return { pinnedGroups, otherGroups };
}

function renderGroupedProjects(groups, selectedProjectId, onSelect, onTogglePin, onOpenSettings, onCreateChildProject, viewMode) {
  return groups.map((group) => (
    <section key={group.label} className="space-y-3">
      {group.label !== 'All Projects' ? (
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-ink/65">{group.label}</h3>
          <span className="text-xs text-ink/55">{group.projects.length} projects</span>
        </div>
      ) : null}
      <div className={viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2 xl:grid-cols-3' : 'grid gap-4'}>
        {group.projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            isSelected={project.id === selectedProjectId}
            onSelect={onSelect}
            onTogglePin={onTogglePin}
            onOpenSettings={onOpenSettings}
            onCreateChildProject={onCreateChildProject}
            viewMode={viewMode}
          />
        ))}
      </div>
    </section>
  ));
}

export function ProjectList({ projectGroups, selectedProjectId, onSelect, onTogglePin, onOpenSettings, onCreateChildProject, searchQuery, viewMode = 'list' }) {
  const totalProjects = projectGroups.reduce((count, group) => count + group.projects.length, 0);
  const { pinnedGroups, otherGroups } = splitPinnedGroups(projectGroups);

  return (
    <SectionShell
      id="project-list-shell"
      className="project-list-shell"
      eyebrow="Projects"
      title="Project workspace list"
      description={
        searchQuery
          ? `Showing ${totalProjects} matching project${totalProjects === 1 ? '' : 's'} for "${searchQuery}".`
          : 'Choose a project to open its dedicated workspace. Until you do, only the project organizer is shown.'
      }
    >
      <div id="project-list-groups" className="project-list-groups space-y-6">
        {pinnedGroups.length ? (
          <section id="project-list-pinned-section" className="project-list-pinned-section space-y-4">
            <div className="project-list-section-header flex items-center justify-between gap-3 border-b border-white/10 pb-2">
              <div className="inline-flex items-center gap-2 text-ink/70">
                <PinBadgeIcon />
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em]">Projects</h2>
              </div>
              <span className="text-xs text-ink/55">{pinnedGroups.reduce((count, group) => count + group.projects.length, 0)} projects</span>
            </div>
            <div className="project-list-section-body space-y-6">
              {renderGroupedProjects(pinnedGroups, selectedProjectId, onSelect, onTogglePin, onOpenSettings, onCreateChildProject, viewMode)}
            </div>
          </section>
        ) : null}

        {otherGroups.length ? (
          <section id="project-list-main-section" className="project-list-main-section space-y-4">
            {pinnedGroups.length ? (
              <div className="project-list-section-header flex items-center justify-between gap-3 border-b border-white/10 pb-2">
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-ink/70">Projects</h2>
                <span className="text-xs text-ink/55">{otherGroups.reduce((count, group) => count + group.projects.length, 0)} projects</span>
              </div>
            ) : null}
            <div className="project-list-section-body space-y-6">
              {renderGroupedProjects(otherGroups, selectedProjectId, onSelect, onTogglePin, onOpenSettings, onCreateChildProject, viewMode)}
            </div>
          </section>
        ) : null}

        {totalProjects === 0 ? (
          <div id="project-list-empty-state" className="project-list-empty-state rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-ink/75">
            No projects match the current search.
          </div>
        ) : null}
      </div>
    </SectionShell>
  );
}
