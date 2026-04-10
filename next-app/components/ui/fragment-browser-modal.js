'use client';

import { useEffect, useMemo, useState } from 'react';
import { ActionButton } from '@/components/ui/action-button';
import { DialogFrame } from '@/components/ui/dialog-frame';
import { SurfaceCard } from '@/components/ui/surface-card';

function compareByCode(left, right) {
  const codeCompare = String(left?.code || left?.id || '').localeCompare(String(right?.code || right?.id || ''), undefined, { numeric: true, sensitivity: 'base' });
  if (codeCompare !== 0) return codeCompare;
  return Number(right?.revision || 1) - Number(left?.revision || 1);
}

function compareArchived(left, right) {
  const rightTime = Date.parse(right?.integratedAt || right?.mergedAt || right?.updatedAt || '') || 0;
  const leftTime = Date.parse(left?.integratedAt || left?.mergedAt || left?.updatedAt || '') || 0;
  return rightTime - leftTime || compareByCode(left, right);
}

function isArchivedFragment(fragment) {
  const status = String(fragment?.status || '').trim().toLowerCase();
  return status === 'archived' || status === 'integrated' || status === 'merged' || Boolean(fragment?.merged);
}

function describeFragment(fragment) {
  return [
    fragment?.status ? `Status: ${fragment.status}` : null,
    fragment?.revision ? `Revision: v${fragment.revision}` : null,
    fragment?.lineageKey ? `Lineage: ${fragment.lineageKey}` : null,
    fragment?.isSuperseded ? `Superseded by ${fragment?.supersededByCode || 'newer revision'}${fragment?.supersededByRevision ? ` v${fragment.supersededByRevision}` : ''}` : null,
    fragment?.supersedesCode ? `Supersedes: ${fragment.supersedesCode}${fragment?.supersedesRevision ? ` v${fragment.supersedesRevision}` : ''}` : null,
    fragment?.sourceScope ? `Source: ${fragment.sourceScope}` : null,
    fragment?.mergedAt ? `Merged: ${new Date(fragment.mergedAt).toLocaleString()}` : null,
    fragment?.integratedAt ? `Integrated: ${new Date(fragment.integratedAt).toLocaleString()}` : null,
    fragment?.fileName || fragment?.mergedFileName ? `File: ${fragment.fileName || fragment.mergedFileName}` : null,
  ].filter(Boolean);
}

export function FragmentBrowserModal({
  title,
  eyebrow,
  isOpen,
  fragments = [],
  onClose,
  onMerge,
  onIntegrate,
  onRefresh,
  storageKey = 'fragments',
}) {
  const [showArchived, setShowArchived] = useState(false);
  const [selectedFragmentId, setSelectedFragmentId] = useState(null);
  const [actionStatus, setActionStatus] = useState('');
  const [seenMap, setSeenMap] = useState({});

  const activeFragments = useMemo(
    () => fragments.filter((fragment) => !isArchivedFragment(fragment)).sort(compareByCode),
    [fragments]
  );
  const archivedFragments = useMemo(
    () => fragments.filter((fragment) => isArchivedFragment(fragment)).sort(compareArchived),
    [fragments]
  );
  const visibleFragments = showArchived ? archivedFragments : activeFragments;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(`apm.fragment-seen.${storageKey}`);
      setSeenMap(raw ? JSON.parse(raw) : {});
    } catch (_) {
      setSeenMap({});
    }
  }, [storageKey]);

  useEffect(() => {
    if (!isOpen) return;
    const nextSelected = visibleFragments[0]?.id || null;
    setSelectedFragmentId((current) => {
      if (current && visibleFragments.some((fragment) => fragment.id === current)) return current;
      return nextSelected;
    });
    setActionStatus('');
  }, [isOpen, visibleFragments]);

  const selectedIndex = visibleFragments.findIndex((fragment) => fragment.id === selectedFragmentId);
  const selectedFragment = selectedIndex >= 0 ? visibleFragments[selectedIndex] : null;

  function fragmentSeenKey(fragment) {
    return String(fragment?.code || fragment?.id || fragment?.fileName || '');
  }

  function isFragmentNew(fragment) {
    const key = fragmentSeenKey(fragment);
    if (!key) return false;
    return !seenMap[key];
  }

  function markFragmentSeen(fragment) {
    const key = fragmentSeenKey(fragment);
    if (!key || typeof window === 'undefined') return;
    const nextSeenMap = {
      ...seenMap,
      [key]: new Date().toISOString(),
    };
    setSeenMap(nextSeenMap);
    try {
      window.localStorage.setItem(`apm.fragment-seen.${storageKey}`, JSON.stringify(nextSeenMap));
    } catch (_) {
      // ignore storage errors
    }
  }

  if (!isOpen) return null;

  async function handleMergeAll() {
    if (!activeFragments.length) return;
    setActionStatus('Processing fragments in order...');
    try {
      for (const fragment of activeFragments) {
        if (onMerge) await onMerge(fragment);
        if (onIntegrate) await onIntegrate(fragment);
      }
      setShowArchived(true);
      setActionStatus(onMerge && onIntegrate ? 'Merged and integrated all fragments in order.' : 'Processed all fragments in order.');
    } catch (error) {
      console.error('Failed to process fragments:', error);
      setActionStatus('Failed while processing fragments.');
    }
  }

  async function handleMergeSelected() {
    if (!selectedFragment || !onMerge) return;
    setActionStatus(`Merging ${selectedFragment.code || selectedFragment.id}...`);
    try {
      await onMerge(selectedFragment);
      setActionStatus(`Merged ${selectedFragment.code || selectedFragment.id}.`);
    } catch (error) {
      console.error('Failed to merge fragment:', error);
      setActionStatus('Failed to merge fragment.');
    }
  }

  async function handleIntegrateSelected() {
    if (!selectedFragment || !onIntegrate) return;
    setActionStatus(`Integrating ${selectedFragment.code || selectedFragment.id}...`);
    try {
      await onIntegrate(selectedFragment);
      setActionStatus(`Integrated ${selectedFragment.code || selectedFragment.id}.`);
    } catch (error) {
      console.error('Failed to integrate fragment:', error);
      setActionStatus('Failed to integrate fragment.');
    }
  }

  async function handleRefresh() {
    if (!onRefresh) return;
    setActionStatus(showArchived ? 'Refreshing archived fragments...' : 'Refreshing fragments...');
    try {
      await onRefresh();
      setActionStatus(showArchived ? 'Archived fragments refreshed.' : 'Fragments refreshed.');
    } catch (error) {
      console.error('Failed to refresh fragments:', error);
      setActionStatus('Failed to refresh fragments.');
    }
  }

  return (
    <div
      id={`fragment-browser-modal-${storageKey}`}
      className="fragment-browser-modal fixed inset-0 z-[1250] flex items-center justify-center bg-slate/80 px-4 py-6 backdrop-blur-md"
    >
      <div className="absolute inset-0" aria-hidden="true" onClick={onClose} />
      <DialogFrame
        eyebrow={eyebrow}
        title={title}
        description="Fragments are ordered so you can process them in sequence. The archive view shows previously merged or integrated fragments."
        className="relative z-[1251] w-full max-w-7xl"
      >
        <div className="fragment-browser-modal-body space-y-4">
          <div className="fragment-browser-modal-header flex flex-col gap-3 border-b border-white/10 pb-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="fragment-browser-modal-actions-left flex flex-wrap gap-2">
              <ActionButton variant="accent" onClick={handleMergeAll} disabled={!activeFragments.length || showArchived}>
                Merge all fragments
              </ActionButton>
              <ActionButton
                variant="ghost"
                onClick={() => setSelectedFragmentId(visibleFragments[Math.max(0, selectedIndex - 1)]?.id || null)}
                disabled={selectedIndex <= 0}
              >
                Previous
              </ActionButton>
              <ActionButton
                variant="ghost"
                onClick={() => setSelectedFragmentId(visibleFragments[Math.min(visibleFragments.length - 1, selectedIndex + 1)]?.id || null)}
                disabled={selectedIndex < 0 || selectedIndex >= visibleFragments.length - 1}
              >
                Next
              </ActionButton>
            </div>
            <div className="fragment-browser-modal-actions-right flex flex-wrap items-center gap-2">
              {onRefresh ? (
                <ActionButton variant="ghost" onClick={handleRefresh}>
                  Refresh
                </ActionButton>
              ) : null}
              <button
                type="button"
                className="text-sm font-medium text-ink/70 transition hover:text-ink"
                onClick={() => setShowArchived((current) => !current)}
              >
                {showArchived ? `Show Active Fragments (${activeFragments.length})` : `Show Archived Fragments (${archivedFragments.length})`}
              </button>
              <ActionButton variant="ghost" onClick={onClose}>Close</ActionButton>
            </div>
          </div>

          <div className="fragment-browser-modal-layout grid min-h-0 gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
            <SurfaceCard id={`${storageKey}-fragment-list`} className="fragment-browser-modal-list max-h-[calc(100vh-20rem)] overflow-y-auto p-3" tone="muted">
              <div className="fragment-browser-modal-list-items space-y-2">
                {visibleFragments.length ? visibleFragments.map((fragment) => (
                  <button
                    key={fragment.id}
                    type="button"
                    id={`${storageKey}-fragment-list-item-${String(fragment.code || fragment.id || 'fragment').replace(/[^a-zA-Z0-9_-]+/g, '-').toLowerCase()}`}
                    className={[
                      'fragment-browser-modal-list-item block w-full rounded-xl px-3 py-2 text-left text-sm transition',
                      selectedFragmentId === fragment.id
                        ? 'bg-accentSoft/80 text-white'
                        : 'bg-transparent text-ink/75 hover:bg-white/8 hover:text-ink',
                    ].join(' ')}
                    onClick={() => setSelectedFragmentId(fragment.id)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate">{fragment.code || fragment.id || 'Fragment'}</span>
                      <div className="flex items-center gap-1">
                        {fragment?.revision ? (
                          <span className="rounded-full bg-white/8 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/70">{`v${fragment.revision}`}</span>
                        ) : null}
                        {fragment?.isSuperseded ? (
                          <span className="rounded-full bg-slate-400/18 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-100">Superseded</span>
                        ) : null}
                        {fragment?.parseWarning ? (
                          <span className="rounded-full bg-rose-400/18 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-rose-100">Malformed</span>
                        ) : null}
                        {isFragmentNew(fragment) ? (
                          <span className="rounded-full bg-amber-400/18 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-100">New</span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                )) : (
                  <p className="px-2 py-1 text-sm text-ink/65">
                    {showArchived ? 'No archived fragments.' : 'No active fragments.'}
                  </p>
                )}
              </div>
            </SurfaceCard>

            <SurfaceCard id={`${storageKey}-fragment-details`} className="fragment-browser-modal-details min-w-0 max-h-[calc(100vh-20rem)] overflow-y-auto p-4">
              {selectedFragment ? (
                <div className="fragment-browser-modal-details-body space-y-4">
                  <div className="fragment-browser-modal-details-header flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/60">
                        {[selectedFragment.code || selectedFragment.id || 'Fragment', selectedFragment.revision ? `v${selectedFragment.revision}` : ''].filter(Boolean).join(' ')}
                      </p>
                      <h3 className="mt-2 break-words text-xl font-semibold text-ink">
                        {selectedFragment.title || 'Untitled fragment'}
                      </h3>
                    </div>
                    <div className="fragment-browser-modal-details-actions flex flex-wrap gap-2">
                      {isFragmentNew(selectedFragment) ? (
                        <ActionButton variant="ghost" onClick={() => markFragmentSeen(selectedFragment)}>
                          Seen
                        </ActionButton>
                      ) : null}
                      <ActionButton variant="subtle" onClick={handleMergeSelected} disabled={!onMerge}>
                        {showArchived ? 'Re-merge' : 'Merge'}
                      </ActionButton>
                      <ActionButton variant="accent" onClick={handleIntegrateSelected} disabled={!onIntegrate}>
                        {showArchived ? 'Re-integrate' : 'Integrate'}
                      </ActionButton>
                    </div>
                  </div>

                  <div className="fragment-browser-modal-metadata flex flex-wrap gap-2">
                    {describeFragment(selectedFragment).map((line) => (
                      <span key={line} className="rounded-full bg-white/8 px-2.5 py-1 text-xs text-ink/70">
                        {line}
                      </span>
                    ))}
                    {selectedFragment.parseWarning ? (
                      <span className="rounded-full bg-rose-400/18 px-2.5 py-1 text-xs text-rose-100">
                        {selectedFragment.parseWarning}
                      </span>
                    ) : null}
                  </div>

                  <div className="fragment-browser-modal-markdown rounded-2xl bg-white/5 p-4">
                    <pre className="overflow-x-auto whitespace-pre-wrap break-words text-sm leading-6 text-ink/80">
                      {selectedFragment.markdown || 'No fragment markdown.'}
                    </pre>
                  </div>
                </div>
              ) : (
                <p className="text-sm leading-6 text-ink/70">Choose a fragment from the list to inspect it.</p>
              )}
            </SurfaceCard>
          </div>

          {actionStatus ? <p className="text-sm text-ink/70">{actionStatus}</p> : null}
        </div>
      </DialogFrame>
    </div>
  );
}
