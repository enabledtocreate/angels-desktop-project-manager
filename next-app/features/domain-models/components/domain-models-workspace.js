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
import { ProjectFamilyDocumentContext } from '@/features/workspace/components/project-family-document-context';
import { useProjectWorkItemLookup } from '@/hooks/use-project-work-item-lookup';
import { countActiveFragments } from '@/lib/fragment-utils';

const TABS = [
  { id: 'overview', label: 'Overview', title: 'Domain Model Summary', description: 'Explain the shared model vocabulary this project will use.' },
  { id: 'models', label: 'Models', title: 'Base Domain Models', description: 'Define central conceptual models before schema, UI, API, or technical projections diverge.' },
  { id: 'projections', label: 'Projections', title: 'Model Projections', description: 'Connect a base model to a module-specific shape.' },
  { id: 'family', label: 'Family', title: 'Project Family Model Sharing', description: 'Describe how parent and child projects share or specialize model concepts.' },
  { id: 'questions', label: 'Questions', title: 'Open Questions', description: 'Track unresolved model questions before downstream modules harden the shape.' },
  { id: 'preview', label: 'Preview', title: 'Generated Domain Models Document', description: 'Review the markdown generated from the model registry.' },
];

const MODEL_TYPES = ['concept', 'entity', 'value-object', 'aggregate', 'event', 'command', 'external-resource'];
const FIELD_TYPES = ['unknown', 'text', 'number', 'boolean', 'date', 'datetime', 'identifier', 'enum', 'object', 'collection', 'reference'];
const PROJECTION_TYPES = ['functional', 'experience', 'persistence', 'technical', 'api-request', 'api-response', 'event', 'message', 'test-fixture'];
const MODULE_OPTIONS = ['functional_spec', 'experience_design', 'database_schema', 'technical_design', 'architecture', 'test_strategy', 'integrations'];

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeList(value) {
  return Array.isArray(value) ? value : [];
}

function emptyModelDraft() {
  return { name: '', summary: '' };
}

function emptyFieldDraft() {
  return { name: '', description: '', conceptualType: 'text', required: false };
}

function emptyRelationshipDraft() {
  return { title: '', description: '', relationshipType: '' };
}

function emptyProjectionDraft() {
  return { name: '', description: '', baseModelKey: '', owningModule: 'functional_spec', projectionType: 'functional' };
}

function editableStateFromDocument(editorState) {
  const state = editorState || {};
  return {
    overview: {
      summary: state.overview?.summary || '',
      stableId: state.overview?.stableId || '',
      sourceRefs: normalizeList(state.overview?.sourceRefs),
    },
    models: normalizeList(state.models),
    projections: normalizeList(state.projections),
    sharedModelProjections: normalizeList(state.sharedModelProjections),
    openQuestions: normalizeList(state.openQuestions),
    fragmentHistory: normalizeList(state.fragmentHistory),
  };
}

function buildEditorState(editableState, currentState) {
  return {
    ...(currentState || {}),
    overview: {
      ...(currentState?.overview || {}),
      summary: editableState.overview.summary,
      stableId: editableState.overview.stableId,
      sourceRefs: editableState.overview.sourceRefs,
      versionDate: new Date().toISOString(),
    },
    models: editableState.models,
    projections: editableState.projections,
    sharedModelProjections: editableState.sharedModelProjections,
    openQuestions: editableState.openQuestions,
    fragmentHistory: normalizeList(currentState?.fragmentHistory),
  };
}

function modelKey(model, index) {
  return String(model?.id || model?.stableId || `model-${index}`);
}

function TextInput({ label, value, onChange, placeholder = '', help = '' }) {
  return (
    <label className="space-y-2 text-sm text-sky-100/75">
      <span className="font-medium text-white">{label}</span>
      {help ? <p className="text-xs leading-5 text-sky-100/55">{help}</p> : null}
      <input
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-accent/60"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function TextArea({ label, value, onChange, rows = 4, placeholder = '', help = '' }) {
  return (
    <label className="space-y-2 text-sm text-sky-100/75">
      <span className="font-medium text-white">{label}</span>
      {help ? <p className="text-xs leading-5 text-sky-100/55">{help}</p> : null}
      <textarea
        rows={rows}
        className="min-h-24 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-accent/60"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SelectInput({ label, value, onChange, options = [] }) {
  return (
    <label className="space-y-2 text-sm text-sky-100/75">
      <span className="font-medium text-white">{label}</span>
      <select className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-accent/60" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function ModelSelectorButton({ model, active, onClick, workItemLookup = {} }) {
  return (
    <button type="button" onClick={onClick} className={['rounded-[1.2rem] border px-4 py-3 text-left transition', active ? 'border-cyan-200/80 bg-cyan-200/12' : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'].join(' ')}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{model?.name || 'Unnamed model'}</p>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-sky-100/70">{model?.summary || model?.description || 'No model summary yet.'}</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/6 px-2 py-1 text-[11px] font-semibold tracking-[0.12em] text-sky-100/70">{model?.fields?.length || 0} fields</span>
      </div>
      <div className="mt-3">
        <DocumentFieldMeta stableId={model?.stableId} sourceRefs={model?.sourceRefs} workItemLookup={workItemLookup} />
      </div>
    </button>
  );
}

function ModelFieldsEditor({ model, onUpdateModel }) {
  const [fieldDraft, setFieldDraft] = useState(() => emptyFieldDraft());

  function addField() {
    const name = fieldDraft.name.trim();
    const description = fieldDraft.description.trim();
    if (!name || !description) return;
    onUpdateModel({
      fields: [
        ...normalizeList(model.fields),
        {
          id: createId('domain-field'),
          stableId: '',
          name,
          displayName: name,
          description,
          conceptualType: fieldDraft.conceptualType || 'text',
          required: Boolean(fieldDraft.required),
          allowedValues: [],
          constraints: [],
          sourceRefs: [],
          versionDate: new Date().toISOString(),
        },
      ],
    });
    setFieldDraft(emptyFieldDraft());
  }

  function updateField(fieldId, fieldIndex, updates) {
    onUpdateModel({
      fields: normalizeList(model.fields).map((field, index) => (
        ((field.id && field.id === fieldId) || index === fieldIndex)
          ? { ...field, ...updates, id: field.id || fieldId, versionDate: new Date().toISOString() }
          : field
      )),
    });
  }

  function removeField(fieldId, fieldIndex) {
    onUpdateModel({
      fields: normalizeList(model.fields).filter((field, index) => !((field.id && field.id === fieldId) || index === fieldIndex)),
    });
  }

  return (
    <SurfaceCard className="space-y-4">
      <p className="text-sm font-semibold text-white">Fields</p>
      <div className="grid gap-3 md:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)_160px_auto_auto]">
        <input className="w-full rounded-xl border border-accent/35 bg-white/5 px-3 py-2 text-white outline-none focus:border-accent" placeholder="Field name" value={fieldDraft.name} onChange={(event) => setFieldDraft((current) => ({ ...current, name: event.target.value }))} />
        <input className="w-full rounded-xl border border-accent/35 bg-white/5 px-3 py-2 text-white outline-none focus:border-accent" placeholder="Description" value={fieldDraft.description} onChange={(event) => setFieldDraft((current) => ({ ...current, description: event.target.value }))} />
        <select className="w-full rounded-xl border border-accent/35 bg-white/5 px-3 py-2 text-white outline-none focus:border-accent" value={fieldDraft.conceptualType} onChange={(event) => setFieldDraft((current) => ({ ...current, conceptualType: event.target.value }))}>{FIELD_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</select>
        <label className="flex h-11 items-center gap-2 rounded-xl border border-accent/35 bg-white/5 px-3 text-sm text-white"><input type="checkbox" checked={fieldDraft.required} onChange={(event) => setFieldDraft((current) => ({ ...current, required: event.target.checked }))} />Required</label>
        <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-200/60 bg-emerald-400/20 text-lg font-semibold text-emerald-50 transition hover:bg-emerald-400/30 disabled:cursor-not-allowed disabled:opacity-40" onClick={addField} disabled={!fieldDraft.name.trim() || !fieldDraft.description.trim()} aria-label="Add field">+</button>
      </div>
      <div className="space-y-3">
        {normalizeList(model.fields).length ? normalizeList(model.fields).map((field, index) => {
          const fieldId = field.id || `field-${index}`;
          return (
            <div key={fieldId} className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="grid gap-3 md:grid-cols-[minmax(0,0.65fr)_minmax(0,1fr)_150px_auto_auto]">
                <input className="rounded-xl border border-white/10 bg-slate px-3 py-2 text-white outline-none focus:border-accent/60" value={field.name || ''} onChange={(event) => updateField(fieldId, index, { name: event.target.value, displayName: event.target.value })} />
                <input className="rounded-xl border border-white/10 bg-slate px-3 py-2 text-white outline-none focus:border-accent/60" value={field.description || ''} onChange={(event) => updateField(fieldId, index, { description: event.target.value })} />
                <select className="rounded-xl border border-white/10 bg-slate px-3 py-2 text-white outline-none focus:border-accent/60" value={field.conceptualType || 'unknown'} onChange={(event) => updateField(fieldId, index, { conceptualType: event.target.value })}>{FIELD_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</select>
                <label className="flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-slate px-3 text-sm text-white"><input type="checkbox" checked={Boolean(field.required)} onChange={(event) => updateField(fieldId, index, { required: event.target.checked })} />Required</label>
                <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-rose-200/60 bg-rose-400/20 text-sm font-semibold text-rose-50 transition hover:bg-rose-400/30" onClick={() => removeField(fieldId, index)} aria-label="Delete field">Del</button>
              </div>
              <p className="apm-stable-id mt-2 text-[11px] font-mono text-sky-100/45">ID: {field.stableId || 'pending-save'}</p>
            </div>
          );
        }) : <p className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-3 py-4 text-sm text-sky-100/60">No fields defined yet.</p>}
      </div>
    </SurfaceCard>
  );
}

function ModelRelationshipsEditor({ model, onUpdateModel }) {
  const [relationshipDraft, setRelationshipDraft] = useState(() => emptyRelationshipDraft());

  function addRelationship() {
    const title = relationshipDraft.title.trim();
    const description = relationshipDraft.description.trim();
    if (!title || !description) return;
    onUpdateModel({
      relationships: [
        ...normalizeList(model.relationships),
        {
          id: createId('domain-relationship'),
          stableId: '',
          title,
          description,
          relationshipType: relationshipDraft.relationshipType.trim(),
          sourceRefs: [],
          versionDate: new Date().toISOString(),
        },
      ],
    });
    setRelationshipDraft(emptyRelationshipDraft());
  }

  return (
    <SurfaceCard className="space-y-4">
      <p className="text-sm font-semibold text-white">Relationships</p>
      <div className="grid gap-3 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,0.7fr)_auto]">
        <input className="w-full rounded-xl border border-accent/35 bg-white/5 px-3 py-2 text-white outline-none focus:border-accent" placeholder="Relationship" value={relationshipDraft.title} onChange={(event) => setRelationshipDraft((current) => ({ ...current, title: event.target.value }))} />
        <input className="w-full rounded-xl border border-accent/35 bg-white/5 px-3 py-2 text-white outline-none focus:border-accent" placeholder="Description" value={relationshipDraft.description} onChange={(event) => setRelationshipDraft((current) => ({ ...current, description: event.target.value }))} />
        <input className="w-full rounded-xl border border-accent/35 bg-white/5 px-3 py-2 text-white outline-none focus:border-accent" placeholder="Type" value={relationshipDraft.relationshipType} onChange={(event) => setRelationshipDraft((current) => ({ ...current, relationshipType: event.target.value }))} />
        <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-200/60 bg-emerald-400/20 text-lg font-semibold text-emerald-50 transition hover:bg-emerald-400/30 disabled:cursor-not-allowed disabled:opacity-40" onClick={addRelationship} disabled={!relationshipDraft.title.trim() || !relationshipDraft.description.trim()} aria-label="Add relationship">+</button>
      </div>
      <div className="space-y-3">
        {normalizeList(model.relationships).length ? normalizeList(model.relationships).map((relationship, index) => (
          <div key={relationship.id || `relationship-${index}`} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
            <p className="text-sm font-semibold text-white">{relationship.title || 'Unnamed relationship'}</p>
            <p className="mt-1 text-sm leading-6 text-sky-100/70">{relationship.description || 'No relationship description.'}</p>
            <p className="apm-stable-id mt-2 text-[11px] font-mono text-sky-100/45">ID: {relationship.stableId || 'pending-save'}</p>
          </div>
        )) : <p className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-3 py-4 text-sm text-sky-100/60">No relationships defined yet.</p>}
      </div>
    </SurfaceCard>
  );
}

function ModelsTab({ editableState, selectedModelKey, setSelectedModelKey, selectedModel, updateSelectedModel, removeSelectedModel, workItemLookup }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(260px,0.9fr)_minmax(0,1.5fr)]">
      <div className="space-y-3">
        {editableState.models.length ? editableState.models.map((model, index) => {
          const key = modelKey(model, index);
          return <ModelSelectorButton key={key} model={model} active={key === selectedModelKey} workItemLookup={workItemLookup} onClick={() => setSelectedModelKey(key)} />;
        }) : <SurfaceCard tone="muted"><p className="text-sm leading-6 text-sky-100/70">No domain models yet. Add the first shared concept above.</p></SurfaceCard>}
      </div>

      {selectedModel ? (
        <div className="space-y-4">
          <SurfaceCard className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100/60">Selected Model</p>
                <h3 className="mt-2 text-xl font-semibold text-white">{selectedModel.name || 'Unnamed model'}</h3>
              </div>
              <ActionButton variant="ghost" onClick={removeSelectedModel}>Delete Model</ActionButton>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <TextInput label="Name" value={selectedModel.name || ''} onChange={(name) => updateSelectedModel({ name })} />
              <SelectInput label="Model Type" value={selectedModel.modelType || 'concept'} options={MODEL_TYPES} onChange={(modelType) => updateSelectedModel({ modelType })} />
            </div>
            <TextInput label="Summary" value={selectedModel.summary || ''} onChange={(summary) => updateSelectedModel({ summary })} />
            <TextArea label="Description" value={selectedModel.description || ''} onChange={(description) => updateSelectedModel({ description })} />
            <DocumentFieldMeta stableId={selectedModel.stableId} sourceRefs={selectedModel.sourceRefs} workItemLookup={workItemLookup} />
          </SurfaceCard>

          <ModelFieldsEditor model={selectedModel} onUpdateModel={updateSelectedModel} />
          <StructuredEntryListEditor label="Rules" help="Conceptual rules that apply to this model across modules." entries={normalizeList(selectedModel.rules)} onChange={(rules) => updateSelectedModel({ rules })} workItemLookup={workItemLookup} primaryLabel="Rule" secondaryLabel="Description" emptyLabel="No model rules yet." />
          <StructuredEntryListEditor label="Examples" help="Examples that help humans and agents understand what the model represents." entries={normalizeList(selectedModel.examples)} onChange={(examples) => updateSelectedModel({ examples })} workItemLookup={workItemLookup} primaryLabel="Example" secondaryLabel="Description" emptyLabel="No model examples yet." />
          <ModelRelationshipsEditor model={selectedModel} onUpdateModel={updateSelectedModel} />
        </div>
      ) : null}
    </div>
  );
}

function ProjectionsTab({ editableState, projectionDraft, setProjectionDraft, addProjection, workItemLookup }) {
  return (
    <div className="space-y-4">
      <SurfaceCard>
        <div className="grid gap-3 md:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)_minmax(0,0.8fr)_160px_180px_auto]">
          <input className="w-full rounded-xl border border-accent/35 bg-white/5 px-3 py-2 text-white outline-none focus:border-accent" placeholder="Projection name" value={projectionDraft.name} onChange={(event) => setProjectionDraft((current) => ({ ...current, name: event.target.value }))} />
          <input className="w-full rounded-xl border border-accent/35 bg-white/5 px-3 py-2 text-white outline-none focus:border-accent" placeholder="Description" value={projectionDraft.description} onChange={(event) => setProjectionDraft((current) => ({ ...current, description: event.target.value }))} />
          <select className="w-full rounded-xl border border-accent/35 bg-white/5 px-3 py-2 text-white outline-none focus:border-accent" value={projectionDraft.baseModelKey} onChange={(event) => setProjectionDraft((current) => ({ ...current, baseModelKey: event.target.value }))}>
            <option value="">No base selected</option>
            {editableState.models.map((model, index) => {
              const key = modelKey(model, index);
              return <option key={key} value={key}>{model.name || `Model ${index + 1}`}</option>;
            })}
          </select>
          <select className="w-full rounded-xl border border-accent/35 bg-white/5 px-3 py-2 text-white outline-none focus:border-accent" value={projectionDraft.projectionType} onChange={(event) => setProjectionDraft((current) => ({ ...current, projectionType: event.target.value }))}>{PROJECTION_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</select>
          <select className="w-full rounded-xl border border-accent/35 bg-white/5 px-3 py-2 text-white outline-none focus:border-accent" value={projectionDraft.owningModule} onChange={(event) => setProjectionDraft((current) => ({ ...current, owningModule: event.target.value }))}>{MODULE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</select>
          <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-200/60 bg-emerald-400/20 text-lg font-semibold text-emerald-50 transition hover:bg-emerald-400/30 disabled:cursor-not-allowed disabled:opacity-40" onClick={addProjection} disabled={!projectionDraft.name.trim() || !projectionDraft.description.trim()} aria-label="Add projection">+</button>
        </div>
      </SurfaceCard>
      <div className="grid gap-3 lg:grid-cols-2">
        {editableState.projections.length ? editableState.projections.map((projection, index) => (
          <SurfaceCard key={projection.id || `projection-${index}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100/60">{projection.projectionType || 'functional'}</p>
            <h3 className="mt-2 text-lg font-semibold text-white">{projection.name || 'Unnamed projection'}</h3>
            <p className="mt-2 text-sm leading-6 text-sky-100/72">{projection.description || 'No projection description.'}</p>
            <p className="mt-3 text-xs text-sky-100/60">Owning module: <span className="font-semibold text-white">{projection.owningModule || 'not set'}</span></p>
            <DocumentFieldMeta stableId={projection.stableId} sourceRefs={projection.sourceRefs} workItemLookup={workItemLookup} />
          </SurfaceCard>
        )) : <SurfaceCard tone="muted"><p className="text-sm leading-6 text-sky-100/70">No projections yet. Add one when a module needs its own version of a base model.</p></SurfaceCard>}
      </div>
    </div>
  );
}

export function DomainModelsWorkspace({ project, module }) {
  const { documentState, fragments, status, error, saveStatus, refresh, saveModuleDocument, consumeModuleFragment } = useModuleDocument(project, 'domain_models', Boolean(project?.id));
  const { byCode: workItemLookup } = useProjectWorkItemLookup(project, Boolean(project?.id));
  const [editableState, setEditableState] = useState(() => editableStateFromDocument(null));
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [selectedModelKey, setSelectedModelKey] = useState('');
  const [isFragmentsOpen, setIsFragmentsOpen] = useState(false);
  const [modelDraft, setModelDraft] = useState(() => emptyModelDraft());
  const [projectionDraft, setProjectionDraft] = useState(() => emptyProjectionDraft());
  const activeFragmentCount = countActiveFragments(fragments);

  useEffect(() => {
    if (documentState?.editorState) setEditableState(editableStateFromDocument(documentState.editorState));
  }, [documentState]);

  useEffect(() => {
    const keys = editableState.models.map((model, index) => modelKey(model, index));
    if (!keys.length) {
      if (selectedModelKey) setSelectedModelKey('');
      return;
    }
    if (!selectedModelKey || !keys.includes(selectedModelKey)) setSelectedModelKey(keys[0]);
  }, [editableState.models, selectedModelKey]);

  const activeTabMeta = useMemo(() => TABS.find((tab) => tab.id === activeTab) || TABS[0], [activeTab]);
  const selectedModel = useMemo(() => editableState.models.find((model, index) => modelKey(model, index) === selectedModelKey) || null, [editableState.models, selectedModelKey]);
  const selectedModelIndex = useMemo(() => editableState.models.findIndex((model, index) => modelKey(model, index) === selectedModelKey), [editableState.models, selectedModelKey]);

  async function handleSave() {
    await saveModuleDocument(buildEditorState(editableState, documentState?.editorState), documentState?.mermaid || null);
  }

  function updateSelectedModel(updates) {
    if (selectedModelIndex < 0) return;
    setEditableState((current) => ({
      ...current,
      models: current.models.map((model, index) => (index === selectedModelIndex ? { ...model, ...updates, versionDate: new Date().toISOString() } : model)),
    }));
  }

  function addModel() {
    const name = modelDraft.name.trim();
    const summary = modelDraft.summary.trim();
    if (!name || !summary) return;
    const nextModel = {
      id: createId('domain-model'),
      stableId: '',
      name,
      summary,
      description: '',
      modelType: 'concept',
      fields: [],
      relationships: [],
      rules: [],
      examples: [],
      sourceRefs: [],
      versionDate: new Date().toISOString(),
    };
    setEditableState((current) => ({ ...current, models: [...current.models, nextModel] }));
    setSelectedModelKey(nextModel.id);
    setModelDraft(emptyModelDraft());
  }

  function removeSelectedModel() {
    if (selectedModelIndex < 0) return;
    setEditableState((current) => ({ ...current, models: current.models.filter((_, index) => index !== selectedModelIndex) }));
    setSelectedModelKey('');
  }

  function addProjection() {
    const name = projectionDraft.name.trim();
    const description = projectionDraft.description.trim();
    if (!name || !description) return;
    const baseModel = editableState.models.find((model, index) => modelKey(model, index) === projectionDraft.baseModelKey) || null;
    setEditableState((current) => ({
      ...current,
      projections: [
        ...current.projections,
        {
          id: createId('domain-projection'),
          stableId: '',
          baseModelId: baseModel?.id || '',
          baseModelStableId: baseModel?.stableId || '',
          baseModelName: baseModel?.name || '',
          owningModule: projectionDraft.owningModule,
          projectionType: projectionDraft.projectionType,
          name,
          description,
          fieldMappings: [],
          excludedFields: [],
          additionalFields: [],
          constraints: [],
          sourceRefs: [],
          versionDate: new Date().toISOString(),
        },
      ],
    }));
    setProjectionDraft(emptyProjectionDraft());
  }

  if (status === 'loading' || status === 'idle') return <SectionShell eyebrow="Domain Models" title="Loading domain models..." description="Fetching the shared model registry." />;
  if (status === 'error') return <SectionShell eyebrow="Domain Models" title="Domain Models load failed" description={error ? error.message : 'Unknown domain models error'} />;

  return (
    <div className="space-y-6">
      <SectionShell
        eyebrow="Domain Models"
        title="Shared model registry"
        description={module?.description || 'Define conceptual models once, then let Functional Spec, Experience Design, Schema, Technical Design, APIs, and tests project from them.'}
        actions={(
          <>
            <StatusBadge tone="foundation">{project.name}</StatusBadge>
            <StatusBadge tone="migration">{saveStatus === 'saving' ? 'Saving' : 'Ready'}</StatusBadge>
            <ActionButton variant="ghost" onClick={() => setIsFragmentsOpen(true)}>{`Load Fragments${activeFragmentCount ? ` (${activeFragmentCount})` : ''}`}</ActionButton>
            <ActionButton variant="subtle" onClick={refresh}>Refresh</ActionButton>
            <ActionButton variant="accent" onClick={handleSave} disabled={saveStatus === 'saving'}>{saveStatus === 'saving' ? 'Saving...' : 'Save Domain Models'}</ActionButton>
          </>
        )}
      >
        <StatisticsDisclosure>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoTile eyebrow="Models" title={`${editableState.models.length}`} body="Shared conceptual models available to downstream modules." />
            <InfoTile eyebrow="Fields" title={`${editableState.models.reduce((total, model) => total + normalizeList(model.fields).length, 0)}`} body="Model fields captured in the registry." />
            <InfoTile eyebrow="Projections" title={`${editableState.projections.length}`} body="Module-specific shapes linked to base models." />
            <InfoTile eyebrow="Fragments" title={`${activeFragmentCount}`} body="Pending Domain Models fragments ready for review." />
          </div>
        </StatisticsDisclosure>
      </SectionShell>

      <ProjectFamilyDocumentContext project={project} moduleLabel="Domain Models" />

      <SectionShell eyebrow="Structured Editor" title={activeTabMeta.title} description={activeTabMeta.description}>
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={['rounded-full border px-3 py-2 text-xs font-semibold tracking-[0.12em] transition', tab.id === activeTab ? 'border-cyan-200/80 bg-cyan-200 text-slate' : 'border-white/10 bg-white/5 text-sky-100/65 hover:border-white/20 hover:bg-white/10 hover:text-white'].join(' ')}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-4">
          {activeTab === 'overview' ? (
            <SurfaceCard className="space-y-3">
              <TextArea label="Executive Summary" rows={6} value={editableState.overview.summary} help="Explain what this project means by its shared model layer." onChange={(summary) => setEditableState((current) => ({ ...current, overview: { ...current.overview, summary } }))} />
              <DocumentFieldMeta stableId={editableState.overview.stableId} sourceRefs={editableState.overview.sourceRefs} workItemLookup={workItemLookup} />
            </SurfaceCard>
          ) : null}

          {activeTab === 'models' ? (
            <div className="space-y-5">
              <SurfaceCard>
                <div className="grid gap-3 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_auto_auto]">
                  <input className="w-full rounded-xl border border-accent/35 bg-white/5 px-3 py-2 text-white outline-none focus:border-accent" placeholder="Model name" value={modelDraft.name} onChange={(event) => setModelDraft((current) => ({ ...current, name: event.target.value }))} />
                  <input className="w-full rounded-xl border border-accent/35 bg-white/5 px-3 py-2 text-white outline-none focus:border-accent" placeholder="Short summary" value={modelDraft.summary} onChange={(event) => setModelDraft((current) => ({ ...current, summary: event.target.value }))} />
                  <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-200/60 bg-emerald-400/20 text-lg font-semibold text-emerald-50 transition hover:bg-emerald-400/30 disabled:cursor-not-allowed disabled:opacity-40" onClick={addModel} disabled={!modelDraft.name.trim() || !modelDraft.summary.trim()} aria-label="Add domain model">+</button>
                  <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-rose-200/60 bg-rose-400/18 text-lg font-semibold text-rose-50 transition hover:bg-rose-400/28" onClick={() => setModelDraft(emptyModelDraft())} aria-label="Clear model draft">x</button>
                </div>
              </SurfaceCard>
              <ModelsTab editableState={editableState} selectedModelKey={selectedModelKey} setSelectedModelKey={setSelectedModelKey} selectedModel={selectedModel} updateSelectedModel={updateSelectedModel} removeSelectedModel={removeSelectedModel} workItemLookup={workItemLookup} />
            </div>
          ) : null}

          {activeTab === 'projections' ? (
            <ProjectionsTab editableState={editableState} projectionDraft={projectionDraft} setProjectionDraft={setProjectionDraft} addProjection={addProjection} workItemLookup={workItemLookup} />
          ) : null}

          {activeTab === 'family' ? (
            <StructuredEntryListEditor
              label="Project Family Model Sharing"
              help="Describe how a parent project references, extends, or constrains models owned by child projects, or how child projects specialize shared base concepts."
              entries={editableState.sharedModelProjections}
              onChange={(sharedModelProjections) => setEditableState((current) => ({ ...current, sharedModelProjections }))}
              workItemLookup={workItemLookup}
              primaryLabel="Sharing Rule"
              primaryPlaceholder="Shared Person concept splits into parent Identity and child Profile projections"
              secondaryLabel="Description"
              secondaryPlaceholder="The parent platform owns the shared identity concept while each child project adds only project-local fields."
              emptyLabel="No project-family model sharing notes yet."
            />
          ) : null}

          {activeTab === 'questions' ? (
            <StructuredEntryListEditor label="Open Questions" entries={editableState.openQuestions} onChange={(openQuestions) => setEditableState((current) => ({ ...current, openQuestions }))} workItemLookup={workItemLookup} primaryLabel="Question" primaryPlaceholder="Should Person split into User and Contact?" secondaryLabel="Context" secondaryPlaceholder="This affects UI forms and persistence shape." emptyLabel="No model questions yet." />
          ) : null}

          {activeTab === 'preview' ? (
            <SurfaceCard tone="muted">
              <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap text-sm leading-6 text-sky-100/80">{documentState?.markdown || 'No generated Domain Models markdown yet.'}</pre>
            </SurfaceCard>
          ) : null}
        </div>
      </SectionShell>

      <FragmentBrowserModal title="Domain Models Fragments" eyebrow="Fragment Browser" isOpen={isFragmentsOpen} fragments={fragments} onClose={() => setIsFragmentsOpen(false)} onIntegrate={(fragment) => consumeModuleFragment(fragment)} storageKey={`${project.id}-domain-models-fragments`} />
    </div>
  );
}
