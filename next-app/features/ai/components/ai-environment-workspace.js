'use client';

import { useEffect, useRef, useState } from 'react';
import { ActionButton } from '@/components/ui/action-button';
import { DocumentFieldMeta } from '@/components/ui/document-field-meta';
import { FragmentBrowserModal } from '@/components/ui/fragment-browser-modal';
import { InfoTile } from '@/components/ui/info-tile';
import { SectionShell } from '@/components/ui/section-shell';
import { StatisticsDisclosure } from '@/components/ui/statistics-disclosure';
import { StructuredEntryListEditor } from '@/components/ui/structured-entry-list-editor';
import { SurfaceCard } from '@/components/ui/surface-card';
import { useAiEnvironment } from '@/features/ai/hooks/use-ai-environment';
import { useProjectWorkItemLookup } from '@/hooks/use-project-work-item-lookup';
import { countActiveFragments } from '@/lib/fragment-utils';
import { fetchJson } from '@/lib/api-client';

function buildEditableState(editorState) {
  const state = editorState || {};
  return {
    selectedProfileIds: Array.isArray(state.selectedProfileIds) ? state.selectedProfileIds : [],
    mission: state.overview?.mission || '',
    operatingModel: state.overview?.operatingModel || '',
    communicationStyle: state.overview?.communicationStyle || '',
    overviewItemIds: {
      mission: state.overview?.itemIds?.mission || '',
      operatingModel: state.overview?.itemIds?.operatingModel || '',
      communicationStyle: state.overview?.itemIds?.communicationStyle || '',
    },
    overviewItemSourceRefs: {
      mission: Array.isArray(state.overview?.itemSourceRefs?.mission) ? state.overview.itemSourceRefs.mission : [],
      operatingModel: Array.isArray(state.overview?.itemSourceRefs?.operatingModel) ? state.overview.itemSourceRefs.operatingModel : [],
      communicationStyle: Array.isArray(state.overview?.itemSourceRefs?.communicationStyle) ? state.overview.itemSourceRefs.communicationStyle : [],
    },
    requiredBehaviors: Array.isArray(state.requiredBehaviors) ? state.requiredBehaviors : [],
    moduleUpdateRules: Array.isArray(state.moduleUpdateRules) ? state.moduleUpdateRules : [],
    dataPhrasingRules: Array.isArray(state.dataPhrasingRules) ? state.dataPhrasingRules : [],
    avoidRules: Array.isArray(state.avoidRules) ? state.avoidRules : [],
    customInstructions: state.customInstructions || '',
    customInstructionsMeta: {
      stableId: state.customInstructionsMeta?.stableId || '',
      sourceRefs: Array.isArray(state.customInstructionsMeta?.sourceRefs) ? state.customInstructionsMeta.sourceRefs : [],
    },
    handoffChecklist: Array.isArray(state.handoffChecklist) ? state.handoffChecklist : [],
  };
}

function buildEditorState(editableState) {
  const now = new Date().toISOString();
  return {
    selectedProfileIds: Array.isArray(editableState.selectedProfileIds) ? editableState.selectedProfileIds : [],
    overview: {
      mission: editableState.mission,
      operatingModel: editableState.operatingModel,
      communicationStyle: editableState.communicationStyle,
      itemIds: editableState.overviewItemIds,
      itemSourceRefs: editableState.overviewItemSourceRefs,
      versionDate: now,
    },
    requiredBehaviors: editableState.requiredBehaviors,
    moduleUpdateRules: editableState.moduleUpdateRules,
    dataPhrasingRules: editableState.dataPhrasingRules,
    avoidRules: editableState.avoidRules,
    customInstructions: editableState.customInstructions,
    customInstructionsMeta: editableState.customInstructionsMeta,
    handoffChecklist: editableState.handoffChecklist,
  };
}

function parseManagedBlock(markdown) {
  const match = String(markdown || '').match(/<!-- APM:DATA\s*([\s\S]*?)\s*-->/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

function createImportedInstructionBlock(fileName, content) {
  const normalizedContent = String(content || '').trim();
  if (!normalizedContent) return '';
  const prefix = `Imported directives from ${fileName || 'uploaded file'}:`;
  return [prefix, normalizedContent].join('\n\n');
}

function AiEnvironmentTextArea({ label, value, onChange, rows = 4, help, stableId = '', sourceRefs = [], workItemLookup = {} }) {
  return (
    <label className="space-y-2 text-sm text-ink/75">
      <span className="font-medium text-ink">{label}</span>
      {help ? <p className="text-xs leading-5 text-ink/60">{help}</p> : null}
      <textarea
        rows={rows}
        className="min-h-20 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-ink outline-none focus:border-accent/50"
        value={value}
        onChange={onChange}
      />
      <DocumentFieldMeta stableId={stableId} sourceRefs={sourceRefs} workItemLookup={workItemLookup} />
    </label>
  );
}

export function AiEnvironmentWorkspace({ project }) {
  const fileInputRef = useRef(null);
  const {
    aiEnvironment,
    fragments,
    status,
    error,
    saveStatus,
    refresh,
    saveAiEnvironment,
    consumeAiEnvironmentFragment,
  } = useAiEnvironment(project, project.type === 'folder');
  const { byCode: workItemLookup } = useProjectWorkItemLookup(project, project.type === 'folder');
  const [editableState, setEditableState] = useState(() => buildEditableState(null));
  const [sharedProfiles, setSharedProfiles] = useState([]);
  const [projectTypes, setProjectTypes] = useState([]);
  const [sharedSaveStatus, setSharedSaveStatus] = useState('idle');
  const [fragmentsDirectiveProjectId, setFragmentsDirectiveProjectId] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [fragmentsOpen, setFragmentsOpen] = useState(false);
  const activeFragmentCount = countActiveFragments(fragments);

  useEffect(() => {
    if (aiEnvironment?.editorState) setEditableState(buildEditableState(aiEnvironment.editorState));
  }, [aiEnvironment]);

  useEffect(() => {
    let cancelled = false;
    async function loadSharedProfiles() {
      try {
        const [settings, types] = await Promise.all([
          fetchJson('/api/settings'),
          fetchJson('/api/project-types'),
        ]);
        if (cancelled) return;
        setSharedProfiles(Array.isArray(settings?.ai?.profiles) ? settings.ai.profiles : []);
        setFragmentsDirectiveProjectId(String(settings?.ai?.fragmentsDirectiveProjectId || ''));
        setProjectTypes(Array.isArray(types) ? types : []);
      } catch (loadError) {
        if (!cancelled) console.error('Failed to load AI profile settings:', loadError);
      }
    }
    loadSharedProfiles();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave() {
    await saveAiEnvironment(buildEditorState(editableState), aiEnvironment?.mermaid || null);
  }

  async function handleSaveSharedProfiles() {
    setSharedSaveStatus('saving');
    try {
      await fetchJson('/api/settings', {
        method: 'PUT',
        body: JSON.stringify({
          ai: {
            profiles: sharedProfiles,
          },
        }),
      });
      await refresh();
      setSharedSaveStatus('saved');
    } catch (saveError) {
      console.error('Failed to save shared AI profiles:', saveError);
      setSharedSaveStatus('error');
    }
  }

  function addSharedProfile() {
    setSharedProfiles((current) => [
      ...current,
      {
        id: `ai-profile-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: '',
        scope: 'global',
        projectType: '',
        content: '',
      },
    ]);
  }

  const autoAppliedProfiles = sharedProfiles.filter((profile) => {
    const scope = String(profile.scope || 'global');
    return scope === 'global' || (scope === 'project_type' && String(profile.projectType || '') === String(project.projectType || ''));
  });
  const selectableProfiles = sharedProfiles.filter((profile) => !autoAppliedProfiles.some((entry) => entry.id === profile.id));
  const immutableDirectives = String(project?.id || '') === fragmentsDirectiveProjectId
        ? [
          {
            id: 'immutable-changelog-traceability',
            title: 'Record document-impacting changes in the Change Log with stable target references',
            description: 'When feature or bug work updates a managed document, create or update a Change Log entry that references the work item code, target document, target section number, stable target item id, and a short human-readable summary of the change.',
          },
          {
            id: 'immutable-storage-safe-titles',
            title: 'Keep generated stored titles short and storage-safe',
            description: 'When AI generates fragments or any structured data that will be stored, keep titles and other short stored fields as short as the database allows. Prefer concise complete titles over truncated prose, and put longer detail in descriptions or body content.',
          },
          {
            id: 'immutable-fragments-path',
            title: 'Fragments generated should use the configured fragments path',
            description: `Fragments generated should be placed in ${aiEnvironment?.fragmentsRootDir || '[Fragments Path]'} when generated. Never place fragment files in the project docs folder.`,
          },
        {
          id: 'immutable-source-of-truth',
          title: 'Treat the live runtime SQLite database as the source of truth for Angel\'s Project Manager',
          description: `For Angel's Project Manager, the live runtime SQLite database at ${aiEnvironment?.runtimeDatabasePath || '[Runtime Database Path]'} is the source of truth for project and module state. Generated docs, DBML, and fragments are derived artifacts and should be treated as outputs, proposals, or exchange files unless explicitly stated otherwise.`,
        },
        {
          id: 'immutable-adr-tracking',
          title: 'Create ADR records when architectural decisions are made',
          description: 'When work introduces, changes, or reverses a significant architectural decision, update the Architecture document and create or update an ADR record that captures the decision, rationale, alternatives, and consequences.',
        },
      ]
    : [];

  async function handleDirectiveFileChange(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const managed = parseManagedBlock(text);
      if (managed?.docType === 'ai_environment' && managed?.editorState && typeof managed.editorState === 'object') {
        setEditableState(buildEditableState(managed.editorState));
        setImportStatus(`Loaded structured AI directives from ${file.name}. Review and save when ready.`);
      } else {
        setEditableState((current) => {
          const importedBlock = createImportedInstructionBlock(file.name, text);
          return {
            ...current,
            customInstructions: [String(current.customInstructions || '').trim(), importedBlock]
              .filter(Boolean)
              .join('\n\n---\n\n'),
          };
        });
        setImportStatus(`Imported directives from ${file.name} into Custom Instructions. Review and save when ready.`);
      }
    } catch (importError) {
      console.error('Failed to import AI directives:', importError);
      setImportStatus(`Failed to import directives from ${file.name}.`);
    } finally {
      event.target.value = '';
    }
  }

  if (status === 'loading' || status === 'idle') {
    return <SectionShell eyebrow="AI" title="Loading AI environment..." description="Fetching AI operating guidance for this project." />;
  }

  if (status === 'error') {
    return <SectionShell eyebrow="AI" title="AI environment load failed" description={error ? error.message : 'Unknown AI environment error'} />;
  }

  return (
    <div className="space-y-5">
      <SectionShell
        eyebrow="AI"
        title="AI Environment"
        description="Define how external AI agents should read the project, what they should update, and how they should keep related modules aligned. Add project-specific instructions in the editable sections below."
        actions={(
          <>
            <ActionButton variant="ghost" onClick={() => setFragmentsOpen(true)}>
              {`Load Fragments${activeFragmentCount ? ` (${activeFragmentCount})` : ''}`}
            </ActionButton>
            <ActionButton variant="ghost" onClick={() => fileInputRef.current?.click()}>
              Upload Directives
            </ActionButton>
            <ActionButton variant="subtle" onClick={refresh}>Refresh AI environment</ActionButton>
            <ActionButton variant="accent" onClick={handleSave} disabled={saveStatus === 'saving'}>
              {saveStatus === 'saving' ? 'Saving...' : 'Save AI environment'}
            </ActionButton>
          </>
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.txt,.json"
          className="hidden"
          onChange={handleDirectiveFileChange}
        />
        {importStatus ? (
          <p className="mb-4 text-sm text-ink/70">{importStatus}</p>
        ) : null}
        <SurfaceCard className="mb-4 p-3" tone="muted">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">Loaded Fragments</p>
              <p className="mt-1 text-sm text-ink/75">Pending: {activeFragmentCount}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {fragments.length ? fragments.map((fragment) => (
                <button
                  key={fragment.id}
                  type="button"
                  className="rounded-full bg-white/8 px-2.5 py-1 text-xs text-ink/75 transition hover:bg-white/12 hover:text-ink"
                  onClick={() => setFragmentsOpen(true)}
                >
                  {fragment.code || fragment.id || fragment.fileName || 'Fragment'}
                </button>
              )) : (
                <span className="text-sm text-ink/60">No fragments are currently loaded into the UI state.</span>
              )}
            </div>
          </div>
        </SurfaceCard>
        <StatisticsDisclosure>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <InfoTile eyebrow="Required Behaviors" title={`${aiEnvironment?.editorState?.requiredBehaviors?.length || 0}`} body="Non-optional operating rules for agents." />
            <InfoTile eyebrow="Module Rules" title={`${aiEnvironment?.editorState?.moduleUpdateRules?.length || 0}`} body="Which modules need follow-up when scope changes." />
            <InfoTile eyebrow="Phrasing Rules" title={`${aiEnvironment?.editorState?.dataPhrasingRules?.length || 0}`} body="How agents should phrase structured updates." />
            <InfoTile eyebrow="Guardrails" title={`${aiEnvironment?.editorState?.avoidRules?.length || 0}`} body="What agents should explicitly avoid." />
          </div>
        </StatisticsDisclosure>
      </SectionShell>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.8fr)]">
        <SectionShell
          eyebrow="Structured Guidance"
          title="Agent operating instructions"
          description="Structured lists are edited as real title-and-description entries now, so we do not rely on brittle inline delimiters. Use Custom Instructions for project-specific guidance that does not fit a structured list."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <AiEnvironmentTextArea label="Mission" stableId={editableState.overviewItemIds?.mission} sourceRefs={editableState.overviewItemSourceRefs?.mission} workItemLookup={workItemLookup} value={editableState.mission} onChange={(event) => setEditableState((current) => ({ ...current, mission: event.target.value }))} />
            <AiEnvironmentTextArea label="Communication Style" stableId={editableState.overviewItemIds?.communicationStyle} sourceRefs={editableState.overviewItemSourceRefs?.communicationStyle} workItemLookup={workItemLookup} value={editableState.communicationStyle} onChange={(event) => setEditableState((current) => ({ ...current, communicationStyle: event.target.value }))} />
            <div className="md:col-span-2">
              <AiEnvironmentTextArea label="Operating Model" rows={4} stableId={editableState.overviewItemIds?.operatingModel} sourceRefs={editableState.overviewItemSourceRefs?.operatingModel} workItemLookup={workItemLookup} value={editableState.operatingModel} onChange={(event) => setEditableState((current) => ({ ...current, operatingModel: event.target.value }))} />
            </div>
            <div className="md:col-span-2 space-y-3">
              <div className="space-y-2 text-sm text-ink/75">
                <p className="font-medium text-ink">Applied Shared Profiles</p>
                <div className="flex flex-wrap gap-2">
                  {autoAppliedProfiles.length ? autoAppliedProfiles.map((profile) => (
                    <span key={profile.id} className="rounded-full bg-white/8 px-2.5 py-1 text-xs text-ink/75">
                      {profile.name || profile.id} {profile.scope === 'project_type' ? `(auto: ${profile.projectType})` : '(auto)'}
                    </span>
                  )) : <span className="text-xs text-ink/60">No auto-applied profiles.</span>}
                </div>
              </div>
              <div className="space-y-2 text-sm text-ink/75">
                <p className="font-medium text-ink">Additional Shared Profiles</p>
                <div className="grid gap-2 md:grid-cols-2">
                  {selectableProfiles.length ? selectableProfiles.map((profile) => (
                    <label key={profile.id} className="inline-flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                      <input
                        type="checkbox"
                        checked={editableState.selectedProfileIds.includes(profile.id)}
                        onChange={(event) => setEditableState((current) => ({
                          ...current,
                          selectedProfileIds: event.target.checked
                            ? [...current.selectedProfileIds, profile.id]
                            : current.selectedProfileIds.filter((value) => value !== profile.id),
                        }))}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-ink">{profile.name || profile.id}</span>
                        <span className="block text-xs text-ink/60">{profile.scope === 'project_type' ? `Project Type: ${profile.projectType || 'Any'}` : 'Manual shared profile'}</span>
                      </span>
                    </label>
                  )) : <span className="text-xs text-ink/60">No manually selectable shared profiles.</span>}
                </div>
              </div>
            </div>
            <div className="md:col-span-2">
              <StructuredEntryListEditor label="Required Behaviors" entries={editableState.requiredBehaviors} workItemLookup={workItemLookup} onChange={(value) => setEditableState((current) => ({ ...current, requiredBehaviors: value }))} emptyLabel="No required behaviors yet." />
            </div>
            <div className="md:col-span-2">
              <StructuredEntryListEditor label="Module Update Rules" entries={editableState.moduleUpdateRules} workItemLookup={workItemLookup} onChange={(value) => setEditableState((current) => ({ ...current, moduleUpdateRules: value }))} emptyLabel="No module update rules yet." />
            </div>
            <div className="md:col-span-2">
              <StructuredEntryListEditor label="Data Structure / Phrasing Rules" entries={editableState.dataPhrasingRules} workItemLookup={workItemLookup} onChange={(value) => setEditableState((current) => ({ ...current, dataPhrasingRules: value }))} emptyLabel="No data phrasing rules yet." />
            </div>
            <div className="md:col-span-2">
              <StructuredEntryListEditor label="Avoid / Guardrails" entries={editableState.avoidRules} workItemLookup={workItemLookup} onChange={(value) => setEditableState((current) => ({ ...current, avoidRules: value }))} emptyLabel="No guardrails yet." />
            </div>
            <div className="md:col-span-2">
              <AiEnvironmentTextArea
                label="Custom Instructions"
                rows={5}
                help="Add plain-language project-specific instructions here. This is the easiest place to add new AI guidance that does not belong in a structured list."
                stableId={editableState.customInstructionsMeta?.stableId}
                sourceRefs={editableState.customInstructionsMeta?.sourceRefs}
                workItemLookup={workItemLookup}
                value={editableState.customInstructions}
                onChange={(event) => setEditableState((current) => ({ ...current, customInstructions: event.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <StructuredEntryListEditor label="Handoff Checklist" entries={editableState.handoffChecklist} workItemLookup={workItemLookup} onChange={(value) => setEditableState((current) => ({ ...current, handoffChecklist: value }))} emptyLabel="No handoff checklist yet." />
            </div>
          </div>
        </SectionShell>

        <div className="space-y-4">
          <SectionShell
            eyebrow="Shared Profiles"
            title="Reusable AI instruction sets"
            description="Create global or project-type profiles once, then apply them to any project AI environment."
            actions={(
              <>
                <ActionButton variant="ghost" onClick={addSharedProfile}>Add profile</ActionButton>
                <ActionButton variant="accent" onClick={handleSaveSharedProfiles} disabled={sharedSaveStatus === 'saving'}>
                  {sharedSaveStatus === 'saving' ? 'Saving...' : 'Save shared profiles'}
                </ActionButton>
              </>
            )}
          >
            <div className="space-y-3">
              {sharedProfiles.length ? sharedProfiles.map((profile, index) => (
                <SurfaceCard key={profile.id} className="p-3" tone="muted">
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1.2fr)_180px_180px_auto]">
                    <label className="space-y-1 text-xs text-ink/75">
                      <span className="font-medium text-ink">Profile name</span>
                      <input
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-ink outline-none"
                        value={profile.name}
                        onChange={(event) => setSharedProfiles((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, name: event.target.value } : entry))}
                      />
                    </label>
                    <label className="space-y-1 text-xs text-ink/75">
                      <span className="font-medium text-ink">Scope</span>
                      <select
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-ink outline-none"
                        value={profile.scope || 'global'}
                        onChange={(event) => setSharedProfiles((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, scope: event.target.value, projectType: event.target.value === 'project_type' ? entry.projectType : '' } : entry))}
                      >
                        <option value="global">global</option>
                        <option value="project_type">project_type</option>
                        <option value="manual">manual</option>
                      </select>
                    </label>
                    <label className="space-y-1 text-xs text-ink/75">
                      <span className="font-medium text-ink">Project type</span>
                      <select
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-ink outline-none"
                        value={profile.projectType || ''}
                        disabled={(profile.scope || 'global') !== 'project_type'}
                        onChange={(event) => setSharedProfiles((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, projectType: event.target.value } : entry))}
                      >
                        <option value="">Any</option>
                        {projectTypes.map((type) => <option key={type.code || type.id} value={type.code || type.id}>{type.name || type.code || type.id}</option>)}
                      </select>
                    </label>
                    <div className="flex items-end justify-end">
                      <ActionButton
                        variant="subtle"
                        onClick={() => setSharedProfiles((current) => current.filter((entry) => entry.id !== profile.id))}
                      >
                        Remove
                      </ActionButton>
                    </div>
                  </div>
                  <div className="mt-3">
                    <AiEnvironmentTextArea
                      label="Profile content"
                      rows={5}
                      value={profile.content || ''}
                      onChange={(event) => setSharedProfiles((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, content: event.target.value } : entry))}
                    />
                  </div>
                </SurfaceCard>
              )) : (
                <SurfaceCard className="p-4" tone="muted">
                  <p className="text-sm leading-6 text-ink/75">No reusable AI profiles yet.</p>
                </SurfaceCard>
              )}
            </div>
          </SectionShell>

          <SurfaceCard className="p-4" tone="muted">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">Locked Directives</p>
            <div className="mt-3 space-y-2">
              {immutableDirectives.length ? immutableDirectives.map((directive) => (
                <div key={directive.id} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-ink">{directive.title}</p>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/65">
                      Locked
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-ink/75">{directive.description}</p>
                </div>
              )) : (
                <p className="text-sm leading-6 text-ink/70">No locked directives are applied to this project.</p>
              )}
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-4" tone="muted">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">AI Readable Intent</p>
            <p className="mt-3 text-sm leading-6 text-ink/75">
              This module is the place to define how agents should behave across the project, not just inside software modules.
            </p>
          </SurfaceCard>
          <SurfaceCard className="p-4" tone="muted">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">Saved Output</p>
            <div className="mt-3 space-y-2 text-sm text-ink/75">
              <p><span className="font-semibold text-ink">AI_ENVIRONMENT.md:</span> {aiEnvironment?.documentPath || 'Not available yet.'}</p>
              <p><span className="font-semibold text-ink">Fragments Path:</span> {aiEnvironment?.fragmentsRootDir || 'Not available yet.'}</p>
              <p><span className="font-semibold text-ink">Software Standards:</span> {aiEnvironment?.softwareStandardsPath || 'Not available yet.'}</p>
            </div>
          </SurfaceCard>
          <SurfaceCard className="p-4" tone="muted">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">Generated Output</p>
            <p className="mt-3 text-sm leading-6 text-ink/75">Markdown size: <span className="font-semibold text-ink">{(aiEnvironment?.markdown || '').length}</span></p>
            <p className="mt-2 text-sm leading-6 text-ink/75">Mermaid size: <span className="font-semibold text-ink">{(aiEnvironment?.mermaid || '').length}</span></p>
          </SurfaceCard>
        </div>
      </div>

      <FragmentBrowserModal
        title="AI Environment Directives"
        eyebrow="AI"
        isOpen={fragmentsOpen}
        fragments={fragments}
        onClose={() => setFragmentsOpen(false)}
        onIntegrate={(fragment) => consumeAiEnvironmentFragment(fragment)}
        storageKey={`ai-environment-${project?.id || 'project'}`}
      />
    </div>
  );
}
