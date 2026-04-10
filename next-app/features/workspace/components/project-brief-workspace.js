'use client';

import { useMemo, useState } from 'react';
import { InfoTile } from '@/components/ui/info-tile';
import { AiInstructionsPanel } from '@/components/ui/ai-instructions-panel';
import { SectionShell } from '@/components/ui/section-shell';
import { StatisticsDisclosure } from '@/components/ui/statistics-disclosure';
import { SurfaceCard } from '@/components/ui/surface-card';
import { fetchJson } from '@/lib/api-client';

const CORE_GROUP_ORDER = ['Planning', 'Records'];
const SOFTWARE_GROUP_ORDER = ['Product Definition', 'Product Delivery', 'Requirements', 'System Design', 'Validation & Decisions'];

function labelForDependency(moduleKey, labelMap) {
  return labelMap.get(moduleKey) || moduleKey;
}

function groupModules(modules, groupOrder, groupName) {
  const enabledModules = Array.isArray(modules) ? modules.filter((module) => module.enabled) : [];
  return groupOrder
    .map((label) => ({
      label,
      modules: enabledModules
        .filter((module) => module.group === groupName && module.hierarchyGroup === label && module.moduleKey !== 'project_brief')
        .sort((left, right) => Number(left.hierarchyOrder || 0) - Number(right.hierarchyOrder || 0)),
    }))
    .filter((section) => section.modules.length);
}

function InlineBriefCard({
  eyebrow,
  title,
  fields,
  onSave,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(() => Object.fromEntries(fields.map((field) => [field.key, field.value || ''])));
  const [status, setStatus] = useState('idle');

  async function commitSave() {
    setStatus('saving');
    try {
      await onSave(draft);
      setStatus('saved');
      setIsEditing(false);
      setTimeout(() => setStatus('idle'), 1200);
    } catch (error) {
      console.error(`Failed to save ${title}:`, error);
      setStatus('error');
    }
  }

  function handleKeyDown(event) {
    if (event.key !== 'Enter') return;
    if (event.altKey && event.shiftKey) return;
    event.preventDefault();
    commitSave();
  }

  return (
    <SurfaceCard className="p-4" tone="muted">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">{eyebrow}</p>
        <button
          type="button"
          className="text-xs font-medium text-ink/70 underline-offset-4 transition hover:text-ink hover:underline"
          onClick={() => {
            if (!isEditing) {
              setDraft(Object.fromEntries(fields.map((field) => [field.key, field.value || ''])));
              setStatus('idle');
            }
            setIsEditing((current) => !current);
          }}
        >
          {isEditing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      {isEditing ? (
        <div className="mt-3 space-y-3">
          {fields.map((field) => (
            <label key={field.key} className="block space-y-2 text-sm text-ink/75">
              <span className="font-medium text-ink">{field.label}</span>
              {field.multiline ? (
                <textarea
                  rows={field.rows || 4}
                  className="min-h-20 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-ink outline-none focus:border-accent/50"
                  value={draft[field.key] || ''}
                  onChange={(event) => setDraft((current) => ({ ...current, [field.key]: event.target.value }))}
                  onKeyDown={handleKeyDown}
                />
              ) : (
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-ink outline-none focus:border-accent/50"
                  value={draft[field.key] || ''}
                  onChange={(event) => setDraft((current) => ({ ...current, [field.key]: event.target.value }))}
                  onKeyDown={handleKeyDown}
                />
              )}
            </label>
          ))}
          <p className="text-xs text-ink/60">
            Press <span className="font-semibold text-ink">Enter</span> to save. Use <span className="font-semibold text-ink">Alt+Shift+Enter</span> for a new line.
          </p>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <h3 className="text-xl font-semibold text-ink">{title}</h3>
          {fields.map((field) => (
            <p key={field.key} className="text-sm leading-6 text-ink/75">
              {field.label ? <span className="font-semibold text-ink">{field.label}: </span> : null}
              {field.displayValue || field.value || 'Not set'}
            </p>
          ))}
        </div>
      )}

      <p className="mt-3 text-xs text-ink/60">
        {status === 'saving'
          ? 'Autosaving...'
          : status === 'saved'
            ? 'Saved.'
            : status === 'error'
              ? 'Save failed.'
              : ' '}
      </p>
    </SurfaceCard>
  );
}

export function ProjectBriefWorkspace({ project, modules = [], onProjectUpdated }) {
  const labelMap = new Map(
    (Array.isArray(modules) ? modules : []).map((module) => [module.moduleKey, module.label || module.moduleKey])
  );
  const coreSections = groupModules(modules, CORE_GROUP_ORDER, 'core');
  const softwareSections = groupModules(modules, SOFTWARE_GROUP_ORDER, 'software');
  const tags = Array.isArray(project.tags) ? project.tags.filter(Boolean) : [];

  async function saveBriefPatch(patch) {
    if (typeof onProjectUpdated === 'function') {
      await onProjectUpdated(project.id, patch);
      return;
    }
    await fetchJson(`/api/projects/${project.id}`, { method: 'PUT', body: JSON.stringify(patch) });
  }

  return (
    <div className="space-y-5">
      <SectionShell
        eyebrow="Foundation"
        title="Project Brief"
        description="Project Brief is the root of the document system. It anchors purpose, context, goals, and constraints so every other project document branches from the same base."
      >
        <StatisticsDisclosure>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoTile eyebrow="Project Type" title={project.projectType || 'general'} body="Project type controls which specialized branches can hang off the brief." />
            <InfoTile eyebrow="Root Role" title="Document root" body="Roadmap and every software design document should branch from this shared project context." />
            <InfoTile eyebrow="Core Branches" title={`${coreSections.reduce((count, section) => count + section.modules.length, 0)} enabled`} body="Planning and record-keeping capabilities that apply across project types." />
            <InfoTile eyebrow="Software Branches" title={`${softwareSections.reduce((count, section) => count + section.modules.length, 0)} enabled`} body="Specialized software design modules layered on top of the core project model." />
          </div>
        </StatisticsDisclosure>
      </SectionShell>

      <AiInstructionsPanel
        title="Project Brief AI Instructions"
        instructions={[
          'Treat Project Brief as the root context for every other document and module in the project.',
          'Keep goals, constraints, operating context, and key identity details current here first.',
          'Use this brief to establish how downstream documents should interpret project purpose and boundaries.',
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <SectionShell
          eyebrow="Brief Context"
          title="Current project context"
          description="This root context is editable in place now, so the project brief can evolve without leaving the workspace."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <InlineBriefCard
              eyebrow="Identity"
              title={project.name}
              fields={[
                { key: 'name', label: 'Name', value: project.name || '' },
                { key: 'description', label: 'Description', value: project.description || '', multiline: true, rows: 5 },
              ]}
              onSave={async (patch) => saveBriefPatch({
                name: patch.name,
                description: patch.description,
              })}
            />

            <InlineBriefCard
              eyebrow="Operating Context"
              title="Project metadata"
              fields={[
                { key: 'category', label: 'Category', value: project.category || '', displayValue: project.category || 'Uncategorized' },
                { key: 'primaryAction', label: 'Primary Action', value: project.primaryAction || 'auto', displayValue: project.primaryAction || 'auto' },
                { key: 'path', label: 'Project Path', value: project.path || project.url || '', displayValue: project.path || project.url || 'Not set' },
                { key: 'tags', label: 'Tags', value: tags.join(', '), displayValue: tags.join(', ') || 'None', multiline: true, rows: 3 },
              ]}
              onSave={async (patch) => saveBriefPatch({
                category: patch.category,
                primaryAction: patch.primaryAction,
                tags: String(patch.tags || '')
                  .split(',')
                  .map((tag) => tag.trim())
                  .filter(Boolean),
              })}
            />
          </div>
        </SectionShell>

        <SectionShell
          eyebrow="Dependency Model"
          title="What branches from Project Brief"
          description="This mirrors the document hierarchy spec so the workspace navigation and document model tell the same story."
        >
          <div className="space-y-4">
            {coreSections.map((section) => (
              <SurfaceCard key={section.label} className="p-4" tone="muted">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">{section.label}</p>
                <div className="mt-3 space-y-3">
                  {section.modules.map((module) => (
                    <div key={module.moduleKey} className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                      <p className="text-sm font-semibold text-ink">{module.label}</p>
                      <p className="mt-1 text-sm leading-6 text-ink/75">{module.description}</p>
                      {Array.isArray(module.dependsOn) && module.dependsOn.length ? (
                        <p className="mt-2 text-xs uppercase tracking-[0.16em] text-ink/55">
                          Depends on: {module.dependsOn.map((dependency) => labelForDependency(dependency, labelMap)).join(' | ')}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </SurfaceCard>
            ))}

            {softwareSections.length ? (
              softwareSections.map((section) => (
                <SurfaceCard key={section.label} className="p-4" tone="muted">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">{section.label}</p>
                  <div className="mt-3 space-y-3">
                    {section.modules.map((module) => (
                      <div key={module.moduleKey} className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                        <p className="text-sm font-semibold text-ink">{module.label}</p>
                        <p className="mt-1 text-sm leading-6 text-ink/75">{module.description}</p>
                        {Array.isArray(module.dependsOn) && module.dependsOn.length ? (
                          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-ink/55">
                            Depends on: {module.dependsOn.map((dependency) => labelForDependency(dependency, labelMap)).join(' | ')}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </SurfaceCard>
              ))
            ) : (
              <SurfaceCard className="p-4" tone="muted">
                <p className="text-sm leading-6 text-ink/75">
                  No software branches are enabled yet. General projects can stay lightweight until you decide to layer in software design modules.
                </p>
              </SurfaceCard>
            )}
          </div>
        </SectionShell>
      </div>
    </div>
  );
}
