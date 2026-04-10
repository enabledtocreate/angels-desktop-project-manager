'use client';

import { useMemo } from 'react';
import { InfoTile } from '@/components/ui/info-tile';
import { SectionShell } from '@/components/ui/section-shell';
import { StatisticsDisclosure } from '@/components/ui/statistics-disclosure';
import { SurfaceCard } from '@/components/ui/surface-card';

const managedDocuments = [
  { key: 'project_brief', label: 'PROJECT_BRIEF.md', moduleKey: 'project_brief', description: 'Root project context that all other managed documents branch from.', hierarchyGroup: 'Foundation', hierarchyOrder: 0 },
  { key: 'ai_environment', label: 'AI_ENVIRONMENT.md', moduleKey: 'ai_environment', description: 'AI-readable operating guidance for how agents should work inside the project.', hierarchyGroup: 'AI', hierarchyOrder: 5 },
  { key: 'roadmap', label: 'ROADMAP.md', moduleKey: 'roadmap', description: 'Phase planning and roadmap design.', hierarchyGroup: 'Planning', hierarchyOrder: 10 },
  { key: 'features', label: 'FEATURES.md', moduleKey: 'features', description: 'Software feature tracking and PRD fragment generation.', hierarchyGroup: 'Product Delivery', hierarchyOrder: 30 },
  { key: 'bugs', label: 'BUGS.md', moduleKey: 'bugs', description: 'Software bug tracking and issue history.', hierarchyGroup: 'Product Delivery', hierarchyOrder: 40 },
  { key: 'prd', label: 'PRD.md', moduleKey: 'prd', description: 'Structured product requirements.', hierarchyGroup: 'Product Definition', hierarchyOrder: 20 },
  { key: 'architecture', label: 'ARCHITECTURE.md', moduleKey: 'architecture', description: 'System boundaries, components, and flows.', hierarchyGroup: 'System Design', hierarchyOrder: 50 },
  { key: 'database_schema', label: 'DATABASE_SCHEMA.md', moduleKey: 'database_schema', description: 'Narrative schema design companion.', hierarchyGroup: 'System Design', hierarchyOrder: 60 },
];

const DOCUMENT_GROUP_ORDER = ['Foundation', 'AI', 'Planning', 'Product Definition', 'Product Delivery', 'Requirements', 'System Design', 'Validation & Decisions'];

function isEnabled(project, modules, moduleKey) {
  const registry = Array.isArray(modules) ? modules : [];
  const match = registry.find((module) => module.moduleKey === moduleKey);
  if (match) return !!match.enabled;
  return Array.isArray(project.enabledModules) && project.enabledModules.includes(moduleKey);
}

export function DocumentsWorkspace({ project, modules }) {
  const availableDocuments = useMemo(
    () => managedDocuments
      .filter((document) => isEnabled(project, modules, document.moduleKey))
      .sort((left, right) => Number(left.hierarchyOrder || 0) - Number(right.hierarchyOrder || 0)),
    [project, modules]
  );
  const groupedDocuments = useMemo(
    () => DOCUMENT_GROUP_ORDER
      .map((label) => ({
        label,
        documents: availableDocuments.filter((document) => document.hierarchyGroup === label),
      }))
      .filter((section) => section.documents.length),
    [availableDocuments]
  );
  const docsRoot = project.type === 'folder' && project.absolutePath ? `${project.absolutePath}\\docs` : 'Folder project required';

  return (
    <div className="space-y-6">
      <SectionShell
        eyebrow="Documents"
        title="Documents workspace"
        description="This migrated documents surface keeps the managed document model visible while we continue moving deeper document interactions out of the legacy frontend."
      >
        <StatisticsDisclosure>
          <div className="grid gap-4 md:grid-cols-3">
            <InfoTile eyebrow="Managed Docs" title={`${availableDocuments.length}`} body="Documents are derived from enabled modules and the current project type." />
            <InfoTile eyebrow="Docs Root" title={project.type === 'folder' ? 'Available' : 'Unavailable'} body={docsRoot} />
            <InfoTile eyebrow="Source of Truth" title="Database first" body="Managed markdown stays generated from structured state and controlled imports." />
          </div>
        </StatisticsDisclosure>
      </SectionShell>

      <SectionShell eyebrow="Managed Outputs" title="Expected project documents" description="These documents are now organized by the same hierarchy the workspace uses, with Project Brief acting as the root.">
        <div className="space-y-6">
          {groupedDocuments.length ? groupedDocuments.map((section) => (
            <div key={section.label} className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">{section.label}</p>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {section.documents.map((document) => (
                  <SurfaceCard key={document.key} className="p-4" tone="muted">
                    <p className="text-sm font-semibold text-white">{document.label}</p>
                    <p className="mt-2 text-sm leading-6 text-sky-100/75">{document.description}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.16em] text-sky-100/55">{document.moduleKey}</p>
                  </SurfaceCard>
                ))}
              </div>
            </div>
          )) : (
            <SurfaceCard tone="muted">
              <p className="text-sm leading-6 text-sky-100/75">No managed documents are available for this project yet.</p>
            </SurfaceCard>
          )}
        </div>
      </SectionShell>
    </div>
  );
}
