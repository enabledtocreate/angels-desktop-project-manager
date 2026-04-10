'use client';

import { Handle, Position } from '@xyflow/react';

function fieldFacts(field) {
  const facts = [];
  if (field.primaryKey) facts.push('PK');
  if (field.unique) facts.push('UK');
  if (!field.nullable) facts.push('NN');
  return facts;
}

function entityToneClass(entity, selected) {
  if (entity.changeState === 'deleted') return 'border-red-400/70 bg-red-500/12 ring-2 ring-red-300/25';
  if (entity.changeState === 'modified') return 'border-orange-400/70 bg-orange-500/10 ring-2 ring-orange-300/20';
  if (entity.changeState === 'added' || entity.status === 'draft') return 'border-emerald-400/70 bg-emerald-500/10 ring-2 ring-emerald-300/20';
  if (entity.driftStatus === 'mismatch') return 'border-amber-300/75 bg-amber-500/10 ring-2 ring-amber-200/25';
  if (entity.driftStatus === 'intended_only') return 'border-sky-300/75 bg-sky-500/10 ring-2 ring-sky-200/25';
  if (entity.driftStatus === 'observed_only') return 'border-fuchsia-300/75 bg-fuchsia-500/10 ring-2 ring-fuchsia-200/25';
  if (selected) return 'border-accent/60 ring-2 ring-accent/25';
  return 'border-white/10';
}

function fieldRowToneClass(field) {
  if (field.changeState === 'deleted') return 'bg-red-500/12';
  if (field.changeState === 'modified') return 'bg-orange-500/10';
  if (field.changeState === 'added' || field.status === 'draft') return 'bg-emerald-500/12';
  if (field.driftStatus === 'mismatch') return 'bg-amber-500/10';
  if (field.driftStatus === 'intended_only') return 'bg-sky-500/10';
  if (field.driftStatus === 'observed_only') return 'bg-fuchsia-500/10';
  return 'hover:bg-white/5';
}

export function SchemaTableNode({ data, selected }) {
  const entity = data.entity;

  return (
    <div className={[
      'min-w-[240px] rounded-[1.15rem] border bg-panel/98 shadow-panel',
      entityToneClass(entity, selected),
    ].join(' ')}>
      <div className="rounded-t-[1.05rem] border-b border-white/10 bg-white/5 px-3 py-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-100/55">{entity.kind || 'table'}</p>
        <div className="mt-1 flex items-center gap-2">
          <h3 className="min-w-0 break-words text-sm font-semibold leading-5 text-white">{entity.name || entity.id}</h3>
          {entity.changeState === 'deleted' ? (
            <span className="rounded-full bg-red-500/18 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-red-100">Delete</span>
          ) : entity.changeState === 'modified' ? (
            <span className="rounded-full bg-orange-400/18 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-orange-100">Changed</span>
          ) : (entity.changeState === 'added' || entity.status === 'draft') ? (
            <span className="rounded-full bg-emerald-400/18 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-emerald-100">New</span>
          ) : entity.driftStatus === 'mismatch' ? (
            <span className="rounded-full bg-amber-400/18 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-amber-100">Drift</span>
          ) : entity.driftStatus === 'intended_only' ? (
            <span className="rounded-full bg-sky-400/18 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-sky-100">Intended</span>
          ) : entity.driftStatus === 'observed_only' ? (
            <span className="rounded-full bg-fuchsia-400/18 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-fuchsia-100">Observed</span>
          ) : null}
        </div>
      </div>
      <div className="space-y-0.5 px-1.5 py-1.5">
        {(entity.fields || []).map((field) => {
          const facts = fieldFacts(field);
          return (
            <div key={field.id} className={`relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg px-2.5 py-1.5 ${fieldRowToneClass(field)}`}>
              <Handle
                type="target"
                id={`target-${field.id}`}
                position={Position.Left}
                className="!left-[-7px] !top-1/2 !h-3 !w-3 !-translate-y-1/2 !border !border-white/40 !bg-panel"
              />
              <div className="min-w-0">
                <p className="break-words text-[13px] font-medium leading-5 text-white">{field.name || field.id}</p>
                {facts.length ? (
                  <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-sky-100/50">{facts.join(' | ')}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-[0.12em] text-sky-100/70">{field.type || 'text'}</span>
              </div>
              <Handle
                type="source"
                id={`source-${field.id}`}
                position={Position.Right}
                className="!right-[-7px] !top-1/2 !h-3 !w-3 !-translate-y-1/2 !border !border-white/40 !bg-panel"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
