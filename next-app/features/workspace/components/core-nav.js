import { ActionButton } from '@/components/ui/action-button';

function buildCoreSections(showParentDashboard) {
  return [
    {
      label: 'Foundation',
      views: showParentDashboard ? ['Parent Dashboard', 'Project Brief'] : ['Project Brief'],
    },
    {
      label: 'Planning',
      views: ['Roadmap', 'Work Items', 'Kanban', 'Gantt'],
    },
    {
      label: 'Records',
      views: ['Documents', 'Integrations'],
    },
  ];
}

export function CoreNav({ activeView, onSelect, showParentDashboard = false }) {
  const coreSections = buildCoreSections(showParentDashboard);

  return (
    <div id="project-workspace-core-nav" className="project-workspace-core-nav space-y-4">
      {coreSections.map((section) => (
        <div key={section.label} id={`project-workspace-core-section-${section.label.toLowerCase()}`} className="project-workspace-core-section space-y-2">
          <p className="project-workspace-core-section-label text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">{section.label}</p>
          <div className="project-workspace-core-section-buttons flex flex-wrap gap-2">
            {section.views.map((view) => (
              <ActionButton
                key={view}
                id={`project-workspace-core-button-${view.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                className="project-workspace-core-button"
                variant={view === activeView ? 'accent' : 'ghost'}
                size="sm"
                onClick={() => onSelect(view)}
              >
                {view}
              </ActionButton>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
