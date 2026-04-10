import { cn } from '@/lib/cn';

export function SectionShell({ eyebrow, title, description, actions, children, className, ...props }) {
  return (
    <section
      className={cn('min-w-0 space-y-3 rounded-[1.35rem] border border-white/10 bg-panel/80 p-3 shadow-panel', className)}
      {...props}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100/60">{eyebrow}</p>
          ) : null}
          {title ? <h2 className="break-words text-[1.55rem] font-semibold tracking-tight text-white">{title}</h2> : null}
          {description ? <p className="max-w-3xl break-words text-sm leading-6 text-sky-100/80">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
