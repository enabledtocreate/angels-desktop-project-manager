'use client';

import { Handle, NodeResizer, Position } from '@xyflow/react';
import { visualForType, WorkflowNodeIcon } from '@/features/functional-spec/components/flowchart/workflow-node-visuals';

export function FunctionalFlowNode({ data, selected }) {
  const node = data?.node || {};
  const type = String(node.type || 'action').toLowerCase();
  const visual = visualForType(type);
  const width = Number.isFinite(Number(node.width)) ? Math.max(Number(node.width), 190) : 230;
  const height = Number.isFinite(Number(node.height)) ? Math.max(Number(node.height), 130) : undefined;
  const selectedRing = selected ? 'ring-2 ring-accent/30 border-accent/70' : '';

  return (
    <div style={{ width, minHeight: height }} className="relative">
      <NodeResizer
        isVisible={selected}
        minWidth={190}
        minHeight={120}
        lineClassName="!border-accent/70"
        handleClassName="!h-2.5 !w-2.5 !border !border-accent/80 !bg-panel"
        onResizeEnd={(_, params) => data?.onResize?.(node.id, { width: params.width, height: params.height })}
      />
      <Handle type="target" position={Position.Left} className="!left-[-7px] !h-3 !w-3 !border !border-white/50 !bg-panel" />
      <Handle type="source" position={Position.Right} className="!right-[-7px] !h-3 !w-3 !border !border-white/50 !bg-panel" />
      <div className={['h-full min-h-[120px] overflow-hidden border shadow-panel', visual.className, selectedRing].filter(Boolean).join(' ')}>
        <div className="flex items-start gap-2 border-b border-white/10 bg-white/10 px-3 py-2.5">
          <span className="mt-0.5 rounded-xl border border-white/10 bg-black/10 p-1.5">
            <WorkflowNodeIcon type={type} />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-60">{visual.label}</p>
            <h3 className="mt-1 break-words text-sm font-semibold leading-5 text-white">{node.label || 'Untitled node'}</h3>
          </div>
        </div>
        <div className="px-3 py-3">
          <p className="max-h-24 overflow-auto text-xs leading-5 text-sky-50/76">{node.description || 'No node description yet.'}</p>
          {node.command ? <p className="mt-2 break-words text-[11px] font-mono uppercase tracking-[0.12em] text-sky-50/48">{node.command}</p> : null}
          <p className="apm-stable-id mt-2 truncate text-[10px] font-mono text-sky-50/35">{node.stableId || 'pending-save'}</p>
        </div>
      </div>
    </div>
  );
}
