import { SurfaceCard } from '@/components/ui/surface-card';

export function InfoTile({ eyebrow, title, body }) {
  return (
    <SurfaceCard className="p-4" tone="muted">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100/60">{eyebrow}</p>
      <h3 className="mt-2 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-sky-100/75">{body}</p>
    </SurfaceCard>
  );
}
