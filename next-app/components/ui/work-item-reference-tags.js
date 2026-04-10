'use client';

import { useMemo, useState } from 'react';
import { ActionButton } from '@/components/ui/action-button';
import { DialogFrame } from '@/components/ui/dialog-frame';
import { SurfaceCard } from '@/components/ui/surface-card';

function normalizeRefs(sourceRefs) {
  if (Array.isArray(sourceRefs)) {
    return [...new Set(sourceRefs.map((value) => String(value || '').trim()).filter(Boolean))];
  }
  if (typeof sourceRefs === 'string') {
    return [...new Set(sourceRefs.split(',').map((value) => String(value || '').trim()).filter(Boolean))];
  }
  return [];
}

function normalizeLookupCode(code) {
  return String(code || '').trim().toUpperCase();
}

function inferType(ref, item) {
  if (item?.type) return item.type;
  const normalized = normalizeLookupCode(ref);
  if (normalized.startsWith('FEAT-')) return 'feature';
  if (normalized.startsWith('BUG-')) return 'bug';
  return 'work-item';
}

function typeTone(type, available) {
  if (!available) return 'border-white/10 bg-white/5 text-sky-100/70';
  if (type === 'feature') return 'border-emerald-300/30 bg-emerald-400/12 text-emerald-100';
  if (type === 'bug') return 'border-rose-300/30 bg-rose-400/12 text-rose-100';
  return 'border-sky-300/30 bg-sky-400/12 text-sky-100';
}

function titleForItem(ref, item) {
  if (item?.title) return item.title;
  return ref;
}

export function WorkItemReferenceTags({ sourceRefs = [], workItemLookup = {}, className = '' }) {
  const refs = useMemo(() => normalizeRefs(sourceRefs), [sourceRefs]);
  const [selectedRef, setSelectedRef] = useState(null);

  const selectedItem = selectedRef ? workItemLookup[normalizeLookupCode(selectedRef)] || null : null;
  const selectedType = inferType(selectedRef, selectedItem);

  if (!refs.length) return null;

  return (
    <>
      <div className={['space-y-1', className].filter(Boolean).join(' ')}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-100/45">Linked Work Items</p>
        <div className="flex flex-wrap gap-2">
          {refs.map((ref) => {
            const item = workItemLookup[normalizeLookupCode(ref)] || null;
            const refType = inferType(ref, item);
            return (
              <button
                key={ref}
                type="button"
                className={[
                  'rounded-full border px-2.5 py-1 text-[11px] font-medium transition hover:brightness-110',
                  typeTone(refType, Boolean(item)),
                ].join(' ')}
                onClick={() => setSelectedRef(ref)}
                title={item ? `${ref}: ${titleForItem(ref, item)}` : `${ref}: work item not available in the current lookup`}
              >
                {ref}
              </button>
            );
          })}
        </div>
      </div>

      {selectedRef ? (
        <div className="fixed inset-0 z-[1250] flex items-center justify-center bg-slate/80 px-4 py-6 backdrop-blur-md">
          <div className="absolute inset-0" aria-hidden="true" onClick={() => setSelectedRef(null)} />
          <DialogFrame
            eyebrow={selectedType === 'bug' ? 'Bug Reference' : selectedType === 'feature' ? 'Feature Reference' : 'Work Item Reference'}
            title={selectedItem ? `${selectedRef} · ${selectedItem.title}` : selectedRef}
            description={selectedItem
              ? 'This is a read-only view of the linked work item attached to the current document entry.'
              : 'This reference exists on the document item, but the corresponding work item is not available in the current lookup.'}
            className="relative z-[1251] w-full max-w-3xl"
          >
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-white/8 px-2.5 py-1 text-xs text-ink/75">{selectedRef}</span>
                {selectedItem?.status ? (
                  <span className="rounded-full bg-white/8 px-2.5 py-1 text-xs text-ink/75">Status: {selectedItem.status}</span>
                ) : null}
                {selectedItem?.planningBucket ? (
                  <span className="rounded-full bg-white/8 px-2.5 py-1 text-xs text-ink/75">Bucket: {selectedItem.planningBucket}</span>
                ) : null}
                {selectedItem?.category ? (
                  <span className="rounded-full bg-white/8 px-2.5 py-1 text-xs text-ink/75">Category: {selectedItem.category}</span>
                ) : null}
              </div>

              {selectedItem ? (
                <SurfaceCard className="space-y-3 p-4" tone="muted">
                  {selectedItem.type === 'feature' ? (
                    <>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/60">Description</p>
                        <p className="mt-2 text-sm leading-6 text-ink/80">{selectedItem.description || selectedItem.summary || 'No description recorded.'}</p>
                      </div>
                      {selectedItem.affectedModuleKeys?.length ? (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/60">Affected Modules</p>
                          <p className="mt-2 text-sm leading-6 text-ink/80">{selectedItem.affectedModuleKeys.join(', ')}</p>
                        </div>
                      ) : null}
                    </>
                  ) : selectedItem.type === 'bug' ? (
                    <>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/60">Current Behavior</p>
                        <p className="mt-2 text-sm leading-6 text-ink/80">{selectedItem.currentBehavior || selectedItem.summary || 'No current behavior recorded.'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/60">Expected Behavior</p>
                        <p className="mt-2 text-sm leading-6 text-ink/80">{selectedItem.expectedBehavior || 'No expected behavior recorded.'}</p>
                      </div>
                      {selectedItem.affectedModuleKeys?.length ? (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/60">Affected Modules</p>
                          <p className="mt-2 text-sm leading-6 text-ink/80">{selectedItem.affectedModuleKeys.join(', ')}</p>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <p className="text-sm leading-6 text-ink/80">No read-only detail renderer exists yet for this work item type.</p>
                  )}
                </SurfaceCard>
              ) : (
                <SurfaceCard className="p-4" tone="muted">
                  <p className="text-sm leading-6 text-ink/80">APM could not resolve this code to a currently loaded feature or bug. The reference is still preserved on the document item.</p>
                </SurfaceCard>
              )}

              <div className="flex justify-end">
                <ActionButton variant="ghost" onClick={() => setSelectedRef(null)}>Close</ActionButton>
              </div>
            </div>
          </DialogFrame>
        </div>
      ) : null}
    </>
  );
}
