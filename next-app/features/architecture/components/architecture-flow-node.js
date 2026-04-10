'use client';

import { Handle, Position } from '@xyflow/react';

function toneClass(selected) {
  if (selected) return 'border-accent/70 ring-2 ring-accent/25 bg-cyan-500/10';
  return 'border-white/10 bg-panel/96';
}

export function ArchitectureFlowNode({ data, selected }) {
  const component = data?.component || {};

  return (
    <div className={['min-w-[220px] rounded-[1.15rem] border shadow-panel', toneClass(selected)].join(' ')}>
      <Handle
        type="target"
        position={Position.Left}
        className="!left-[-7px] !h-3 !w-3 !border !border-white/40 !bg-panel"
      />
      <div className="rounded-t-[1.05rem] border-b border-white/10 bg-white/5 px-3 py-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-100/55">
          {component.kind || 'component'}
        </p>
        <h3 className="mt-1 break-words text-sm font-semibold leading-5 text-white">
          {component.title || 'Untitled component'}
        </h3>
      </div>
      <div className="px-3 py-3">
        <p className="text-xs leading-5 text-sky-100/70">
          {component.description || 'No component description yet.'}
        </p>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!right-[-7px] !h-3 !w-3 !border !border-white/40 !bg-panel"
      />
    </div>
  );
}
