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

const BUG_STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'triaged', label: 'Triaged' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'fixed', label: 'Fixed' },
  { value: 'verifying', label: 'Verifying' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
  { value: 'regressed', label: 'Regressed' },
];

const ACTIVE_BUG_STATUSES = new Set(['open', 'triaged', 'in_progress', 'blocked', 'fixed', 'verifying', 'regressed']);

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
    associationHints: '',
  };
}

function normalizeBugStatus(status) {
  return String(status || 'open').trim().toLowerCase();
}

function isArchivedBug(bug) {
  const normalizedStatus = normalizeBugStatus(bug?.status);
  const planningBucket = String(bug?.planningBucket || '').trim().toLowerCase();
  return Boolean(bug?.archived) || planningBucket === 'archived' || normalizedStatus === 'resolved' || normalizedStatus === 'closed';
}

function isActiveBug(bug) {
  const normalizedStatus = normalizeBugStatus(bug?.status);
  const planningBucket = String(bug?.planningBucket || '').trim().toLowerCase();
  return !isArchivedBug(bug) && ACTIVE_BUG_STATUSES.has(normalizedStatus) && ['considered', 'planned', 'phase'].includes(planningBucket || 'considered');
}

function parseAssociationHints(value) {
  return [...new Set(
    String(value || '')
      .split(/[\s,;]+/)
      .map((item) => item.trim())
      .filter((item) => /^@[\w:-]+$/i.test(item))
  )];
}

function formatBucketLabel(value) {
  const normalized = String(value || 'considered').trim().toLowerCase();
  if (normalized === 'phase') return 'Phase';
  if (normalized === 'planned') return 'Planned';
  if (normalized === 'archived') return 'Archived';
  return 'Considered';
}

function IconButton({ label, title, onClick, variant = 'ghost' }) {
  return <ActionButton size="sm" variant={variant} onClick={onClick} title={title} aria-label={title}>{label}</ActionButton>;
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

function ViewToggle({ value, current, onClick, children }) {
  const active = value === current;
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
        active
          ? 'border-accent/70 bg-accent/20 text-white'
          : 'border-white/10 bg-white/5 text-sky-100/70 hover:border-white/20 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

function BugListRow({ bug, onEdit, onDelete }) {
  return (
    <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 md:grid-cols-[140px_minmax(0,1.6fr)_140px_150px_160px_160px_auto] md:items-center">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-100/60">{bug.code || bug.id}</p>
      <p className="truncate text-sm font-semibold text-white">{bug.title}</p>
      <p className="text-sm text-sky-100/80">{String(bug.status || 'open').replace(/_/g, ' ')}</p>
      <p className="text-sm text-sky-100/80">{formatBucketLabel(bug.planningBucket)}</p>
      <p className="truncate text-sm text-sky-100/80">{bug.roadmapPhaseName || (bug.roadmapPhaseId ? bug.roadmapPhaseId : 'No phase')}</p>
      <p className="truncate text-sm text-sky-100/80">{bug.category || 'uncategorized'}</p>
      <div className="flex items-center justify-end gap-2">
        <IconButton variant="ghost" title="Edit bug" onClick={onEdit} label={<PencilIcon />} />
        <IconButton variant="subtle" title="Delete bug" onClick={onDelete} label={<TrashIcon />} />
      </div>
    </div>
  );
}

function BugDetailCard({ bug, onEdit, onDelete }) {
  const associationHints = parseAssociationHints(bug.associationHints);
  return (
    <SurfaceCard key={bug.id} className="p-4" tone={bug.archived ? 'muted' : 'default'}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold text-white">{bug.code || bug.id}</p>
          <h3 className="mt-1 text-lg font-semibold text-white">{bug.title}</h3>
          <p className="mt-2 text-sm leading-6 text-sky-100/75">Current: {bug.currentBehavior || bug.summary || 'No current behavior noted.'}</p>
          <p className="mt-1 text-sm leading-6 text-sky-100/75">Expected: {bug.expectedBehavior || 'No expected behavior noted.'}</p>
          <p className="mt-3 text-xs uppercase tracking-[0.16em] text-sky-100/55">{String(bug.status || 'open').replace(/_/g, ' ')} | {formatBucketLabel(bug.planningBucket)} | {bug.roadmapPhaseName || (bug.roadmapPhaseId ? bug.roadmapPhaseId : 'no phase')} | {bug.category || 'uncategorized'}</p>
          {Array.isArray(bug.affectedModuleKeys) && bug.affectedModuleKeys.length ? (
            <p className="mt-2 text-xs text-sky-100/70">Affected modules: {bug.affectedModuleKeys.join(', ')}</p>
          ) : null}
          {associationHints.length ? (
            <p className="mt-1 text-xs text-sky-100/70">Association hints: {associationHints.join(', ')}</p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <IconButton variant="ghost" title="Edit bug" onClick={onEdit} label={<PencilIcon />} />
          <IconButton variant="subtle" title="Delete bug" onClick={onDelete} label={<TrashIcon />} />
        </div>
      </div>
    </SurfaceCard>
  );
}

function BugListHeader() {
  return (
    <div className="hidden gap-3 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-100/55 md:grid md:grid-cols-[140px_minmax(0,1.6fr)_140px_150px_160px_160px_auto]">
      <span>Bug Code</span>
      <span>Title</span>
      <span>State</span>
      <span>State Bucket</span>
      <span>Roadmap Phase</span>
      <span>Category</span>
      <span className="text-right">Actions</span>
    </div>
  );
}

export function BugsWorkspace({ project }) {
  const { bugsState, fragments, status, error, saveStatus, refresh, createBug, updateBug, deleteBug, consumeBugFragment } = useBugs(project, project.type === 'folder');
  const [draft, setDraft] = useState(defaultBugForm());
  const [editingId, setEditingId] = useState(null);
  const [isFragmentsOpen, setIsFragmentsOpen] = useState(false);
  const [listTab, setListTab] = useState('live');
  const [listView, setListView] = useState('detail');

  const bugs = bugsState?.bugs || [];
  const phases = bugsState?.phases || [];
  const activeFragmentCount = useMemo(() => countActiveFragments(fragments), [fragments]);
  const moduleOptions = useMemo(
    () => (Array.isArray(project.modules) ? project.modules.filter((module) => module.enabled) : []),
    [project.modules]
  );
  const categorySuggestions = useMemo(
    () => [...new Set(bugs.map((item) => String(item?.category || '').trim()).filter(Boolean))],
    [bugs]
  );
  const phaseNameById = useMemo(() => new Map(phases.map((phase) => [phase.id, phase.name])), [phases]);
  const bugsWithPhaseNames = useMemo(
    () => bugs.map((bug) => ({ ...bug, roadmapPhaseName: bug.roadmapPhaseId ? phaseNameById.get(bug.roadmapPhaseId) : '' })),
    [bugs, phaseNameById]
  );
  const liveBugs = useMemo(() => bugsWithPhaseNames.filter(isActiveBug), [bugsWithPhaseNames]);
  const archivedBugs = useMemo(() => bugsWithPhaseNames.filter(isArchivedBug), [bugsWithPhaseNames]);
  const visibleBugs = listTab === 'archived' ? archivedBugs : liveBugs;

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
      associationHints: draft.associationHints,
      completed: draft.status === 'resolved' || draft.status === 'closed',
      regressed: draft.status === 'regressed',
    };
    if (editingId) await updateBug(editingId, payload);
    else await createBug(payload);
    setDraft(defaultBugForm());
    setEditingId(null);
  }

  function startEditingBug(bug) {
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
      associationHints: bug.associationHints || '',
    });
  }

  if (status === 'loading' || status === 'idle') {
    return <SectionShell eyebrow="Bugs" title="Loading bugs..." description="Fetching bug state from the current backend." />;
  }

  if (status === 'error') {
    return <SectionShell eyebrow="Bugs" title="Bugs load failed" description={error ? error.message : 'Unknown bugs error'} />;
  }

  return (
    <div className="space-y-6">
      <SectionShell
        eyebrow="Bugs"
        title="Bugs workspace"
        description="Track software bugs through a defined lifecycle, keep active and archived bugs separate, and regenerate BUGS.md from database-backed bug state."
        actions={(
          <>
            <StatusBadge tone="foundation">{liveBugs.length} active</StatusBadge>
            <StatusBadge tone="migration">{archivedBugs.length} archived</StatusBadge>
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
            <InfoTile eyebrow="Active" title={`${liveBugs.length}`} body="Open issues still in considered, planned, or roadmap phase work." />
            <InfoTile eyebrow="Archived" title={`${archivedBugs.length}`} body="Resolved or closed bugs move to archive and remain available as historical bug records." />
            <InfoTile eyebrow="Regressed" title={`${liveBugs.filter((item) => normalizeBugStatus(item.status) === 'regressed').length}`} body="Regressions remain active until the fix is verified again." />
            <InfoTile eyebrow="Fragments" title={`${activeFragmentCount}`} body="Archived fixes should produce downstream fragments and changelog updates." />
          </div>
        </StatisticsDisclosure>
      </SectionShell>

      <AiInstructionsPanel
        title="Bug AI Instructions"
        instructions={[
          'Only active bugs should remain in BUGS.md. Resolved and closed bugs belong in archive follow-up notes under the project workspace folder.',
          'When a bug is archived, generate the appropriate fragments for the affected canonical documents and attach the bug code to the resulting document items.',
          'Association hints use @item-id tokens as optional context to help the AI connect a bug to the right document items or module records.',
          'If an archived bug is reactivated, remove its workspace archive note and move it back into the active bug flow.',
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
        <SectionShell
          eyebrow="Editor"
          title={editingId ? 'Edit bug' : 'Add bug'}
          description="Capture what is broken, what should happen instead, and where the bug sits in the delivery workflow."
          actions={<ActionButton variant="accent" onClick={handleSubmit} disabled={saveStatus === 'saving'}>{editingId ? 'Save bug' : 'Create bug'}</ActionButton>}
        >
          <div className="space-y-4">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100/60">1. Bug Definition</p>
              <input className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-accent/60" placeholder="Bug title" value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} />
              <textarea className="min-h-24 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-accent/60" placeholder="Current behavior" value={draft.currentBehavior} onChange={(event) => setDraft((current) => ({ ...current, currentBehavior: event.target.value }))} />
              <textarea className="min-h-24 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-accent/60" placeholder="Expected behavior" value={draft.expectedBehavior} onChange={(event) => setDraft((current) => ({ ...current, expectedBehavior: event.target.value }))} />
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100/60">2. Workflow And Planning</p>
              <div className="grid gap-3 md:grid-cols-2">
                <select className="w-full rounded-xl border border-white/10 bg-slate px-4 py-3 text-white outline-none focus:border-accent/60" value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}>
                  {BUG_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <select className="w-full rounded-xl border border-white/10 bg-slate px-4 py-3 text-white outline-none focus:border-accent/60" value={draft.planningBucket} onChange={(event) => setDraft((current) => ({ ...current, planningBucket: event.target.value }))}>
                  <option value="considered">Considered</option>
                  <option value="planned">Planned</option>
                  <option value="phase">Phase</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <select className="w-full rounded-xl border border-white/10 bg-slate px-4 py-3 text-white outline-none focus:border-accent/60" value={draft.roadmapPhaseId} onChange={(event) => setDraft((current) => ({ ...current, roadmapPhaseId: event.target.value }))}>
                  <option value="">No roadmap phase</option>
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
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100/60">3. Context And Hints</p>
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
              <textarea
                className="min-h-20 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-accent/60"
                placeholder="Association hints (optional). Use @item-id tokens to hint at related document or module items."
                value={draft.associationHints}
                onChange={(event) => setDraft((current) => ({ ...current, associationHints: event.target.value }))}
              />
              <p className="text-xs leading-5 text-sky-100/65">Optional AI hinting: use tokens like <code>@prd-functional-save</code> or <code>@architecture-flow-sync</code> to point the bug at related module items.</p>
            </div>

            {editingId ? <ActionButton variant="ghost" onClick={() => { setEditingId(null); setDraft(defaultBugForm()); }}>Cancel editing</ActionButton> : null}
          </div>
        </SectionShell>

        <SectionShell
          eyebrow="Bug List"
          title={listTab === 'archived' ? 'Archived bugs' : 'Live software bugs'}
          description={listTab === 'archived'
            ? 'Archived bugs are resolved or closed and remain here as history without cluttering the active bug workflow.'
            : 'Active bugs stay visible here while they are still moving through the delivery workflow.'}
          actions={(
            <div className="flex flex-wrap gap-2">
              <ViewToggle value="live" current={listTab} onClick={setListTab}>Live Software Bugs</ViewToggle>
              <ViewToggle value="archived" current={listTab} onClick={setListTab}>Archived Bugs</ViewToggle>
              <ViewToggle value="detail" current={listView} onClick={setListView}>Detail View</ViewToggle>
              <ViewToggle value="list" current={listView} onClick={setListView}>List View</ViewToggle>
            </div>
          )}
        >
          <div className="space-y-3">
            {visibleBugs.length ? (
              listView === 'list' ? (
                <>
                  <BugListHeader />
                  {visibleBugs.map((bug) => (
                    <BugListRow
                      key={bug.id}
                      bug={bug}
                      onEdit={() => startEditingBug(bug)}
                      onDelete={() => deleteBug(bug.id)}
                    />
                  ))}
                </>
              ) : visibleBugs.map((bug) => (
                <BugDetailCard
                  key={bug.id}
                  bug={bug}
                  onEdit={() => startEditingBug(bug)}
                  onDelete={() => deleteBug(bug.id)}
                />
              ))
            ) : (
              <SurfaceCard tone="muted">
                <p className="text-sm leading-6 text-sky-100/75">{listTab === 'archived' ? 'No archived bugs yet.' : 'No active bugs yet. Add the first issue from the editor.'}</p>
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
