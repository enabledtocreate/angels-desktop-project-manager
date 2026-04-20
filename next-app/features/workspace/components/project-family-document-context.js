'use client';

import { StatusBadge } from '@/components/ui/status-badge';
import { SurfaceCard } from '@/components/ui/surface-card';

function enabledLabels(flags = {}) {
  const labels = {
    aiDirectives: 'AI directives',
    standards: 'Standards',
    templatePolicy: 'Template policy',
    moduleDefaults: 'Module defaults',
    uiPreferences: 'UI preferences',
    integrationDefaults: 'Integration defaults',
  };
  return Object.entries(labels)
    .filter(([key]) => Boolean(flags?.[key]))
    .map(([, label]) => label);
}

export function ProjectFamilyDocumentContext({ project, moduleLabel }) {
  const isParent = Boolean(project?.isParentProject);
  const isChild = Boolean(project?.parentSummary);
  const projectFamily = project?.integrations?.projectFamily || {};
  const offered = enabledLabels(projectFamily.offeredInheritance);
  const inherited = enabledLabels(projectFamily.inheritedFromParent);

  if (!isParent && !isChild && !offered.length && !inherited.length) return null;

  return (
    <SurfaceCard id={`project-family-document-context-${moduleLabel || 'module'}`} className="project-family-document-context p-4" tone="muted">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100/55">Project Family Context</p>
          <h2 className="mt-1 text-lg font-semibold text-white">{moduleLabel || 'This module'} document role</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {isParent ? <StatusBadge tone="foundation">Parent orchestration</StatusBadge> : null}
          {isChild ? <StatusBadge tone="migration">Child autonomous</StatusBadge> : null}
        </div>
      </div>
      <p className="mt-3 text-sm leading-7 text-sky-100/75">
        {isParent
          ? 'This project can describe cross-project orchestration while child projects remain the source of truth for their own module data.'
          : `This project belongs to ${project.parentSummary?.name || 'a parent project'} and should expose stable ids that parent orchestration can reference without taking ownership.`}
      </p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-100/50">Inherited by this project</p>
          <p className="mt-1 text-sm text-sky-100/75">{inherited.length ? inherited.join(', ') : 'No inherited settings enabled.'}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-100/50">Offered to children</p>
          <p className="mt-1 text-sm text-sky-100/75">{offered.length ? offered.join(', ') : 'No inheritance offers configured.'}</p>
        </div>
      </div>
    </SurfaceCard>
  );
}
