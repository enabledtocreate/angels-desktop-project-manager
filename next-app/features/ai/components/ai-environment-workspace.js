'use client';

import { useEffect, useState } from 'react';
import { ActionButton } from '@/components/ui/action-button';
import { DocumentFieldMeta } from '@/components/ui/document-field-meta';
import { FragmentBrowserModal } from '@/components/ui/fragment-browser-modal';
import { InfoTile } from '@/components/ui/info-tile';
import { SectionShell } from '@/components/ui/section-shell';
import { StatisticsDisclosure } from '@/components/ui/statistics-disclosure';
import { StructuredEntryListEditor } from '@/components/ui/structured-entry-list-editor';
import { SurfaceCard } from '@/components/ui/surface-card';
import { useAiEnvironment } from '@/features/ai/hooks/use-ai-environment';
import { ProjectFamilyDocumentContext } from '@/features/workspace/components/project-family-document-context';
import { useProjectWorkItemLookup } from '@/hooks/use-project-work-item-lookup';
import { countActiveFragments } from '@/lib/fragment-utils';
import { fetchJson } from '@/lib/api-client';

function buildEditableState(editorState) {
  const state = editorState || {};
  return {
    selectedProfileIds: Array.isArray(state.selectedProfileIds) ? state.selectedProfileIds : [],
    disabledDirectiveIds: Array.isArray(state.disabledDirectiveIds) ? state.disabledDirectiveIds : [],
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
    termDictionary: Array.isArray(state.termDictionary) ? state.termDictionary : [],
    moduleUpdateRules: Array.isArray(state.moduleUpdateRules) ? state.moduleUpdateRules : [],
    projectFamilyReadOrder: Array.isArray(state.projectFamilyReadOrder) ? state.projectFamilyReadOrder : [],
    projectFamilyInheritanceRules: Array.isArray(state.projectFamilyInheritanceRules) ? state.projectFamilyInheritanceRules : [],
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
    disabledDirectiveIds: Array.isArray(editableState.disabledDirectiveIds) ? editableState.disabledDirectiveIds : [],
    overview: {
      mission: editableState.mission,
      operatingModel: editableState.operatingModel,
      communicationStyle: editableState.communicationStyle,
      itemIds: editableState.overviewItemIds,
      itemSourceRefs: editableState.overviewItemSourceRefs,
      versionDate: now,
    },
    requiredBehaviors: editableState.requiredBehaviors,
    termDictionary: editableState.termDictionary,
    moduleUpdateRules: editableState.moduleUpdateRules,
    projectFamilyReadOrder: editableState.projectFamilyReadOrder,
    projectFamilyInheritanceRules: editableState.projectFamilyInheritanceRules,
    dataPhrasingRules: editableState.dataPhrasingRules,
    avoidRules: editableState.avoidRules,
    customInstructions: editableState.customInstructions,
    customInstructionsMeta: editableState.customInstructionsMeta,
    handoffChecklist: editableState.handoffChecklist,
  };
}

function groupDirectivesByModule(directives = []) {
  const groups = [];
  const byKey = new Map();
  directives.forEach((directive) => {
    const moduleKey = String(directive?.moduleKey || 'module').trim() || 'module';
    if (!byKey.has(moduleKey)) {
      const group = {
        moduleKey,
        moduleLabel: directive?.moduleLabel || moduleKey,
        templateName: directive?.templateName || '',
        directives: [],
      };
      byKey.set(moduleKey, group);
      groups.push(group);
    }
    const group = byKey.get(moduleKey);
    if (!group.templateName && directive?.templateName) group.templateName = directive.templateName;
    group.directives.push(directive);
  });
  return groups;
}

function domToken(value) {
  return String(value || 'item').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'item';
}

const AI_SECTION_GUIDES = {
  mission: 'The project-level purpose for AI agents. This should tell an agent what the project exists to accomplish before it reads detailed directives.',
  communicationStyle: 'How agents should communicate with the human user, including tone, brevity, escalation, and collaboration expectations.',
  operatingModel: 'The default workflow for reading project context, making changes, using fragments, validating work, and handing results back.',
  requiredBehaviors: 'Project-specific rules that should always be followed unless a code-owned directive says otherwise.',
  termDictionary: 'APM vocabulary that may not mean the same thing in other tools. These terms are generated into the AI Environment document as a table.',
  moduleUpdateRules: 'Rules that tell an agent which other modules or documents may need updates when one area changes.',
  projectFamilyReadOrder: 'The order an agent should use when a task spans parent and child projects so it can find the owning source of truth before editing.',
  projectFamilyInheritanceRules: 'Rules that explain when parent-offered inheritance may be used and when child projects must stay autonomous.',
  dataPhrasingRules: 'Rules for structured data, stored titles, section wording, and generated document phrasing.',
  avoidRules: 'Guardrails for behaviors that can damage source-of-truth state, generated files, or project traceability.',
  customInstructions: 'A review buffer for temporary or unusual project-specific guidance. Durable rules should be moved into structured entries or code-owned directives.',
  handoffChecklist: 'The final verification checklist an agent should use before reporting that work is complete.',
};

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

function SectionGuide({ title, children }) {
  return (
    <SurfaceCard className="p-3" tone="muted">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/55">AI Section Guide</p>
      <p className="mt-1 text-sm font-semibold text-ink">{title}</p>
      <p className="mt-2 text-sm leading-6 text-ink/72">{children}</p>
    </SurfaceCard>
  );
}

export function AiEnvironmentWorkspace({ project }) {
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
  const [fragmentsOpen, setFragmentsOpen] = useState(false);
  const [expandedDirectiveGroups, setExpandedDirectiveGroups] = useState(() => new Set([
    'Application Directives',
    'Shared APM Directives',
    'Emitted Module Directives',
  ]));
  const [expandedDirectiveModules, setExpandedDirectiveModules] = useState(() => new Set());
  const [expandedDirectiveDescriptions, setExpandedDirectiveDescriptions] = useState(() => new Set());
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
  const directiveRegistry = aiEnvironment?.directiveRegistry || {};
  const localDisabledDirectiveIds = new Set(Array.isArray(editableState.disabledDirectiveIds) ? editableState.disabledDirectiveIds : []);
  const applyLocalDirectiveState = (directives = []) => directives.map((directive) => {
    const enabled = directive.required ? true : !localDisabledDirectiveIds.has(directive.id);
    return {
      ...directive,
      enabled,
      disabled: !enabled,
    };
  });
  const localApplicationDirectives = applyLocalDirectiveState(directiveRegistry.applicationDirectives || []);
  const localSharedDirectives = applyLocalDirectiveState(directiveRegistry.sharedDirectives || []);
  const localModuleDirectives = applyLocalDirectiveState(directiveRegistry.emittedModuleDirectives || directiveRegistry.moduleDirectives || []);
  const localDisabledDirectives = [...localApplicationDirectives, ...localSharedDirectives, ...localModuleDirectives].filter((directive) => !directive.enabled);
  const localModuleDirectiveGroups = groupDirectivesByModule(localModuleDirectives.filter((directive) => directive.enabled));
  const localDisabledDirectiveGroups = groupDirectivesByModule(localDisabledDirectives.filter((directive) => directive.moduleKey));
  const groupedDirectives = [
    { label: 'Application Directives', directives: localApplicationDirectives.filter((directive) => directive.enabled) },
    { label: 'Shared APM Directives', directives: localSharedDirectives.filter((directive) => directive.enabled) },
    { label: 'Emitted Module Directives', moduleGroups: localModuleDirectiveGroups },
    { label: 'Disabled Directives', directives: localDisabledDirectives.filter((directive) => !directive.moduleKey), moduleGroups: localDisabledDirectiveGroups },
  ].filter((group) => (group.directives || []).length || (group.moduleGroups || []).some((moduleGroup) => moduleGroup.directives.length));
  const countDirectiveGroupItems = (group) => (group.directives || []).length
    + (group.moduleGroups || []).reduce((total, moduleGroup) => total + moduleGroup.directives.length, 0);
  const isDirectiveGroupExpanded = (label) => expandedDirectiveGroups.has(label);
  const isDirectiveModuleExpanded = (groupLabel, moduleKey) => expandedDirectiveModules.has(`${groupLabel}:${moduleKey}`);
  const isDirectiveDescriptionExpanded = (key) => expandedDirectiveDescriptions.has(key);

  function toggleExpansion(setter, key) {
    setter((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleDirective(directive) {
    if (!directive || directive.required) return;
    setEditableState((current) => {
      const currentIds = new Set(Array.isArray(current.disabledDirectiveIds) ? current.disabledDirectiveIds : []);
      if (currentIds.has(directive.id)) currentIds.delete(directive.id);
      else currentIds.add(directive.id);
      return {
        ...current,
        disabledDirectiveIds: [...currentIds],
      };
    });
  }

  function renderDirectiveCard(directive, keyPrefix = 'directive') {
    const detailKey = `${keyPrefix}:${directive.id}`;
    const expanded = isDirectiveDescriptionExpanded(detailKey);
    const domId = `ai-directive-${domToken(keyPrefix)}-${domToken(directive.id)}`;
    const pathHints = Array.isArray(directive.pathHints) ? directive.pathHints.filter((hint) => hint?.path) : [];
    return (
      <div
        key={detailKey}
        id={domId}
        className="ai-directive-item rounded-xl border border-white/10 bg-slate/20 px-3 py-3"
        data-directive-id={directive.id}
        data-directive-scope={directive.scope || ''}
        data-directive-module={directive.moduleKey || ''}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 break-words text-sm font-semibold text-ink">{directive.title}</p>
          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            <button
              type="button"
              className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-ink/70 transition hover:border-accent/50 hover:text-ink"
              aria-expanded={expanded}
              aria-controls={`${domId}-details`}
              onClick={() => toggleExpansion(setExpandedDirectiveDescriptions, detailKey)}
            >
              {expanded ? 'Hide Details' : 'Details'}
            </button>
            {!directive.required ? (
              <button
                type="button"
                className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-ink/70 transition hover:border-accent/50 hover:text-ink"
                onClick={() => toggleDirective(directive)}
              >
                {directive.enabled ? 'Disable' : 'Enable'}
              </button>
            ) : null}
          </div>
        </div>
        {expanded ? (
          <div id={`${domId}-details`} className="ai-directive-details mt-3 space-y-2 border-t border-white/10 pt-3">
            <div className="flex flex-wrap gap-1">
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/65">
                {directive.locked ? 'Locked' : 'Editable'}
              </span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/65">
                {directive.required ? 'Required' : 'Optional'}
              </span>
              {directive.moduleLabel ? (
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/65">
                  {directive.moduleLabel}
                </span>
              ) : null}
            </div>
            <p className="break-words text-[11px] uppercase tracking-[0.14em] text-ink/45">Directive ID: {directive.id}</p>
            <p className="text-sm leading-6 text-ink/75">{directive.description}</p>
            {directive.templateName ? (
              <p className="text-xs text-ink/55">Source Template: templates/{directive.templateName}</p>
            ) : null}
            {pathHints.length ? (
              <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/50">Resolved Paths</p>
                <div className="mt-2 space-y-1">
                  {pathHints.map((hint, index) => (
                    <p key={`${directive.id}-path-${index}`} className="break-words text-xs leading-5 text-ink/65">
                      <span className="font-semibold text-ink/75">{hint.label || 'Path'}:</span> {hint.path}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    );
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
            <ActionButton variant="subtle" onClick={refresh}>Refresh AI environment</ActionButton>
            <ActionButton variant="accent" onClick={handleSave} disabled={saveStatus === 'saving'}>
              {saveStatus === 'saving' ? 'Saving...' : 'Save AI environment'}
            </ActionButton>
          </>
        )}
      >
        <SurfaceCard className="mb-4 p-3" tone="muted">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">Fragment-first directive updates</p>
          <p className="mt-2 text-sm leading-6 text-ink/75">
            AI directive changes should be loaded through AI Environment fragments so versioned migrators, validation, and source references stay intact.
          </p>
        </SurfaceCard>
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
            <InfoTile eyebrow="Term Dictionary" title={`${aiEnvironment?.editorState?.termDictionary?.length || 0}`} body="APM-specific terms agents should understand." />
            <InfoTile eyebrow="Module Rules" title={`${aiEnvironment?.editorState?.moduleUpdateRules?.length || 0}`} body="Which modules need follow-up when scope changes." />
            <InfoTile eyebrow="Phrasing Rules" title={`${aiEnvironment?.editorState?.dataPhrasingRules?.length || 0}`} body="How agents should phrase structured updates." />
          </div>
        </StatisticsDisclosure>
      </SectionShell>

      <ProjectFamilyDocumentContext project={project} moduleLabel="AI Environment" />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.8fr)]">
        <SectionShell
          eyebrow="Structured Guidance"
          title="Agent operating instructions"
          description="Structured lists are edited as real title-and-description entries now, so we do not rely on brittle inline delimiters. Use Custom Instructions for project-specific guidance that does not fit a structured list."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <SectionGuide title="Mission">{AI_SECTION_GUIDES.mission}</SectionGuide>
              <AiEnvironmentTextArea label="Mission" stableId={editableState.overviewItemIds?.mission} sourceRefs={editableState.overviewItemSourceRefs?.mission} workItemLookup={workItemLookup} value={editableState.mission} onChange={(event) => setEditableState((current) => ({ ...current, mission: event.target.value }))} />
            </div>
            <div className="space-y-3">
              <SectionGuide title="Communication Style">{AI_SECTION_GUIDES.communicationStyle}</SectionGuide>
              <AiEnvironmentTextArea label="Communication Style" stableId={editableState.overviewItemIds?.communicationStyle} sourceRefs={editableState.overviewItemSourceRefs?.communicationStyle} workItemLookup={workItemLookup} value={editableState.communicationStyle} onChange={(event) => setEditableState((current) => ({ ...current, communicationStyle: event.target.value }))} />
            </div>
            <div className="md:col-span-2 space-y-3">
              <SectionGuide title="Operating Model">{AI_SECTION_GUIDES.operatingModel}</SectionGuide>
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
            <div className="md:col-span-2 space-y-3">
              <SectionGuide title="Required Behaviors">{AI_SECTION_GUIDES.requiredBehaviors}</SectionGuide>
              <StructuredEntryListEditor label="Required Behaviors" entries={editableState.requiredBehaviors} workItemLookup={workItemLookup} onChange={(value) => setEditableState((current) => ({ ...current, requiredBehaviors: value }))} emptyLabel="No required behaviors yet." />
            </div>
            <div className="md:col-span-2 space-y-3">
              <SectionGuide title="APM Term Dictionary">{AI_SECTION_GUIDES.termDictionary}</SectionGuide>
              <StructuredEntryListEditor label="APM Term Dictionary" entries={editableState.termDictionary} workItemLookup={workItemLookup} onChange={(value) => setEditableState((current) => ({ ...current, termDictionary: value }))} emptyLabel="No APM terms yet." />
            </div>
            <div className="md:col-span-2 space-y-3">
              <SectionGuide title="Module Update Rules">{AI_SECTION_GUIDES.moduleUpdateRules}</SectionGuide>
              <StructuredEntryListEditor label="Module Update Rules" entries={editableState.moduleUpdateRules} workItemLookup={workItemLookup} onChange={(value) => setEditableState((current) => ({ ...current, moduleUpdateRules: value }))} emptyLabel="No module update rules yet." />
            </div>
            <div className="md:col-span-2 space-y-3">
              <SectionGuide title="Project Family Read Order">{AI_SECTION_GUIDES.projectFamilyReadOrder}</SectionGuide>
              <StructuredEntryListEditor label="Project Family Read Order" entries={editableState.projectFamilyReadOrder} workItemLookup={workItemLookup} onChange={(value) => setEditableState((current) => ({ ...current, projectFamilyReadOrder: value }))} emptyLabel="No project-family read order guidance yet." />
            </div>
            <div className="md:col-span-2 space-y-3">
              <SectionGuide title="Project Family Inheritance Rules">{AI_SECTION_GUIDES.projectFamilyInheritanceRules}</SectionGuide>
              <StructuredEntryListEditor label="Project Family Inheritance Rules" entries={editableState.projectFamilyInheritanceRules} workItemLookup={workItemLookup} onChange={(value) => setEditableState((current) => ({ ...current, projectFamilyInheritanceRules: value }))} emptyLabel="No project-family inheritance rules yet." />
            </div>
            <div className="md:col-span-2 space-y-3">
              <SectionGuide title="Data Structure / Phrasing Rules">{AI_SECTION_GUIDES.dataPhrasingRules}</SectionGuide>
              <StructuredEntryListEditor label="Data Structure / Phrasing Rules" entries={editableState.dataPhrasingRules} workItemLookup={workItemLookup} onChange={(value) => setEditableState((current) => ({ ...current, dataPhrasingRules: value }))} emptyLabel="No data phrasing rules yet." />
            </div>
            <div className="md:col-span-2 space-y-3">
              <SectionGuide title="Avoid / Guardrails">{AI_SECTION_GUIDES.avoidRules}</SectionGuide>
              <StructuredEntryListEditor label="Avoid / Guardrails" entries={editableState.avoidRules} workItemLookup={workItemLookup} onChange={(value) => setEditableState((current) => ({ ...current, avoidRules: value }))} emptyLabel="No guardrails yet." />
            </div>
            <div className="md:col-span-2 space-y-3">
              <SurfaceCard className="mb-3 p-3" tone="muted">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/55">Custom Instruction Review Buffer</p>
                <p className="mt-2 text-sm leading-6 text-ink/72">
                  {AI_SECTION_GUIDES.customInstructions} If a custom instruction becomes permanent, convert it into a structured section or code-owned directive instead of leaving it in this freeform buffer.
                </p>
              </SurfaceCard>
              <AiEnvironmentTextArea
                label="Custom Instructions"
                rows={5}
                help="Add plain-language project-specific instructions here only when the guidance does not belong in a structured list or module-owned directive."
                stableId={editableState.customInstructionsMeta?.stableId}
                sourceRefs={editableState.customInstructionsMeta?.sourceRefs}
                workItemLookup={workItemLookup}
                value={editableState.customInstructions}
                onChange={(event) => setEditableState((current) => ({ ...current, customInstructions: event.target.value }))}
              />
            </div>
            <div className="md:col-span-2 space-y-3">
              <SectionGuide title="Handoff Checklist">{AI_SECTION_GUIDES.handoffChecklist}</SectionGuide>
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
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">Directive Hierarchy</p>
            <p className="mt-2 text-sm leading-6 text-ink/75">
              Code-owned required directives cannot be edited or disabled. Optional locked directives can be disabled here, and disabled directives disappear from generated documents.
            </p>
            <div className="mt-3 space-y-3">
              {groupedDirectives.length ? groupedDirectives.map((group) => (
                <div key={group.label} id={`ai-directive-group-${domToken(group.label)}`} className="ai-directive-group rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 text-left text-sm font-semibold text-ink"
                    aria-expanded={isDirectiveGroupExpanded(group.label)}
                    onClick={() => toggleExpansion(setExpandedDirectiveGroups, group.label)}
                  >
                    <span>{group.label} ({countDirectiveGroupItems(group)})</span>
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-ink/70">
                      {isDirectiveGroupExpanded(group.label) ? 'Collapse' : 'Expand'}
                    </span>
                  </button>
                  {isDirectiveGroupExpanded(group.label) ? (
                  <div className="mt-3 space-y-2">
                    {(group.moduleGroups || []).map((moduleGroup) => (
                      <div key={`${group.label}-${moduleGroup.moduleKey}`} id={`ai-directive-module-${domToken(group.label)}-${domToken(moduleGroup.moduleKey)}`} className="ai-directive-module rounded-xl border border-accent/20 bg-slate/20 px-3 py-3">
                        <button
                          type="button"
                          className="flex w-full items-center justify-between gap-3 text-left"
                          aria-expanded={isDirectiveModuleExpanded(group.label, moduleGroup.moduleKey)}
                          onClick={() => toggleExpansion(setExpandedDirectiveModules, `${group.label}:${moduleGroup.moduleKey}`)}
                        >
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-ink">{moduleGroup.moduleLabel}</span>
                            <span className="block text-xs text-ink/55">
                              {moduleGroup.directives.length} emitted directive{moduleGroup.directives.length === 1 ? '' : 's'}
                              {moduleGroup.templateName ? ` from ${moduleGroup.templateName}` : ''}
                            </span>
                          </span>
                          <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs font-semibold text-ink/70">
                            {isDirectiveModuleExpanded(group.label, moduleGroup.moduleKey) ? 'Collapse Module' : 'Expand Module'}
                          </span>
                        </button>
                        {isDirectiveModuleExpanded(group.label, moduleGroup.moduleKey) ? (
                          <div className="mt-3 space-y-2 border-l border-accent/25 pl-3">
                            {moduleGroup.directives.map((directive) => renderDirectiveCard(directive, `${group.label}-${moduleGroup.moduleKey}`))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                    {(group.directives || []).map((directive) => renderDirectiveCard(directive, group.label))}
                  </div>
                  ) : null}
                </div>
              )) : (
                <p className="text-sm leading-6 text-ink/70">No directives are currently registered for this project.</p>
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
              <p><span className="font-semibold text-ink">Project Fragments:</span> {aiEnvironment?.projectFragmentsDir || 'Not available yet.'}</p>
              <p><span className="font-semibold text-ink">Shared Fragments:</span> {aiEnvironment?.sharedFragmentsDir || 'Not available yet.'}</p>
              <p><span className="font-semibold text-ink">Software Standards:</span> {aiEnvironment?.softwareStandardsPath || 'Not available yet.'}</p>
              <p><span className="font-semibold text-ink">Runtime Database:</span> {aiEnvironment?.runtimeDatabasePath || 'Not available yet.'}</p>
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
