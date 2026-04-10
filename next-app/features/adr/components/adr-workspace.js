'use client';

import { useEffect, useState } from 'react';
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

function buildEditableState(editorState) {
  const state = editorState || {};
  return {
    summary: state.overview?.summary || '',
    summaryMeta: {
      stableId: state.overview?.stableId || '',
      sourceRefs: Array.isArray(state.overview?.sourceRefs) ? state.overview.sourceRefs : [],
    },
    decisionTitle: state.metadata?.decisionTitle || '',
    status: state.metadata?.status || 'proposed',
    scope: state.metadata?.scope || '',
    owners: state.metadata?.owners || '',
    decisionDate: state.metadata?.decisionDate || '',
    metadataItemIds: {
      decisionTitle: state.metadata?.itemIds?.decisionTitle || '',
      status: state.metadata?.itemIds?.status || '',
      scope: state.metadata?.itemIds?.scope || '',
      owners: state.metadata?.itemIds?.owners || '',
      decisionDate: state.metadata?.itemIds?.decisionDate || '',
    },
    metadataItemSourceRefs: {
      decisionTitle: Array.isArray(state.metadata?.itemSourceRefs?.decisionTitle) ? state.metadata.itemSourceRefs.decisionTitle : [],
      status: Array.isArray(state.metadata?.itemSourceRefs?.status) ? state.metadata.itemSourceRefs.status : [],
      scope: Array.isArray(state.metadata?.itemSourceRefs?.scope) ? state.metadata.itemSourceRefs.scope : [],
      owners: Array.isArray(state.metadata?.itemSourceRefs?.owners) ? state.metadata.itemSourceRefs.owners : [],
      decisionDate: Array.isArray(state.metadata?.itemSourceRefs?.decisionDate) ? state.metadata.itemSourceRefs.decisionDate : [],
    },
    context: state.context || '',
    decision: state.decision || '',
    rationale: state.rationale || '',
    contextMeta: {
      stableId: state.contextMeta?.stableId || '',
      sourceRefs: Array.isArray(state.contextMeta?.sourceRefs) ? state.contextMeta.sourceRefs : [],
    },
    decisionMeta: {
      stableId: state.decisionMeta?.stableId || '',
      sourceRefs: Array.isArray(state.decisionMeta?.sourceRefs) ? state.decisionMeta.sourceRefs : [],
    },
    rationaleMeta: {
      stableId: state.rationaleMeta?.stableId || '',
      sourceRefs: Array.isArray(state.rationaleMeta?.sourceRefs) ? state.rationaleMeta.sourceRefs : [],
    },
    alternatives: Array.isArray(state.alternatives) ? state.alternatives : [],
    consequences: Array.isArray(state.consequences) ? state.consequences : [],
    relatedArchitecture: Array.isArray(state.relatedArchitecture) ? state.relatedArchitecture : [],
    relatedModules: Array.isArray(state.relatedModules) ? state.relatedModules : [],
    followUpNotes: state.followUpNotes || '',
    followUpNotesMeta: {
      stableId: state.followUpNotesMeta?.stableId || '',
      sourceRefs: Array.isArray(state.followUpNotesMeta?.sourceRefs) ? state.followUpNotesMeta.sourceRefs : [],
    },
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
    metadata: {
      ...(currentState?.metadata || {}),
      decisionTitle: editableState.decisionTitle,
      status: editableState.status,
      scope: editableState.scope,
      owners: editableState.owners,
      decisionDate: editableState.decisionDate,
      itemIds: editableState.metadataItemIds,
      itemSourceRefs: editableState.metadataItemSourceRefs,
      versionDate: now,
    },
    context: editableState.context,
    decision: editableState.decision,
    rationale: editableState.rationale,
    contextMeta: editableState.contextMeta,
    decisionMeta: editableState.decisionMeta,
    rationaleMeta: editableState.rationaleMeta,
    alternatives: editableState.alternatives,
    consequences: editableState.consequences,
    relatedArchitecture: editableState.relatedArchitecture,
    relatedModules: editableState.relatedModules,
    followUpNotes: editableState.followUpNotes,
    followUpNotesMeta: editableState.followUpNotesMeta,
    openQuestions: editableState.openQuestions,
    fragmentHistory: Array.isArray(currentState?.fragmentHistory) ? currentState.fragmentHistory : [],
  };
}

function AdrTextArea({ label, value, onChange, rows = 4, help, stableId = '', sourceRefs = [], workItemLookup = {} }) {
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

export function AdrWorkspace({ project }) {
  const { documentState, fragments, status, error, saveStatus, refresh, saveModuleDocument, consumeModuleFragment } = useModuleDocument(project, 'adr', project?.type === 'folder');
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
    return <SectionShell eyebrow="ADR" title="Loading ADR..." description="Fetching the current architecture decision record state." />;
  }

  if (status === 'error') {
    return <SectionShell eyebrow="ADR" title="ADR load failed" description={error ? error.message : 'Unknown ADR error'} />;
  }

  return (
    <div className="space-y-6">
      <SectionShell
        eyebrow="ADR"
        title="ADR workspace"
        description="Track significant architecture decisions with enough structure to capture rationale, alternatives, consequences, and cross-module impact."
        actions={(
          <>
            <StatusBadge tone="foundation">{project.name}</StatusBadge>
            <StatusBadge tone="migration">{saveStatus === 'saving' ? 'Saving' : 'Ready'}</StatusBadge>
            <ActionButton variant="ghost" onClick={() => setIsFragmentsOpen(true)}>
              {`Load Fragments${activeFragmentCount ? ` (${activeFragmentCount})` : ''}`}
            </ActionButton>
            <ActionButton variant="subtle" onClick={refresh}>Refresh ADR</ActionButton>
            <ActionButton variant="accent" onClick={handleSave} disabled={saveStatus === 'saving'}>
              {saveStatus === 'saving' ? 'Saving...' : 'Save ADR'}
            </ActionButton>
          </>
        )}
      >
        <StatisticsDisclosure>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoTile eyebrow="Status" title={editableState.status || 'proposed'} body="Current ADR lifecycle state." />
            <InfoTile eyebrow="Alternatives" title={`${documentState?.editorState?.alternatives?.length || 0}`} body="Alternatives considered for this decision." />
            <InfoTile eyebrow="Consequences" title={`${documentState?.editorState?.consequences?.length || 0}`} body="Known effects of adopting the decision." />
            <InfoTile eyebrow="Fragments" title={`${activeFragmentCount}`} body="Pending ADR fragments ready for review and integration." />
          </div>
        </StatisticsDisclosure>
      </SectionShell>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.85fr)]">
        <SectionShell eyebrow="Structured Editor" title="Architecture decision record" description="Decision lists are now structured fields with add, remove, and reorder controls so ADR content stays stable and parser-safe.">
          <div className="grid gap-4 md:grid-cols-2">
            <AdrTextArea label="Executive Summary" stableId={editableState.summaryMeta?.stableId} sourceRefs={editableState.summaryMeta?.sourceRefs} workItemLookup={workItemLookup} value={editableState.summary} onChange={(event) => setEditableState((current) => ({ ...current, summary: event.target.value }))} />
            <AdrTextArea label="Decision Title" stableId={editableState.metadataItemIds?.decisionTitle} sourceRefs={editableState.metadataItemSourceRefs?.decisionTitle} workItemLookup={workItemLookup} value={editableState.decisionTitle} onChange={(event) => setEditableState((current) => ({ ...current, decisionTitle: event.target.value }))} />
            <AdrTextArea label="Decision Status" help="Examples: proposed, accepted, superseded, rejected." stableId={editableState.metadataItemIds?.status} sourceRefs={editableState.metadataItemSourceRefs?.status} workItemLookup={workItemLookup} value={editableState.status} onChange={(event) => setEditableState((current) => ({ ...current, status: event.target.value }))} />
            <AdrTextArea label="Scope" help="Examples: application, system, persistence, deployment." stableId={editableState.metadataItemIds?.scope} sourceRefs={editableState.metadataItemSourceRefs?.scope} workItemLookup={workItemLookup} value={editableState.scope} onChange={(event) => setEditableState((current) => ({ ...current, scope: event.target.value }))} />
            <AdrTextArea label="Owners" help="Comma-separated or short responsibility summary." stableId={editableState.metadataItemIds?.owners} sourceRefs={editableState.metadataItemSourceRefs?.owners} workItemLookup={workItemLookup} value={editableState.owners} onChange={(event) => setEditableState((current) => ({ ...current, owners: event.target.value }))} />
            <AdrTextArea label="Decision Date" help="Use ISO or a human-readable date that fits the project." stableId={editableState.metadataItemIds?.decisionDate} sourceRefs={editableState.metadataItemSourceRefs?.decisionDate} workItemLookup={workItemLookup} value={editableState.decisionDate} onChange={(event) => setEditableState((current) => ({ ...current, decisionDate: event.target.value }))} />
            <div className="md:col-span-2">
              <AdrTextArea label="Context" rows={5} stableId={editableState.contextMeta?.stableId} sourceRefs={editableState.contextMeta?.sourceRefs} workItemLookup={workItemLookup} value={editableState.context} onChange={(event) => setEditableState((current) => ({ ...current, context: event.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <AdrTextArea label="Decision" rows={5} stableId={editableState.decisionMeta?.stableId} sourceRefs={editableState.decisionMeta?.sourceRefs} workItemLookup={workItemLookup} value={editableState.decision} onChange={(event) => setEditableState((current) => ({ ...current, decision: event.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <AdrTextArea label="Rationale" rows={5} stableId={editableState.rationaleMeta?.stableId} sourceRefs={editableState.rationaleMeta?.sourceRefs} workItemLookup={workItemLookup} value={editableState.rationale} onChange={(event) => setEditableState((current) => ({ ...current, rationale: event.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <StructuredEntryListEditor label="Alternatives Considered" entries={editableState.alternatives} workItemLookup={workItemLookup} onChange={(value) => setEditableState((current) => ({ ...current, alternatives: value }))} emptyLabel="No alternatives captured yet." />
            </div>
            <div className="md:col-span-2">
              <StructuredEntryListEditor label="Consequences" entries={editableState.consequences} workItemLookup={workItemLookup} onChange={(value) => setEditableState((current) => ({ ...current, consequences: value }))} emptyLabel="No consequences captured yet." />
            </div>
            <div className="md:col-span-2">
              <StructuredEntryListEditor label="Related Architecture Elements" entries={editableState.relatedArchitecture} workItemLookup={workItemLookup} onChange={(value) => setEditableState((current) => ({ ...current, relatedArchitecture: value }))} emptyLabel="No related architecture elements yet." />
            </div>
            <div className="md:col-span-2">
              <StructuredEntryListEditor label="Related Modules and Workflows" entries={editableState.relatedModules} workItemLookup={workItemLookup} onChange={(value) => setEditableState((current) => ({ ...current, relatedModules: value }))} emptyLabel="No related modules or workflows yet." />
            </div>
            <div className="md:col-span-2">
              <AdrTextArea label="Follow-Up Notes" rows={5} stableId={editableState.followUpNotesMeta?.stableId} sourceRefs={editableState.followUpNotesMeta?.sourceRefs} workItemLookup={workItemLookup} value={editableState.followUpNotes} onChange={(event) => setEditableState((current) => ({ ...current, followUpNotes: event.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <StructuredEntryListEditor label="Open Questions" entries={editableState.openQuestions} workItemLookup={workItemLookup} onChange={(value) => setEditableState((current) => ({ ...current, openQuestions: value }))} emptyLabel="No open questions yet." />
            </div>
          </div>
        </SectionShell>

        <div className="space-y-4">
          <SurfaceCard>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100/60">Decision Guidance</p>
            <p className="mt-3 text-sm leading-6 text-sky-100/75">Use ADR for why a significant architecture choice exists. Use Architecture for the system map and workflow organization.</p>
          </SurfaceCard>
          <SurfaceCard tone="muted">
            <p className="text-sm leading-6 text-sky-100/75">This workspace is intentionally decision-centric: title, rationale, alternatives, consequences, and related architecture elements are all first-class so ADR fragments can target them cleanly later.</p>
          </SurfaceCard>
        </div>
      </div>

      <FragmentBrowserModal
        title="ADR Fragments"
        eyebrow="Fragment Browser"
        isOpen={isFragmentsOpen}
        fragments={fragments}
        onClose={() => setIsFragmentsOpen(false)}
        onIntegrate={(fragment) => consumeModuleFragment(fragment)}
        storageKey={`${project.id}-adr-fragments`}
      />
    </div>
  );
}
