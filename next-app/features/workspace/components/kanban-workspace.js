'use client';

import { useMemo } from 'react';
import { ActionButton } from '@/components/ui/action-button';
import { InfoTile } from '@/components/ui/info-tile';
import { SectionShell } from '@/components/ui/section-shell';
import { StatisticsDisclosure } from '@/components/ui/statistics-disclosure';
import { StatusBadge } from '@/components/ui/status-badge';
import { SurfaceCard } from '@/components/ui/surface-card';
import { useWorkItems } from '@/features/workspace/hooks/use-work-items';

const boardColumns = [
  { key: 'todo', label: 'Todo' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'blocked', label: 'Blocked' },
  { key: 'done', label: 'Done' },
];

export function KanbanWorkspace({ project }) {
  const { workItems, status, error, saveStatus, refresh, updateWorkItem } = useWorkItems(project, project.type === 'folder');

  const groupedItems = useMemo(() => {
    const map = new Map(boardColumns.map((column) => [column.key, []]));
    workItems.forEach((item) => {
      const key = map.has(item.status) ? item.status : 'todo';
      map.get(key).push(item);
    });
    return map;
  }, [workItems]);

  if (status === 'loading' || status === 'idle') {
    return <SectionShell eyebrow="Kanban" title="Loading board…" description="Fetching work items for the migrated board view." />;
  }

  if (status === 'error') {
    return <SectionShell eyebrow="Kanban" title="Board load failed" description={error ? error.message : 'Unknown board error'} />;
  }

  return (
    <div className="space-y-6">
      <SectionShell
        eyebrow="Kanban"
        title="Kanban workspace"
        description="This first React board focuses on status grouping and safe status edits through the existing work-item API."
        actions={(
          <>
            <StatusBadge tone="foundation">{workItems.length} cards</StatusBadge>
            <StatusBadge tone="migration">{saveStatus === 'saving' ? 'Saving' : 'Ready'}</StatusBadge>
            <ActionButton variant="subtle" onClick={refresh}>Refresh board</ActionButton>
          </>
        )}
      >
        <StatisticsDisclosure>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {boardColumns.map((column) => (
              <InfoTile key={column.key} eyebrow={column.label} title={`${groupedItems.get(column.key)?.length || 0}`} body="Board grouping is now powered by the unified work-item model." />
            ))}
          </div>
        </StatisticsDisclosure>
      </SectionShell>

      <div className="grid gap-4 xl:grid-cols-4">
        {boardColumns.map((column) => (
          <SectionShell key={column.key} eyebrow="Board Column" title={column.label} description={`Work items currently in ${column.label.toLowerCase()}.`}>
            <div className="space-y-3">
              {(groupedItems.get(column.key) || []).length ? (groupedItems.get(column.key) || []).map((item) => (
                <SurfaceCard key={item.id} className="p-4" tone="muted">
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-sky-100/75">{item.description || 'No description yet.'}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {boardColumns.filter((nextColumn) => nextColumn.key !== column.key).map((nextColumn) => (
                      <ActionButton key={nextColumn.key} size="sm" variant="ghost" onClick={() => updateWorkItem(item.id, { status: nextColumn.key })}>
                        Move to {nextColumn.label}
                      </ActionButton>
                    ))}
                  </div>
                </SurfaceCard>
              )) : (
                <SurfaceCard tone="muted">
                  <p className="text-sm leading-6 text-sky-100/75">No cards in this column yet.</p>
                </SurfaceCard>
              )}
            </div>
          </SectionShell>
        ))}
      </div>
    </div>
  );
}
