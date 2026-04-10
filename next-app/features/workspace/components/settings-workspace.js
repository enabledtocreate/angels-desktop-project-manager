'use client';

import { useEffect, useState } from 'react';
import { ActionButton } from '@/components/ui/action-button';
import { InfoTile } from '@/components/ui/info-tile';
import { SectionShell } from '@/components/ui/section-shell';
import { StatisticsDisclosure } from '@/components/ui/statistics-disclosure';
import { StatusBadge } from '@/components/ui/status-badge';
import { SuggestedValueInput } from '@/components/ui/suggested-value-input';
import { useProjectSettings } from '@/features/workspace/hooks/use-project-settings';

function buildEditableState(project) {
  return {
    name: project?.name || '',
    description: project?.description || '',
    category: project?.category || '',
    primaryAction: project?.primaryAction || 'auto',
    projectType: project?.projectType || 'general',
  };
}

export function SettingsWorkspace({ project, roots, onProjectUpdated }) {
  const { projectState, settings, status, error, saveStatus, refresh, saveProjectSettings } = useProjectSettings(project, true);
  const [editableState, setEditableState] = useState(() => buildEditableState(project));

  useEffect(() => {
    setEditableState(buildEditableState(projectState || project));
  }, [projectState, project]);

  async function handleSave() {
    const saved = await saveProjectSettings(editableState);
    if (onProjectUpdated) onProjectUpdated(saved);
  }

  if (status === 'loading' || status === 'idle') {
    return <SectionShell eyebrow="Settings" title="Loading settings…" description="Fetching project and application settings context." />;
  }

  if (status === 'error') {
    return <SectionShell eyebrow="Settings" title="Settings load failed" description={error ? error.message : 'Unknown settings error'} />;
  }

  return (
    <div className="space-y-6">
      <SectionShell
        eyebrow="Settings"
        title="Project settings workspace"
        description="This migrated settings surface focuses on the project settings that already have clean backend contracts, while still exposing the current workspace roots for context."
        actions={(
          <>
            <StatusBadge tone="foundation">{editableState.projectType}</StatusBadge>
            <StatusBadge tone="migration">{saveStatus === 'saving' ? 'Saving' : 'Ready'}</StatusBadge>
            <ActionButton variant="subtle" onClick={refresh}>Refresh settings</ActionButton>
            <ActionButton variant="accent" onClick={handleSave} disabled={saveStatus === 'saving'}>
              {saveStatus === 'saving' ? 'Saving…' : 'Save settings'}
            </ActionButton>
          </>
        )}
      >
        <StatisticsDisclosure>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoTile eyebrow="Project Root" title={roots?.projectsRoot || 'Unavailable'} body="Current project workspace root from the active backend." />
            <InfoTile eyebrow="Data Dir" title={roots?.dataDir || settings?.projects?.dataDir || 'Unavailable'} body="SQLite and managed files remain here." />
            <InfoTile eyebrow="Project Type" title={editableState.projectType} body="Type controls the default and optional module set." />
            <InfoTile eyebrow="Primary Action" title={editableState.primaryAction} body="Still used by the current backend and desktop shell." />
          </div>
        </StatisticsDisclosure>
      </SectionShell>

      <SectionShell eyebrow="Project Settings" title="Editable project metadata" description="This first pass covers the highest-signal project settings that already map cleanly to the current API.">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-ink/75">
            <span className="font-medium text-ink">Project Name</span>
            <input className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-accent/60" placeholder="Project name" value={editableState.name} onChange={(event) => setEditableState((current) => ({ ...current, name: event.target.value }))} />
          </label>
          <SuggestedValueInput label="Category" value={editableState.category} onChange={(value) => setEditableState((current) => ({ ...current, category: value }))} placeholder="Category" />
          <label className="space-y-2 text-sm text-ink/75">
            <span className="font-medium text-ink">Project Type</span>
            <select className="w-full rounded-xl border border-white/10 bg-slate px-4 py-3 text-white outline-none focus:border-accent/60" value={editableState.projectType} onChange={(event) => setEditableState((current) => ({ ...current, projectType: event.target.value }))}>
              <option value="general">general</option>
              <option value="software">software</option>
            </select>
          </label>
          <label className="space-y-2 text-sm text-ink/75">
            <span className="font-medium text-ink">Primary Action</span>
            <select className="w-full rounded-xl border border-white/10 bg-slate px-4 py-3 text-white outline-none focus:border-accent/60" value={editableState.primaryAction} onChange={(event) => setEditableState((current) => ({ ...current, primaryAction: event.target.value }))}>
              <option value="auto">auto</option>
              <option value="cursor">cursor</option>
              <option value="vscode">vscode</option>
              <option value="chrome">chrome</option>
              <option value="explorer">explorer</option>
            </select>
          </label>
          <div className="md:col-span-2">
            <label className="space-y-2 text-sm text-ink/75">
              <span className="font-medium text-ink">Project Description</span>
              <textarea className="min-h-28 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-accent/60" placeholder="Project description" value={editableState.description} onChange={(event) => setEditableState((current) => ({ ...current, description: event.target.value }))} />
            </label>
          </div>
        </div>
      </SectionShell>
    </div>
  );
}
