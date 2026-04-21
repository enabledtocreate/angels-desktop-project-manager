'use client';

import { useEffect, useMemo, useState } from 'react';
import { ActionButton } from '@/components/ui/action-button';
import { DialogFrame } from '@/components/ui/dialog-frame';
import { FileExplorerModal } from '@/components/ui/file-explorer-modal';
import { FilePathField } from '@/components/ui/file-path-field';
import { fetchJson } from '@/lib/api-client';

const INHERITANCE_OPTIONS = [
  { key: 'aiDirectives', label: 'AI directives', description: 'Reuse parent AI guidance in the child project.' },
  { key: 'standards', label: 'Standards references', description: 'Reuse parent standards references in the child project.' },
  { key: 'templatePolicy', label: 'Template policy', description: 'Reuse parent template policy and replacement rules.' },
  { key: 'moduleDefaults', label: 'Module defaults', description: 'Start the child from parent-offered module defaults.' },
  { key: 'uiPreferences', label: 'UI preferences', description: 'Reuse safe parent UI preferences.' },
  { key: 'integrationDefaults', label: 'Integration defaults', description: 'Reuse safe parent integration defaults without secrets.' },
];

function normalizeInheritanceFlags(flags) {
  const source = flags && typeof flags === 'object' ? flags : {};
  return Object.fromEntries(INHERITANCE_OPTIONS.map((option) => [option.key, !!source[option.key]]));
}

function buildDraft(initialParentId = '') {
  return {
    sourceType: 'folder',
    name: '',
    description: '',
    projectType: 'general',
    category: '',
    tagsText: '',
    parentId: initialParentId || '',
    path: '',
    url: '',
    inheritedFromParent: normalizeInheritanceFlags({}),
  };
}

function formatTagList(value) {
  return String(value || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

export function CreateProjectModal({
  isOpen,
  onClose,
  onCreate,
  projects = [],
  roots = null,
  initialParentId = '',
}) {
  const [draft, setDraft] = useState(() => buildDraft(initialParentId));
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [pickerState, setPickerState] = useState(null);
  const [projectTypes, setProjectTypes] = useState([
    { key: 'general', label: 'General Project' },
    { key: 'software', label: 'Software Project' },
  ]);

  useEffect(() => {
    if (!isOpen) return;
    setDraft(buildDraft(initialParentId));
    setStatus('idle');
    setError('');
  }, [initialParentId, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    async function loadProjectTypes() {
      try {
        const payload = await fetchJson('/api/project-types');
        if (cancelled || !Array.isArray(payload) || !payload.length) return;
        setProjectTypes(payload.map((item) => ({
          key: item.key,
          label: item.label || item.key,
        })));
      } catch {
        // Keep the safe fallback options.
      }
    }
    loadProjectTypes();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const parentCandidates = useMemo(
    () => (Array.isArray(projects) ? projects : []).map((project) => ({
      id: project.id,
      name: project.name,
      offeredInheritance: normalizeInheritanceFlags(project.integrations?.projectFamily?.offeredInheritance),
    })),
    [projects]
  );

  const selectedParent = useMemo(
    () => parentCandidates.find((project) => project.id === draft.parentId) || null,
    [draft.parentId, parentCandidates]
  );

  const offeredInheritance = selectedParent?.offeredInheritance || normalizeInheritanceFlags({});

  function setInheritanceFlag(key, value) {
    setDraft((current) => ({
      ...current,
      inheritedFromParent: {
        ...current.inheritedFromParent,
        [key]: value,
      },
    }));
  }

  async function handleCreate() {
    setStatus('saving');
    setError('');
    try {
      const body = {
        type: draft.sourceType,
        name: draft.name.trim(),
        description: draft.description.trim(),
        projectType: draft.projectType,
        category: draft.category.trim() || null,
        tags: formatTagList(draft.tagsText),
        parentId: draft.parentId || null,
        integrations: {
          projectFamily: {
            inheritedFromParent: normalizeInheritanceFlags(draft.inheritedFromParent),
          },
        },
      };
      if (draft.sourceType === 'folder') body.path = draft.path.trim();
      if (draft.sourceType === 'url') body.url = draft.url.trim();
      const created = await onCreate?.(body);
      setStatus('saved');
      if (created) onClose?.();
    } catch (createError) {
      setStatus('error');
      setError(createError?.message || 'Failed to create project.');
    }
  }

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-slate/80 px-4 py-6 backdrop-blur-md">
        <div className="absolute inset-0" aria-hidden="true" onClick={onClose} />
        <DialogFrame
          eyebrow="Projects"
          title={draft.parentId ? 'Create child project' : 'Create project'}
          description={draft.parentId ? 'Create a child project under a parent and choose which parent-offered settings the child should inherit.' : 'Create a new project in the workspace and optionally attach it to a parent project.'}
          className="relative z-[1301] w-full max-w-4xl"
        >
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-ink/75">
                <span className="font-medium text-ink">Project Source</span>
                <select
                  className="w-full rounded-2xl border border-white/10 bg-slate px-4 py-3 text-ink outline-none focus:border-accent/60"
                  value={draft.sourceType}
                  onChange={(event) => setDraft((current) => ({ ...current, sourceType: event.target.value }))}
                >
                  <option value="folder">Folder</option>
                  <option value="url">URL</option>
                </select>
              </label>
              <label className="space-y-2 text-sm text-ink/75">
                <span className="font-medium text-ink">Project Type</span>
                <select
                  className="w-full rounded-2xl border border-white/10 bg-slate px-4 py-3 text-ink outline-none focus:border-accent/60"
                  value={draft.projectType}
                  onChange={(event) => setDraft((current) => ({ ...current, projectType: event.target.value }))}
                >
                  {projectTypes.map((projectType) => (
                    <option key={projectType.key} value={projectType.key}>{projectType.label}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm text-ink/75">
                <span className="font-medium text-ink">Project Name</span>
                <input
                  className="w-full rounded-2xl border border-white/10 bg-slate px-4 py-3 text-ink outline-none focus:border-accent/60"
                  value={draft.name}
                  onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                />
              </label>
              <label className="space-y-2 text-sm text-ink/75">
                <span className="font-medium text-ink">Category</span>
                <input
                  className="w-full rounded-2xl border border-white/10 bg-slate px-4 py-3 text-ink outline-none focus:border-accent/60"
                  value={draft.category}
                  onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))}
                />
              </label>
            </div>

            <label className="space-y-2 text-sm text-ink/75">
              <span className="font-medium text-ink">Description</span>
              <textarea
                rows={3}
                className="w-full rounded-2xl border border-white/10 bg-slate px-4 py-3 text-ink outline-none focus:border-accent/60"
                value={draft.description}
                onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
              />
            </label>

            <label className="space-y-2 text-sm text-ink/75">
              <span className="font-medium text-ink">Tags</span>
              <input
                className="w-full rounded-2xl border border-white/10 bg-slate px-4 py-3 text-ink outline-none focus:border-accent/60"
                value={draft.tagsText}
                onChange={(event) => setDraft((current) => ({ ...current, tagsText: event.target.value }))}
                placeholder="portfolio, mobile, planning"
              />
              <p className="text-xs text-ink/60">Use commas to separate tags.</p>
            </label>

            {draft.sourceType === 'folder' ? (
              <FilePathField
                id="create-project-path"
                label="Folder Path"
                value={draft.path}
                onBrowse={() => setPickerState({
                  title: 'Choose project folder',
                  description: 'Select the folder that should become the project root.',
                  initialPath: draft.path || roots?.projectsRoot || '',
                  selectionMode: 'folder',
                  onSelect: (entry) => {
                    const nextPath = entry.path || entry.absolutePath;
                    setDraft((current) => ({
                      ...current,
                      path: nextPath,
                      name: current.name || entry.name || current.name,
                    }));
                  },
                })}
                help="Folder projects must point to an existing directory inside the configured project root."
              />
            ) : (
              <label className="space-y-2 text-sm text-ink/75">
                <span className="font-medium text-ink">Project URL</span>
                <input
                  className="w-full rounded-2xl border border-white/10 bg-slate px-4 py-3 text-ink outline-none focus:border-accent/60"
                  value={draft.url}
                  onChange={(event) => setDraft((current) => ({ ...current, url: event.target.value }))}
                  placeholder="https://example.com/project"
                />
              </label>
            )}

            <label className="space-y-2 text-sm text-ink/75">
              <span className="font-medium text-ink">Parent Project</span>
              <select
                className="w-full rounded-2xl border border-white/10 bg-slate px-4 py-3 text-ink outline-none focus:border-accent/60"
                value={draft.parentId}
                onChange={(event) => setDraft((current) => ({
                  ...current,
                  parentId: event.target.value,
                  inheritedFromParent: event.target.value ? current.inheritedFromParent : normalizeInheritanceFlags({}),
                }))}
              >
                <option value="">No parent project</option>
                {parentCandidates.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </label>

            {selectedParent ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-ink">Parent-offered inheritance</p>
                <p className="mt-1 text-xs leading-5 text-ink/60">
                  Choose which of {selectedParent.name}&apos;s offered settings this child should inherit now. Everything remains optional.
                </p>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {INHERITANCE_OPTIONS.map((option) => {
                    const offered = !!offeredInheritance[option.key];
                    return (
                      <label key={option.key} className={`rounded-xl border p-3 text-sm ${offered ? 'border-white/10 bg-white/5 text-ink/75' : 'border-white/6 bg-black/10 text-ink/40'}`}>
                        <span className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            disabled={!offered}
                            checked={offered && !!draft.inheritedFromParent[option.key]}
                            onChange={(event) => setInheritanceFlag(option.key, event.target.checked)}
                          />
                          <span>
                            <span className="block font-medium text-ink">{option.label}</span>
                            <span className="mt-1 block text-xs leading-5">{offered ? option.description : 'Not offered by the selected parent.'}</span>
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {error ? <p className="text-sm text-rose-200">{error}</p> : null}

            <div className="flex flex-wrap justify-end gap-2 border-t border-white/10 pt-4">
              <ActionButton variant="ghost" onClick={onClose}>Cancel</ActionButton>
              <ActionButton variant="accent" onClick={handleCreate} disabled={status === 'saving'}>
                {status === 'saving' ? 'Creating...' : (draft.parentId ? 'Create Child Project' : 'Create Project')}
              </ActionButton>
            </div>
          </div>
        </DialogFrame>
      </div>

      <FileExplorerModal
        isOpen={Boolean(pickerState)}
        title={pickerState?.title}
        description={pickerState?.description}
        initialPath={pickerState?.initialPath}
        selectionMode={pickerState?.selectionMode}
        onClose={() => setPickerState(null)}
        onSelect={(entry) => {
          pickerState?.onSelect?.(entry);
          setPickerState(null);
        }}
      />
    </>
  );
}
