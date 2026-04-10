'use client';

import { useState } from 'react';
import { SurfaceCard } from '@/components/ui/surface-card';

export function AiInstructionsPanel({ title = 'AI Instructions', instructions = [], defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const normalized = (Array.isArray(instructions) ? instructions : [])
    .map((instruction) => String(instruction || '').trim())
    .filter(Boolean);

  if (!normalized.length) return null;

  return (
    <SurfaceCard className="p-3" tone="muted">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">AI Readable</p>
          <h3 className="mt-1 text-sm font-semibold text-ink">{title}</h3>
        </div>
        <button
          type="button"
          className="text-sm font-medium text-ink/70 transition hover:text-ink"
          onClick={() => setIsOpen((current) => !current)}
        >
          {isOpen ? 'Hide' : 'Show'}
        </button>
      </div>
      {isOpen ? (
        <div className="mt-3 rounded-xl bg-white/5 p-3">
          <pre className="whitespace-pre-wrap break-words text-sm leading-6 text-ink/78">
            {normalized.map((instruction) => `- ${instruction}`).join('\n')}
          </pre>
        </div>
      ) : null}
    </SurfaceCard>
  );
}
