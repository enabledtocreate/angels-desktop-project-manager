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
import { useBugs } from '@/features/bugs/hooks/use-bugs';
import { countActiveFragments } from '@/lib/fragment-utils';

function defaultBugForm() {
  return {
    title: '',
    currentBehavior: '',
    expectedBehavior: '',
    status: 'open',
    planningBucket: 'considered',
    roadmapPhaseId: '',
    category: '',
    affectedModuleKeys: [],
  };
}

export function BugsWorkspace({ project }) {
  const { bugsState, fragments, status, error, saveStatus, refresh, createBug, updateBug, deleteBug, consumeBugFragment } = useBugs(project, project.type === 'folder');
  const [draft, setDraft] = useState(defaultBugForm());
  const [editingId, setEditingId] = useState(null);
  const [isFragmentsOpen, setIsFragmentsOpen] = useState(false);

  const bugs = bugsState?.bugs || [];
  const activeBugs = useMemo(() => bugs.filter((item) => !item.archived), [bugs]);
  const activeFragmentCount = useMemo(() => countActiveFragments(fragments), [fragments]);
  const moduleOptions = useMemo(
    () => (Array.isArray(project.modules) ? project.modules.filter((module) => module.enabled) : []),
    [project.modules]
  );
  const categorySuggestions = useMemo(
    () => [...new Set(bugs.map((item) => String(item?.category || '').trim()).filter(Boolean))],
    [bugs]
  );

  async function handleSubmit() {
    if (!draft.title.trim()) return;
    const payload = {
      title: draft.title,
      currentBehavior: draft.currentBehavior,
      expectedBehavior: draft.expectedBehavior,
      status: draft.status,
      planningBucket: draft.planningBucket,
      roadmapPhaseId: draft.roadmapPhaseId || null,
      category: draft.category || null,
      affectedModuleKeys: draft.affectedModuleKeys,
      completed: draft.status === 'done',
      regressed: draft.status === 'regressed',
    };
    if (editingId) await updateBug(editingId, payload);
    else await createBug(payload);
    setDraft(defaultBugForm());
    setEditingId(null);
  }

  if (status === 'loading' || status === 'idle') {
    return <SectionShell eyebrow="Bugs" title="Loading bugs…" description="Fetching bug state from the current backend." />;
  }

  if (status === 'error') {
    return <SectionShell eyebrow="Bugs" title="Bugs load failed" description={error ? error.message : 'Unknown bugs error'} />;
  }

  return (
    <div className="space-y-6">
      <SectionShell
        eyebrow="Bugs"
        title="Bugs workspace"
        description="This migrated bug surface keeps the current and expected behavior model intact while moving issue editing and review into React."
        actions={(
          <>
            <StatusBadge tone="foundation">{activeBugs.length} active</StatusBadge>
            <StatusBadge tone="migration">{saveStatus === 'saving' ? 'Saving' : 'Ready'}</StatusBadge>
            <ActionButton variant="ghost" onClick={() => setIsFragmentsOpen(true)}>
              {`Load Fragments${activeFragmentCount ? ` (${activeFragmentCount})` : ''}`}
            </ActionButton>
            <ActionButton variant="subtle" onClick={refresh}>Refresh bugs</ActionButton>
          </>
        )}
      >
        <StatisticsDisclosure>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoTile eyebrow="Bugs" title={`${bugs.length}`} body={`${bugs.filter((item) => item.archived).length} archived`} />
            <InfoTile eyebrow="Regressed" title={`${bugs.filter((item) => item.regressed).length}`} body="Bugs marked as regressed stay visible here." />
            <InfoTile eyebrow="Completed" title={`${bugs.filter((item) => item.completed).length}`} body="Completed bugs remain available for project history." />
            <InfoTile eyebrow="Considered" title={`${bugs.filter((item) => item.planningBucket === 'considered').length}`} body="Backlog issues waiting for prioritization." />
          </div>
        </StatisticsDisclosure>
      </SectionShell>

      <AiInstructionsPanel
        title="Bug AI Instructions"
        instructions={[
          'Use bugs to identify implementation corrections that may require updates outside the bug module itself.',
          'Affected modules indicate which project areas likely need follow-up review when this bug is addressed.',
          'Keep current behavior grounded in what is happening now and expected behavior grounded in the intended design.',
          'If a bug changes delivery scope or product behavior, review Roadmap and PRD-related records as follow-up work.',
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <SectionShell eyebrow="Editor" title={editingId ? 'Edit bug' : 'Add bug'} description="This first pass focuses on the fields that matter most for issue tracking and roadmap placement." actions={<ActionButton variant="accent" onClick={handleSubmit} disabled={saveStatus === 'saving'}>{editingId ? 'Save bug' : 'Create bug'}</ActionButton>}>
          <div className="space-y-3">
            <input className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-accent/60" placeholder="Bug title" value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} />
            <textarea className="min-h-24 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-accent/60" placeholder="Current behavior" value={draft.currentBehavior} onChange={(event) => setDraft((current) => ({ ...current, currentBehavior: event.target.value }))} />
            <textarea className="min-h-24 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-accent/60" placeholder="Expected behavior" value={draft.expectedBehavior} onChange={(event) => setDraft((current) => ({ ...current, expectedBehavior: event.target.value }))} />
            <div className="grid gap-3 md:grid-cols-2">
              <select className="w-full rounded-xl border border-white/10 bg-slate px-4 py-3 text-white outline-none focus:border-accent/60" value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}>
                <option value="open">open</option>
                <option value="in_progress">in_progress</option>
                <option value="done">done</option>
                <option value="blocked">blocked</option>
                <option value="regressed">regressed</option>
              </select>
              <select className="w-full rounded-xl border border-white/10 bg-slate px-4 py-3 text-white outline-none focus:border-accent/60" value={draft.planningBucket} onChange={(event) => setDraft((current) => ({ ...current, planningBucket: event.target.value }))}>
                <option value="considered">considered</option>
                <option value="planned">planned</option>
                <option value="phase">phase</option>
                <option value="archived">archived</option>
              </select>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <SuggestedValueInput
                label="Category"
                value={draft.category}
                onChange={(value) => setDraft((current) => ({ ...current, category: value }))}
                suggestions={categorySuggestions}
                placeholder="Category"
                help="Choose an existing category or type a new one."
                inputClassName="rounded-xl"
              />
              <input className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-accent/60" placeholder="Roadmap phase id (optional)" value={draft.roadmapPhaseId} onChange={(event) => setDraft((current) => ({ ...current, roadmapPhaseId: event.target.value }))} />
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
            {editingId ? <ActionButton variant="ghost" onClick={() => { setEditingId(null); setDraft(defaultBugForm()); }}>Cancel editing</ActionButton> : null}
          </div>
        </SectionShell>

        <SectionShell eyebrow="Bug List" title="Live software bugs" description="Bug cards here still participate in the existing roadmap and document generation flows.">
          <div className="space-y-3">
            {bugs.length ? bugs.map((bug) => (
              <SurfaceCard key={bug.id} className="p-4" tone={bug.archived ? 'muted' : 'default'}>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{bug.code || bug.id}</p>
                    <h3 className="mt-1 text-lg font-semibold text-white">{bug.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-sky-100/75">Current: {bug.currentBehavior || bug.summary || 'No current behavior noted.'}</p>
                    <p className="mt-1 text-sm leading-6 text-sky-100/75">Expected: {bug.expectedBehavior || 'No expected behavior noted.'}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.16em] text-sky-100/55">{bug.status || 'open'} • {bug.planningBucket || 'considered'} • {bug.category || 'uncategorized'}</p>
                    {Array.isArray(bug.affectedModuleKeys) && bug.affectedModuleKeys.length ? (
                      <p className="mt-2 text-xs text-sky-100/70">Affected modules: {bug.affectedModuleKeys.join(', ')}</p>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <ActionButton size="sm" variant="ghost" onClick={() => {
                      setEditingId(bug.id);
                      setDraft({
                        title: bug.title || '',
                        currentBehavior: bug.currentBehavior || bug.summary || '',
                        expectedBehavior: bug.expectedBehavior || '',
                        status: bug.status || 'open',
                        planningBucket: bug.planningBucket || 'considered',
                        roadmapPhaseId: bug.roadmapPhaseId || '',
                        category: bug.category || '',
                        affectedModuleKeys: Array.isArray(bug.affectedModuleKeys) ? bug.affectedModuleKeys : [],
                      });
                    }}>Edit</ActionButton>
                    <ActionButton size="sm" variant="subtle" onClick={() => deleteBug(bug.id)}>Delete</ActionButton>
                  </div>
                </div>
              </SurfaceCard>
            )) : (
              <SurfaceCard tone="muted">
                <p className="text-sm leading-6 text-sky-100/75">No bugs yet. Add the first issue from the editor.</p>
              </SurfaceCard>
            )}
          </div>
        </SectionShell>
      </div>

      <FragmentBrowserModal
        title="Bug Fragments"
        eyebrow="Fragment Browser"
        isOpen={isFragmentsOpen}
        fragments={fragments}
        onClose={() => setIsFragmentsOpen(false)}
        onIntegrate={(fragment) => consumeBugFragment(fragment)}
        storageKey={`${project.id}-bugs-fragments`}
      />
    </div>
  );
}
