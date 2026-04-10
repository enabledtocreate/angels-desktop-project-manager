'use client';

import { useMemo } from 'react';
import { ActionButton } from '@/components/ui/action-button';
import { InfoTile } from '@/components/ui/info-tile';
import { SectionShell } from '@/components/ui/section-shell';
import { StatisticsDisclosure } from '@/components/ui/statistics-disclosure';
import { StatusBadge } from '@/components/ui/status-badge';
import { SurfaceCard } from '@/components/ui/surface-card';
import { useWorkItems } from '@/features/workspace/hooks/use-work-items';

function normalizeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function GanttWorkspace({ project }) {
  const { workItems, status, error, refresh } = useWorkItems(project, project.type === 'folder');

  const scheduledItems = useMemo(() => (
    workItems
      .map((item) => ({
        ...item,
        start: normalizeDate(item.startDate),
        due: normalizeDate(item.dueDate),
        end: normalizeDate(item.endDate),
      }))
      .filter((item) => item.start || item.due || item.end)
      .sort((left, right) => {
        const leftTime = (left.start || left.due || left.end || new Date(8640000000000000)).getTime();
        const rightTime = (right.start || right.due || right.end || new Date(8640000000000000)).getTime();
        return leftTime - rightTime;
      })
  ), [workItems]);

  if (status === 'loading' || status === 'idle') {
    return <SectionShell eyebrow="Gantt" title="Loading timeline…" description="Fetching scheduled work for the migrated timeline view." />;
  }

  if (status === 'error') {
    return <SectionShell eyebrow="Gantt" title="Timeline load failed" description={error ? error.message : 'Unknown gantt error'} />;
  }

  return (
    <div className="space-y-6">
      <SectionShell
        eyebrow="Gantt"
        title="Gantt workspace"
        description="This first React timeline focuses on the date-backed schedule view while we keep richer drag and dependency behaviors on the roadmap for now."
        actions={(
          <>
            <StatusBadge tone="foundation">{scheduledItems.length} scheduled</StatusBadge>
            <StatusBadge tone="migration">Read model</StatusBadge>
            <ActionButton variant="subtle" onClick={refresh}>Refresh timeline</ActionButton>
          </>
        )}
      >
        <StatisticsDisclosure>
          <div className="grid gap-4 md:grid-cols-3">
            <InfoTile eyebrow="Scheduled" title={`${scheduledItems.length}`} body="Items with at least one date field are shown here." />
            <InfoTile eyebrow="Unscheduled" title={`${workItems.length - scheduledItems.length}`} body="These still need planning dates before they can appear on the timeline." />
            <InfoTile eyebrow="Progress" title={`${Math.round(workItems.reduce((sum, item) => sum + Number(item.progress || 0), 0) / Math.max(workItems.length, 1))}%`} body="Average progress across all work items." />
          </div>
        </StatisticsDisclosure>
      </SectionShell>

      <SectionShell eyebrow="Timeline" title="Scheduled work" description="This is a compact timeline list for now, backed by the same work-item model that will power the richer gantt view later.">
        <div className="space-y-3">
          {scheduledItems.length ? scheduledItems.map((item) => (
            <SurfaceCard key={item.id} className="p-4" tone="muted">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-sky-100/75">{item.description || 'No description yet.'}</p>
                </div>
                <div className="text-sm leading-6 text-sky-100/75">
                  <p>Start: {item.start ? item.start.toISOString().slice(0, 10) : '—'}</p>
                  <p>Due: {item.due ? item.due.toISOString().slice(0, 10) : '—'}</p>
                  <p>End: {item.end ? item.end.toISOString().slice(0, 10) : '—'}</p>
                </div>
              </div>
            </SurfaceCard>
          )) : (
            <SurfaceCard tone="muted">
              <p className="text-sm leading-6 text-sky-100/75">No scheduled work items yet. Add dates in Work Items to start shaping the timeline.</p>
            </SurfaceCard>
          )}
        </div>
      </SectionShell>
    </div>
  );
}
