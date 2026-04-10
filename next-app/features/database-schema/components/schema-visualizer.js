'use client';

import { useEffect, useMemo, useState } from 'react';
import { Background, Controls, MarkerType, ReactFlow } from '@xyflow/react';
import { SchemaTableNode } from '@/features/database-schema/components/schema-table-node';

const nodeTypes = {
  schemaTable: SchemaTableNode,
};

function defaultPosition(index) {
  const column = index % 3;
  const row = Math.floor(index / 3);
  return {
    x: column * 340,
    y: row * 280,
  };
}

function cardinalityLabel(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'one-to-one') return '1 : 1';
  if (normalized === 'many-to-many') return '* : *';
  if (normalized === 'many-to-one') return '* : 1';
  return '1 : *';
}

function relationshipStroke(relationship, selected) {
  if (relationship.changeState === 'deleted') return 'rgba(248, 113, 113, 0.95)';
  if (relationship.changeState === 'modified') return 'rgba(251, 146, 60, 0.95)';
  if (relationship.changeState === 'added' || relationship.status === 'draft') return 'rgba(52, 211, 153, 0.95)';
  if (relationship.driftStatus === 'mismatch') return 'rgba(245, 158, 11, 0.95)';
  if (relationship.driftStatus === 'intended_only') return 'rgba(56, 189, 248, 0.95)';
  if (relationship.driftStatus === 'observed_only') return 'rgba(232, 121, 249, 0.95)';
  if (selected) return 'rgba(34, 211, 238, 0.95)';
  return undefined;
}

export function SchemaVisualizer({
  entities = [],
  relationships = [],
  selectedEntityId = null,
  selectedRelationshipId = null,
  onSelectEntity,
  onSelectRelationship,
  onNodePositionChange,
}) {
  const [positions, setPositions] = useState({});

  useEffect(() => {
    setPositions((current) => {
      const next = { ...current };
      entities.forEach((entity, index) => {
        if (!next[entity.id]) {
          next[entity.id] = entity.position || defaultPosition(index);
        }
      });
      Object.keys(next).forEach((entityId) => {
        if (!entities.some((entity) => entity.id === entityId)) {
          delete next[entityId];
        }
      });
      return next;
    });
  }, [entities]);

  const nodes = useMemo(
    () => entities.map((entity, index) => ({
      id: entity.id,
      type: 'schemaTable',
      position: positions[entity.id] || entity.position || defaultPosition(index),
      data: { entity },
      selected: entity.id === selectedEntityId,
    })),
    [entities, positions, selectedEntityId]
  );

  const edges = useMemo(
    () => relationships
      .filter((relationship) => relationship.fromEntityId && relationship.toEntityId)
      .map((relationship) => ({
        id: relationship.id,
        source: relationship.fromEntityId,
        target: relationship.toEntityId,
        sourceHandle: relationship.fromFieldId ? `source-${relationship.fromFieldId}` : null,
        targetHandle: relationship.toFieldId ? `target-${relationship.toFieldId}` : null,
        label: cardinalityLabel(relationship.cardinality),
        labelStyle: { fill: 'rgb(var(--color-ink))', fontWeight: 700, fontSize: 12 },
        labelBgStyle: { fill: 'rgba(255,255,255,0.92)', fillOpacity: 0.96 },
        labelBgPadding: [6, 4],
        labelBgBorderRadius: 999,
        type: 'step',
        markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
        style: {
          strokeWidth:
            relationship.changeState === 'deleted'
            || relationship.changeState === 'modified'
            || relationship.changeState === 'added'
            || relationship.status === 'draft'
            || (relationship.driftStatus && relationship.driftStatus !== 'in_sync')
              ? 2.2
              : 1.6,
          stroke: relationshipStroke(relationship, relationship.id === selectedRelationshipId),
        },
        selected: relationship.id === selectedRelationshipId,
      })),
    [relationships, selectedRelationshipId]
  );

  return (
    <div className="h-[44rem] rounded-[1.4rem] border border-white/10 bg-slate/40">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.4}
        onlyRenderVisibleElements
        onNodeClick={(_, node) => onSelectEntity?.(node.id)}
        onEdgeClick={(_, edge) => onSelectRelationship?.(edge.id)}
        onPaneClick={() => {
          onSelectEntity?.(null);
          onSelectRelationship?.(null);
        }}
        onNodeDragStop={(_, node) => {
          const nextPosition = { x: node.position.x, y: node.position.y };
          setPositions((current) => ({
            ...current,
            [node.id]: nextPosition,
          }));
          onNodePositionChange?.(node.id, nextPosition);
        }}
      >
        <Background gap={20} size={1} color="rgba(148, 163, 184, 0.16)" />
        <Controls showInteractive={false} position="bottom-right" />
      </ReactFlow>
    </div>
  );
}
