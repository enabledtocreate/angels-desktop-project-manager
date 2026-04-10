import { ActionButton } from '@/components/ui/action-button';
import { SurfaceCard } from '@/components/ui/surface-card';

export function NavSection({ label, items }) {
  return (
    <SurfaceCard className="p-4" tone="panel">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-sky-100/60">{label}</p>
      <div className="space-y-2">
        {items.map((item) => (
          <ActionButton key={item} className="w-full text-left" variant="ghost">
            {item}
          </ActionButton>
        ))}
      </div>
    </SurfaceCard>
  );
}
