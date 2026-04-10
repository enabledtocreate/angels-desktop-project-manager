'use client';

import { useMemo, useState } from 'react';
import { ActionButton } from '@/components/ui/action-button';
import { AiInstructionsPanel } from '@/components/ui/ai-instructions-panel';
import { FragmentBrowserModal } from '@/components/ui/fragment-browser-modal';
import { InfoTile } from '@/components/ui/info-tile';
import { SectionShell } from '@/components/ui/section-shell';
import { StatisticsDisclosure } from '@/components/ui/statistics-disclosure';
import { StatusBadge } from '@/components/ui/status-badge';
import { SuggestedValueInput } from '@/components/ui/suggested-value-input';
import { SurfaceCard } from '@/components/ui/surface-card';
import { useFeatures } from '@/features/features/hooks/use-features';
import { countActiveFragments } from '@/lib/fragment-utils';

function defaultFeatureForm() {
  return {
    title: '',
    description: '',
    status: 'planned',
    planningBucket: 'considered',
    roadmapPhaseId: '',
    category: '',
    affectedModuleKeys: [],
  };
}

export function FeaturesWorkspace({ project }) {
  const { featuresState, fragments, status, error, saveStatus, refreshStatus, refresh, createFeature, updateFeature, deleteFeature, consumeFeatureFragment } = useFeatures(project, project.type === 'folder');
  const [draft, setDraft] = useState(defaultFeatureForm());
  const [editingId, setEditingId] = useState(null);
  const [isFragmentsOpen, setIsFragmentsOpen] = useState(false);

  const phases = featuresState?.phases || [];
  const features = featuresState?.features || [];
  const activeFeatures = useMemo(() => features.filter((item) => !item.archived), [features]);
  const activeFragmentCount = useMemo(() => countActiveFragments(fragments), [fragments]);
  const moduleOptions = useMemo(
    () => (Array.isArray(project.modules) ? project.modules.filter((module) => module.enabled) : []),
    [project.modules]
  );
  const categorySuggestions = useMemo(
    () => [...new Set(features.map((item) => String(item?.category || '').trim()).filter(Boolean))],
    [features]
  );

  async function handleSubmit() {
    if (!draft.title.trim()) return;
    const payload = {
      title: draft.title,
      description: draft.description,
      summary: draft.description,
      status: draft.status,
      planningBucket: draft.planningBucket,
      roadmapPhaseId: draft.roadmapPhaseId || null,
      category: draft.category || null,
      affectedModuleKeys: draft.affectedModuleKeys,
    };
    if (editingId) await updateFeature(editingId, payload);
    else await createFeature(payload);
    setDraft(defaultFeatureForm());
    setEditingId(null);
  }

  if (status === 'loading' || status === 'idle') {
    return <SectionShell eyebrow="Features" title="Loading features…" description="Fetching feature state from the current backend." />;
  }

  if (status === 'error') {
    return <SectionShell eyebrow="Features" title="Features load failed" description={error ? error.message : 'Unknown features error'} />;
  }

  return (
    <div className="space-y-6">
      <SectionShell
        eyebrow="Features"
        title="Features workspace"
        description="This migrated feature surface keeps creation, editing, and deletion on the live backend while moving the list and planning context into React."
        actions={(
          <>
            <StatusBadge tone="foundation">{activeFeatures.length} active</StatusBadge>
            <StatusBadge tone="migration">{saveStatus === 'saving' ? 'Saving' : 'Ready'}</StatusBadge>
            <StatusBadge tone={refreshStatus === 'error' ? 'caution' : 'migration'}>
              {refreshStatus === 'refreshing' ? 'Refreshing' : refreshStatus === 'refreshed' ? 'Refreshed' : refreshStatus === 'error' ? 'Refresh failed' : 'Loaded'}
            </StatusBadge>
            <ActionButton variant="ghost" onClick={() => setIsFragmentsOpen(true)}>
              {`Load Fragments${activeFragmentCount ? ` (${activeFragmentCount})` : ''}`}
            </ActionButton>
            <ActionButton variant="subtle" onClick={() => refresh().catch(() => {})} disabled={refreshStatus === 'refreshing'}>
              {refreshStatus === 'refreshing' ? 'Refreshing features...' : 'Refresh features'}
            </ActionButton>
          </>
        )}
      >
        <StatisticsDisclosure>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoTile eyebrow="Features" title={`${features.length}`} body={`${features.filter((item) => item.archived).length} archived`} />
            <InfoTile eyebrow="Fragments" title={`${activeFragmentCount}`} body="Feature-linked PRD fragments remain connected through the current backend." />
            <InfoTile eyebrow="Planned" title={`${features.filter((item) => item.planningBucket === 'planned').length}`} body="Features actively moving into a roadmap phase." />
            <InfoTile eyebrow="Considered" title={`${features.filter((item) => item.planningBucket === 'considered').length}`} body="Backlog ideas not yet committed to a phase." />
          </div>
        </StatisticsDisclosure>
      </SectionShell>

      <AiInstructionsPanel
        title="Feature AI Instructions"
        instructions={[
          'Use features as a primary trigger for downstream project updates.',
          'Affected modules indicate which modules likely need review or changes alongside this feature.',
          'If feature scope changes product intent or implementation behavior, create or update a PRD fragment instead of editing PRD directly.',
          'Keep roadmap placement and planning bucket aligned with the actual delivery phase.',
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <SectionShell eyebrow="Editor" title={editingId ? 'Edit feature' : 'Add feature'} description="This first pass focuses on the core planning fields so feature design can move out of the legacy frontend cleanly." actions={<ActionButton variant="accent" onClick={handleSubmit} disabled={saveStatus === 'saving'}>{editingId ? 'Save feature' : 'Create feature'}</ActionButton>}>
          <div className="space-y-3">
            <input className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-accent/60" placeholder="Feature title" value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} />
            <textarea className="min-h-28 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-accent/60" placeholder="Feature description" value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} />
            <div className="grid gap-3 md:grid-cols-2">
              <select className="w-full rounded-xl border border-white/10 bg-slate px-4 py-3 text-white outline-none focus:border-accent/60" value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}>
                <option value="planned">planned</option>
                <option value="in_progress">in_progress</option>
                <option value="done">done</option>
                <option value="blocked">blocked</option>
              </select>
              <select className="w-full rounded-xl border border-white/10 bg-slate px-4 py-3 text-white outline-none focus:border-accent/60" value={draft.planningBucket} onChange={(event) => setDraft((current) => ({ ...current, planningBucket: event.target.value }))}>
                <option value="considered">considered</option>
                <option value="planned">planned</option>
                <option value="phase">phase</option>
                <option value="archived">archived</option>
              </select>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <select className="w-full rounded-xl border border-white/10 bg-slate px-4 py-3 text-white outline-none focus:border-accent/60" value={draft.roadmapPhaseId} onChange={(event) => setDraft((current) => ({ ...current, roadmapPhaseId: event.target.value }))}>
                <option value="">No phase</option>
                {phases.map((phase) => <option key={phase.id} value={phase.id}>{phase.name}</option>)}
              </select>
              <SuggestedValueInput
                label="Category"
                value={draft.category}
                onChange={(value) => setDraft((current) => ({ ...current, category: value }))}
                suggestions={categorySuggestions}
                placeholder="Category"
                help="Choose an existing category or type a new one."
                inputClassName="rounded-xl"
              />
            </div>
            <label className="block space-y-2 text-sm text-sky-100/75">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100/60">Affected Modules</span>
              <select
                multiple
                value={draft.affectedModuleKeys}
                onChange={(event) => {
                  const nextValue = Array.from(event.target.selectedOptions).map((option) => option.value);
                  setDraft((current) => ({ ...current, affectedModuleKeys: nextValue }));
                }}
                className="min-h-28 w-full rounded-xl border border-white/10 bg-slate px-4 py-3 text-white outline-none focus:border-accent/60"
              >
                {moduleOptions.map((module) => (
                  <option key={module.moduleKey} value={module.moduleKey}>
                    {module.label || module.moduleKey}
                  </option>
                ))}
              </select>
            </label>
            {editingId ? <ActionButton variant="ghost" onClick={() => { setEditingId(null); setDraft(defaultFeatureForm()); }}>Cancel editing</ActionButton> : null}
          </div>
        </SectionShell>

        <SectionShell eyebrow="Feature List" title="Live software features" description="Feature cards here are backed by the current backend and still participate in roadmap and PRD generation.">
          <div className="space-y-3">
            {features.length ? features.map((feature) => (
              <SurfaceCard key={feature.id} className="p-4" tone={feature.archived ? 'muted' : 'default'}>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{feature.code || feature.id}</p>
                    <h3 className="mt-1 text-lg font-semibold text-white">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-sky-100/75">{feature.description || feature.summary || 'No description yet.'}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.16em] text-sky-100/55">{feature.status || 'planned'} • {feature.planningBucket || 'considered'} • {feature.category || 'uncategorized'}</p>
                    {Array.isArray(feature.affectedModuleKeys) && feature.affectedModuleKeys.length ? (
                      <p className="mt-2 text-xs text-sky-100/70">Affected modules: {feature.affectedModuleKeys.join(', ')}</p>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <ActionButton size="sm" variant="ghost" onClick={() => {
                      setEditingId(feature.id);
                      setDraft({
                        title: feature.title || '',
                        description: feature.description || feature.summary || '',
                        status: feature.status || 'planned',
                        planningBucket: feature.planningBucket || 'considered',
                        roadmapPhaseId: feature.roadmapPhaseId || '',
                        category: feature.category || '',
                        affectedModuleKeys: Array.isArray(feature.affectedModuleKeys) ? feature.affectedModuleKeys : [],
                      });
                    }}>Edit</ActionButton>
                    <ActionButton size="sm" variant="subtle" onClick={() => deleteFeature(feature.id)}>Delete</ActionButton>
                  </div>
                </div>
              </SurfaceCard>
            )) : (
              <SurfaceCard tone="muted">
                <p className="text-sm leading-6 text-sky-100/75">No features yet. Add the first software feature from the editor.</p>
              </SurfaceCard>
            )}
          </div>
        </SectionShell>
      </div>

      <FragmentBrowserModal
        title="Feature Fragments"
        eyebrow="Fragment Browser"
        isOpen={isFragmentsOpen}
        fragments={fragments}
        onClose={() => setIsFragmentsOpen(false)}
        onIntegrate={(fragment) => consumeFeatureFragment(fragment)}
        onRefresh={() => refresh()}
        storageKey={`${project.id}-features-fragments`}
      />
    </div>
  );
}
