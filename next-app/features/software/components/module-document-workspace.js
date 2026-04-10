'use client';

import { useEffect, useState } from 'react';
import { ActionButton } from '@/components/ui/action-button';
import { DocumentFieldMeta } from '@/components/ui/document-field-meta';
import { FragmentBrowserModal } from '@/components/ui/fragment-browser-modal';
import { InfoTile } from '@/components/ui/info-tile';
import { SectionShell } from '@/components/ui/section-shell';
import { StatisticsDisclosure } from '@/components/ui/statistics-disclosure';
import { StatusBadge } from '@/components/ui/status-badge';
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
    workingContent: state.workingContent || '',
    workingContentMeta: {
      stableId: state.workingContentMeta?.stableId || '',
      sourceRefs: Array.isArray(state.workingContentMeta?.sourceRefs) ? state.workingContentMeta.sourceRefs : [],
    },
    openQuestions: state.openQuestions || '',
    openQuestionsMeta: {
      stableId: state.openQuestionsMeta?.stableId || '',
      sourceRefs: Array.isArray(state.openQuestionsMeta?.sourceRefs) ? state.openQuestionsMeta.sourceRefs : [],
    },
  };
}

function buildEditorState(editableState, currentState) {
  return {
    ...(currentState || {}),
    overview: {
      ...(currentState?.overview || {}),
      summary: editableState.summary,
      stableId: editableState.summaryMeta?.stableId,
      sourceRefs: editableState.summaryMeta?.sourceRefs,
      versionDate: new Date().toISOString(),
    },
    workingContent: editableState.workingContent,
    workingContentMeta: editableState.workingContentMeta,
    openQuestions: editableState.openQuestions,
    openQuestionsMeta: editableState.openQuestionsMeta,
    fragmentHistory: Array.isArray(currentState?.fragmentHistory) ? currentState.fragmentHistory : [],
  };
}

function toTitle(moduleKey) {
  return String(moduleKey || '')
    .split('_')
    .filter(Boolean)
    .map((part) => part.toUpperCase() === 'UX' || part.toUpperCase() === 'UI' || part.toUpperCase() === 'ADR'
      ? part.toUpperCase()
      : part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function ModuleTextArea({ label, value, onChange, rows = 6, help, stableId = '', sourceRefs = [], workItemLookup = {} }) {
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

export function ModuleDocumentWorkspace({ project, module }) {
  const moduleKey = module?.moduleKey;
  const moduleTitle = module?.label || toTitle(moduleKey);
  const { documentState, fragments, status, error, saveStatus, refresh, saveModuleDocument, consumeModuleFragment } = useModuleDocument(project, moduleKey, Boolean(project?.id && moduleKey));
  const { byCode: workItemLookup } = useProjectWorkItemLookup(project, Boolean(project?.id && moduleKey));
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
    return <SectionShell eyebrow={moduleTitle} title={`Loading ${moduleTitle.toLowerCase()}…`} description="Fetching the current managed document state." />;
  }

  if (status === 'error') {
    return <SectionShell eyebrow={moduleTitle} title={`${moduleTitle} load failed`} description={error ? error.message : 'Unknown module document error'} />;
  }

  return (
    <div className="space-y-6">
      <SectionShell
        eyebrow={moduleTitle}
        title={`${moduleTitle} workspace`}
        description={module?.description || `${moduleTitle} now has a managed document workspace with fragment loading so it can participate in the same workflow as the finished modules.`}
        actions={(
          <>
            <StatusBadge tone="foundation">{project.name}</StatusBadge>
            <StatusBadge tone="migration">{saveStatus === 'saving' ? 'Saving' : 'Ready'}</StatusBadge>
            <ActionButton variant="ghost" onClick={() => setIsFragmentsOpen(true)}>
              {`Load Fragments${activeFragmentCount ? ` (${activeFragmentCount})` : ''}`}
            </ActionButton>
            <ActionButton variant="subtle" onClick={refresh}>Refresh</ActionButton>
            <ActionButton variant="accent" onClick={handleSave} disabled={saveStatus === 'saving'}>
              {saveStatus === 'saving' ? 'Saving…' : `Save ${moduleTitle}`}
            </ActionButton>
          </>
        )}
      >
        <StatisticsDisclosure>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoTile eyebrow="Fragments" title={`${activeFragmentCount}`} body="Pending fragments that can be reviewed and integrated here." />
            <InfoTile eyebrow="History" title={`${documentState?.editorState?.fragmentHistory?.length || 0}`} body="Previously integrated fragments recorded in document state." />
            <InfoTile eyebrow="Markdown" title={`${(documentState?.markdown || '').length}`} body="Current generated markdown length." />
            <InfoTile eyebrow="Mermaid" title={`${(documentState?.mermaid || '').length}`} body="Current companion diagram length." />
          </div>
        </StatisticsDisclosure>
      </SectionShell>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.85fr)]">
        <SectionShell eyebrow="Structured Editor" title={moduleTitle} description="This starter editor is deliberately simple: it gives the module somewhere real to accumulate fragment-backed content while the richer UI evolves.">
          <div className="space-y-4">
            <ModuleTextArea
              label="Executive Summary"
              rows={4}
              stableId={editableState.summaryMeta?.stableId}
              sourceRefs={editableState.summaryMeta?.sourceRefs}
              workItemLookup={workItemLookup}
              value={editableState.summary}
              onChange={(event) => setEditableState((current) => ({ ...current, summary: event.target.value }))}
            />
            <ModuleTextArea
              label="Working Content"
              rows={12}
              help="Use this for the main content that should appear in the generated managed document."
              stableId={editableState.workingContentMeta?.stableId}
              sourceRefs={editableState.workingContentMeta?.sourceRefs}
              workItemLookup={workItemLookup}
              value={editableState.workingContent}
              onChange={(event) => setEditableState((current) => ({ ...current, workingContent: event.target.value }))}
            />
            <ModuleTextArea
              label="Open Questions"
              rows={6}
              stableId={editableState.openQuestionsMeta?.stableId}
              sourceRefs={editableState.openQuestionsMeta?.sourceRefs}
              workItemLookup={workItemLookup}
              value={editableState.openQuestions}
              onChange={(event) => setEditableState((current) => ({ ...current, openQuestions: event.target.value }))}
            />
          </div>
        </SectionShell>

        <div className="space-y-4">
          <SurfaceCard>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100/60">Current Output</p>
            <p className="mt-3 text-sm leading-6 text-sky-100/75">Document type: <span className="font-semibold text-white">{moduleKey}</span></p>
            <p className="mt-2 text-sm leading-6 text-sky-100/75">Template-driven, fragment-capable starter workflow is active for this module.</p>
          </SurfaceCard>
          <SurfaceCard tone="muted">
            <p className="text-sm leading-6 text-sky-100/75">
              Use <span className="font-semibold text-white">Load Fragments</span> to bring in AI-written fragment files, then save to keep the managed document in sync.
            </p>
          </SurfaceCard>
        </div>
      </div>

      <FragmentBrowserModal
        title={`${moduleTitle} Fragments`}
        eyebrow="Fragment Browser"
        isOpen={isFragmentsOpen}
        fragments={fragments}
        onClose={() => setIsFragmentsOpen(false)}
        onIntegrate={(fragment) => consumeModuleFragment(fragment)}
        storageKey={`${project.id}-${moduleKey}-fragments`}
      />
    </div>
  );
}
