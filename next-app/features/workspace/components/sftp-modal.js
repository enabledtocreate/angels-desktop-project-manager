'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ActionButton } from '@/components/ui/action-button';
import { DialogFrame } from '@/components/ui/dialog-frame';
import { fetchJson } from '@/lib/api-client';
import sftpMappingRules from '../../../../src/sftp-mapping-rules';

function createDefaultGroup() {
  return {
    id: `group-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: 'Default',
    uploadMappings: [],
    downloadMappings: [],
    kind: 'upload',
    serverId: '',
  };
}

function normalizeProjectGroups(project) {
  if (Array.isArray(project?.mappingGroups) && project.mappingGroups.length) {
    return project.mappingGroups.map((group) => ({
      id: group.id || `group-${Math.random().toString(36).slice(2, 7)}`,
      name: group.name || 'Group',
      uploadMappings: Array.isArray(group.uploadMappings) ? group.uploadMappings : [],
      downloadMappings: Array.isArray(group.downloadMappings) ? group.downloadMappings : [],
      kind: ['upload', 'download', 'both'].includes(String(group.kind || '').trim().toLowerCase())
        ? String(group.kind).trim().toLowerCase()
        : ((Array.isArray(group.uploadMappings) && group.uploadMappings.length && !(Array.isArray(group.downloadMappings) && group.downloadMappings.length))
          ? 'upload'
          : ((Array.isArray(group.downloadMappings) && group.downloadMappings.length && !(Array.isArray(group.uploadMappings) && group.uploadMappings.length))
            ? 'download'
            : 'both')),
      serverId: group.serverId ? String(group.serverId).trim() : '',
    }));
  }
  return [createDefaultGroup()];
}

function getLinkedServerIds(project) {
  const linked = Array.isArray(project?.integrations?.sftp?.serverIds)
    ? project.integrations.sftp.serverIds.map((value) => String(value || '').trim()).filter(Boolean)
    : [];
  if (linked.length) return [...new Set(linked)];
  return project?.serverId ? [project.serverId] : [];
}

const { buildUploadMappingFromSelection, buildDownloadMappingFromSelection } = sftpMappingRules;

function buildMappingKey(mapping, index, prefix) {
  return `${prefix}-${index}-${String(mapping?.localPath || '')}::${String(mapping?.remotePath || '')}`;
}

function buildMappingLabel(mapping, direction) {
  if (!mapping) return '';
  if (direction === 'upload') return `${mapping.localPath || 'Unknown local path'} -> ${mapping.remotePath || 'Unknown remote path'}`;
  return `${mapping.remotePath || 'Unknown remote path'} -> ${mapping.localPath || 'Unknown local path'}`;
}

function kindLabel(kind) {
  if (kind === 'upload') return 'upload';
  if (kind === 'download') return 'download';
  return 'shared';
}

function kindArrow(kind) {
  if (kind === 'upload') return '↑';
  if (kind === 'download') return '↓';
  return '↕';
}

function ListingPane({
  title,
  pathValue,
  onPathChange,
  onNavigate,
  rows,
  selectedPath,
  onSelect,
  kind,
}) {
  return (
    <div className="min-h-0 rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="flex items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">{title}</p>
        <ActionButton size="sm" variant="ghost" className="ml-auto" onClick={() => onNavigate(pathValue)}>
          Refresh
        </ActionButton>
      </div>
      <div className="mt-2 flex gap-2">
        <input
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-ink outline-none focus:border-accent/50"
          value={pathValue}
          onChange={(event) => onPathChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') onNavigate(pathValue);
          }}
        />
      </div>
      <div className="mt-3 max-h-[20rem] overflow-y-auto rounded-xl border border-white/8 bg-black/10">
        <div className="divide-y divide-white/6">
          {rows.length ? rows.map((row) => (
            <button
              key={`${kind}-${row.path}`}
              type="button"
              className={[
                'flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition hover:bg-white/8',
                selectedPath === row.path ? 'bg-accent/14' : '',
              ].join(' ')}
              onClick={() => onSelect(row)}
              onDoubleClick={() => {
                if (row.type === 'dir') onNavigate(row.path);
              }}
            >
              <span className="w-5 shrink-0 text-center text-ink/65">{row.type === 'dir' ? '[D]' : '[F]'}</span>
              <span className="min-w-0 flex-1 truncate text-ink">{row.name}</span>
              <span className="shrink-0 text-xs uppercase tracking-[0.12em] text-ink/55">{row.type}</span>
            </button>
          )) : (
            <div className="px-3 py-6 text-sm text-ink/65">No entries.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export function SftpModal({ isOpen, project, onClose, onProjectUpdated, onStatusChange }) {
  const transferAbortControllerRef = useRef(null);
  const [credentials, setCredentials] = useState([]);
  const [selectedCredentialId, setSelectedCredentialId] = useState('');
  const [linkedServerIds, setLinkedServerIds] = useState([]);
  const [mappingGroups, setMappingGroups] = useState(() => normalizeProjectGroups(project));
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedUploadGroupId, setSelectedUploadGroupId] = useState('');
  const [selectedDownloadGroupId, setSelectedDownloadGroupId] = useState('');
  const [localPath, setLocalPath] = useState(project?.path || '.');
  const [remotePath, setRemotePath] = useState('/');
  const [localRows, setLocalRows] = useState([]);
  const [remoteRows, setRemoteRows] = useState([]);
  const [selectedLocal, setSelectedLocal] = useState(null);
  const [selectedRemote, setSelectedRemote] = useState(null);
  const [selectedUploadMappingKey, setSelectedUploadMappingKey] = useState('');
  const [selectedDownloadMappingKey, setSelectedDownloadMappingKey] = useState('');
  const [status, setStatus] = useState('idle');
  const [saveStatus, setSaveStatus] = useState('idle');
  const [runLog, setRunLog] = useState([]);
  const [feedback, setFeedback] = useState({ tone: 'info', message: '' });
  const [transferState, setTransferState] = useState({
    isOpen: false,
    mode: 'upload',
    running: false,
    processed: 0,
    total: 0,
    currentItem: '',
    summary: '',
  });

  useEffect(() => {
    if (!isOpen || !project) return;
    const nextLinkedServerIds = getLinkedServerIds(project);
    setLinkedServerIds(nextLinkedServerIds);
    setSelectedCredentialId(project?.integrations?.sftp?.defaultServerId || project.serverId || nextLinkedServerIds[0] || '');
    const groups = normalizeProjectGroups(project);
    setMappingGroups(groups);
    setSelectedGroupId(groups[0]?.id || '');
    setSelectedUploadGroupId(groups.find((group) => group.kind !== 'download')?.id || groups[0]?.id || '');
    setSelectedDownloadGroupId(groups.find((group) => group.kind !== 'upload')?.id || groups[0]?.id || '');
    setLocalPath(project.path || '.');
    setRemotePath('/');
    setSelectedLocal(null);
    setSelectedRemote(null);
    setSelectedUploadMappingKey('');
    setSelectedDownloadMappingKey('');
    setRunLog([]);
    setFeedback({ tone: 'info', message: '' });
    setTransferState({
      isOpen: false,
      mode: 'upload',
      running: false,
      processed: 0,
      total: 0,
      currentItem: '',
      summary: '',
    });
    transferAbortControllerRef.current = null;
  }, [isOpen, project]);

  function pushFeedback(message, tone = 'info') {
    const nextMessage = String(message || '').trim();
    setFeedback({ tone, message: nextMessage });
    onStatusChange?.(nextMessage);
  }

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    async function loadCredentials() {
      try {
        const payload = await fetchJson('/api/credentials');
        if (!cancelled) setCredentials(Array.isArray(payload) ? payload : []);
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load credentials:', error);
          pushFeedback('Failed to load SFTP credentials.', 'error');
        }
      }
    }

    loadCredentials();
    return () => {
      cancelled = true;
    };
  }, [isOpen, onStatusChange]);

  const selectedGroup = useMemo(
    () => mappingGroups.find((group) => group.id === selectedGroupId) || mappingGroups[0] || null,
    [mappingGroups, selectedGroupId]
  );
  const uploadGroups = useMemo(
    () => mappingGroups.filter((group) => (group.kind === 'upload' || group.kind === 'both') && (!group.serverId || !selectedCredentialId || group.serverId === selectedCredentialId)),
    [mappingGroups, selectedCredentialId]
  );
  const downloadGroups = useMemo(
    () => mappingGroups.filter((group) => (group.kind === 'download' || group.kind === 'both') && (!group.serverId || !selectedCredentialId || group.serverId === selectedCredentialId)),
    [mappingGroups, selectedCredentialId]
  );
  const selectedUploadGroup = useMemo(
    () => uploadGroups.find((group) => group.id === selectedUploadGroupId) || uploadGroups[0] || null,
    [uploadGroups, selectedUploadGroupId]
  );
  const selectedDownloadGroup = useMemo(
    () => downloadGroups.find((group) => group.id === selectedDownloadGroupId) || downloadGroups[0] || null,
    [downloadGroups, selectedDownloadGroupId]
  );
  const uploadMappings = Array.isArray(selectedUploadGroup?.uploadMappings) ? selectedUploadGroup.uploadMappings : [];
  const downloadMappings = Array.isArray(selectedDownloadGroup?.downloadMappings) ? selectedDownloadGroup.downloadMappings : [];

  useEffect(() => {
    const ids = uploadGroups.map((group) => group.id);
    if (!ids.length) {
      if (selectedUploadGroupId) setSelectedUploadGroupId('');
      return;
    }
    if (!selectedUploadGroupId || !ids.includes(selectedUploadGroupId)) {
      setSelectedUploadGroupId(ids[0]);
    }
  }, [uploadGroups, selectedUploadGroupId]);

  useEffect(() => {
    const ids = downloadGroups.map((group) => group.id);
    if (!ids.length) {
      if (selectedDownloadGroupId) setSelectedDownloadGroupId('');
      return;
    }
    if (!selectedDownloadGroupId || !ids.includes(selectedDownloadGroupId)) {
      setSelectedDownloadGroupId(ids[0]);
    }
  }, [downloadGroups, selectedDownloadGroupId]);

  useEffect(() => {
    const options = uploadMappings.map((mapping, index) => buildMappingKey(mapping, index, 'upload'));
    if (!options.length) {
      if (selectedUploadMappingKey) setSelectedUploadMappingKey('');
      return;
    }
    if (!selectedUploadMappingKey || !options.includes(selectedUploadMappingKey)) {
      setSelectedUploadMappingKey(options[0]);
    }
  }, [uploadMappings, selectedUploadMappingKey]);

  useEffect(() => {
    const options = downloadMappings.map((mapping, index) => buildMappingKey(mapping, index, 'download'));
    if (!options.length) {
      if (selectedDownloadMappingKey) setSelectedDownloadMappingKey('');
      return;
    }
    if (!selectedDownloadMappingKey || !options.includes(selectedDownloadMappingKey)) {
      setSelectedDownloadMappingKey(options[0]);
    }
  }, [downloadMappings, selectedDownloadMappingKey]);

  const selectedUploadMapping = useMemo(() => {
    const index = uploadMappings.findIndex((mapping, itemIndex) => buildMappingKey(mapping, itemIndex, 'upload') === selectedUploadMappingKey);
    return index >= 0 ? { mapping: uploadMappings[index], index } : null;
  }, [uploadMappings, selectedUploadMappingKey]);

  const selectedDownloadMapping = useMemo(() => {
    const index = downloadMappings.findIndex((mapping, itemIndex) => buildMappingKey(mapping, itemIndex, 'download') === selectedDownloadMappingKey);
    return index >= 0 ? { mapping: downloadMappings[index], index } : null;
  }, [downloadMappings, selectedDownloadMappingKey]);

  const selectableCredentials = useMemo(() => {
    if (!linkedServerIds.length) return credentials;
    const filtered = credentials.filter((credential) => linkedServerIds.includes(credential.id));
    return filtered.length ? filtered : credentials;
  }, [credentials, linkedServerIds]);

  async function loadLocalListing(nextPath = localPath) {
    setStatus('loading');
    try {
      const payload = await fetchJson(`/api/sftp/local-list?path=${encodeURIComponent(nextPath || '.')}`);
      const rows = [
        ...(Array.isArray(payload?.dirs) ? payload.dirs.map((entry) => ({ ...entry, type: 'dir' })) : []),
        ...(Array.isArray(payload?.files) ? payload.files.map((entry) => ({ ...entry, type: 'file' })) : []),
      ];
      setLocalPath(payload?.path || nextPath || '.');
      setLocalRows(rows);
      setStatus('ready');
    } catch (error) {
      console.error('Failed to load local listing:', error);
      pushFeedback('Failed to load local files.', 'error');
      setStatus('error');
    }
  }

  async function loadRemoteListing(nextPath = remotePath) {
    if (!selectedCredentialId) {
      setRemoteRows([]);
      return;
    }
    setStatus('loading');
    try {
      const payload = await fetchJson(`/api/sftp/list?credId=${encodeURIComponent(selectedCredentialId)}&path=${encodeURIComponent(nextPath || '/')}`);
      setRemotePath(payload?.path || nextPath || '/');
      setRemoteRows(Array.isArray(payload?.entries) ? payload.entries : []);
      setStatus('ready');
    } catch (error) {
      console.error('Failed to load remote listing:', error);
      pushFeedback('Failed to load remote files.', 'error');
      setStatus('error');
    }
  }

  useEffect(() => {
    if (!isOpen || !project) return;
    loadLocalListing(project.path || '.');
  }, [isOpen, project]);

  useEffect(() => {
    if (!isOpen || !selectedCredentialId) return;
    loadRemoteListing('/');
  }, [isOpen, selectedCredentialId]);

  function updateGroupById(groupId, mutator) {
    setMappingGroups((current) => current.map((group) => (
      group.id === String(groupId || '')
        ? { ...group, ...mutator(group) }
        : group
    )));
  }

  function addUploadMapping() {
    if (!selectedUploadGroup?.id) {
      pushFeedback('Select an upload mapping group first.', 'warning');
      return;
    }
    const localSelection = selectedLocal || (localPath ? { path: localPath, type: 'dir' } : null);
    if (!localSelection) {
      pushFeedback('Select a local file or folder first.', 'warning');
      return;
    }
    let nextMapping;
    try {
      nextMapping = buildUploadMappingFromSelection({
        sourceSelection: localSelection,
        targetSelection: selectedRemote,
        currentRemotePath: remotePath || '/',
      });
    } catch (error) {
      pushFeedback(error.message || 'Could not create the upload mapping.', 'warning');
      return;
    }
    updateGroupById(selectedUploadGroup.id, (group) => ({
      kind: group.kind === 'both' ? 'both' : 'upload',
      serverId: group.serverId || selectedCredentialId || '',
      uploadMappings: [
        ...(group.uploadMappings || []).filter((mapping) => !(mapping.localPath === nextMapping.localPath && mapping.remotePath === nextMapping.remotePath)),
        nextMapping,
      ],
    }));
    pushFeedback(`Added upload mapping for ${nextMapping.localPath}.`, 'success');
  }

  function addDownloadMapping() {
    if (!selectedDownloadGroup?.id) {
      pushFeedback('Select a download mapping group first.', 'warning');
      return;
    }
    const remoteSelection = selectedRemote || (remotePath ? { path: remotePath, type: 'dir' } : null);
    if (!remoteSelection) {
      pushFeedback('Select a remote file or folder first.', 'warning');
      return;
    }
    let nextMapping;
    try {
      nextMapping = buildDownloadMappingFromSelection({
        sourceSelection: remoteSelection,
        targetSelection: selectedLocal,
        currentLocalPath: localPath || project?.path || '.',
      });
    } catch (error) {
      pushFeedback(error.message || 'Could not create the download mapping.', 'warning');
      return;
    }
    updateGroupById(selectedDownloadGroup.id, (group) => ({
      kind: group.kind === 'both' ? 'both' : 'download',
      serverId: group.serverId || selectedCredentialId || '',
      downloadMappings: [
        ...(group.downloadMappings || []).filter((mapping) => !(mapping.remotePath === nextMapping.remotePath && mapping.localPath === nextMapping.localPath)),
        nextMapping,
      ],
    }));
    pushFeedback(`Added download mapping for ${nextMapping.remotePath}.`, 'success');
  }

  function removeUploadMapping(index) {
    if (!selectedUploadGroup?.id) return;
    updateGroupById(selectedUploadGroup.id, (group) => ({
      uploadMappings: (group.uploadMappings || []).filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function removeDownloadMapping(index) {
    if (!selectedDownloadGroup?.id) return;
    updateGroupById(selectedDownloadGroup.id, (group) => ({
      downloadMappings: (group.downloadMappings || []).filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  async function saveMappingsAndServer() {
    if (!project?.id) return;
    setSaveStatus('saving');
    try {
      const patch = {
        serverId: selectedCredentialId || null,
        mappingGroups,
        integrations: {
          ...(project?.integrations || {}),
          sftp: {
            ...((project?.integrations && project.integrations.sftp) || {}),
            serverIds: linkedServerIds,
            defaultServerId: selectedCredentialId || '',
          },
        },
      };
      if (typeof onProjectUpdated === 'function') {
        await onProjectUpdated(project.id, patch);
      } else {
        await fetchJson(`/api/projects/${project.id}`, {
          method: 'PUT',
          body: JSON.stringify(patch),
        });
      }
      setSaveStatus('saved');
      pushFeedback('Saved SFTP settings for the project.', 'success');
    } catch (error) {
      console.error('Failed to save SFTP settings:', error);
      setSaveStatus('error');
      pushFeedback('Failed to save SFTP settings.', 'error');
    }
  }

  function appendRunLog(message) {
    setRunLog((current) => [...current, `${new Date().toLocaleTimeString()}  ${message}`]);
  }

  function finishTransferRun(summary, tone = 'info') {
    setTransferState((current) => ({
      ...current,
      running: false,
      currentItem: '',
      summary,
    }));
    transferAbortControllerRef.current = null;
    pushFeedback(summary, tone);
  }

  function cancelTransferRun() {
    if (!transferAbortControllerRef.current) return;
    transferAbortControllerRef.current.abort();
    appendRunLog('Transfer run cancelled by user.');
    finishTransferRun('Transfer run cancelled.', 'warning');
  }

  async function runUploads() {
    if (!selectedCredentialId || !selectedUploadGroup?.uploadMappings?.length) {
      pushFeedback('Add at least one upload mapping and select a server before running uploads.', 'warning');
      return;
    }
    const controller = new AbortController();
    transferAbortControllerRef.current = controller;
    setRunLog([]);
    setTransferState({
      isOpen: true,
      mode: 'upload',
      running: true,
      processed: 0,
      total: selectedUploadGroup.uploadMappings.length,
      currentItem: '',
      summary: '',
    });
    pushFeedback('Upload run started.', 'info');
    appendRunLog('Starting upload run.');
    for (const [index, mapping] of selectedUploadGroup.uploadMappings.entries()) {
      if (controller.signal.aborted) break;
      setTransferState((current) => ({
        ...current,
        currentItem: `${mapping.localPath} -> ${mapping.remotePath}`,
      }));
      appendRunLog(`Uploading ${mapping.localPath} -> ${mapping.remotePath}`);
      try {
        const payload = await fetchJson('/api/sftp/upload', {
          method: 'POST',
          body: JSON.stringify({
            credId: selectedCredentialId,
            localPath: mapping.localPath,
            remotePath: mapping.remotePath,
            overwrite: true,
            askBeforeOverwrite: false,
          }),
          signal: controller.signal,
        });
        appendRunLog(payload?.skipped ? `Skipped ${mapping.remotePath}` : `Done ${mapping.remotePath}`);
        setTransferState((current) => ({
          ...current,
          processed: index + 1,
        }));
      } catch (error) {
        if (controller.signal.aborted || error?.name === 'AbortError') {
          break;
        }
        appendRunLog(`Error ${mapping.remotePath}: ${error.message || 'Upload failed'}`);
        setTransferState((current) => ({
          ...current,
          processed: index + 1,
        }));
      }
    }
    if (!controller.signal.aborted) {
      appendRunLog('Upload run finished.');
      finishTransferRun('Upload run finished.', 'success');
    }
  }

  async function runDownloads() {
    if (!selectedCredentialId || !selectedDownloadGroup?.downloadMappings?.length) {
      pushFeedback('Add at least one download mapping and select a server before running downloads.', 'warning');
      return;
    }
    const controller = new AbortController();
    transferAbortControllerRef.current = controller;
    setRunLog([]);
    setTransferState({
      isOpen: true,
      mode: 'download',
      running: true,
      processed: 0,
      total: selectedDownloadGroup.downloadMappings.length,
      currentItem: '',
      summary: '',
    });
    pushFeedback('Download run started.', 'info');
    appendRunLog('Starting download run.');
    for (const [index, mapping] of selectedDownloadGroup.downloadMappings.entries()) {
      if (controller.signal.aborted) break;
      setTransferState((current) => ({
        ...current,
        currentItem: `${mapping.remotePath} -> ${mapping.localPath}`,
      }));
      appendRunLog(`Downloading ${mapping.remotePath} -> ${mapping.localPath}`);
      try {
        await fetchJson('/api/sftp/download', {
          method: 'POST',
          body: JSON.stringify({
            credId: selectedCredentialId,
            remotePath: mapping.remotePath,
            localPath: mapping.localPath,
          }),
          signal: controller.signal,
        });
        appendRunLog(`Done ${mapping.localPath}`);
        setTransferState((current) => ({
          ...current,
          processed: index + 1,
        }));
      } catch (error) {
        if (controller.signal.aborted || error?.name === 'AbortError') {
          break;
        }
        appendRunLog(`Error ${mapping.remotePath}: ${error.message || 'Download failed'}`);
        setTransferState((current) => ({
          ...current,
          processed: index + 1,
        }));
      }
    }
    if (!controller.signal.aborted) {
      appendRunLog('Download run finished.');
      finishTransferRun('Download run finished.', 'success');
    }
  }

  function addGroup(kind = 'upload') {
    const nextGroup = {
      ...createDefaultGroup(),
      kind,
      name: kind === 'download' ? 'Download Group' : 'Upload Group',
      serverId: selectedCredentialId || '',
    };
    setMappingGroups((current) => [...current, nextGroup]);
    setSelectedGroupId(nextGroup.id);
    if (kind === 'download') setSelectedDownloadGroupId(nextGroup.id);
    else setSelectedUploadGroupId(nextGroup.id);
  }

  function removeGroup() {
    if (!selectedGroup) return;
    const nextGroups = mappingGroups.filter((group) => group.id !== selectedGroup.id);
    const ensured = nextGroups.length ? nextGroups : [createDefaultGroup()];
    setMappingGroups(ensured);
    setSelectedGroupId(ensured[0].id);
  }

  if (!isOpen || !project) return null;

  const transferProgress = transferState.total ? Math.round((transferState.processed / transferState.total) * 100) : 0;
  const feedbackToneClass = {
    success: 'border-emerald-300 bg-emerald-50 text-emerald-950',
    warning: 'border-amber-300 bg-amber-50 text-amber-950',
    error: 'border-rose-300 bg-rose-50 text-rose-950',
    info: 'border-sky-300 bg-sky-50 text-sky-950',
  }[feedback.tone] || 'border-sky-300 bg-sky-50 text-sky-950';

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-slate/80 px-4 py-6 backdrop-blur-md">
      <div className="absolute inset-0" aria-hidden="true" onClick={onClose} />
      <DialogFrame
        eyebrow="SFTP"
        title={`SFTP workspace - ${project.name}`}
        description="Browse local and remote files, map upload/download paths, and run transfers against the selected server."
        className="relative z-[1301] w-full max-w-[min(96vw,1400px)]"
      >
        <div className="space-y-4">
          <div className="grid gap-3 xl:grid-cols-[300px_minmax(0,1fr)]">
            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-3">
              <label className="space-y-2 text-sm text-ink/75">
                <span className="font-medium text-ink">Server</span>
                <select
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-ink outline-none focus:border-accent/50"
                  value={selectedCredentialId}
                  onChange={(event) => setSelectedCredentialId(event.target.value)}
                >
                  <option value="">No server selected</option>
                  {selectableCredentials.map((credential) => (
                    <option key={credential.id} value={credential.id}>
                      {credential.name} ({credential.user}@{credential.host}:{credential.port})
                    </option>
                  ))}
                </select>
              </label>

              <p className="text-xs text-ink/60">
                {linkedServerIds.length
                  ? `This project has ${linkedServerIds.length} linked SFTP server${linkedServerIds.length === 1 ? '' : 's'}.`
                  : 'No linked SFTP servers are stored on this project yet.'}
              </p>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">Mapping Group</p>
                  <div className="flex gap-2">
                    <ActionButton size="sm" variant="ghost" onClick={() => addGroup('upload')}>Add Upload</ActionButton>
                    <ActionButton size="sm" variant="ghost" onClick={() => addGroup('download')}>Add Download</ActionButton>
                    <ActionButton size="sm" variant="ghost" onClick={removeGroup}>Remove</ActionButton>
                  </div>
                </div>
                <select
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-ink outline-none focus:border-accent/50"
                  value={selectedGroupId}
                  onChange={(event) => {
                    const nextId = event.target.value;
                    const nextGroup = mappingGroups.find((group) => group.id === nextId);
                    setSelectedGroupId(nextId);
                    if (nextGroup?.kind === 'upload') setSelectedUploadGroupId(nextId);
                    else if (nextGroup?.kind === 'download') setSelectedDownloadGroupId(nextId);
                    else {
                      setSelectedUploadGroupId(nextId);
                      setSelectedDownloadGroupId(nextId);
                    }
                  }}
                >
                  {mappingGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {`${kindArrow(group.kind)} ${group.name} (${kindLabel(group.kind)})${group.serverId ? ` [server]` : ''}`}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-ink/60">
                  {selectedGroup ? `${kindArrow(selectedGroup.kind)} ${kindLabel(selectedGroup.kind)} mapping group${selectedGroup.serverId ? ' for the selected server' : ''}.` : 'No mapping group selected.'}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <ActionButton size="sm" variant="subtle" onClick={saveMappingsAndServer}>
                  {saveStatus === 'saving' ? 'Saving...' : 'Save SFTP Settings'}
                </ActionButton>
                <ActionButton size="sm" variant="subtle" onClick={runUploads} disabled={!selectedUploadGroup?.uploadMappings?.length}>
                  Run Uploads
                </ActionButton>
                <ActionButton size="sm" variant="subtle" onClick={runDownloads} disabled={!selectedDownloadGroup?.downloadMappings?.length}>
                  Run Downloads
                </ActionButton>
              </div>

              <p className="text-xs text-ink/60">
                {status === 'loading' ? 'Loading listings...' : saveStatus === 'saved' ? 'Saved.' : saveStatus === 'error' ? 'Save failed.' : ' '}
              </p>
              <div className={['rounded-2xl border px-3 py-3 text-sm leading-6', feedbackToneClass].join(' ')}>
                {feedback.message || 'Choose a file or folder, then use Add From Selection to create a mapping with visible feedback.'}
              </div>
            </div>

            <div className="grid min-h-0 gap-4 xl:grid-cols-2">
              <ListingPane
                title="Local Files"
                pathValue={localPath}
                onPathChange={setLocalPath}
                onNavigate={loadLocalListing}
                rows={localRows}
                selectedPath={selectedLocal?.path}
                onSelect={setSelectedLocal}
                kind="local"
              />
              <ListingPane
                title="Remote Files"
                pathValue={remotePath}
                onPathChange={setRemotePath}
                onNavigate={loadRemoteListing}
                rows={remoteRows}
                selectedPath={selectedRemote?.path}
                onSelect={setSelectedRemote}
                kind="remote"
              />
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">Upload Mappings</p>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <select
                    className="min-w-[13rem] rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-ink outline-none focus:border-accent/50"
                    value={selectedUploadGroup?.id || ''}
                    onChange={(event) => {
                      setSelectedUploadGroupId(event.target.value);
                      setSelectedGroupId(event.target.value);
                    }}
                    disabled={!uploadGroups.length}
                  >
                    {!uploadGroups.length ? (
                      <option value="">No upload groups</option>
                    ) : uploadGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {`${kindArrow(group.kind)} ${group.name} (${kindLabel(group.kind)})`}
                      </option>
                    ))}
                  </select>
                  <input
                    className="min-w-[12rem] rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-ink outline-none focus:border-accent/50"
                    value={selectedUploadGroup?.name || ''}
                    placeholder="Rename upload group"
                    onChange={(event) => {
                      const nextId = selectedUploadGroup?.id;
                      if (!nextId) return;
                      updateGroupById(nextId, (group) => ({ ...group, name: event.target.value }));
                    }}
                    disabled={!selectedUploadGroup?.id}
                  />
                  <ActionButton size="sm" variant="ghost" onClick={addUploadMapping} disabled={!selectedLocal && !localPath}>
                    Add From Selection
                  </ActionButton>
                </div>
              </div>
              <p className="text-xs text-ink/60">
                Upload group: {selectedUploadGroup ? `${kindArrow(selectedUploadGroup.kind)} ${kindLabel(selectedUploadGroup.kind)}${selectedUploadGroup.serverId ? ' for selected server' : ''}` : 'None selected'}
              </p>
              <p className="text-xs text-ink/60">
                Selected local: {selectedLocal?.path || localPath || 'None'} | Selected remote base: {(selectedRemote?.type === 'dir' ? selectedRemote.path : remotePath) || '/'}
              </p>
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {(selectedUploadGroup?.uploadMappings || []).length ? selectedUploadGroup.uploadMappings.map((mapping, index) => {
                  const mappingKey = buildMappingKey(mapping, index, 'upload');
                  const isSelected = mappingKey === selectedUploadMappingKey;
                  return (
                  <div
                    key={`upload-${index}`}
                    className={[
                      'rounded-xl border px-3 py-2',
                      isSelected ? 'border-accent/60 bg-accent/12' : 'border-white/8 bg-black/10',
                    ].join(' ')}
                    onClick={() => setSelectedUploadMappingKey(mappingKey)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedUploadMappingKey(mappingKey);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 text-sm text-ink">
                        <p className="truncate">{mapping.localPath}</p>
                        <p className="truncate text-ink/65">-&gt; {mapping.remotePath}</p>
                      </div>
                      <ActionButton size="sm" variant="ghost" onClick={(event) => { event.stopPropagation(); removeUploadMapping(index); }}>Remove</ActionButton>
                    </div>
                  </div>
                ); }) : (
                  <p className="text-sm text-ink/65">No upload mappings yet.</p>
                )}
              </div>
              {selectedUploadMapping?.mapping ? (
                <p className="text-xs leading-5 text-ink/70">
                  Selected mapping: {buildMappingLabel(selectedUploadMapping.mapping, 'upload')}
                </p>
              ) : null}
            </div>

            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">Download Mappings</p>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <select
                    className="min-w-[13rem] rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-ink outline-none focus:border-accent/50"
                    value={selectedDownloadGroup?.id || ''}
                    onChange={(event) => {
                      setSelectedDownloadGroupId(event.target.value);
                      setSelectedGroupId(event.target.value);
                    }}
                    disabled={!downloadGroups.length}
                  >
                    {!downloadGroups.length ? (
                      <option value="">No download groups</option>
                    ) : downloadGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {`${kindArrow(group.kind)} ${group.name} (${kindLabel(group.kind)})`}
                      </option>
                    ))}
                  </select>
                  <input
                    className="min-w-[12rem] rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-ink outline-none focus:border-accent/50"
                    value={selectedDownloadGroup?.name || ''}
                    placeholder="Rename download group"
                    onChange={(event) => {
                      const nextId = selectedDownloadGroup?.id;
                      if (!nextId) return;
                      updateGroupById(nextId, (group) => ({ ...group, name: event.target.value }));
                    }}
                    disabled={!selectedDownloadGroup?.id}
                  />
                  <ActionButton size="sm" variant="ghost" onClick={addDownloadMapping} disabled={!selectedRemote && !remotePath}>
                    Add From Selection
                  </ActionButton>
                </div>
              </div>
              <p className="text-xs text-ink/60">
                Download group: {selectedDownloadGroup ? `${kindArrow(selectedDownloadGroup.kind)} ${kindLabel(selectedDownloadGroup.kind)}${selectedDownloadGroup.serverId ? ' for selected server' : ''}` : 'None selected'}
              </p>
              <p className="text-xs text-ink/60">
                Selected remote: {selectedRemote?.path || remotePath || '/'} | Local base: {localPath || project?.path || '.'}
              </p>
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {(selectedDownloadGroup?.downloadMappings || []).length ? selectedDownloadGroup.downloadMappings.map((mapping, index) => {
                  const mappingKey = buildMappingKey(mapping, index, 'download');
                  const isSelected = mappingKey === selectedDownloadMappingKey;
                  return (
                  <div
                    key={`download-${index}`}
                    className={[
                      'rounded-xl border px-3 py-2',
                      isSelected ? 'border-accent/60 bg-accent/12' : 'border-white/8 bg-black/10',
                    ].join(' ')}
                    onClick={() => setSelectedDownloadMappingKey(mappingKey)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedDownloadMappingKey(mappingKey);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 text-sm text-ink">
                        <p className="truncate">{mapping.remotePath}</p>
                        <p className="truncate text-ink/65">-&gt; {mapping.localPath}</p>
                      </div>
                      <ActionButton size="sm" variant="ghost" onClick={(event) => { event.stopPropagation(); removeDownloadMapping(index); }}>Remove</ActionButton>
                    </div>
                  </div>
                ); }) : (
                  <p className="text-sm text-ink/65">No download mappings yet.</p>
                )}
              </div>
              {selectedDownloadMapping?.mapping ? (
                <p className="text-xs leading-5 text-ink/70">
                  Selected mapping: {buildMappingLabel(selectedDownloadMapping.mapping, 'download')}
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">Transfer Log</p>
            <div className="mt-3 max-h-48 overflow-y-auto rounded-xl border border-white/8 bg-black/15 p-3">
              <pre className="whitespace-pre-wrap break-words text-xs leading-5 text-ink/78">
                {runLog.length ? runLog.join('\n') : 'No transfer activity yet.'}
              </pre>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
            <ActionButton variant="ghost" onClick={onClose}>Close</ActionButton>
          </div>
        </div>
      </DialogFrame>
      {transferState.isOpen ? (
        <div className="absolute inset-0 z-[1302] flex items-center justify-center bg-slate/70 px-4 py-6 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            aria-hidden="true"
            onClick={() => {
              if (!transferState.running) {
                setTransferState((current) => ({ ...current, isOpen: false }));
              }
            }}
          />
          <DialogFrame
            eyebrow={transferState.mode === 'upload' ? 'Upload Progress' : 'Download Progress'}
            title={transferState.mode === 'upload' ? 'Running mapped uploads' : 'Running mapped downloads'}
            description="This dialog stays focused on the current mapping run so you can see progress, skips, and failures as they happen."
            className="relative z-[1303] w-full max-w-[min(92vw,760px)]"
          >
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white">{transferState.currentItem || transferState.summary || 'Preparing run...'}</p>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-100/60">
                    {transferState.processed}/{transferState.total || 0}
                  </p>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-cyan-300 transition-[width]" style={{ width: `${transferProgress}%` }} />
                </div>
                <p className="mt-2 text-xs leading-5 text-sky-100/70">
                  {transferState.running ? `${transferProgress}% complete` : transferState.summary || 'Transfer run complete.'}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">Run Log</p>
                <div className="mt-3 max-h-72 overflow-y-auto rounded-xl border border-white/8 bg-black/15 p-3">
                  <pre className="whitespace-pre-wrap break-words text-xs leading-5 text-ink/78">
                    {runLog.length ? runLog.join('\n') : 'No transfer activity yet.'}
                  </pre>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
                {transferState.running ? (
                  <>
                    <ActionButton variant="ghost" onClick={() => setTransferState((current) => ({ ...current, isOpen: false }))}>
                      Hide
                    </ActionButton>
                    <ActionButton variant="subtle" onClick={cancelTransferRun}>
                      Cancel Run
                    </ActionButton>
                  </>
                ) : null}
                {!transferState.running ? (
                  <ActionButton variant="ghost" onClick={() => setTransferState((current) => ({ ...current, isOpen: false }))}>
                    Close
                  </ActionButton>
                ) : null}
              </div>
            </div>
          </DialogFrame>
        </div>
      ) : null}
    </div>
  );
}
