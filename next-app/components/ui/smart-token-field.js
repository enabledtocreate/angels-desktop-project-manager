'use client';

import { useRef, useState } from 'react';

const PREFIX_META = {
  '@': { label: 'Reference', tone: 'border-cyan-300/35 bg-cyan-400/10 text-cyan-100' },
  '#': { label: 'Module / Section', tone: 'border-violet-300/35 bg-violet-400/10 text-violet-100' },
  '$': { label: 'Work Item', tone: 'border-emerald-300/35 bg-emerald-400/10 text-emerald-100' },
  '/': { label: 'Action', tone: 'border-amber-300/35 bg-amber-400/10 text-amber-100' },
  '?': { label: 'Question', tone: 'border-fuchsia-300/35 bg-fuchsia-400/10 text-fuchsia-100' },
  '!': { label: 'Guardrail', tone: 'border-rose-300/35 bg-rose-400/10 text-rose-100' },
};

function normalizeCatalog(catalog) {
  const entries = catalog && typeof catalog === 'object' ? catalog : {};
  return Object.fromEntries(
    Object.keys(PREFIX_META).map((prefix) => {
      const list = Array.isArray(entries[prefix]) ? entries[prefix] : [];
      const seen = new Set();
      return [prefix, list.filter((entry) => {
        const value = String(entry?.value || '').trim();
        if (!value || seen.has(value.toLowerCase())) return false;
        seen.add(value.toLowerCase());
        return true;
      })];
    })
  );
}

function parseSmartTokens(value, catalog) {
  const text = String(value || '');
  const matches = [...text.matchAll(/([@#$/?!])([\w:-]+)/g)];
  return matches.map((match) => {
    const prefix = match[1];
    const rawValue = `${prefix}${match[2]}`;
    const resolved = (catalog[prefix] || []).find((entry) => String(entry?.value || '').toLowerCase() === rawValue.toLowerCase());
    return {
      prefix,
      value: rawValue,
      label: resolved?.label || rawValue,
      detail: resolved?.detail || '',
    };
  });
}

function findActiveToken(value, selectionStart, selectionEnd) {
  if (!Number.isFinite(selectionStart) || !Number.isFinite(selectionEnd) || selectionStart !== selectionEnd) return null;
  const before = String(value || '').slice(0, selectionStart);
  const match = before.match(/(^|[\s([{-])([@#$/?!])([\w:-]*)$/);
  if (!match) return null;
  return {
    prefix: match[2],
    query: match[3] || '',
    start: selectionStart - `${match[2]}${match[3] || ''}`.length,
    end: selectionStart,
  };
}

export function SmartTokenField({
  label,
  help = '',
  value,
  onChange,
  placeholder = '',
  rows = 4,
  multiline = true,
  className = '',
  inputClassName = '',
  catalog = {},
}) {
  const inputRef = useRef(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const normalizedCatalog = normalizeCatalog(catalog);
  const activeToken = findActiveToken(value, selection.start, selection.end);
  const parsedTokens = parseSmartTokens(value, normalizedCatalog);
  const suggestions = activeToken
    ? (normalizedCatalog[activeToken.prefix] || [])
      .filter((entry) => {
        const query = String(activeToken.query || '').trim().toLowerCase();
        if (!query) return true;
        return [entry.value, entry.label, entry.detail].some((part) => String(part || '').toLowerCase().includes(query));
      })
      .slice(0, 8)
    : [];
  const InputTag = multiline ? 'textarea' : 'input';

  function updateSelection(event) {
    setSelection({
      start: Number(event.target.selectionStart || 0),
      end: Number(event.target.selectionEnd || 0),
    });
  }

  function handleInsertSuggestion(entry) {
    if (!activeToken) return;
    const text = String(value || '');
    const nextValue = `${text.slice(0, activeToken.start)}${entry.value}${text.slice(activeToken.end)}`;
    onChange(nextValue);
    const nextCaret = activeToken.start + String(entry.value || '').length;
    requestAnimationFrame(() => {
      if (!inputRef.current) return;
      inputRef.current.focus();
      inputRef.current.setSelectionRange(nextCaret, nextCaret);
      setSelection({ start: nextCaret, end: nextCaret });
    });
  }

  return (
    <label className={['space-y-2 text-sm text-sky-100/75', className].filter(Boolean).join(' ')}>
      <span className="font-medium text-white">{label}</span>
      {help ? <p className="text-sm leading-6 text-sky-100/72">{help}</p> : null}
      <InputTag
        ref={inputRef}
        rows={multiline ? rows : undefined}
        type={multiline ? undefined : 'text'}
        className={[
          multiline ? 'min-h-24' : 'min-h-0',
          'w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-accent/60',
          inputClassName,
        ].filter(Boolean).join(' ')}
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          onChange(event.target.value);
          updateSelection(event);
        }}
        onClick={updateSelection}
        onKeyUp={updateSelection}
        onSelect={updateSelection}
      />
      <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-100/55">Smart Text</p>
        <p className="mt-2 text-xs leading-5 text-sky-100/68">Use @ references, # modules, $ work items, / actions, ? questions, and ! guardrails.</p>
        {suggestions.length ? (
          <div className="mt-3 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-100/55">Suggestions</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((entry) => (
                <button
                  key={entry.value}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleInsertSuggestion(entry)}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-sky-100/80 transition hover:border-cyan-200/45 hover:bg-cyan-200/10 hover:text-white"
                  title={entry.detail || entry.label}
                >
                  {entry.value}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {parsedTokens.length ? (
          <div className="mt-3 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-100/55">Detected Tokens</p>
            <div className="flex flex-wrap gap-2">
              {parsedTokens.map((token, index) => (
                <span
                  key={`${token.value}-${index}`}
                  className={[
                    'rounded-full border px-2.5 py-1 text-[11px] font-medium',
                    PREFIX_META[token.prefix]?.tone || 'border-white/10 bg-white/5 text-sky-100/80',
                  ].join(' ')}
                  title={token.detail || token.label}
                >
                  {token.value}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </label>
  );
}
