'use client';

import { ActionButton } from '@/components/ui/action-button';

export function FilePathField({
  id,
  label,
  value,
  onBrowse,
  placeholder,
  help,
  buttonLabel = '...',
  disabled = false,
}) {
  return (
    <label className="space-y-2 text-sm text-ink/75">
      <span className="font-medium text-ink">{label}</span>
      <div className="flex gap-2">
        <input
          id={id}
          className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-slate/60 px-4 py-3 text-ink/80 outline-none"
          value={value || ''}
          readOnly
          placeholder={placeholder}
        />
        <ActionButton variant="ghost" onClick={onBrowse} disabled={disabled} aria-label={`Browse for ${label}`}>
          {buttonLabel}
        </ActionButton>
      </div>
      {help ? <p className="text-xs text-ink/60">{help}</p> : null}
    </label>
  );
}
