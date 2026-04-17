'use client';

export const DEFAULT_NODE_WIDTH = 230;
export const DEFAULT_NODE_HEIGHT = 130;
export const EDGE_TYPES = ['continue', 'if_then', 'else', 'loop_until', 'on_success', 'on_failure', 'returns_to', 'emits', 'consumes'];
export const CONNECTION_HANDLES = {
  input: 'input',
  output: 'output',
};

export function defaultNodePosition(index) {
  return { x: (index % 3) * 280, y: Math.floor(index / 3) * 180 };
}

export function nodeSize(node = {}) {
  return {
    width: Number.isFinite(Number(node.width)) ? Math.max(Number(node.width), 190) : DEFAULT_NODE_WIDTH,
    height: Number.isFinite(Number(node.height)) ? Math.max(Number(node.height), 120) : DEFAULT_NODE_HEIGHT,
  };
}

export function nodePosition(node = {}, index = 0) {
  return node.position || defaultNodePosition(index);
}

export function edgeType(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return EDGE_TYPES.includes(normalized)
    ? normalized
    : 'continue';
}

export function edgeTypeLabel(value) {
  return {
    continue: 'Continue',
    if_then: 'If / Then',
    else: 'Else',
    loop_until: 'Loop Until',
    on_success: 'On Success',
    on_failure: 'On Failure',
    returns_to: 'Returns To',
    emits: 'Emits',
    consumes: 'Consumes',
  }[edgeType(value)] || 'Continue';
}

export function edgeStroke(value, selected) {
  if (selected) return 'rgba(34, 211, 238, 0.95)';
  return {
    if_then: 'rgba(251, 191, 36, 0.92)',
    else: 'rgba(251, 146, 60, 0.9)',
    loop_until: 'rgba(249, 115, 22, 0.9)',
    on_success: 'rgba(74, 222, 128, 0.9)',
    on_failure: 'rgba(251, 113, 133, 0.9)',
    returns_to: 'rgba(217, 70, 239, 0.9)',
    emits: 'rgba(56, 189, 248, 0.9)',
    consumes: 'rgba(45, 212, 191, 0.9)',
  }[edgeType(value)] || 'rgba(148, 163, 184, 0.88)';
}

export function nodeCenter(node = {}, index = 0) {
  const position = nodePosition(node, index);
  const size = nodeSize(node);
  return {
    x: position.x + size.width / 2,
    y: position.y + size.height / 2,
  };
}

export function nodeHandlePoint(node = {}, index = 0, handle = CONNECTION_HANDLES.output) {
  const position = nodePosition(node, index);
  const size = nodeSize(node);
  const normalized = handle === CONNECTION_HANDLES.input ? CONNECTION_HANDLES.input : CONNECTION_HANDLES.output;
  return {
    x: normalized === CONNECTION_HANDLES.input ? position.x - 7 : position.x + size.width + 7,
    y: position.y + size.height / 2,
  };
}

export function buildNodeIndex(nodes = []) {
  return new Map((Array.isArray(nodes) ? nodes : []).map((node, index) => [node.id, { node, index }]));
}
