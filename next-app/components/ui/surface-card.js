import { cn } from '@/lib/cn';

export function SurfaceCard({ children, className, tone = 'panel' }) {
  const tones = {
    panel: 'border-white/10 bg-panel/80 shadow-panel',
    muted: 'border-white/10 bg-white/5',
  };

  return (
    <article className={cn('min-w-0 break-words rounded-[1.2rem] border p-3', tones[tone] || tones.panel, className)}>
      {children}
    </article>
  );
}
