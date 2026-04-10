'use client';

function buildListId(label, explicitId) {
  if (explicitId) return explicitId;
  return `suggested-value-${String(label || 'field').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

export function SuggestedValueInput({
  label,
  value,
  onChange,
  suggestions = [],
  placeholder = '',
  help = '',
  className = '',
  inputClassName = '',
  listId,
}) {
  const resolvedListId = buildListId(label, listId);
  const normalizedSuggestions = [...new Set((Array.isArray(suggestions) ? suggestions : []).map((item) => String(item || '').trim()).filter(Boolean))];

  return (
    <label className={['space-y-2 text-sm text-ink/75', className].filter(Boolean).join(' ')}>
      <span className="font-medium text-ink">{label}</span>
      {help ? <p className="text-xs leading-5 text-ink/60">{help}</p> : null}
      <input
        list={resolvedListId}
        className={[
          'w-full rounded-2xl border border-white/10 bg-slate px-4 py-3 text-ink outline-none focus:border-accent/60',
          inputClassName,
        ].filter(Boolean).join(' ')}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      <datalist id={resolvedListId}>
        {normalizedSuggestions.map((suggestion) => (
          <option key={suggestion} value={suggestion} />
        ))}
      </datalist>
    </label>
  );
}
