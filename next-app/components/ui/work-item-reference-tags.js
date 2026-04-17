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

function formatList(values) {
  return (Array.isArray(values) ? values : []).map((value) => String(value || '').trim()).filter(Boolean);
}

function ReadableTextBlock({ label, value, empty = 'Not recorded.' }) {
  const text = String(value || '').trim();
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/55">{label}</p>
      <div className="mt-2 max-h-40 overflow-auto rounded-xl bg-slate/30 px-3 py-2">
        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-ink/80">{text || empty}</p>
      </div>
    </div>
  );
}

function MetadataPills({ values = [] }) {
  const entries = formatList(values);
  if (!entries.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {entries.map((value) => (
        <span key={value} className="rounded-full bg-white/8 px-2.5 py-1 text-xs text-ink/75">{value}</span>
      ))}
    </div>
  );
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
            title={selectedItem ? `${selectedRef} - ${selectedItem.title}` : selectedRef}
            description={selectedItem
              ? 'This read-only view summarizes the linked work item attached to the current document entry.'
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
                <SurfaceCard className="space-y-4 p-4" tone="muted">
                  {selectedItem.type === 'feature' ? (
                    <>
                      <ReadableTextBlock label="Summary" value={selectedItem.summary || selectedItem.description} empty="No summary recorded." />
                      {selectedItem.description && selectedItem.description !== selectedItem.summary ? (
                        <ReadableTextBlock label="Description" value={selectedItem.description} empty="No description recorded." />
                      ) : null}
                      {selectedItem.affectedModuleKeys?.length ? (
                        <div>
                          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/55">Affected Modules</p>
                          <MetadataPills values={selectedItem.affectedModuleKeys} />
                        </div>
                      ) : null}
                    </>
                  ) : selectedItem.type === 'bug' ? (
                    <>
                      <ReadableTextBlock label="Current Behavior" value={selectedItem.currentBehavior || selectedItem.summary} empty="No current behavior recorded." />
                      <ReadableTextBlock label="Expected Behavior" value={selectedItem.expectedBehavior} empty="No expected behavior recorded." />
                      {selectedItem.affectedModuleKeys?.length ? (
                        <div>
                          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/55">Affected Modules</p>
                          <MetadataPills values={selectedItem.affectedModuleKeys} />
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
