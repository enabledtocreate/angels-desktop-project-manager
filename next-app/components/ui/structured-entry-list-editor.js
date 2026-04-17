'use client';

import { useEffect, useState } from 'react';
import { WorkItemReferenceTags } from '@/components/ui/work-item-reference-tags';

function createDraft(primaryKey, secondaryKey) {
  return {
    [primaryKey]: '',
    ...(secondaryKey ? { [secondaryKey]: '' } : {}),
  };
}

export function StructuredEntryListEditor({
  label,
  help,
  entries = [],
  onChange,
  workItemLookup = {},
  primaryKey = 'title',
  primaryLabel = 'Title',
  primaryPlaceholder = '',
  secondaryKey = 'description',
  secondaryLabel = 'Description',
  secondaryPlaceholder = '',
  requireSecondary = true,
  emptyLabel = 'No entries yet.',
}) {
  const [draft, setDraft] = useState(() => createDraft(primaryKey, secondaryKey));
  const normalizedEntries = Array.isArray(entries) ? entries : [];

  useEffect(() => {
    setDraft(createDraft(primaryKey, secondaryKey));
  }, [primaryKey, secondaryKey]);

  const canAdd = String(draft[primaryKey] || '').trim()
    && (!secondaryKey || !requireSecondary || String(draft[secondaryKey] || '').trim());

  function updateEntry(entryId, entryIndex, updates) {
    onChange(normalizedEntries.map((entry, index) => (
      ((entry.id && entry.id === entryId) || index === entryIndex)
        ? { ...entry, ...updates, id: entry.id || entryId, versionDate: new Date().toISOString() }
        : entry
    )));
  }

  function addEntry() {
    if (!canAdd) return;
    onChange([
      ...normalizedEntries,
      {
        id: `${primaryKey}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        [primaryKey]: String(draft[primaryKey] || '').trim(),
        ...(secondaryKey ? { [secondaryKey]: String(draft[secondaryKey] || '').trim() } : {}),
        versionDate: new Date().toISOString(),
      },
    ]);
    setDraft(createDraft(primaryKey, secondaryKey));
  }

  function removeEntry(entryId, entryIndex) {
    onChange(normalizedEntries.filter((entry, index) => !((entry.id && entry.id === entryId) || index === entryIndex)));
  }

  function moveEntry(entryId, entryIndex, direction) {
    const currentEntries = [...normalizedEntries];
    const index = currentEntries.findIndex((entry, currentIndex) => ((entry.id && entry.id === entryId) || currentIndex === entryIndex));
    if (index < 0) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentEntries.length) return;
    const [entry] = currentEntries.splice(index, 1);
    currentEntries.splice(targetIndex, 0, entry);
    onChange(currentEntries);
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-medium text-white">{label}</p>
        {help ? <p className="text-xs leading-5 text-sky-100/55">{help}</p> : null}
      </div>

      <div className="rounded-2xl border border-accent/35 bg-accent/10 p-3">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto_auto]">
          <input
            className="w-full rounded-xl border border-accent/35 bg-white/5 px-3 py-2 text-white outline-none focus:border-accent"
            placeholder={primaryPlaceholder || primaryLabel}
            value={draft[primaryKey]}
            onChange={(event) => setDraft((current) => ({ ...current, [primaryKey]: event.target.value }))}
          />
          {secondaryKey ? (
            <input
              className="w-full rounded-xl border border-accent/35 bg-white/5 px-3 py-2 text-white outline-none focus:border-accent"
              placeholder={secondaryPlaceholder || secondaryLabel}
              value={draft[secondaryKey]}
              onChange={(event) => setDraft((current) => ({ ...current, [secondaryKey]: event.target.value }))}
            />
          ) : null}
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-200/60 bg-emerald-400/20 text-lg font-semibold text-emerald-50 transition hover:bg-emerald-400/30 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={addEntry}
            disabled={!canAdd}
            aria-label={`Add ${label}`}
          >
            +
          </button>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-rose-200/60 bg-rose-400/18 text-lg font-semibold text-rose-50 transition hover:bg-rose-400/28"
            onClick={() => setDraft(createDraft(primaryKey, secondaryKey))}
            aria-label={`Clear ${label} draft`}
          >
            ×
          </button>
        </div>
      </div>

      {normalizedEntries.length ? (
        <div className="space-y-3">
          {normalizedEntries.map((entry, index) => {
            const entryId = entry.id || `${label}-${index}`;
            return (
            <div key={entryId} className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto]">
                <input
                  className="w-full rounded-xl border border-white/10 bg-slate px-3 py-2 text-white outline-none focus:border-accent/60"
                  value={entry[primaryKey] || ''}
                  onChange={(event) => updateEntry(entryId, index, { [primaryKey]: event.target.value })}
                  placeholder={primaryLabel}
                />
                {secondaryKey ? (
                  <input
                    className="w-full rounded-xl border border-white/10 bg-slate px-3 py-2 text-white outline-none focus:border-accent/60"
                    value={entry[secondaryKey] || ''}
                    onChange={(event) => updateEntry(entryId, index, { [secondaryKey]: event.target.value })}
                    placeholder={secondaryLabel}
                  />
                ) : null}
                <div className="flex items-start gap-2">
                  <button
                    type="button"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-sm font-semibold text-white transition hover:bg-white/15 disabled:opacity-35"
                    onClick={() => moveEntry(entryId, index, 'up')}
                    disabled={index === 0}
                    aria-label={`Move ${label} item up`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-sm font-semibold text-white transition hover:bg-white/15 disabled:opacity-35"
                    onClick={() => moveEntry(entryId, index, 'down')}
                    disabled={index === normalizedEntries.length - 1}
                    aria-label={`Move ${label} item down`}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-rose-200/60 bg-rose-400/20 text-sm font-semibold text-rose-50 shadow-[0_0_0_1px_rgba(253,164,175,0.12)] transition hover:bg-rose-400/30"
                    onClick={() => removeEntry(entryId, index)}
                    aria-label={`Delete ${label} item`}
                  >
                    🗑
                  </button>
                </div>
              </div>
              <div className="mt-2 space-y-1">
                <p className="apm-stable-id text-[11px] font-mono text-sky-100/45">
                  ID: {entry.stableId || 'pending-save'}
                </p>
                {entry.versionDate ? (
                  <p className="text-xs text-sky-100/55">Updated {String(entry.versionDate).slice(0, 10)}</p>
                ) : null}
                <WorkItemReferenceTags sourceRefs={entry.sourceRefs} workItemLookup={workItemLookup} />
              </div>
            </div>
          )})}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-3 py-4 text-sm text-sky-100/60">
          {emptyLabel}
        </div>
      )}
    </div>
  );
}
