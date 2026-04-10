'use client';

import { useMemo, useState } from 'react';
import { ActionButton } from '@/components/ui/action-button';

export function TagEditor({
  label,
  values = [],
  onChange,
  suggestions = [],
  placeholder = 'Add a tag',
  help = '',
}) {
  const [draft, setDraft] = useState('');
  const normalizedValues = useMemo(
    () => [...new Set((Array.isArray(values) ? values : []).map((value) => String(value || '').trim()).filter(Boolean))],
    [values]
  );
  const availableSuggestions = useMemo(
    () => [...new Set((Array.isArray(suggestions) ? suggestions : []).map((value) => String(value || '').trim()).filter(Boolean))]
      .filter((suggestion) => !normalizedValues.includes(suggestion)),
    [normalizedValues, suggestions]
  );

  function commitValue(nextValue) {
    const normalized = String(nextValue || '').trim();
    if (!normalized || normalizedValues.includes(normalized)) return;
    onChange([...normalizedValues, normalized]);
    setDraft('');
  }

  function removeValue(valueToRemove) {
    onChange(normalizedValues.filter((value) => value !== valueToRemove));
  }

  return (
    <div className="space-y-2 text-sm text-ink/75">
      <span className="font-medium text-ink">{label}</span>
      {help ? <p className="text-xs leading-5 text-ink/60">{help}</p> : null}
      <div className="flex flex-wrap gap-2">
        {normalizedValues.length ? normalizedValues.map((value) => (
          <span key={value} className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-medium text-ink">
            {value}
            <button
              type="button"
              className="text-ink/60 transition hover:text-ink"
              onClick={() => removeValue(value)}
              aria-label={`Remove ${value}`}
            >
              x
            </button>
          </span>
        )) : (
          <span className="text-xs text-ink/55">No tags yet.</span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          list={`tag-editor-${String(label || 'tags').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
          className="min-w-[12rem] flex-1 rounded-2xl border border-white/10 bg-slate px-4 py-3 text-ink outline-none focus:border-accent/60"
          value={draft}
          placeholder={placeholder}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commitValue(draft);
            }
          }}
        />
        <ActionButton variant="subtle" size="sm" onClick={() => commitValue(draft)}>Add tag</ActionButton>
      </div>
      <datalist id={`tag-editor-${String(label || 'tags').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
        {availableSuggestions.map((suggestion) => (
          <option key={suggestion} value={suggestion} />
        ))}
      </datalist>
      {availableSuggestions.length ? (
        <div className="flex flex-wrap gap-2">
          {availableSuggestions.slice(0, 10).map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-ink/70 transition hover:border-accent/30 hover:text-ink"
              onClick={() => commitValue(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
