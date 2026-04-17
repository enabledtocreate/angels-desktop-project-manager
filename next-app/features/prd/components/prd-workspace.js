'use client';

import { useEffect, useMemo, useState } from 'react';
import { ActionButton } from '@/components/ui/action-button';
import { AiInstructionsPanel } from '@/components/ui/ai-instructions-panel';
import { FragmentBrowserModal } from '@/components/ui/fragment-browser-modal';
import { InfoTile } from '@/components/ui/info-tile';
import { SectionShell } from '@/components/ui/section-shell';
import { StatisticsDisclosure } from '@/components/ui/statistics-disclosure';
import { StatusBadge } from '@/components/ui/status-badge';
import { StructuredEntryListEditor } from '@/components/ui/structured-entry-list-editor';
import { StructuredTextListEditor } from '@/components/ui/structured-text-list-editor';
import { WorkItemReferenceTags } from '@/components/ui/work-item-reference-tags';
import { SurfaceCard } from '@/components/ui/surface-card';
import { useProjectWorkItemLookup } from '@/hooks/use-project-work-item-lookup';
import { countActiveFragments } from '@/lib/fragment-utils';
import { usePrd } from '@/features/prd/hooks/use-prd';

function normalizeStructuredTitleValue(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isLikelyDerivedStructuredTitle(title, description) {
  const rawTitle = String(title || '').trim();
  const rawDescription = String(description || '').trim();
  if (!rawTitle || !rawDescription) return false;
  const normalizedTitle = normalizeStructuredTitleValue(rawTitle);
  const normalizedDescription = normalizeStructuredTitleValue(rawDescription);
  if (!normalizedTitle || !normalizedDescription || !normalizedDescription.startsWith(normalizedTitle)) return false;
  const titleWordCount = normalizedTitle.split(' ').filter(Boolean).length;
  const titleRatio = normalizedTitle.length / Math.max(normalizedDescription.length, 1);
  return rawTitle.endsWith('.')
    || rawTitle.endsWith('!')
    || rawTitle.endsWith('?')
    || rawTitle.length >= 80
    || titleWordCount >= 8
    || titleRatio >= 0.55;
}

function sanitizeStructuredEntries(entries = []) {
  return (Array.isArray(entries) ? entries : []).map((entry) => {
    if (!entry || typeof entry !== 'object') return entry;
    if (!isLikelyDerivedStructuredTitle(entry.title, entry.description)) return entry;
    return { ...entry, title: '' };
  });
}

function buildEditableState(editorState, fallbackName) {
  const state = editorState || {};
  return {
    executiveSummary: state.executiveSummary?.text || '',
    executiveSummaryStableId: state.executiveSummary?.stableId || '',
    executiveSummarySourceRefs: Array.isArray(state.executiveSummary?.sourceRefs) ? state.executiveSummary.sourceRefs : [],
    productName: state.productOverview?.productName || fallbackName || '',
    vision: state.productOverview?.vision || '',
    productOverviewItemIds: {
      productName: state.productOverview?.itemIds?.productName || '',
      vision: state.productOverview?.itemIds?.vision || '',
    },
    productOverviewItemSourceRefs: {
      productName: Array.isArray(state.productOverview?.itemSourceRefs?.productName) ? state.productOverview.itemSourceRefs.productName : [],
      vision: Array.isArray(state.productOverview?.itemSourceRefs?.vision) ? state.productOverview.itemSourceRefs.vision : [],
    },
    targetAudiences: Array.isArray(state.productOverview?.targetAudiences) ? state.productOverview.targetAudiences : [],
    keyValueProps: Array.isArray(state.productOverview?.keyValueProps) ? state.productOverview.keyValueProps : [],
    workflows: sanitizeStructuredEntries(state.functionalRequirements?.workflows),
    userActions: sanitizeStructuredEntries(state.functionalRequirements?.userActions),
    systemBehaviors: sanitizeStructuredEntries(state.functionalRequirements?.systemBehaviors),
    usability: state.nonFunctionalRequirements?.usability || '',
    reliability: state.nonFunctionalRequirements?.reliability || '',
    accessibility: state.nonFunctionalRequirements?.accessibility || '',
    security: state.nonFunctionalRequirements?.security || '',
    performance: state.nonFunctionalRequirements?.performance || '',
    nonFunctionalItemIds: {
      usability: state.nonFunctionalRequirements?.itemIds?.usability || '',
      reliability: state.nonFunctionalRequirements?.itemIds?.reliability || '',
      accessibility: state.nonFunctionalRequirements?.itemIds?.accessibility || '',
      security: state.nonFunctionalRequirements?.itemIds?.security || '',
      performance: state.nonFunctionalRequirements?.itemIds?.performance || '',
    },
    nonFunctionalItemSourceRefs: {
      usability: Array.isArray(state.nonFunctionalRequirements?.itemSourceRefs?.usability) ? state.nonFunctionalRequirements.itemSourceRefs.usability : [],
      reliability: Array.isArray(state.nonFunctionalRequirements?.itemSourceRefs?.reliability) ? state.nonFunctionalRequirements.itemSourceRefs.reliability : [],
      accessibility: Array.isArray(state.nonFunctionalRequirements?.itemSourceRefs?.accessibility) ? state.nonFunctionalRequirements.itemSourceRefs.accessibility : [],
      security: Array.isArray(state.nonFunctionalRequirements?.itemSourceRefs?.security) ? state.nonFunctionalRequirements.itemSourceRefs.security : [],
      performance: Array.isArray(state.nonFunctionalRequirements?.itemSourceRefs?.performance) ? state.nonFunctionalRequirements.itemSourceRefs.performance : [],
    },
    technicalArchitecture: sanitizeStructuredEntries(state.technicalArchitecture),
    sequencing: sanitizeStructuredEntries(state.implementationPlan?.sequencing),
    dependencies: sanitizeStructuredEntries(state.implementationPlan?.dependencies),
    milestones: sanitizeStructuredEntries(state.implementationPlan?.milestones),
    successMetrics: sanitizeStructuredEntries(state.successMetrics),
    risksMitigations: Array.isArray(state.risksMitigations) ? state.risksMitigations : [],
    futureEnhancements: sanitizeStructuredEntries(state.futureEnhancements),
    conclusion: state.conclusion || '',
  };
}

function buildEditorState(editableState) {
  const now = new Date().toISOString();
  return {
    executiveSummary: {
      text: editableState.executiveSummary,
      stableId: editableState.executiveSummaryStableId,
      sourceRefs: editableState.executiveSummarySourceRefs,
      versionDate: now,
    },
    productOverview: {
      productName: editableState.productName,
      vision: editableState.vision,
      itemIds: editableState.productOverviewItemIds,
      itemSourceRefs: editableState.productOverviewItemSourceRefs,
      targetAudiences: editableState.targetAudiences,
      keyValueProps: editableState.keyValueProps,
      versionDate: now,
    },
    functionalRequirements: {
      workflows: editableState.workflows,
      userActions: editableState.userActions,
      systemBehaviors: editableState.systemBehaviors,
      versionDate: now,
    },
    nonFunctionalRequirements: {
      usability: editableState.usability,
      reliability: editableState.reliability,
      accessibility: editableState.accessibility,
      security: editableState.security,
      performance: editableState.performance,
      itemIds: editableState.nonFunctionalItemIds,
      itemSourceRefs: editableState.nonFunctionalItemSourceRefs,
      versionDate: now,
    },
    technicalArchitecture: editableState.technicalArchitecture,
    implementationPlan: {
      sequencing: editableState.sequencing,
      dependencies: editableState.dependencies,
      milestones: editableState.milestones,
      versionDate: now,
    },
    successMetrics: editableState.successMetrics,
    risksMitigations: editableState.risksMitigations,
    futureEnhancements: editableState.futureEnhancements,
    appliedFragments: [],
    conclusion: editableState.conclusion,
  };
}

function PrdTextArea({ label, value, onChange, rows = 4, help, dirty = false, stableId = '', sourceRefs = [], workItemLookup = {} }) {
  return (
    <label className="space-y-2 text-sm text-sky-100/75">
      <span className="font-medium text-white">{label}</span>
      {help ? <p className="text-xs leading-5 text-sky-100/55">{help}</p> : null}
      <textarea
        rows={rows}
        className={[
          'min-h-24 w-full rounded-xl border bg-white/5 px-4 py-3 text-white outline-none transition',
          dirty
            ? 'border-amber-300/70 bg-amber-300/10 shadow-[0_0_0_1px_rgba(252,211,77,0.24)] focus:border-amber-200'
            : 'border-white/10 focus:border-accent/60',
        ].join(' ')}
        value={value}
        onChange={onChange}
      />
      <p className="apm-stable-id text-[11px] font-mono text-sky-100/45">
        ID: {stableId || 'pending-save'}
      </p>
      <WorkItemReferenceTags sourceRefs={sourceRefs} workItemLookup={workItemLookup} />
    </label>
  );
}

const PRD_TABS = [
  {
    id: 'overview',
    label: 'Overview',
    title: 'Executive Summary and Product Overview',
    description: 'Capture the big-picture product framing before getting into detailed requirements.',
  },
  {
    id: 'functional',
    label: 'Functional',
    title: 'Functional Requirements',
    description: 'Define workflows, user actions, and system behaviors.',
  },
  {
    id: 'non-functional',
    label: 'Non-Functional',
    title: 'Non-Functional Requirements',
    description: 'Track quality expectations such as usability, reliability, security, and performance.',
  },
  {
    id: 'technical',
    label: 'Technical',
    title: 'Technical Architecture',
    description: 'Keep product-level technical constraints and architecture-facing requirements here.',
  },
  {
    id: 'implementation',
    label: 'Implementation',
    title: 'Implementation Plan',
    description: 'Sequence work, capture dependencies, and define milestones.',
  },
  {
    id: 'metrics',
    label: 'Metrics',
    title: 'Success Metrics',
    description: 'Measure whether the product is behaving the way we expect.',
  },
  {
    id: 'risks-future',
    label: 'Risks & Future',
    title: 'Risks, Future Enhancements, and Conclusion',
    description: 'Keep the closing planning sections together until we decide whether Conclusion needs its own home.',
  },
  {
    id: 'preview',
    label: 'Preview',
    title: 'Generated Document Preview',
    description: 'Review the generated PRD markdown and Mermaid only when you need to inspect the current output.',
  },
];

const PREVIEW_TABS = [
  { id: 'markdown', label: 'Document Preview' },
  { id: 'mermaid', label: 'Mermaid' },
];

function PrdTabButton({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-full border px-3 py-2 text-xs font-semibold tracking-[0.12em] transition',
        active
          ? 'border-cyan-200/80 bg-cyan-200 text-slate shadow-[0_0_0_1px_rgba(186,230,253,0.2)]'
          : 'border-white/10 bg-white/5 text-sky-100/65 hover:border-white/20 hover:bg-white/10 hover:text-white',
      ].join(' ')}
    >
      {label}
    </button>
  );
}

export function PrdWorkspace({ project }) {
  const { prd, fragments, status, error, saveStatus, refresh, savePrd, mergeFragment, integrateFragment } = usePrd(project, project.type === 'folder');
  const { byCode: workItemLookup } = useProjectWorkItemLookup(project, project.type === 'folder');
  const [editableState, setEditableState] = useState(() => buildEditableState(null, project.name));
  const [fragmentsOpen, setFragmentsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(PRD_TABS[0].id);
  const [activePreviewTab, setActivePreviewTab] = useState(PREVIEW_TABS[0].id);

  useEffect(() => {
    if (prd && prd.editorState) {
      setEditableState(buildEditableState(prd.editorState, project.name));
    }
  }, [prd, project.name]);

  const persistedEditableState = useMemo(
    () => buildEditableState(prd?.editorState || null, project.name),
    [prd, project.name]
  );
  const activeFragmentCount = useMemo(() => countActiveFragments(fragments), [fragments]);

  const dirtyFields = useMemo(() => (
    Object.keys(editableState).reduce((result, key) => {
      result[key] = JSON.stringify(editableState[key] || '') !== JSON.stringify(persistedEditableState[key] || '');
      return result;
    }, {})
  ), [editableState, persistedEditableState]);

  const isDirty = useMemo(
    () => Object.values(dirtyFields).some(Boolean),
    [dirtyFields]
  );
  const activeTabConfig = useMemo(
    () => PRD_TABS.find((tab) => tab.id === activeTab) || PRD_TABS[0],
    [activeTab]
  );

  async function handleSave() {
    await savePrd(buildEditorState(editableState), prd && prd.mermaid ? prd.mermaid : null);
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      const payload = await refresh();
      setEditableState(buildEditableState(payload?.editorState || null, project.name));
    } finally {
      setIsRefreshing(false);
    }
  }

  if (status === 'loading' || status === 'idle') {
    return <SectionShell eyebrow="PRD" title="Loading PRD..." description="Fetching structured PRD state from the current backend." />;
  }

  if (status === 'error') {
    return <SectionShell eyebrow="PRD" title="PRD load failed" description={error ? error.message : 'Unknown PRD error'} />;
  }

  return (
    <div className="space-y-6">
      <SectionShell
        eyebrow="PRD"
        title="PRD workspace"
        description="This is the migrated PRD editor shell. It reads the structured PRD document state from the current backend and saves changes back through the same API."
        actions={(
          <>
            <StatusBadge tone="foundation">{project.name}</StatusBadge>
            <StatusBadge tone="migration">
              {saveStatus === 'saving'
                ? 'Saving'
                : saveStatus === 'saved'
                  ? 'Saved'
                  : saveStatus === 'error'
                    ? 'Save failed'
                    : isDirty
                      ? 'Unsaved changes'
                      : 'In sync'}
            </StatusBadge>
            <ActionButton variant="subtle" onClick={handleRefresh} disabled={isRefreshing || saveStatus === 'saving'}>
              {isRefreshing ? 'Refreshing...' : 'Refresh PRD'}
            </ActionButton>
            <ActionButton
              variant="ghost"
              onClick={() => setFragmentsOpen(true)}
              title="Review pending PRD fragments, merge draft changes, and revisit archived fragment history."
            >
              {`Load Fragments${activeFragmentCount ? ` (${activeFragmentCount})` : ''}`}
            </ActionButton>
            <ActionButton variant="subtle" onClick={handleSave} disabled={saveStatus === 'saving' || !isDirty}>
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' && !isDirty ? 'Saved' : 'Save PRD'}
            </ActionButton>
          </>
        )}
      >
        <StatisticsDisclosure>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoTile eyebrow="Editor" title={activeTabConfig.title} body="The selected tab controls which PRD section group is active in the editor." />
            <InfoTile eyebrow="Markdown" title={`${(prd?.markdown || '').length} chars`} body="The canonical markdown is still generated by the backend from this structured editor state." />
            <InfoTile eyebrow="Mermaid" title={`${(prd?.mermaid || '').length} chars`} body="Mermaid continues to round-trip through the current PRD document pipeline." />
            <InfoTile eyebrow="Conclusion" title={editableState.conclusion ? 'Defined' : 'Pending'} body="The final PRD summary is editable below with the rest of the structured sections." />
          </div>
        </StatisticsDisclosure>
      </SectionShell>

      <AiInstructionsPanel
        title="PRD AI Instructions"
        instructions={[
          'Update PRD intent, workflows, and system behavior through structured PRD fragments when the source change originated elsewhere.',
          'Keep product intent high level and avoid burying implementation detail here unless it directly changes product behavior.',
          'Cross-reference roadmap phases, features, and bugs when they materially affect the product definition.',
        ]}
      />

      <div className="space-y-4">
        <SectionShell
          eyebrow="Structured Editor"
          title="Product definition"
          description={activeTabConfig.description}
        >
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {PRD_TABS.map((tab) => (
                <PrdTabButton
                  key={tab.id}
                  label={tab.label}
                  active={tab.id === activeTab}
                  onClick={() => setActiveTab(tab.id)}
                />
              ))}
            </div>

            <SurfaceCard className="p-4" tone="muted">
              <p className="text-sm font-semibold text-white">{activeTabConfig.title}</p>
              <p className="mt-2 text-sm leading-6 text-sky-100/70">{activeTabConfig.description}</p>
            </SurfaceCard>

            <div className="grid gap-4 md:grid-cols-2">
              {activeTab === 'overview' ? (
                <>
                  <PrdTextArea dirty={dirtyFields.executiveSummary} label="Executive Summary" stableId={editableState.executiveSummaryStableId} sourceRefs={editableState.executiveSummarySourceRefs} workItemLookup={workItemLookup} rows={5} value={editableState.executiveSummary} onChange={(event) => setEditableState((current) => ({ ...current, executiveSummary: event.target.value }))} />
                  <PrdTextArea dirty={dirtyFields.productName} label="Product Name" stableId={editableState.productOverviewItemIds?.productName} sourceRefs={editableState.productOverviewItemSourceRefs?.productName} workItemLookup={workItemLookup} rows={2} value={editableState.productName} onChange={(event) => setEditableState((current) => ({ ...current, productName: event.target.value }))} />
                  <PrdTextArea dirty={dirtyFields.vision} label="Product Vision" stableId={editableState.productOverviewItemIds?.vision} sourceRefs={editableState.productOverviewItemSourceRefs?.vision} workItemLookup={workItemLookup} rows={5} value={editableState.vision} onChange={(event) => setEditableState((current) => ({ ...current, vision: event.target.value }))} />
                  <div className="md:col-span-2">
                    <StructuredTextListEditor
                      label="Target Audiences"
                      help="Add one audience at a time. The generated document renders these as bullet points."
                      entries={editableState.targetAudiences}
                      workItemLookup={workItemLookup}
                      onChange={(value) => setEditableState((current) => ({ ...current, targetAudiences: value }))}
                      placeholder="Target audience"
                      emptyLabel="No target audiences yet."
                    />
                  </div>
                  <div className="md:col-span-2">
                    <StructuredTextListEditor
                      label="Key Value Propositions"
                      help="Add one value proposition at a time. The generated document renders these as bullet points."
                      entries={editableState.keyValueProps}
                      workItemLookup={workItemLookup}
                      onChange={(value) => setEditableState((current) => ({ ...current, keyValueProps: value }))}
                      placeholder="Value proposition"
                      emptyLabel="No value propositions yet."
                    />
                  </div>
                </>
              ) : null}

              {activeTab === 'functional' ? (
                <>
                  <div className="md:col-span-2">
                    <StructuredEntryListEditor label="Workflows" help="Capture each workflow as a titled item with a required description." entries={editableState.workflows} workItemLookup={workItemLookup} onChange={(value) => setEditableState((current) => ({ ...current, workflows: value }))} emptyLabel="No workflows yet." />
                  </div>
                  <div className="md:col-span-2">
                    <StructuredEntryListEditor label="User Actions" help="Capture user-facing actions one by one." entries={editableState.userActions} workItemLookup={workItemLookup} onChange={(value) => setEditableState((current) => ({ ...current, userActions: value }))} emptyLabel="No user actions yet." />
                  </div>
                  <div className="md:col-span-2">
                    <StructuredEntryListEditor label="System Behaviors" help="Capture system behavior with a title and required description." entries={editableState.systemBehaviors} workItemLookup={workItemLookup} onChange={(value) => setEditableState((current) => ({ ...current, systemBehaviors: value }))} emptyLabel="No system behaviors yet." />
                  </div>
                </>
              ) : null}

              {activeTab === 'non-functional' ? (
                <>
                  <PrdTextArea dirty={dirtyFields.usability} label="Usability" stableId={editableState.nonFunctionalItemIds?.usability} sourceRefs={editableState.nonFunctionalItemSourceRefs?.usability} workItemLookup={workItemLookup} value={editableState.usability} onChange={(event) => setEditableState((current) => ({ ...current, usability: event.target.value }))} />
                  <PrdTextArea dirty={dirtyFields.reliability} label="Reliability" stableId={editableState.nonFunctionalItemIds?.reliability} sourceRefs={editableState.nonFunctionalItemSourceRefs?.reliability} workItemLookup={workItemLookup} value={editableState.reliability} onChange={(event) => setEditableState((current) => ({ ...current, reliability: event.target.value }))} />
                  <PrdTextArea dirty={dirtyFields.accessibility} label="Accessibility" stableId={editableState.nonFunctionalItemIds?.accessibility} sourceRefs={editableState.nonFunctionalItemSourceRefs?.accessibility} workItemLookup={workItemLookup} value={editableState.accessibility} onChange={(event) => setEditableState((current) => ({ ...current, accessibility: event.target.value }))} />
                  <PrdTextArea dirty={dirtyFields.security} label="Security" stableId={editableState.nonFunctionalItemIds?.security} sourceRefs={editableState.nonFunctionalItemSourceRefs?.security} workItemLookup={workItemLookup} value={editableState.security} onChange={(event) => setEditableState((current) => ({ ...current, security: event.target.value }))} />
                  <PrdTextArea dirty={dirtyFields.performance} label="Performance" stableId={editableState.nonFunctionalItemIds?.performance} sourceRefs={editableState.nonFunctionalItemSourceRefs?.performance} workItemLookup={workItemLookup} value={editableState.performance} onChange={(event) => setEditableState((current) => ({ ...current, performance: event.target.value }))} />
                </>
              ) : null}

              {activeTab === 'technical' ? (
                <div className="md:col-span-2">
                  <StructuredEntryListEditor label="Technical Architecture" help="Track product-level technical architecture statements here. Implementation detail still belongs in Architecture and Technical Design." entries={editableState.technicalArchitecture} workItemLookup={workItemLookup} onChange={(value) => setEditableState((current) => ({ ...current, technicalArchitecture: value }))} emptyLabel="No technical architecture entries yet." />
                </div>
              ) : null}

              {activeTab === 'implementation' ? (
                <>
                  <div className="md:col-span-2">
                    <StructuredEntryListEditor label="Implementation Sequencing" entries={editableState.sequencing} workItemLookup={workItemLookup} onChange={(value) => setEditableState((current) => ({ ...current, sequencing: value }))} emptyLabel="No sequencing entries yet." />
                  </div>
                  <div className="md:col-span-2">
                    <StructuredEntryListEditor label="Implementation Dependencies" entries={editableState.dependencies} workItemLookup={workItemLookup} onChange={(value) => setEditableState((current) => ({ ...current, dependencies: value }))} emptyLabel="No dependency entries yet." />
                  </div>
                  <div className="md:col-span-2">
                    <StructuredEntryListEditor label="Milestones" entries={editableState.milestones} workItemLookup={workItemLookup} onChange={(value) => setEditableState((current) => ({ ...current, milestones: value }))} emptyLabel="No milestones yet." />
                  </div>
                </>
              ) : null}

              {activeTab === 'metrics' ? (
                <div className="md:col-span-2">
                  <StructuredEntryListEditor label="Success Metrics" entries={editableState.successMetrics} workItemLookup={workItemLookup} onChange={(value) => setEditableState((current) => ({ ...current, successMetrics: value }))} emptyLabel="No success metrics yet." />
                </div>
              ) : null}

              {activeTab === 'risks-future' ? (
                <>
                  <div className="md:col-span-2">
                    <StructuredEntryListEditor
                      label="Risks and Mitigations"
                      help="Each risk requires a matching mitigation."
                      entries={editableState.risksMitigations}
                      workItemLookup={workItemLookup}
                      onChange={(value) => setEditableState((current) => ({ ...current, risksMitigations: value }))}
                      primaryKey="risk"
                      primaryLabel="Risk"
                      primaryPlaceholder="Risk"
                      secondaryKey="mitigation"
                      secondaryLabel="Mitigation"
                      secondaryPlaceholder="Mitigation"
                      emptyLabel="No risks tracked yet."
                    />
                  </div>
                  <div className="md:col-span-2">
                    <StructuredEntryListEditor
                      label="Future Enhancements"
                      help="Planned and implemented feature work is tracked in FEATURES.md. Keep items here only when a future-facing product note still materially affects the product definition."
                      entries={editableState.futureEnhancements}
                      workItemLookup={workItemLookup}
                      onChange={(value) => setEditableState((current) => ({ ...current, futureEnhancements: value }))}
                      emptyLabel="No future enhancements referenced here."
                    />
                  </div>
                  <div className="md:col-span-2">
                    <PrdTextArea dirty={dirtyFields.conclusion} label="Conclusion" rows={5} value={editableState.conclusion} onChange={(event) => setEditableState((current) => ({ ...current, conclusion: event.target.value }))} />
                  </div>
                </>
              ) : null}

              {activeTab === 'preview' ? (
                <div className="md:col-span-2 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {PREVIEW_TABS.map((tab) => (
                      <PrdTabButton
                        key={tab.id}
                        label={tab.label}
                        active={tab.id === activePreviewTab}
                        onClick={() => setActivePreviewTab(tab.id)}
                      />
                    ))}
                  </div>

                  <SurfaceCard className="p-4" tone="muted">
                    <p className="text-sm font-semibold text-white">
                      {activePreviewTab === 'markdown' ? 'PRD Markdown' : 'PRD Mermaid'}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-sky-100/70">
                      {activePreviewTab === 'markdown'
                        ? 'This is the generated markdown output that becomes PRD.md.'
                        : 'This is the companion Mermaid payload currently stored with the PRD.'}
                    </p>
                  </SurfaceCard>

                  <SurfaceCard className="p-0" tone="muted">
                    <div className="max-h-[34rem] overflow-auto rounded-[1.25rem] bg-slate/70 p-4">
                      <pre className="whitespace-pre-wrap break-words text-xs leading-6 text-sky-50/90">
                        {activePreviewTab === 'markdown'
                          ? (prd?.markdown || 'No generated markdown yet.')
                          : (prd?.mermaid || 'No Mermaid content is currently defined.')}
                      </pre>
                    </div>
                  </SurfaceCard>
                </div>
              ) : null}
            </div>
          </div>
        </SectionShell>
      </div>

      <FragmentBrowserModal
        eyebrow="PRD Fragments"
        title="Product Requirements fragments"
        isOpen={fragmentsOpen}
        fragments={fragments}
        storageKey={`prd-${project.id}`}
        onClose={() => setFragmentsOpen(false)}
        onMerge={(fragment) => mergeFragment(fragment.id)}
        onIntegrate={(fragment) => integrateFragment(fragment.id)}
      />
    </div>
  );
}
