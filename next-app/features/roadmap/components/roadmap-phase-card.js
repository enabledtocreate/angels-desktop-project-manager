import { ActionButton } from '@/components/ui/action-button';
import { SurfaceCard } from '@/components/ui/surface-card';

export function RoadmapPhaseCard({ phase, stats, onEdit, onDelete }) {
  return (
    <SurfaceCard className="p-4" tone="muted">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100/60">{phase.status || 'planned'}</p>
          <h4 className="text-lg font-semibold text-white">{phase.name}</h4>
          <p className="text-sm leading-6 text-sky-100/75">{phase.goal || phase.summary || 'No goal defined yet.'}</p>
          <div className="flex flex-wrap gap-3 text-xs text-sky-100/60">
            <span>Target: {phase.targetDate || 'Unscheduled'}</span>
            <span>Tasks: {stats.tasks}</span>
            <span>Features: {stats.features}</span>
            <span>Bugs: {stats.bugs}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <ActionButton size="sm" variant="ghost" onClick={() => onEdit(phase)}>Edit</ActionButton>
          <ActionButton size="sm" variant="subtle" onClick={() => onDelete(phase.id)}>Delete</ActionButton>
        </div>
      </div>
    </SurfaceCard>
  );
}
