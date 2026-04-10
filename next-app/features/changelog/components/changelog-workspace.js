'use client';

import { useEffect, useMemo, useState } from 'react';
import { ActionButton } from '@/components/ui/action-button';
import { DocumentFieldMeta } from '@/components/ui/document-field-meta';
import { FragmentBrowserModal } from '@/components/ui/fragment-browser-modal';
import { InfoTile } from '@/components/ui/info-tile';
import { SectionShell } from '@/components/ui/section-shell';
import { StatisticsDisclosure } from '@/components/ui/statistics-disclosure';
import { StatusBadge } from '@/components/ui/status-badge';
import { StructuredEntryListEditor } from '@/components/ui/structured-entry-list-editor';
import { SurfaceCard } from '@/components/ui/surface-card';
import { useModuleDocument } from '@/features/software/hooks/use-module-document';
import { useProjectWorkItemLookup } from '@/hooks/use-project-work-item-lookup';
import { countActiveFragments } from '@/lib/fragment-utils';

const TARGET_DOC_OPTIONS = [
  'PROJECT_BRIEF',
  'ROADMAP',
  'FEATURES',
  'BUGS',
  'PRD',
  'ARCHITECTURE',
  'DATABASE_SCHEMA',
  'AI_ENVIRONMENT',
  'FUNCTIONAL_SPEC',
  'TECHNICAL_DESIGN',
  'EXPERIENCE_DESIGN',
  'ADR',
  'TEST_STRATEGY',
];

function createDraftEntry() {
  return {
    changeDate: new Date().toISOString().slice(0, 10),
    workItemCodes: '',
    operation: 'update',
    targetDoc: 'PRD',
    targetSectionNumber: '',
    targetItemId: '',
    fragmentCode: '',
    summary: '',
  };
}

function normalizeEntry(entry, index = 0) {
  return {
    id: entry?.id || `changelog-entry-${index + 1}`,
    changeDate: entry?.changeDate || '',
    workItemCodes: entry?.workItemCodes || '',
    operation: entry?.operation || 'update',
    targetDoc: entry?.targetDoc || '',
    targetSectionNumber: entry?.targetSectionNumber || '',
    targetItemId: entry?.targetItemId || '',
    fragmentCode: entry?.fragmentCode || '',
    summary: entry?.summary || '',
    versionDate: entry?.versionDate || '',
  };
}

function buildEditableState(editorState) {
  const state = editorState || {};
  return {
    summary: state.overview?.summary || '',
    summaryMeta: {
      stableId: state.overview?.stableId || '',
      sourceRefs: Array.isArray(state.overview?.sourceRefs) ? state.overview.sourceRefs : [],
    },
    entries: Array.isArray(state.entries) ? state.entries.map(normalizeEntry) : [],
    openQuestions: Array.isArray(state.openQuestions) ? state.openQuestions : [],
  };
}

function buildEditorState(editableState, currentState = null) {
  const now = new Date().toISOString();
  return {
    ...(currentState || {}),
    overview: {
      ...(currentState?.overview || {}),
      summary: editableState.summary,
      stableId: editableState.summaryMeta?.stableId,
      sourceRefs: editableState.summaryMeta?.sourceRefs,
      versionDate: now,
    },
    entries: Array.isArray(editableState.entries)
      ? editableState.entries.map((entry, index) => ({
          ...normalizeEntry(entry, index),
          versionDate: entry?.versionDate || now,
        }))
      : [],
    openQuestions: Array.isArray(editableState.openQuestions) ? editableState.openQuestions : [],
    fragmentHistory: Array.isArray(currentState?.fragmentHistory) ? currentState.fragmentHistory : [],
  };
}

function ChangelogTextArea({ label, value, onChange, rows = 4, help, stableId = '', sourceRefs = [], workItemLookup = {} }) {
  return (
    <label className="space-y-2 text-sm text-sky-100/75">
      <span className="font-medium text-white">{label}</span>
      {help ? <p className="text-xs leading-5 text-sky-100/55">{help}</p> : null}
      <textarea
        rows={rows}
        className="min-h-24 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-accent/60"
        value={value}
        onChange={onChange}
      />
      <DocumentFieldMeta stableId={stableId} sourceRefs={sourceRefs} workItemLookup={workItemLookup} />
    </label>
  );
}

function ChangelogEntryEditor({ entries = [], onChange }) {
  const normalizedEntries = useMemo(() => (Array.isArray(entries) ? entries.map(normalizeEntry) : []), [entries]);
  const [draft, setDraft] = useState(createDraftEntry);

  const canAdd = String(draft.workItemCodes || '').trim()
    && String(draft.targetSectionNumber || '').trim()
    && String(draft.targetItemId || '').trim()
    && String(draft.summary || '').trim()
    && String(draft.targetDoc || '').trim();

  function updateDraft(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function updateEntry(entryId, updates) {
    onChange(normalizedEntries.map((entry) => (
      entry.id === entryId
        ? { ...entry, ...updates, versionDate: new Date().toISOString() }
        : entry
    )));
  }

  function addEntry() {
    if (!canAdd) return;
    onChange([
      ...normalizedEntries,
      {
        ...draft,
        id: `changelog-entry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        versionDate: new Date().toISOString(),
      },
    ]);
    setDraft(createDraftEntry());
  }

  function removeEntry(entryId) {
    onChange(normalizedEntries.filter((entry) => entry.id !== entryId));
  }

  function moveEntry(entryId, direction) {
    const currentEntries = [...normalizedEntries];
    const index = currentEntries.findIndex((entry) => entry.id === entryId);
    if (index < 0) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentEntries.length) return;
    const [entry] = currentEntries.splice(index, 1);
    currentEntries.splice(targetIndex, 0, entry);
    onChange(currentEntries);
  }

  function renderTargetDocSelect(value, onValueChange, draftMode = false) {
    return (
      <select
        className={`w-full rounded-xl border px-3 py-2 text-white outline-none focus:border-accent ${
          draftMode ? 'border-accent/35 bg-white/5' : 'border-white/10 bg-slate'
        }`}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
      >
        {TARGET_DOC_OPTIONS.map((option) => (
          <option key={option} value={option} className="bg-slate text-white">
            {option}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-medium text-white">Change Entries</p>
        <p className="text-xs leading-5 text-sky-100/55">
          Each entry ties human-readable change history back to work item codes and a stable target item id.
        </p>
      </div>

      <div className="rounded-2xl border border-accent/35 bg-accent/10 p-3">
        <div className="grid gap-3 lg:grid-cols-2">
          <input
            className="w-full rounded-xl border border-accent/35 bg-white/5 px-3 py-2 text-white outline-none focus:border-accent"
            placeholder="Work Item Codes (FEAT-001, BUG-004)"
            value={draft.workItemCodes}
            onChange={(event) => updateDraft('workItemCodes', event.target.value)}
          />
          <input
            className="w-full rounded-xl border border-accent/35 bg-white/5 px-3 py-2 text-white outline-none focus:border-accent"
            placeholder="Change Date"
            value={draft.changeDate}
            onChange={(event) => updateDraft('changeDate', event.target.value)}
          />
          <input
            className="w-full rounded-xl border border-accent/35 bg-white/5 px-3 py-2 text-white outline-none focus:border-accent"
            placeholder="Operation"
            value={draft.operation}
            onChange={(event) => updateDraft('operation', event.target.value)}
          />
          {renderTargetDocSelect(draft.targetDoc, (value) => updateDraft('targetDoc', value), true)}
          <input
            className="w-full rounded-xl border border-accent/35 bg-white/5 px-3 py-2 text-white outline-none focus:border-accent"
            placeholder="Target Section Number (for example 2.1.3)"
            value={draft.targetSectionNumber}
            onChange={(event) => updateDraft('targetSectionNumber', event.target.value)}
          />
          <input
            className="w-full rounded-xl border border-accent/35 bg-white/5 px-3 py-2 text-white outline-none focus:border-accent"
            placeholder="Target Item ID"
            value={draft.targetItemId}
            onChange={(event) => updateDraft('targetItemId', event.target.value)}
          />
          <input
            className="w-full rounded-xl border border-accent/35 bg-white/5 px-3 py-2 text-white outline-none focus:border-accent lg:col-span-2"
            placeholder="Fragment Code (optional)"
            value={draft.fragmentCode}
            onChange={(event) => updateDraft('fragmentCode', event.target.value)}
          />
          <div className="lg:col-span-2">
            <textarea
              rows={4}
              className="w-full rounded-xl border border-accent/35 bg-white/5 px-3 py-2 text-white outline-none focus:border-accent"
              placeholder="Human-readable summary of what changed and why it matters."
              value={draft.summary}
              onChange={(event) => updateDraft('summary', event.target.value)}
            />
          </div>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-rose-300/35 bg-rose-400/12 text-lg text-rose-100 transition hover:bg-rose-400/22"
            onClick={() => setDraft(createDraftEntry())}
            aria-label="Clear change entry draft"
          >
            x
          </button>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-300/40 bg-emerald-400/15 text-lg text-emerald-100 transition hover:bg-emerald-400/25 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={addEntry}
            disabled={!canAdd}
            aria-label="Add change entry"
          >
            +
          </button>
        </div>
      </div>

      {normalizedEntries.length ? (
        <div className="space-y-3">
          {normalizedEntries.map((entry, index) => (
            <div key={entry.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="grid gap-3 lg:grid-cols-2">
                <input
                  className="w-full rounded-xl border border-white/10 bg-slate px-3 py-2 text-white outline-none focus:border-accent/60"
                  value={entry.workItemCodes}
                  placeholder="Work Item Codes"
                  onChange={(event) => updateEntry(entry.id, { workItemCodes: event.target.value })}
                />
                <input
                  className="w-full rounded-xl border border-white/10 bg-slate px-3 py-2 text-white outline-none focus:border-accent/60"
                  value={entry.changeDate}
                  placeholder="Change Date"
                  onChange={(event) => updateEntry(entry.id, { changeDate: event.target.value })}
                />
                <input
                  className="w-full rounded-xl border border-white/10 bg-slate px-3 py-2 text-white outline-none focus:border-accent/60"
                  value={entry.operation}
                  placeholder="Operation"
                  onChange={(event) => updateEntry(entry.id, { operation: event.target.value })}
                />
                {renderTargetDocSelect(entry.targetDoc, (value) => updateEntry(entry.id, { targetDoc: value }))}
                <input
                  className="w-full rounded-xl border border-white/10 bg-slate px-3 py-2 text-white outline-none focus:border-accent/60"
                  value={entry.targetSectionNumber}
                  placeholder="Target Section Number"
                  onChange={(event) => updateEntry(entry.id, { targetSectionNumber: event.target.value })}
                />
                <input
                  className="w-full rounded-xl border border-white/10 bg-slate px-3 py-2 text-white outline-none focus:border-accent/60"
                  value={entry.targetItemId}
                  placeholder="Target Item ID"
                  onChange={(event) => updateEntry(entry.id, { targetItemId: event.target.value })}
                />
                <input
                  className="w-full rounded-xl border border-white/10 bg-slate px-3 py-2 text-white outline-none focus:border-accent/60 lg:col-span-2"
                  value={entry.fragmentCode}
                  placeholder="Fragment Code"
                  onChange={(event) => updateEntry(entry.id, { fragmentCode: event.target.value })}
                />
                <div className="lg:col-span-2">
                  <textarea
                    rows={4}
                    className="w-full rounded-xl border border-white/10 bg-slate px-3 py-2 text-white outline-none focus:border-accent/60"
                    value={entry.summary}
                    placeholder="Summary"
                    onChange={(event) => updateEntry(entry.id, { summary: event.target.value })}
                  />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="text-xs text-sky-100/55">
                  {entry.versionDate ? `Updated ${String(entry.versionDate).slice(0, 10)}` : 'New entry'}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm text-white transition hover:bg-white/10 disabled:opacity-35"
                    onClick={() => moveEntry(entry.id, 'up')}
                    disabled={index === 0}
                    aria-label="Move entry up"
                  >
                    ^
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm text-white transition hover:bg-white/10 disabled:opacity-35"
                    onClick={() => moveEntry(entry.id, 'down')}
                    disabled={index === normalizedEntries.length - 1}
                    aria-label="Move entry down"
                  >
                    v
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-rose-300/30 bg-rose-400/10 text-sm text-rose-100 transition hover:bg-rose-400/20"
                    onClick={() => removeEntry(entry.id)}
                    aria-label="Delete entry"
                  >
                    x
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-3 py-4 text-sm text-sky-100/60">
          No change entries yet.
        </div>
      )}
    </div>
  );
}

export function ChangelogWorkspace({ project }) {
  const { documentState, fragments, status, error, saveStatus, refresh, saveModuleDocument, consumeModuleFragment } = useModuleDocument(project, 'changelog', project?.type === 'folder');
  const { byCode: workItemLookup } = useProjectWorkItemLookup(project, project?.type === 'folder');
  const [editableState, setEditableState] = useState(() => buildEditableState(null));
  const [isFragmentsOpen, setIsFragmentsOpen] = useState(false);
  const activeFragmentCount = countActiveFragments(fragments);

  useEffect(() => {
    if (documentState?.editorState) {
      setEditableState(buildEditableState(documentState.editorState));
    }
  }, [documentState]);

  async function handleSave() {
    await saveModuleDocument(buildEditorState(editableState, documentState?.editorState), documentState?.mermaid || null);
  }

  if (status === 'loading' || status === 'idle') {
    return <SectionShell eyebrow="Change Log" title="Loading change log..." description="Fetching the current managed change history." />;
  }

  if (status === 'error') {
    return <SectionShell eyebrow="Change Log" title="Change log load failed" description={error ? error.message : 'Unknown change log error'} />;
  }

  return (
    <div className="space-y-6">
      <SectionShell
        eyebrow="Change Log"
        title="Change log workspace"
        description="Track human-readable document changes and tie them back to work item codes, stable item ids, and fragment references."
        actions={(
          <>
            <StatusBadge tone="foundation">{project.name}</StatusBadge>
            <StatusBadge tone="migration">{saveStatus === 'saving' ? 'Saving' : 'Ready'}</StatusBadge>
            <ActionButton variant="ghost" onClick={() => setIsFragmentsOpen(true)}>
              {`Load Fragments${activeFragmentCount ? ` (${activeFragmentCount})` : ''}`}
            </ActionButton>
            <ActionButton variant="subtle" onClick={refresh}>Refresh Change Log</ActionButton>
            <ActionButton variant="accent" onClick={handleSave} disabled={saveStatus === 'saving'}>
              {saveStatus === 'saving' ? 'Saving...' : 'Save Change Log'}
            </ActionButton>
          </>
        )}
      >
        <StatisticsDisclosure>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoTile eyebrow="Entries" title={`${editableState.entries.length}`} body="Human-readable change entries tied to stable targets." />
            <InfoTile eyebrow="Fragments" title={`${activeFragmentCount}`} body="Pending changelog fragments ready for integration." />
            <InfoTile eyebrow="History" title={`${documentState?.editorState?.fragmentHistory?.length || 0}`} body="Applied changelog fragments recorded in managed state." />
            <InfoTile eyebrow="Open Questions" title={`${editableState.openQuestions.length}`} body="Questions we still need to resolve around change tracking." />
          </div>
        </StatisticsDisclosure>
      </SectionShell>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.85fr)]">
        <SectionShell eyebrow="Structured Editor" title="Human-readable change history" description="Each entry keeps a human-readable trail while still pointing back to a stable target item id and the work item codes that caused the update.">
          <div className="space-y-4">
            <ChangelogTextArea
              label="Executive Summary"
              rows={4}
              help="Keep this short. The detailed history should live in the entries below."
              stableId={editableState.summaryMeta?.stableId}
              sourceRefs={editableState.summaryMeta?.sourceRefs}
              workItemLookup={workItemLookup}
              value={editableState.summary}
              onChange={(event) => setEditableState((current) => ({ ...current, summary: event.target.value }))}
            />
            <ChangelogEntryEditor
              entries={editableState.entries}
              onChange={(value) => setEditableState((current) => ({ ...current, entries: value }))}
            />
            <StructuredEntryListEditor
              label="Open Questions"
              entries={editableState.openQuestions}
              workItemLookup={workItemLookup}
              onChange={(value) => setEditableState((current) => ({ ...current, openQuestions: value }))}
              emptyLabel="No open questions yet."
            />
          </div>
        </SectionShell>

        <div className="space-y-4">
          <SurfaceCard>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100/60">Reference Model</p>
            <p className="mt-3 text-sm leading-6 text-sky-100/75">
              Canonical docs describe current truth. Change Log captures how those truths changed over time and which work items drove the update.
            </p>
          </SurfaceCard>
          <SurfaceCard tone="muted">
            <p className="text-sm leading-6 text-sky-100/75">
              Use <span className="font-semibold text-white">Target Item ID</span> as the durable locator. Keep the section number as the human-friendly companion reference.
            </p>
          </SurfaceCard>
        </div>
      </div>

      <FragmentBrowserModal
        title="Change Log Fragments"
        eyebrow="Fragment Browser"
        isOpen={isFragmentsOpen}
        fragments={fragments}
        onClose={() => setIsFragmentsOpen(false)}
        onIntegrate={(fragment) => consumeModuleFragment(fragment)}
        storageKey={`${project.id}-changelog-fragments`}
      />
    </div>
  );
}
