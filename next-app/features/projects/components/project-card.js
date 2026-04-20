import { ProjectLinkIcons } from '@/components/ui/project-link-icons';
import { SurfaceCard } from '@/components/ui/surface-card';

function countSoftwareModules(project) {
  const modules = Array.isArray(project.modules) ? project.modules : [];
  return modules.filter((module) => !module.core && module.enabled).length;
}

function getProjectKind(project) {
  const softwareModuleCount = countSoftwareModules(project);
  if (project.type === 'url') return 'Reference Project';
  if (project.projectType === 'software' || softwareModuleCount > 0) return 'Software Project';
  return 'General Project';
}

function tagToneClass(tag, index) {
  const tones = [
    'border border-cyan-500/35 bg-cyan-500/14 text-ink',
    'border border-emerald-500/35 bg-emerald-500/14 text-ink',
    'border border-amber-500/35 bg-amber-500/14 text-ink',
    'border border-rose-500/35 bg-rose-500/14 text-ink',
    'border border-indigo-500/35 bg-indigo-500/14 text-ink',
  ];
  let hash = index;
  for (const character of String(tag || '')) {
    hash += character.charCodeAt(0);
  }
  return tones[Math.abs(hash) % tones.length];
}

function IconButton({ label, active = false, children, onClick }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={[
        'inline-flex h-8 w-8 items-center justify-center rounded-lg bg-transparent text-ink/65 transition hover:bg-white/8 hover:text-ink',
        active ? 'text-accent' : '',
      ].join(' ')}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
      <path d="m14.5 4.5 5 5-2.5 2.5v4L13 12l-6 6-1-1 6-6-4-4h4z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
      <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
      <path d="m19.4 15 1.1 1.9-1.8 3.1-2.2-.3a7.9 7.9 0 0 1-1.7 1l-.6 2.1H9.8l-.6-2.1a7.9 7.9 0 0 1-1.7-1l-2.2.3-1.8-3.1L4.6 15a8.4 8.4 0 0 1 0-2l-1.1-1.9 1.8-3.1 2.2.3a7.9 7.9 0 0 1 1.7-1l.6-2.1h4.4l.6 2.1a7.9 7.9 0 0 1 1.7 1l2.2-.3 1.8 3.1-1.1 1.9a8.4 8.4 0 0 1 0 2Z" />
    </svg>
  );
}

function ChildProjectTypeIcon({ type }) {
  if (type === 'url') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
        <path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1" />
        <path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
      <path d="M3.5 6.5h6l2 2h9v9a2 2 0 0 1-2 2h-15z" />
      <path d="M3.5 6.5v11a2 2 0 0 0 2 2" />
    </svg>
  );
}

function MetricPill({ label, value, tone = 'neutral' }) {
  const toneClass = tone === 'alert'
    ? 'border-amber-400/40 bg-amber-400/12 text-amber-100'
    : 'border-white/10 bg-white/6 text-ink/65';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${toneClass}`}>
      <span>{value}</span>
      <span>{label}</span>
    </span>
  );
}

export function ProjectCard({ project, isSelected, onSelect, onTogglePin, onOpenSettings, viewMode = 'list' }) {
  const tagNames = Array.isArray(project.tags) ? project.tags.filter(Boolean) : [];
  const handleSelect = () => onSelect(project.id);
  const isGrid = viewMode === 'grid';
  const imageSource = project.imageUrl || (project.imagePath ? `/api/project-image/${project.id}` : null);
  const visibleLinks = Array.isArray(project.links) ? project.links.filter((link) => link && (link.description || link.url)).slice(0, 6) : [];
  const pendingFragmentCount = Number.isFinite(Number(project.pendingFragmentCount)) ? Number(project.pendingFragmentCount) : 0;
  const childProjects = Array.isArray(project.childProjects) ? project.childProjects : [];
  const familyRollup = project.familyRollup || project.projectFamilyRollup || {};

  return (
    <SurfaceCard
      id={`project-card-${project.id}`}
      className={[
        'project-card min-w-0',
        isSelected ? 'border-accent/50 ring-1 ring-accent/30' : 'cursor-pointer hover:border-accent/30',
        isGrid ? 'h-full' : '',
      ].join(' ')}
      tone={isSelected ? 'panel' : 'muted'}
    >
      <div
        role="button"
        tabIndex={0}
        className="project-card-hitarea block h-full w-full text-left outline-none"
        onClick={handleSelect}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleSelect();
          }
        }}
      >
        <div className={`project-card-header relative flex ${isGrid ? 'flex-col gap-4' : 'items-start gap-4 pr-16'}`}>
          <div className="project-card-main flex min-w-0 items-start gap-3">
            {imageSource ? (
              <div className="shrink-0">
                <img
                  src={imageSource}
                  alt={`${project.name} icon`}
                  className="h-12 w-12 rounded-xl object-cover"
                />
              </div>
            ) : null}
            <div className="project-card-body min-w-0 flex-1">
              <p className="project-card-kind text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">{getProjectKind(project)}</p>
              <h3 className="project-card-title flex min-w-0 items-center gap-2 text-lg font-semibold text-ink">
                <span className="truncate">{project.name}</span>
                <span
                  className={[
                    'shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold',
                    pendingFragmentCount > 0
                      ? 'border-amber-400/50 bg-amber-400/15 text-amber-100'
                      : 'border-white/12 bg-white/6 text-ink/55',
                  ].join(' ')}
                  title={`${pendingFragmentCount} fragment${pendingFragmentCount === 1 ? '' : 's'} need merging`}
                >
                  ({pendingFragmentCount})
                </span>
              </h3>
              {visibleLinks.length ? (
                <div className="project-card-links mt-1 flex min-w-0 items-center gap-2">
                  <span className="project-card-links-label text-xs font-medium text-ink/60">Links</span>
                  <ProjectLinkIcons
                    links={visibleLinks}
                    className="gap-1"
                    buttonClassName="h-7 w-7"
                    iconClassName="h-3.5 w-3.5"
                  />
                </div>
              ) : null}
              <p className="project-card-description mt-2 break-words text-sm leading-6 text-ink/75">
                {project.description || 'No description yet.'}
              </p>
              {project.type === 'folder' && project.path ? (
                <p className="project-card-path mt-2 break-all text-xs text-ink/60">{project.path}</p>
              ) : null}
              {project.type === 'url' && project.url ? (
                <p className="project-card-url mt-2 break-all text-xs text-ink/60">{project.url}</p>
              ) : null}
            </div>
          </div>
          <div className={`project-card-actions flex shrink-0 items-start gap-1 ${isGrid ? '' : 'absolute right-0 top-0'}`}>
            <IconButton
              label={project.pinned ? 'Unpin project' : 'Pin project'}
              active={project.pinned}
              onClick={(event) => {
                event.stopPropagation();
                onTogglePin(project.id, !project.pinned);
              }}
            >
              <PinIcon />
            </IconButton>
            <IconButton
              label="Project settings"
              onClick={(event) => {
                event.stopPropagation();
                onOpenSettings?.(project);
              }}
            >
              <SettingsIcon />
            </IconButton>
          </div>
        </div>

        <div className="project-card-tags mt-3 flex flex-wrap gap-2">
          {tagNames.length ? tagNames.map((tag, index) => (
            <span key={tag} className={`max-w-full truncate rounded-full px-2.5 py-1 text-xs font-medium ${tagToneClass(tag, index)}`}>
              {tag}
            </span>
          )) : (
            <span className="text-xs text-ink/55">No tags</span>
          )}
        </div>

        {childProjects.length ? (
          <div className="project-card-children mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
            <div className="project-card-children-header mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">Child Projects</p>
                <p className="text-xs text-ink/55">
                  {childProjects.length} direct, {Number(project.descendantCount || childProjects.length)} total
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-1.5">
                <MetricPill label="fragments" value={Number(familyRollup.pendingFragmentCount || 0)} tone={Number(familyRollup.pendingFragmentCount || 0) > 0 ? 'alert' : 'neutral'} />
                <MetricPill label="bugs" value={Number(familyRollup.activeBugCount || 0)} />
                <MetricPill label="features" value={Number(familyRollup.activeFeatureCount || 0)} />
              </div>
            </div>
            <div className={`project-card-child-grid grid gap-2 ${isGrid ? '' : 'sm:grid-cols-2 xl:grid-cols-3'}`}>
              {childProjects.map((child) => {
                const childFragments = Number(child.pendingFragmentCount || child.projectMetrics?.pendingFragmentCount || 0);
                return (
                  <button
                    key={child.id}
                    type="button"
                    id={`project-card-child-${child.id}`}
                    className="project-card-child-tile min-w-0 rounded-xl border border-white/10 bg-white/5 p-2 text-left transition hover:border-accent/45 hover:bg-accent/10"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelect(child.id);
                    }}
                    onKeyDown={(event) => {
                      event.stopPropagation();
                    }}
                  >
                    <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-ink">
                      <span className="shrink-0 text-ink/65"><ChildProjectTypeIcon type={child.type} /></span>
                      <span className="truncate">{child.name}</span>
                      <span className={`ml-auto shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] ${childFragments > 0 ? 'border-amber-400/50 bg-amber-400/15 text-amber-100' : 'border-white/10 bg-white/5 text-ink/50'}`}>
                        ({childFragments})
                      </span>
                    </span>
                    <span className="mt-1 block truncate text-xs text-ink/55">{child.category || child.projectType || 'Project'}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="project-card-meta mt-4 flex items-center justify-between gap-3">
          <div className="project-card-category break-words text-xs text-ink/60">
            {project.category || 'Uncategorized'}
            {project.dateAdded ? ` | Added ${new Date(project.dateAdded).toLocaleDateString()}` : ''}
          </div>
          <span className="project-card-type text-xs text-ink/55">{project.type === 'folder' ? 'Folder' : 'URL'}</span>
        </div>
      </div>
    </SurfaceCard>
  );
}
