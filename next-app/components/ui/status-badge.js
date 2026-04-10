import { cn } from '@/lib/cn';

const tones = {
  foundation: 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100',
  migration: 'border-sky-300/20 bg-sky-400/10 text-sky-100',
  caution: 'border-amber-300/20 bg-amber-400/10 text-amber-100',
};

export function StatusBadge({ children, tone = 'migration', className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]',
        tones[tone] || tones.migration,
        className
      )}
    >
      {children}
    </span>
  );
}
