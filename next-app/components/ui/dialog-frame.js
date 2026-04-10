import { cn } from '@/lib/cn';
import { SurfaceCard } from '@/components/ui/surface-card';

export function DialogFrame({ eyebrow, title, description, children, className }) {
  return (
    <div className={cn('max-h-[calc(100vh-2rem)] overflow-hidden rounded-[1.6rem] border border-white/10 bg-slate/90 p-2 shadow-panel', className)}>
      <SurfaceCard className="flex max-h-[calc(100vh-3rem)] min-h-0 flex-col p-4">
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-100/60">{eyebrow}</p> : null}
        {title ? <h3 className="mt-2 break-words text-xl font-semibold text-white">{title}</h3> : null}
        {description ? <p className="mt-3 break-words text-sm leading-6 text-sky-100/75">{description}</p> : null}
        <div className="mt-4 min-h-0 overflow-y-auto">{children}</div>
      </SurfaceCard>
    </div>
  );
}
