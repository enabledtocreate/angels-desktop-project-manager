'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ActionButton } from '@/components/ui/action-button';
import { DialogFrame } from '@/components/ui/dialog-frame';
import { FileExplorerModal } from '@/components/ui/file-explorer-modal';
import { FilePathField } from '@/components/ui/file-path-field';
import { SuggestedValueInput } from '@/components/ui/suggested-value-input';
import { TagEditor } from '@/components/ui/tag-editor';
import { fetchJson } from '@/lib/api-client';

const CROP_VIEWPORT = 240;
const INHERITANCE_OPTIONS = [
  { key: 'aiDirectives', label: 'AI directives', description: 'Parent AI guidance can be reused by child projects.' },
  { key: 'standards', label: 'Standards references', description: 'Parent standards registry references can guide child modules.' },
  { key: 'templatePolicy', label: 'Template policy', description: 'Template version and replacement expectations can be shared.' },
  { key: 'moduleDefaults', label: 'Module defaults', description: 'Default module choices can be offered to new children.' },
  { key: 'uiPreferences', label: 'UI preferences', description: 'Visual preferences can be inherited where safe.' },
  { key: 'integrationDefaults', label: 'Integration defaults', description: 'Safe integration defaults can be offered without secrets.' },
];

function normalizeInheritanceFlags(flags) {
  const source = flags && typeof flags === 'object' ? flags : {};
  return Object.fromEntries(INHERITANCE_OPTIONS.map((option) => [option.key, !!source[option.key]]));
}

function buildState(project, modules = []) {
  const linkedServerIds = Array.isArray(project?.integrations?.sftp?.serverIds) && project.integrations.sftp.serverIds.length
    ? project.integrations.sftp.serverIds
    : (project?.serverId ? [project.serverId] : []);
  const projectFamily = project?.integrations?.projectFamily || {};
  return {
    name: project?.name || '',
    description: project?.description || '',
    parentId: project?.parentId || '',
    category: project?.category || '',
    projectType: project?.projectType || 'general',
    primaryAction: project?.primaryAction || 'auto',
    serverId: project?.serverId || '',
    linkedServerIds,
    path: project?.path || '',
    absolutePath: project?.absolutePath || '',
    projectUrl: project?.url || '',
    tags: Array.isArray(project?.tags) ? project.tags : [],
    imageUrl: project?.imageUrl || '',
    imageVersion: 0,
    imageSourceMode: project?.imageUrl ? 'url' : 'local',
    hasLocalImage: Boolean(project?.imagePath),
    enabledSoftwareModules: (Array.isArray(modules) ? modules : [])
      .filter((module) => !module.core && module.enabled)
      .map((module) => module.moduleKey),
    links: Array.isArray(project?.links) && project.links.length
      ? project.links.map((link) => ({
        type: link.type || 'url',
        description: link.description || '',
        url: link.url || '',
        action: link.action || 'auto',
      }))
      : [{ type: 'url', description: '', url: '', action: 'auto' }],
    projectFamily: {
      offeredInheritance: normalizeInheritanceFlags(projectFamily.offeredInheritance),
      inheritedFromParent: normalizeInheritanceFlags(projectFamily.inheritedFromParent),
    },
  };
}

const CATEGORY_DEFINITIONS = [
  { key: 'foundation', label: 'Foundation' },
  { key: 'planning', label: 'Planning' },
  { key: 'family', label: 'Project Family' },
  { key: 'records', label: 'Records' },
  { key: 'modules', label: 'Modules' },
];

function textButtonClass(active) {
  return [
    'w-full rounded-2xl border px-4 py-3 text-left text-sm transition',
    active
      ? 'border-accent/50 bg-accentSoft/80 text-white'
      : 'border-white/10 bg-white/5 text-sky-100/75 hover:border-accent/30 hover:bg-white/10',
  ].join(' ');
}

function getImagePreviewSrc(project, state) {
  if (state.imageSourceMode === 'url' && state.imageUrl.trim()) return state.imageUrl.trim();
  if (state.hasLocalImage) return `/api/project-image/${project.id}?v=${state.imageVersion}`;
  return null;
}

function ImageCropModal({ isOpen, source, onClose, onApply }) {
  const imageRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  useEffect(() => {
    if (!isOpen || !source) return;
    setZoom(1);
    setMinZoom(1);
    setPanX(0);
    setPanY(0);
  }, [isOpen, source]);

  if (!isOpen || !source) return null;

  function handleImageLoad() {
    const image = imageRef.current;
    if (!image || !image.naturalWidth || !image.naturalHeight) return;
    const nextMinZoom = Math.max(CROP_VIEWPORT / image.naturalWidth, CROP_VIEWPORT / image.naturalHeight, 0.1);
    setMinZoom(nextMinZoom);
    setZoom(nextMinZoom);
    setPanX(0);
    setPanY(0);
  }

  async function handleApply() {
    const image = imageRef.current;
    if (!image || !image.naturalWidth || !image.naturalHeight) return;

    const canvas = document.createElement('canvas');
    canvas.width = CROP_VIEWPORT;
    canvas.height = CROP_VIEWPORT;
    const context = canvas.getContext('2d');
    if (!context) return;

    const drawWidth = image.naturalWidth * zoom;
    const drawHeight = image.naturalHeight * zoom;
    const originX = (CROP_VIEWPORT - drawWidth) / 2 + panX;
    const originY = (CROP_VIEWPORT - drawHeight) / 2 + panY;

    context.clearRect(0, 0, CROP_VIEWPORT, CROP_VIEWPORT);
    context.drawImage(image, originX, originY, drawWidth, drawHeight);

    await onApply(canvas.toDataURL('image/png'));
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-slate/80 px-4 py-6 backdrop-blur-md">
      <div className="absolute inset-0" aria-hidden="true" onClick={onClose} />
      <DialogFrame
        eyebrow="Crop Image"
        title="Crop project image"
        description="Adjust the framing, then apply to save the cropped project image."
        className="relative z-[1301] w-full max-w-3xl"
      >
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div className="flex items-center justify-center rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
              <div className="relative h-[240px] w-[240px] overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate">
                <img
                  ref={imageRef}
                  src={source}
                  alt=""
                  className="absolute left-1/2 top-1/2 max-w-none"
                  style={{
                    transform: `translate(-50%, -50%) translate(${panX}px, ${panY}px) scale(${zoom})`,
                    transformOrigin: 'center center',
                  }}
                  onLoad={handleImageLoad}
                />
              </div>
            </div>
            <div className="space-y-4">
              <label className="space-y-2 text-sm text-sky-100/75">
                <span className="font-medium text-white">Zoom</span>
                <input
                  type="range"
                  min={minZoom}
                  max={4}
                  step={0.01}
                  value={zoom}
                  onChange={(event) => setZoom(Number(event.target.value))}
                  className="w-full"
                />
              </label>
              <label className="space-y-2 text-sm text-sky-100/75">
                <span className="font-medium text-white">Horizontal framing</span>
                <input
                  type="range"
                  min={-200}
                  max={200}
                  step={1}
                  value={panX}
                  onChange={(event) => setPanX(Number(event.target.value))}
                  className="w-full"
                />
              </label>
              <label className="space-y-2 text-sm text-sky-100/75">
                <span className="font-medium text-white">Vertical framing</span>
                <input
                  type="range"
                  min={-200}
                  max={200}
                  step={1}
                  value={panY}
                  onChange={(event) => setPanY(Number(event.target.value))}
                  className="w-full"
                />
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
            <ActionButton variant="ghost" onClick={onClose}>Cancel</ActionButton>
            <ActionButton variant="accent" onClick={handleApply}>Apply crop</ActionButton>
          </div>
        </div>
      </DialogFrame>
    </div>
  );
}

export function ProjectSettingsModal({ project, modules = [], isOpen, onClose, onSave }) {
  const fileInputRef = useRef(null);
  const [activeCategory, setActiveCategory] = useState('foundation');
  const [state, setState] = useState(() => buildState(project, modules));
  const [saveStatus, setSaveStatus] = useState('idle');
  const [projectTypes, setProjectTypes] = useState([]);
  const [credentials, setCredentials] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [cropSource, setCropSource] = useState(null);
  const [imageActionStatus, setImageActionStatus] = useState('');
  const [pickerState, setPickerState] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setActiveCategory('foundation');
    setState(buildState(project, modules));
    setSaveStatus('idle');
    setImageActionStatus('');
  }, [isOpen, project, modules]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    async function loadProjectTypes() {
      try {
        const [projectTypesPayload, credentialsPayload, projectsPayload] = await Promise.all([
          fetchJson('/api/project-types'),
          fetchJson('/api/credentials'),
          fetchJson('/api/projects'),
        ]);
        if (cancelled) return;
        setProjectTypes(Array.isArray(projectTypesPayload) ? projectTypesPayload : []);
        setCredentials(Array.isArray(credentialsPayload) ? credentialsPayload : []);
        setAllProjects(Array.isArray(projectsPayload) ? projectsPayload : []);
      } catch (error) {
        if (!cancelled) console.error('Failed to load project types:', error);
      }
    }

    loadProjectTypes();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const selectedProjectType = useMemo(
    () => projectTypes.find((projectType) => projectType.key === state.projectType) || null,
    [projectTypes, state.projectType]
  );

  const availableProjectModules = useMemo(
    () => ((selectedProjectType?.availableModules || []).filter((module) => !module.core)),
    [selectedProjectType]
  );
  const availableAiModules = useMemo(
    () => availableProjectModules.filter((module) => module.group === 'ai'),
    [availableProjectModules]
  );
  const availableSoftwareModules = useMemo(
    () => availableProjectModules.filter((module) => module.group === 'software'),
    [availableProjectModules]
  );
  const projectCategorySuggestions = useMemo(
    () => [...new Set((Array.isArray(allProjects) ? allProjects : []).map((entry) => String(entry?.category || '').trim()).filter(Boolean))],
    [allProjects]
  );
  const projectTagSuggestions = useMemo(
    () => [...new Set((Array.isArray(allProjects) ? allProjects : []).flatMap((entry) => Array.isArray(entry?.tags) ? entry.tags : []).map((tag) => String(tag || '').trim()).filter(Boolean))],
    [allProjects]
  );
  const parentCandidates = useMemo(
    () => (Array.isArray(allProjects) ? allProjects : []).filter((entry) => entry && entry.id !== project?.id),
    [allProjects, project?.id]
  );
  const parentProject = useMemo(
    () => parentCandidates.find((entry) => entry.id === state.parentId) || null,
    [parentCandidates, state.parentId]
  );
  const parentOfferedInheritance = normalizeInheritanceFlags(parentProject?.integrations?.projectFamily?.offeredInheritance);

  if (!isOpen) return null;

  function setInheritanceFlag(groupKey, optionKey, value) {
    setState((current) => ({
      ...current,
      projectFamily: {
        ...current.projectFamily,
        [groupKey]: {
          ...normalizeInheritanceFlags(current.projectFamily?.[groupKey]),
          [optionKey]: !!value,
        },
      },
    }));
  }

  async function handleSave() {
    setSaveStatus('saving');
    try {
      const projectPayload = {
        name: state.name,
        description: state.description,
        parentId: state.parentId || null,
        category: state.category,
        projectType: state.projectType,
        primaryAction: state.primaryAction,
        serverId: state.serverId || null,
        integrations: {
          ...(project?.integrations || {}),
          sftp: {
            ...((project?.integrations && project.integrations.sftp) || {}),
            serverIds: state.linkedServerIds,
            defaultServerId: state.serverId || '',
          },
          projectFamily: {
            offeredInheritance: normalizeInheritanceFlags(state.projectFamily?.offeredInheritance),
            inheritedFromParent: normalizeInheritanceFlags(state.projectFamily?.inheritedFromParent),
          },
        },
        imageUrl: state.imageSourceMode === 'url' ? state.imageUrl.trim() || null : null,
        path: project?.type === 'folder' ? state.path || null : null,
        absolutePath: project?.type === 'folder' ? state.absolutePath || null : null,
        url: project?.type === 'folder' ? null : (state.projectUrl || null),
        tags: state.tags,
        links: state.links
          .map((link) => ({
            type: link.type || 'url',
            description: (link.description || '').trim(),
            url: (link.url || '').trim(),
            action: (link.action || '').trim() || undefined,
          }))
          .filter((link) => link.description || link.url),
      };

      const modulePayload = {
        projectType: state.projectType,
        enabledModules: state.enabledSoftwareModules,
      };

      await onSave({ projectPayload, modulePayload });
      setSaveStatus('saved');
      onClose();
    } catch (error) {
      console.error('Failed to save project settings:', error);
      setSaveStatus('error');
    }
  }

  function toggleSoftwareModule(moduleKey) {
    setState((current) => {
      const exists = current.enabledSoftwareModules.includes(moduleKey);
      return {
        ...current,
        enabledSoftwareModules: exists
          ? current.enabledSoftwareModules.filter((key) => key !== moduleKey)
          : [...current.enabledSoftwareModules, moduleKey],
      };
    });
  }

  async function handleCroppedImageApply(imageData) {
    try {
      await fetchJson(`/api/projects/${project.id}/image`, {
        method: 'PUT',
        body: JSON.stringify({ imageData }),
      });
      setState((current) => ({
        ...current,
        imageSourceMode: 'local',
        imageUrl: '',
        hasLocalImage: true,
        imageVersion: current.imageVersion + 1,
      }));
      setImageActionStatus('Saved cropped image.');
    } catch (error) {
      console.error('Failed to save cropped image:', error);
      setImageActionStatus('Failed to save cropped image.');
    }
  }

  async function handleImageFileChange(event) {
    const file = event.target.files && event.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropSource(String(reader.result || ''));
      setImageActionStatus('');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  }

  async function handleRemoveImage() {
    try {
      await fetchJson(`/api/projects/${project.id}`, {
        method: 'PUT',
        body: JSON.stringify({ imagePath: null, imageUrl: null }),
      });
      setState((current) => ({
        ...current,
        imageUrl: '',
        imageSourceMode: 'local',
        hasLocalImage: false,
        imageVersion: current.imageVersion + 1,
      }));
      setImageActionStatus('Removed project image.');
    } catch (error) {
      console.error('Failed to remove project image:', error);
      setImageActionStatus('Failed to remove project image.');
    }
  }

  const imagePreviewSrc = getImagePreviewSrc(project, state);

  function openPathPicker(config) {
    setPickerState(config);
  }

  return (
    <>
      <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate/80 px-4 py-6 backdrop-blur-md">
        <div className="absolute inset-0" aria-hidden="true" onClick={onClose} />
        <DialogFrame
          eyebrow="Project Settings"
          title={project?.name || 'Project settings'}
          description="Project settings are grouped to match the workspace hierarchy, so metadata and software branches stay organized in the same place."
          className="relative z-[1201] w-full max-w-6xl"
        >
          <div role="dialog" aria-modal="true" aria-label="Project settings" className="space-y-5">
            <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
              <nav className="space-y-2">
                {CATEGORY_DEFINITIONS.map((category) => (
                  <button
                    key={category.key}
                    type="button"
                    className={textButtonClass(activeCategory === category.key)}
                    onClick={() => setActiveCategory(category.key)}
                  >
                    {category.label}
                  </button>
                ))}
              </nav>

              <div className="min-h-[24rem] rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                {activeCategory === 'foundation' ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100/60">Foundation</p>
                      <h3 className="mt-2 text-xl font-semibold text-white">Core project identity</h3>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="space-y-2 text-sm text-ink/75">
                        <span className="font-medium text-ink">Project Name</span>
                        <input className="w-full rounded-2xl border border-white/10 bg-slate px-4 py-3 text-ink outline-none focus:border-accent/60" placeholder="Project name" value={state.name} onChange={(event) => setState((current) => ({ ...current, name: event.target.value }))} />
                      </label>
                      <SuggestedValueInput
                        label="Category"
                        value={state.category}
                        onChange={(value) => setState((current) => ({ ...current, category: value }))}
                        suggestions={projectCategorySuggestions}
                        placeholder="Category"
                        help="Choose an existing category or type a new one."
                      />
                      <div className="md:col-span-2">
                        <label className="space-y-2 text-sm text-ink/75">
                          <span className="font-medium text-ink">Project Description</span>
                          <textarea className="min-h-28 w-full rounded-2xl border border-white/10 bg-slate px-4 py-3 text-ink outline-none focus:border-accent/60" placeholder="Project description" value={state.description} onChange={(event) => setState((current) => ({ ...current, description: event.target.value }))} />
                        </label>
                      </div>
                      <div className="md:col-span-2">
                        <TagEditor
                          label="Tags"
                          values={state.tags}
                          onChange={(nextTags) => setState((current) => ({ ...current, tags: nextTags }))}
                          suggestions={projectTagSuggestions}
                          help="Use existing tags or add new ones without comma-separated text."
                        />
                      </div>
                      {project?.type === 'folder' ? (
                        <>
                          <FilePathField
                            id="project-settings-project-path"
                            label="Project Path"
                            value={state.path}
                            onBrowse={() => openPathPicker({
                              title: 'Choose project folder',
                              description: 'Select the root folder for this project.',
                              initialPath: state.absolutePath || state.path,
                              selectionMode: 'folder',
                              onSelect: (entry) => {
                                setState((current) => ({
                                  ...current,
                                  path: entry.relativePath || entry.absolutePath,
                                  absolutePath: entry.absolutePath,
                                }));
                              },
                            })}
                          />
                          <FilePathField
                            id="project-settings-project-absolute-path"
                            label="Absolute Path"
                            value={state.absolutePath}
                            onBrowse={() => openPathPicker({
                              title: 'Choose project folder',
                              description: 'Select the root folder for this project.',
                              initialPath: state.absolutePath || state.path,
                              selectionMode: 'folder',
                              onSelect: (entry) => {
                                setState((current) => ({
                                  ...current,
                                  path: entry.relativePath || entry.absolutePath,
                                  absolutePath: entry.absolutePath,
                                }));
                              },
                            })}
                          />
                        </>
                      ) : (
                        <label className="space-y-2 text-sm text-ink/75 md:col-span-2">
                          <span className="font-medium text-ink">Project URL</span>
                          <input className="w-full rounded-2xl border border-white/10 bg-slate/60 px-4 py-3 text-ink/70 outline-none" value={state.projectUrl} readOnly />
                        </label>
                      )}
                      <p className="md:col-span-2 text-xs text-ink/60">
                        Paths are shown here so repository-backed projects still expose their working location and git-relevant folder context.
                      </p>
                    </div>
                  </div>
                ) : null}

                {activeCategory === 'planning' ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100/60">Planning</p>
                      <h3 className="mt-2 text-xl font-semibold text-white">Project behavior</h3>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="space-y-2 text-sm text-ink/75">
                        <span className="font-medium text-ink">Project Type</span>
                        <select className="w-full rounded-2xl border border-white/10 bg-slate px-4 py-3 text-ink outline-none focus:border-accent/60" value={state.projectType} onChange={(event) => setState((current) => ({ ...current, projectType: event.target.value, enabledSoftwareModules: [] }))}>
                          <option value="general">General Project</option>
                          <option value="software">Software Project</option>
                        </select>
                      </label>
                      <label className="space-y-2 text-sm text-ink/75">
                        <span className="font-medium text-ink">Primary Open Action</span>
                        <select className="w-full rounded-2xl border border-white/10 bg-slate px-4 py-3 text-ink outline-none focus:border-accent/60" value={state.primaryAction} onChange={(event) => setState((current) => ({ ...current, primaryAction: event.target.value }))}>
                          <option value="auto">Default Program / Browser</option>
                          <option value="cursor">Cursor</option>
                          <option value="vscode">VS Code</option>
                          <option value="chrome">Chrome</option>
                          <option value="explorer">Default File Handler</option>
                        </select>
                      </label>
                      <div className="md:col-span-2 space-y-3">
                        <p className="text-sm font-medium text-ink">Linked SFTP Servers</p>
                        <p className="text-xs leading-5 text-ink/60">
                          Link one or more saved SFTP credentials to this project. The default server remains compatible with the existing transfer flows.
                        </p>
                        <div className="grid gap-2 md:grid-cols-2">
                          {credentials.length ? credentials.map((credential) => (
                            <label key={credential.id} className="inline-flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-ink/75">
                              <input
                                type="checkbox"
                                checked={state.linkedServerIds.includes(credential.id)}
                                onChange={(event) => setState((current) => ({
                                  ...current,
                                  linkedServerIds: event.target.checked
                                    ? [...new Set([...current.linkedServerIds, credential.id])]
                                    : current.linkedServerIds.filter((id) => id !== credential.id),
                                  serverId: current.serverId === credential.id && !event.target.checked ? '' : current.serverId,
                                }))}
                              />
                              <span className="min-w-0">
                                <span className="block text-ink">{credential.name}</span>
                                <span className="block text-xs text-ink/60">{credential.user}@{credential.host}:{credential.port}</span>
                              </span>
                            </label>
                          )) : <p className="text-sm text-ink/60">No saved SFTP credentials yet.</p>}
                        </div>
                      </div>
                      <label className="space-y-2 text-sm text-ink/75 md:col-span-2">
                        <span className="font-medium text-ink">Default SFTP Server</span>
                        <select className="w-full rounded-2xl border border-white/10 bg-slate px-4 py-3 text-ink outline-none focus:border-accent/60" value={state.serverId} onChange={(event) => setState((current) => ({ ...current, serverId: event.target.value }))}>
                          <option value="">No default SFTP server</option>
                          {credentials.filter((credential) => state.linkedServerIds.includes(credential.id)).map((credential) => (
                            <option key={credential.id} value={credential.id}>
                              {credential.name} ({credential.user}@{credential.host}:{credential.port})
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <p className="text-sm leading-6 text-sky-100/75">
                      Primary open action controls how links and files open from the app. Linked SFTP servers are project-scoped and can be switched inside the SFTP workspace.
                    </p>
                  </div>
                ) : null}

                {activeCategory === 'family' ? (
                  <div className="space-y-5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100/60">Project Family</p>
                      <h3 className="mt-2 text-xl font-semibold text-white">Parent, child, and inheritance controls</h3>
                      <p className="mt-2 text-sm leading-6 text-sky-100/75">
                        Parent projects can offer inheritable settings. Child projects opt into only the inheritance categories they need.
                      </p>
                    </div>

                    <label className="space-y-2 text-sm text-ink/75">
                      <span className="font-medium text-ink">Parent Project</span>
                      <select
                        className="w-full rounded-2xl border border-white/10 bg-slate px-4 py-3 text-ink outline-none focus:border-accent/60"
                        value={state.parentId}
                        onChange={(event) => setState((current) => ({
                          ...current,
                          parentId: event.target.value,
                          projectFamily: {
                            ...current.projectFamily,
                            inheritedFromParent: event.target.value
                              ? current.projectFamily.inheritedFromParent
                              : normalizeInheritanceFlags({}),
                          },
                        }))}
                      >
                        <option value="">No parent project</option>
                        {parentCandidates.map((candidate) => (
                          <option key={candidate.id} value={candidate.id}>{candidate.name}</option>
                        ))}
                      </select>
                      <span className="block text-xs leading-5 text-ink/60">
                        A child can have only one parent. The backend prevents circular parent/child relationships.
                      </span>
                    </label>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-slate/70 p-4">
                        <p className="text-sm font-semibold text-ink">Offer to child projects</p>
                        <p className="mt-1 text-xs leading-5 text-ink/60">
                          These options make this project a source that child projects may inherit from later.
                        </p>
                        <div className="mt-3 space-y-2">
                          {INHERITANCE_OPTIONS.map((option) => (
                            <label key={option.key} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-ink/75">
                              <input
                                type="checkbox"
                                checked={!!state.projectFamily.offeredInheritance[option.key]}
                                onChange={(event) => setInheritanceFlag('offeredInheritance', option.key, event.target.checked)}
                              />
                              <span>
                                <span className="block font-medium text-ink">{option.label}</span>
                                <span className="mt-1 block text-xs leading-5 text-ink/60">{option.description}</span>
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-slate/70 p-4">
                        <p className="text-sm font-semibold text-ink">Inherit from parent</p>
                        <p className="mt-1 text-xs leading-5 text-ink/60">
                          {parentProject ? `Available from ${parentProject.name}. Disabled options are not offered by the parent.` : 'Choose a parent project before enabling inherited settings.'}
                        </p>
                        <div className="mt-3 space-y-2">
                          {INHERITANCE_OPTIONS.map((option) => {
                            const offered = !!parentOfferedInheritance[option.key];
                            return (
                              <label key={option.key} className={`flex items-start gap-3 rounded-xl border p-3 text-sm ${offered ? 'border-white/10 bg-white/5 text-ink/75' : 'border-white/6 bg-black/10 text-ink/35'}`}>
                                <input
                                  type="checkbox"
                                  disabled={!parentProject || !offered}
                                  checked={!!state.projectFamily.inheritedFromParent[option.key] && offered}
                                  onChange={(event) => setInheritanceFlag('inheritedFromParent', option.key, event.target.checked)}
                                />
                                <span>
                                  <span className="block font-medium">{option.label}</span>
                                  <span className="mt-1 block text-xs leading-5">{offered ? option.description : 'Not offered by the selected parent.'}</span>
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {activeCategory === 'records' ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100/60">Records</p>
                      <h3 className="mt-2 text-xl font-semibold text-white">Media and links</h3>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
                      <div className="space-y-3 rounded-2xl border border-white/10 bg-slate/70 p-4">
                        <div className="flex h-40 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                          {imagePreviewSrc ? (
                            <img src={imagePreviewSrc} alt="" className="h-full w-full rounded-2xl object-cover" />
                          ) : (
                            <span className="text-sm text-sky-100/65">No project image</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <ActionButton size="sm" variant="subtle" onClick={() => fileInputRef.current?.click()}>
                            Choose image
                          </ActionButton>
                          <ActionButton size="sm" variant="ghost" onClick={handleRemoveImage}>
                            Remove image
                          </ActionButton>
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFileChange} />
                        {imageActionStatus ? <p className="text-xs text-sky-100/65">{imageActionStatus}</p> : null}
                      </div>

                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-3 text-sm text-sky-100/75">
                          <label className="inline-flex items-center gap-2">
                            <input type="radio" name="project-image-source" checked={state.imageSourceMode === 'local'} onChange={() => setState((current) => ({ ...current, imageSourceMode: 'local' }))} />
                            Local image
                          </label>
                          <label className="inline-flex items-center gap-2">
                            <input type="radio" name="project-image-source" checked={state.imageSourceMode === 'url'} onChange={() => setState((current) => ({ ...current, imageSourceMode: 'url' }))} />
                            Image URL
                          </label>
                        </div>

                        {state.imageSourceMode === 'url' ? (
                          <label className="space-y-2 text-sm text-ink/75">
                            <span className="font-medium text-ink">Project Image URL</span>
                            <input className="w-full rounded-2xl border border-white/10 bg-slate px-4 py-3 text-ink outline-none focus:border-accent/60" placeholder="Project icon image URL" value={state.imageUrl} onChange={(event) => setState((current) => ({ ...current, imageUrl: event.target.value }))} />
                          </label>
                        ) : (
                          <p className="text-sm leading-6 text-sky-100/75">
                            Local images are cropped before upload and saved into the desktop app data directory for this project.
                          </p>
                        )}

                        <div className="space-y-3">
                          {state.links.map((link, index) => (
                            <div key={`project-link-${index}`} className="grid gap-3 rounded-2xl border border-white/10 bg-slate/70 p-4 md:grid-cols-[120px_minmax(0,1fr)_minmax(0,1.1fr)_170px_120px]">
                              <select className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-accent/60" value={link.type} onChange={(event) => setState((current) => ({ ...current, links: current.links.map((entry, linkIndex) => linkIndex === index ? { ...entry, type: event.target.value } : entry) }))}>
                                <option value="url">url</option>
                                <option value="file">file</option>
                                <option value="folder">folder</option>
                              </select>
                              <label className="space-y-2 text-sm text-ink/75">
                                <span className="font-medium text-ink">Link Title</span>
                                <input className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-accent/60" placeholder="Description" value={link.description} onChange={(event) => setState((current) => ({ ...current, links: current.links.map((entry, linkIndex) => linkIndex === index ? { ...entry, description: event.target.value } : entry) }))} />
                              </label>
                              <label className="space-y-2 text-sm text-ink/75">
                                <span className="font-medium text-ink">Path or URL</span>
                                {link.type === 'url' ? (
                                  <input className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-accent/60" placeholder="URL or path" value={link.url} onChange={(event) => setState((current) => ({ ...current, links: current.links.map((entry, linkIndex) => linkIndex === index ? { ...entry, url: event.target.value } : entry) }))} />
                                ) : (
                                  <div className="flex gap-2">
                                    <input className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-white/85 outline-none" value={link.url} readOnly placeholder="Choose a path" />
                                    <ActionButton
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openPathPicker({
                                        title: link.type === 'folder' ? 'Choose folder link' : 'Choose file link',
                                        description: 'Select the path this project link should open.',
                                        initialPath: link.url || state.absolutePath || state.path,
                                        includeFiles: link.type === 'file',
                                        selectionMode: link.type === 'file' ? 'file' : 'folder',
                                        onSelect: (entry) => {
                                          setState((current) => ({
                                            ...current,
                                            links: current.links.map((existingLink, linkIndex) => linkIndex === index ? { ...existingLink, url: entry.absolutePath } : existingLink),
                                          }));
                                        },
                                      })}
                                    >
                                      ...
                                    </ActionButton>
                                  </div>
                                )}
                              </label>
                              <label className="space-y-2 text-sm text-ink/75">
                                <span className="font-medium text-ink">Open With</span>
                                <select className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-accent/60" value={link.action || 'auto'} onChange={(event) => setState((current) => ({ ...current, links: current.links.map((entry, linkIndex) => linkIndex === index ? { ...entry, action: event.target.value } : entry) }))}>
                                  <option value="auto">Default Program / Browser</option>
                                  <option value="cursor">Cursor</option>
                                  <option value="vscode">VS Code</option>
                                  <option value="chrome">Chrome</option>
                                  <option value="explorer">Default File Handler</option>
                                </select>
                              </label>
                              <ActionButton variant="ghost" size="sm" onClick={() => setState((current) => ({ ...current, links: current.links.filter((_, linkIndex) => linkIndex !== index) || [] }))}>
                                Remove
                              </ActionButton>
                            </div>
                          ))}
                          <ActionButton variant="subtle" size="sm" onClick={() => setState((current) => ({ ...current, links: [...current.links, { type: 'url', description: '', url: '', action: 'auto' }] }))}>
                            Add link
                          </ActionButton>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {activeCategory === 'modules' ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100/60">Modules</p>
                      <h3 className="mt-2 text-xl font-semibold text-white">Module selection</h3>
                      <p className="mt-2 text-sm leading-6 text-sky-100/75">
                        Add or remove project modules here. AI modules and Software modules are shown separately so the project structure is easier to reason about.
                      </p>
                    </div>

                    <div className="space-y-5">
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-semibold text-white">AI</p>
                          <p className="text-xs leading-5 text-sky-100/65">
                            Modules that define how AI should read and operate within the project.
                          </p>
                        </div>
                        {availableAiModules.map((module) => (
                          <label key={module.key} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate/70 p-4 text-sm text-sky-100/75">
                            <input
                              type="checkbox"
                              checked={state.enabledSoftwareModules.includes(module.key)}
                              onChange={() => toggleSoftwareModule(module.key)}
                              className="mt-1"
                            />
                            <span className="space-y-1">
                              <span className="block font-semibold text-white">{module.label}</span>
                              <span className="block">{module.description}</span>
                              {Array.isArray(module.dependsOn) && module.dependsOn.length ? (
                                <span className="block text-xs uppercase tracking-[0.14em] text-sky-100/55">
                                  Depends on: {module.dependsOn.join(' | ')}
                                </span>
                              ) : null}
                            </span>
                          </label>
                        ))}
                        {!availableAiModules.length ? (
                          <p className="text-sm text-sky-100/75">No AI modules are available for this project type.</p>
                        ) : null}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-semibold text-white">Software</p>
                          <p className="text-xs leading-5 text-sky-100/65">
                            Modules that define product, requirements, system design, and validation work for software projects.
                          </p>
                        </div>
                        {state.projectType !== 'software' ? (
                          <p className="text-sm leading-6 text-sky-100/75">
                            Switch the project type to <span className="font-semibold text-white">software</span> under Planning to enable software modules.
                          </p>
                        ) : (
                          <>
                            {availableSoftwareModules.map((module) => (
                              <label key={module.key} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate/70 p-4 text-sm text-sky-100/75">
                                <input
                                  type="checkbox"
                                  checked={state.enabledSoftwareModules.includes(module.key)}
                                  onChange={() => toggleSoftwareModule(module.key)}
                                  className="mt-1"
                                />
                                <span className="space-y-1">
                                  <span className="block font-semibold text-white">{module.label}</span>
                                  <span className="block">{module.description}</span>
                                  {Array.isArray(module.dependsOn) && module.dependsOn.length ? (
                                    <span className="block text-xs uppercase tracking-[0.14em] text-sky-100/55">
                                      Depends on: {module.dependsOn.join(' | ')}
                                    </span>
                                  ) : null}
                                </span>
                              </label>
                            ))}
                            {!availableSoftwareModules.length ? (
                              <p className="text-sm text-sky-100/75">No software modules are available for this project type yet.</p>
                            ) : null}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-sky-100/65">
                {saveStatus === 'saving'
                  ? 'Saving project settings...'
                  : saveStatus === 'error'
                    ? 'Failed to save project settings.'
                    : 'Project settings affect the selected workspace only.'}
              </p>
              <div className="flex gap-3">
                <ActionButton variant="ghost" onClick={onClose}>Close</ActionButton>
                <ActionButton variant="accent" onClick={handleSave} disabled={saveStatus === 'saving'}>
                  {saveStatus === 'saving' ? 'Saving...' : 'Save project'}
                </ActionButton>
              </div>
            </div>
          </div>
        </DialogFrame>
      </div>

      <ImageCropModal
        isOpen={Boolean(cropSource)}
        source={cropSource}
        onClose={() => setCropSource(null)}
        onApply={handleCroppedImageApply}
      />

      <FileExplorerModal
        isOpen={Boolean(pickerState)}
        title={pickerState?.title || 'Choose path'}
        description={pickerState?.description || 'Select a file or folder path.'}
        initialPath={pickerState?.initialPath || ''}
        includeFiles={Boolean(pickerState?.includeFiles)}
        selectionMode={pickerState?.selectionMode || 'folder'}
        onClose={() => setPickerState(null)}
        onSelect={(entry) => {
          pickerState?.onSelect?.(entry);
          setPickerState(null);
        }}
      />
    </>
  );
}
