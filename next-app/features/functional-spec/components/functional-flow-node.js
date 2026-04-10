'use client';

import { Handle, Position } from '@xyflow/react';

function styleForType(type, selected) {
  const selectedRing = selected ? 'ring-2 ring-accent/25 border-accent/70' : 'border-white/10';
  if (type === 'start') return `rounded-full bg-emerald-400/18 ${selectedRing}`;
  if (type === 'decision') return `rounded-[1rem] bg-amber-400/12 ${selectedRing}`;
  if (type === 'endpoint') return `rounded-[1rem] bg-cyan-400/12 ${selectedRing}`;
  if (type === 'return') return `rounded-[1rem] border-dashed bg-fuchsia-400/10 ${selectedRing}`;
  return `rounded-[1rem] bg-white/6 ${selectedRing}`;
}

function labelForType(type) {
  if (type === 'start') return 'start';
  if (type === 'decision') return 'decision';
  if (type === 'endpoint') return 'endpoint';
  if (type === 'return') return 'return';
  return 'action';
}

export function FunctionalFlowNode({ data, selected }) {
  const node = data?.node || {};
  const type = String(node.type || 'action').toLowerCase();
  const body = (
    <div className={['min-w-[200px] border shadow-panel', styleForType(type, selected)].join(' ')}>
      <div className="rounded-t-[0.95rem] border-b border-white/10 bg-white/5 px-3 py-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-100/55">{labelForType(type)}</p>
        <h3 className="mt-1 break-words text-sm font-semibold leading-5 text-white">{node.label || 'Untitled node'}</h3>
      </div>
      <div className="px-3 py-3">
        <p className="text-xs leading-5 text-sky-100/70">{node.description || 'No node description yet.'}</p>
        {node.command ? <p className="mt-2 text-[11px] font-mono uppercase tracking-[0.12em] text-sky-100/45">{node.command}</p> : null}
      </div>
    </div>
  );

  return (
    <div className={type === 'decision' ? 'rotate-45' : ''}>
      <Handle type="target" position={Position.Left} className="!left-[-7px] !h-3 !w-3 !border !border-white/40 !bg-panel" />
      <div className={type === 'decision' ? '-rotate-45' : ''}>{body}</div>
      <Handle type="source" position={Position.Right} className="!right-[-7px] !h-3 !w-3 !border !border-white/40 !bg-panel" />
    </div>
  );
}
