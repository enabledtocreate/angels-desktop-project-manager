'use client';

import { useEffect, useMemo, useState } from 'react';
import { ActionButton } from '@/components/ui/action-button';
import { DialogFrame } from '@/components/ui/dialog-frame';
import { fetchJson } from '@/lib/api-client';

function normalizeSelectionMode(value) {
  if (value === 'file' || value === 'either') return value;
  return 'folder';
}

export function FileExplorerModal({
  isOpen,
  title = 'Select path',
  description = 'Browse folders and files, or paste a path directly.',
  initialPath = '',
  includeFiles = false,
  selectionMode = 'folder',
  onClose,
  onSelect,
}) {
  const normalizedSelectionMode = normalizeSelectionMode(selectionMode);
  const [pathValue, setPathValue] = useState(initialPath || '');
  const [listing, setListing] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setPathValue(initialPath || '');
    setSelectedEntry(null);
    setError('');
  }, [initialPath, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    async function loadListing(nextPath) {
      setStatus('loading');
      setError('');
      try {
        const params = new URLSearchParams();
        if (nextPath) params.set('path', nextPath);
        if (includeFiles) params.set('includeFiles', '1');
        const payload = await fetchJson(`/api/fs/browse?${params.toString()}`);
        if (cancelled) return;
        setListing(payload);
        setPathValue(payload?.absolutePath || nextPath || '');
        setStatus('ready');
      } catch (loadError) {
        if (cancelled) return;
        console.error('Failed to browse file system path:', loadError);
        setError(loadError.message || 'Failed to browse path.');
        setStatus('error');
      }
    }

    loadListing(initialPath || '');
    return () => {
      cancelled = true;
    };
  }, [includeFiles, initialPath, isOpen]);

  const canChooseCurrentFolder = normalizedSelectionMode !== 'file';
  const canChooseSelected = useMemo(() => {
    if (!selectedEntry) return false;
    if (normalizedSelectionMode === 'either') return true;
    if (normalizedSelectionMode === 'file') return selectedEntry.type === 'file';
    return selectedEntry.type === 'dir';
  }, [normalizedSelectionMode, selectedEntry]);

  async function browse(nextPath) {
    setStatus('loading');
    setError('');
    try {
      const params = new URLSearchParams();
      if (nextPath) params.set('path', nextPath);
      if (includeFiles) params.set('includeFiles', '1');
      const payload = await fetchJson(`/api/fs/browse?${params.toString()}`);
      setListing(payload);
      setPathValue(payload?.absolutePath || nextPath || '');
      setSelectedEntry(null);
      setStatus('ready');
    } catch (loadError) {
      console.error('Failed to browse file system path:', loadError);
      setError(loadError.message || 'Failed to browse path.');
      setStatus('error');
    }
  }

  function commitSelection(entry) {
    if (!entry) return;
    onSelect?.(entry);
    onClose?.();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1400] flex items-center justify-center bg-slate/80 px-4 py-6 backdrop-blur-md">
      <div className="absolute inset-0" aria-hidden="true" onClick={onClose} />
      <DialogFrame
        eyebrow="File Explorer"
        title={title}
        description={description}
        className="relative z-[1401] w-full max-w-5xl"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <ActionButton
              variant="ghost"
              size="sm"
              onClick={() => browse(listing?.parentPath || listing?.absolutePath || pathValue)}
              disabled={!listing?.parentPath}
            >
              Up
            </ActionButton>
            <ActionButton variant="ghost" size="sm" onClick={() => browse(pathValue)}>
              Refresh
            </ActionButton>
            <input
              id="file-explorer-address"
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-ink outline-none focus:border-accent/50"
              value={pathValue}
              onChange={(event) => setPathValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') browse(pathValue);
              }}
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5">
            <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 border-b border-white/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60">
              <span>Type</span>
              <span>Name</span>
            </div>
            <div className="max-h-[calc(100vh-24rem)] overflow-y-auto">
              {status === 'loading' ? (
                <div className="px-3 py-4 text-sm text-ink/70">Loading path...</div>
              ) : listing?.entries?.length ? (
                listing.entries.map((entry) => (
                  <button
                    key={`${entry.type}-${entry.absolutePath}`}
                    type="button"
                    className={[
                      'grid w-full grid-cols-[72px_minmax(0,1fr)] gap-3 border-b border-white/6 px-3 py-2 text-left text-sm transition hover:bg-white/6',
                      selectedEntry?.absolutePath === entry.absolutePath ? 'bg-accent/14' : '',
                    ].join(' ')}
                    onClick={() => setSelectedEntry(entry)}
                    onDoubleClick={() => {
                      if (entry.type === 'dir') browse(entry.absolutePath);
                      else if (normalizedSelectionMode !== 'folder') commitSelection(entry);
                    }}
                  >
                    <span className="text-ink/60">{entry.type === 'dir' ? '[DIR]' : '[FILE]'}</span>
                    <span className="truncate text-ink">{entry.name}</span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-sm text-ink/70">No entries found.</div>
              )}
            </div>
          </div>

          <div className="space-y-1 text-xs text-ink/65">
            <p>Current path: {listing?.absolutePath || pathValue || 'Unavailable'}</p>
            {selectedEntry ? <p>Selected: {selectedEntry.absolutePath}</p> : null}
            {error ? <p className="text-rose-300">{error}</p> : null}
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-white/10 pt-4">
            {canChooseCurrentFolder ? (
              <ActionButton
                variant="ghost"
                onClick={() => commitSelection({
                  type: 'dir',
                  name: listing?.name || pathValue,
                  path: listing?.path || '',
                  absolutePath: listing?.absolutePath || pathValue,
                  relativePath: listing?.relativePath || '',
                })}
              >
                Use Current Folder
              </ActionButton>
            ) : null}
            <ActionButton variant="ghost" onClick={onClose}>Cancel</ActionButton>
            <ActionButton variant="accent" onClick={() => commitSelection(selectedEntry)} disabled={!canChooseSelected}>
              Select
            </ActionButton>
          </div>
        </div>
      </DialogFrame>
    </div>
  );
}
