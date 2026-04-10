'use client';

import { useMemo, useState } from 'react';
import { ActionButton } from '@/components/ui/action-button';
import { InfoTile } from '@/components/ui/info-tile';
import { SectionShell } from '@/components/ui/section-shell';
import { StatisticsDisclosure } from '@/components/ui/statistics-disclosure';
import { StatusBadge } from '@/components/ui/status-badge';
import { SuggestedValueInput } from '@/components/ui/suggested-value-input';
import { SurfaceCard } from '@/components/ui/surface-card';
import { useWorkItems } from '@/features/workspace/hooks/use-work-items';

function defaultWorkItemForm() {
  return {
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    planningBucket: 'considered',
    category: '',
  };
}

export function WorkItemsWorkspace({ project }) {
  const { workItems, status, error, saveStatus, refresh, createWorkItem, updateWorkItem, deleteWorkItem } = useWorkItems(project, project.type === 'folder');
  const [draft, setDraft] = useState(defaultWorkItemForm());
  const [editingId, setEditingId] = useState(null);

  const groupedCount = useMemo(() => ({
    todo: workItems.filter((item) => item.status === 'todo').length,
    inProgress: workItems.filter((item) => item.status === 'in_progress').length,
    done: workItems.filter((item) => item.status === 'done').length,
  }), [workItems]);
  const categorySuggestions = useMemo(
    () => [...new Set(workItems.map((item) => String(item?.category || '').trim()).filter(Boolean))],
    [workItems]
  );

  async function handleSubmit() {
    if (!draft.title.trim()) return;
    const payload = {
      title: draft.title,
      description: draft.description,
      status: draft.status,
      priority: draft.priority,
      planningBucket: draft.planningBucket,
      category: draft.category || null,
    };
    if (editingId) await updateWorkItem(editingId, payload);
    else await createWorkItem(payload);
    setDraft(defaultWorkItemForm());
    setEditingId(null);
  }

  if (status === 'loading' || status === 'idle') {
    return <SectionShell eyebrow="Work Items" title="Loading work items…" description="Fetching work items from the current backend." />;
  }

  if (status === 'error') {
    return <SectionShell eyebrow="Work Items" title="Work items load failed" description={error ? error.message : 'Unknown work item error'} />;
  }

  return (
    <div className="space-y-6">
      <SectionShell
        eyebrow="Work Items"
        title="Work items workspace"
        description="This migrated core surface uses the unified work-item API, so general tasks and software-derived items can eventually converge here cleanly."
        actions={(
          <>
            <StatusBadge tone="foundation">{workItems.length} items</StatusBadge>
            <StatusBadge tone="migration">{saveStatus === 'saving' ? 'Saving' : 'Ready'}</StatusBadge>
            <ActionButton variant="subtle" onClick={refresh}>Refresh work items</ActionButton>
          </>
        )}
      >
        <StatisticsDisclosure>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoTile eyebrow="Todo" title={`${groupedCount.todo}`} body="Items ready to be picked up." />
            <InfoTile eyebrow="In Progress" title={`${groupedCount.inProgress}`} body="Active work currently moving." />
            <InfoTile eyebrow="Done" title={`${groupedCount.done}`} body="Completed items still available in history." />
            <InfoTile eyebrow="Buckets" title={`${new Set(workItems.map((item) => item.planningBucket || 'considered')).size}`} body="Planning buckets stay attached at the base work-item layer." />
          </div>
        </StatisticsDisclosure>
      </SectionShell>

      <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
        <SectionShell eyebrow="Editor" title={editingId ? 'Edit work item' : 'Add work item'} description="This first pass focuses on the core universal task fields." actions={<ActionButton variant="accent" onClick={handleSubmit} disabled={saveStatus === 'saving'}>{editingId ? 'Save work item' : 'Create work item'}</ActionButton>}>
          <div className="space-y-3">
            <input className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-accent/60" placeholder="Work item title" value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} />
            <textarea className="min-h-28 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-accent/60" placeholder="Description" value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} />
            <div className="grid gap-3 md:grid-cols-2">
              <select className="w-full rounded-xl border border-white/10 bg-slate px-4 py-3 text-white outline-none focus:border-accent/60" value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}>
                <option value="todo">todo</option>
                <option value="in_progress">in_progress</option>
                <option value="done">done</option>
                <option value="blocked">blocked</option>
              </select>
              <select className="w-full rounded-xl border border-white/10 bg-slate px-4 py-3 text-white outline-none focus:border-accent/60" value={draft.priority} onChange={(event) => setDraft((current) => ({ ...current, priority: event.target.value }))}>
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
              </select>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <select className="w-full rounded-xl border border-white/10 bg-slate px-4 py-3 text-white outline-none focus:border-accent/60" value={draft.planningBucket} onChange={(event) => setDraft((current) => ({ ...current, planningBucket: event.target.value }))}>
                <option value="considered">considered</option>
                <option value="planned">planned</option>
                <option value="phase">phase</option>
                <option value="archived">archived</option>
              </select>
              <SuggestedValueInput
                label="Category"
                value={draft.category}
                onChange={(value) => setDraft((current) => ({ ...current, category: value }))}
                suggestions={categorySuggestions}
                placeholder="Category"
                help="Choose an existing category or type a new one."
                inputClassName="rounded-xl"
              />
            </div>
            {editingId ? <ActionButton variant="ghost" onClick={() => { setEditingId(null); setDraft(defaultWorkItemForm()); }}>Cancel editing</ActionButton> : null}
          </div>
        </SectionShell>

        <SectionShell eyebrow="Work Item List" title="Unified work items" description="This list comes from the current backend work-item read model, so it already includes the task-backed foundation.">
          <div className="space-y-3">
            {workItems.length ? workItems.map((item) => (
              <SurfaceCard key={item.id} className="p-4" tone="muted">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{item.code || item.id}</p>
                    <h3 className="mt-1 text-lg font-semibold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-sky-100/75">{item.description || 'No description yet.'}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.16em] text-sky-100/55">{(item.workItemType || 'core_task').replace(/_/g, ' ')} • {item.status || 'todo'} • {item.priority || 'medium'}</p>
                  </div>
                  <div className="flex gap-2">
                    <ActionButton size="sm" variant="ghost" onClick={() => {
                      setEditingId(item.id);
                      setDraft({
                        title: item.title || '',
                        description: item.description || '',
                        status: item.status || 'todo',
                        priority: item.priority || 'medium',
                        planningBucket: item.planningBucket || 'considered',
                        category: item.category || '',
                      });
                    }}>Edit</ActionButton>
                    <ActionButton size="sm" variant="subtle" onClick={() => deleteWorkItem(item.id)}>Delete</ActionButton>
                  </div>
                </div>
              </SurfaceCard>
            )) : (
              <SurfaceCard tone="muted">
                <p className="text-sm leading-6 text-sky-100/75">No work items yet. Add the first item from the editor.</p>
              </SurfaceCard>
            )}
          </div>
        </SectionShell>
      </div>
    </div>
  );
}
