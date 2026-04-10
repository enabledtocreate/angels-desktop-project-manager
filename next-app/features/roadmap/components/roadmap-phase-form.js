'use client';

import { useEffect, useState } from 'react';
import { ActionButton } from '@/components/ui/action-button';
import { DialogFrame } from '@/components/ui/dialog-frame';

function buildInitialState(phase) {
  return {
    name: phase?.name || '',
    goal: phase?.goal || '',
    summary: phase?.summary || '',
    status: phase?.status || 'planned',
    targetDate: phase?.targetDate || '',
    afterPhaseId: phase?.afterPhaseId || '',
    archived: !!phase?.archived,
  };
}

export function RoadmapPhaseForm({ phase, phases, onCancel, onSave, saveStatus }) {
  const [formState, setFormState] = useState(buildInitialState(phase));

  useEffect(() => {
    setFormState(buildInitialState(phase));
  }, [phase]);

  const availableAfterPhases = phases.filter((item) => item.id !== phase?.id);

  return (
    <DialogFrame
      eyebrow={phase ? 'Edit Phase' : 'Add Phase'}
      title={phase ? `Update ${phase.name}` : 'Create a roadmap phase'}
      description="This is the first migrated roadmap editing flow. It saves directly to the existing backend and refreshes the planner state afterward."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-sky-100/75">
          <span className="font-medium text-white">Name</span>
          <input
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-accent/60"
            value={formState.name}
            onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
          />
        </label>
        <label className="space-y-2 text-sm text-sky-100/75">
          <span className="font-medium text-white">Status</span>
          <select
            className="w-full rounded-xl border border-white/10 bg-slate px-4 py-3 text-white outline-none focus:border-accent/60"
            value={formState.status}
            onChange={(event) => setFormState((current) => ({ ...current, status: event.target.value }))}
          >
            <option value="planned">Planned</option>
            <option value="active">Active</option>
            <option value="done">Done</option>
            <option value="blocked">Blocked</option>
          </select>
        </label>
        <label className="space-y-2 text-sm text-sky-100/75 md:col-span-2">
          <span className="font-medium text-white">Goal</span>
          <textarea
            className="min-h-24 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-accent/60"
            value={formState.goal}
            onChange={(event) => setFormState((current) => ({ ...current, goal: event.target.value }))}
          />
        </label>
        <label className="space-y-2 text-sm text-sky-100/75 md:col-span-2">
          <span className="font-medium text-white">Summary</span>
          <textarea
            className="min-h-24 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-accent/60"
            value={formState.summary}
            onChange={(event) => setFormState((current) => ({ ...current, summary: event.target.value }))}
          />
        </label>
        <label className="space-y-2 text-sm text-sky-100/75">
          <span className="font-medium text-white">Target date</span>
          <input
            type="date"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-accent/60"
            value={formState.targetDate}
            onChange={(event) => setFormState((current) => ({ ...current, targetDate: event.target.value }))}
          />
        </label>
        <label className="space-y-2 text-sm text-sky-100/75">
          <span className="font-medium text-white">Comes after</span>
          <select
            className="w-full rounded-xl border border-white/10 bg-slate px-4 py-3 text-white outline-none focus:border-accent/60"
            value={formState.afterPhaseId}
            onChange={(event) => setFormState((current) => ({ ...current, afterPhaseId: event.target.value }))}
          >
            <option value="">No dependency</option>
            {availableAfterPhases.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-5 flex items-center justify-between">
        <label className="inline-flex items-center gap-3 text-sm text-sky-100/75">
          <input
            type="checkbox"
            checked={formState.archived}
            onChange={(event) => setFormState((current) => ({ ...current, archived: event.target.checked }))}
          />
          Archived
        </label>
        <div className="flex gap-3">
          <ActionButton variant="ghost" onClick={onCancel}>Cancel</ActionButton>
          <ActionButton
            variant="accent"
            onClick={() => onSave(formState)}
            disabled={!formState.name.trim() || saveStatus === 'saving'}
          >
            {saveStatus === 'saving' ? 'Saving…' : phase ? 'Save phase' : 'Add phase'}
          </ActionButton>
        </div>
      </div>
    </DialogFrame>
  );
}
