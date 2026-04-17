'use client';

import { useMemo } from 'react';
import { Background, Controls, MarkerType, MiniMap, ReactFlow } from '@xyflow/react';
import { FunctionalFlowNode } from '@/features/functional-spec/components/functional-flow-node';
import { defaultNodePosition, edgeStroke, edgeTypeLabel } from '@/features/functional-spec/components/flowchart/flowchart-renderer-utils';

const NODE_TYPES = { functionalFlowNode: FunctionalFlowNode };

export function ReactFlowchartImplementation({
  nodes,
  edges,
  selectedNodeId,
  selectedEdgeId,
  onSelectNode,
  onSelectEdge,
  onMoveNode,
  onResizeNode,
  onConnectNodes,
}) {
  const canvasNodes = useMemo(() => (Array.isArray(nodes) ? nodes : []).map((node, index) => ({
    id: node.id,
    type: 'functionalFlowNode',
    position: node.position || defaultNodePosition(index),
    data: { node, onResize: onResizeNode },
    selected: node.id === selectedNodeId,
    draggable: true,
  })), [nodes, selectedNodeId, onResizeNode]);

  const canvasEdges = useMemo(() => (Array.isArray(edges) ? edges : []).map((edge) => {
    const selected = edge.id === selectedEdgeId;
    const stroke = edgeStroke(edge.type, selected);
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label || edgeTypeLabel(edge.type),
      labelStyle: { fill: 'rgb(var(--color-ink))', fontWeight: 700, fontSize: 12 },
      labelBgStyle: { fill: 'rgba(255,255,255,0.92)', fillOpacity: 0.96 },
      labelBgPadding: [6, 4],
      labelBgBorderRadius: 999,
      type: 'step',
      markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, color: stroke },
      style: { strokeWidth: selected ? 2.6 : 1.9, stroke },
      hidden: Boolean(edge.hidden),
      selected,
    };
  }), [edges, selectedEdgeId]);

  return (
    <div className="h-[34rem] rounded-[1.4rem] border border-white/10 bg-slate/40">
      <ReactFlow
        nodes={canvasNodes}
        edges={canvasEdges}
        nodeTypes={NODE_TYPES}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.35}
        onlyRenderVisibleElements
        nodesDraggable
        nodesConnectable
        elementsSelectable
        onNodeClick={(_, node) => onSelectNode?.(node.id)}
        onEdgeClick={(_, edge) => onSelectEdge?.(edge.id)}
        onPaneClick={() => { onSelectNode?.(null); onSelectEdge?.(null); }}
        onNodeDrag={(_, node) => onMoveNode?.(node.id, { x: node.position.x, y: node.position.y })}
        onNodeDragStop={(_, node) => onMoveNode?.(node.id, { x: node.position.x, y: node.position.y })}
        onConnect={(params) => onConnectNodes?.(params)}
      >
        <MiniMap pannable zoomable />
        <Background gap={20} size={1} color="rgba(148, 163, 184, 0.16)" />
        <Controls showInteractive={false} position="bottom-right" />
      </ReactFlow>
    </div>
  );
}
