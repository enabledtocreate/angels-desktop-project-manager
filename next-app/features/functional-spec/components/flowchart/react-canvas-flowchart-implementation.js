'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CONNECTION_HANDLES, EDGE_TYPES, buildNodeIndex, edgeStroke, edgeTypeLabel, nodeHandlePoint, nodePosition, nodeSize } from '@/features/functional-spec/components/flowchart/flowchart-renderer-utils';
import { visualForType } from '@/features/functional-spec/components/flowchart/workflow-node-visuals';

function canvasBounds(nodes = []) {
  const nodeList = Array.isArray(nodes) ? nodes : [];
  if (!nodeList.length) return { minX: -80, minY: -80, width: 960, height: 560 };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  nodeList.forEach((node, index) => {
    const position = nodePosition(node, index);
    const size = nodeSize(node);
    minX = Math.min(minX, position.x);
    minY = Math.min(minY, position.y);
    maxX = Math.max(maxX, position.x + size.width);
    maxY = Math.max(maxY, position.y + size.height);
  });
  const pad = 130;
  return {
    minX: minX - pad,
    minY: minY - pad,
    width: Math.max(maxX - minX + pad * 2, 960),
    height: Math.max(maxY - minY + pad * 2, 560),
  };
}

function svgPoint(svg, event) {
  const point = svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  return point.matrixTransform(svg.getScreenCTM().inverse());
}

function wrapLabel(text, max = 26) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  const lines = [];
  words.forEach((word) => {
    const current = lines[lines.length - 1] || '';
    if (!current || `${current} ${word}`.length > max) lines.push(word);
    else lines[lines.length - 1] = `${current} ${word}`;
  });
  return lines.slice(0, 3);
}

function nodeShape(type, x, y, width, height) {
  if (type === 'decision') {
    const cx = x + width / 2;
    const cy = y + height / 2;
    return `${cx},${y} ${x + width},${cy} ${cx},${y + height} ${x},${cy}`;
  }
  return null;
}

function clampZoom(value, minZoom, maxZoom) {
  return Math.min(maxZoom, Math.max(minZoom, Number(value.toFixed(2))));
}

function zoomedViewBox(bounds, zoom) {
  const width = bounds.width / zoom;
  const height = bounds.height / zoom;
  return {
    minX: bounds.minX + (bounds.width - width) / 2,
    minY: bounds.minY + (bounds.height - height) / 2,
    width,
    height,
  };
}

function panStep(bounds, zoom) {
  return Math.max(48, Math.min(bounds.width, bounds.height) / zoom * 0.12);
}

const NODE_DRAG_DATA_TYPE = 'application/x-apm-functional-node';

function plusPoint(handlePoint, handle) {
  return {
    x: handlePoint.x + (handle === CONNECTION_HANDLES.input ? -22 : 22),
    y: handlePoint.y,
  };
}

function connectionParams(start, end, type) {
  if (start.handle === CONNECTION_HANDLES.output) {
    return { source: start.nodeId, target: end.nodeId, sourceHandle: CONNECTION_HANDLES.output, targetHandle: CONNECTION_HANDLES.input, type, replaceDraft: true };
  }
  return { source: end.nodeId, target: start.nodeId, sourceHandle: CONNECTION_HANDLES.output, targetHandle: CONNECTION_HANDLES.input, type, replaceDraft: true };
}

function danglingParams(start) {
  if (start.handle === CONNECTION_HANDLES.output) {
    return { source: start.nodeId, target: '', sourceHandle: CONNECTION_HANDLES.output, targetHandle: CONNECTION_HANDLES.input, type: 'continue', draft: true };
  }
  return { source: '', target: start.nodeId, sourceHandle: CONNECTION_HANDLES.output, targetHandle: CONNECTION_HANDLES.input, type: 'continue', draft: true };
}

function handleDirectionKey(nodeId, handle) {
  return `${nodeId}:${handle}`;
}

function directionTrianglePoints(handle, direction, offsetY = 0) {
  const outward = handle === CONNECTION_HANDLES.input ? -1 : 1;
  const axis = direction === 'outgoing' ? outward : outward * -1;
  const y = offsetY;
  return [
    `${axis * 4.8},${y}`,
    `${axis * -3.2},${y - 4.2}`,
    `${axis * -3.2},${y + 4.2}`,
  ].join(' ');
}

function HandleDirectionMarker({ point, handle, directions = {}, active = false, onPointerDown }) {
  const hasBothDirections = directions.incoming && directions.outgoing;
  return (
    <g transform={`translate(${point.x} ${point.y})`}>
      <circle r="7" fill={active ? 'rgba(34,211,238,0.95)' : 'rgb(15,23,42)'} stroke="rgba(255,255,255,0.55)" onPointerDown={onPointerDown} />
      {directions.incoming ? <polygon points={directionTrianglePoints(handle, 'incoming', hasBothDirections ? -2.4 : 0)} fill="white" pointerEvents="none" /> : null}
      {directions.outgoing ? <polygon points={directionTrianglePoints(handle, 'outgoing', hasBothDirections ? 2.4 : 0)} fill="white" pointerEvents="none" /> : null}
    </g>
  );
}

export function ReactCanvasFlowchartImplementation({
  nodes,
  edges,
  selectedNodeId,
  selectedEdgeId,
  onSelectNode,
  onSelectEdge,
  onMoveNode,
  onResizeNode,
  onConnectNodes,
  onCreateNode,
  onDeleteNode,
  onRemoveEdge,
  showZoomControls = true,
  showPanControls = true,
  enableWheelZoom = true,
  enableDragPan = true,
  trapWheelScroll = true,
  minZoom = 0.35,
  maxZoom = 2.5,
}) {
  const canvasRef = useRef(null);
  const svgRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [gesture, setGesture] = useState(null);
  const [connectionDraft, setConnectionDraft] = useState(null);
  const [connectionMenu, setConnectionMenu] = useState(null);
  const nodeIndex = useMemo(() => buildNodeIndex(nodes), [nodes]);
  const handleDirections = useMemo(() => {
    const map = new Map();
    function record(nodeId, handle, direction) {
      const key = handleDirectionKey(nodeId, handle);
      const entry = map.get(key) || { incoming: false, outgoing: false };
      entry[direction] = true;
      map.set(key, entry);
    }
    (Array.isArray(edges) ? edges : []).forEach((edge) => {
      if (edge?.hidden) return;
      if (edge?.source) record(edge.source, edge.sourceHandle || CONNECTION_HANDLES.output, 'outgoing');
      if (edge?.target) record(edge.target, edge.targetHandle || CONNECTION_HANDLES.input, 'incoming');
    });
    return map;
  }, [edges]);
  const bounds = useMemo(() => canvasBounds(nodes), [nodes]);
  const viewBox = useMemo(() => {
    const baseViewBox = zoomedViewBox(bounds, zoom);
    return { ...baseViewBox, minX: baseViewBox.minX + pan.x, minY: baseViewBox.minY + pan.y };
  }, [bounds, pan, zoom]);

  function updateZoom(delta) {
    setZoom((current) => clampZoom(current + delta, minZoom, maxZoom));
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !trapWheelScroll) return undefined;

    function handleWheel(event) {
      event.preventDefault();
      event.stopPropagation();
      if (enableWheelZoom) updateZoom(event.deltaY < 0 ? 0.1 : -0.1);
    }

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [enableWheelZoom, maxZoom, minZoom, trapWheelScroll]);

  function resetZoom() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  function updatePan(deltaX, deltaY) {
    setPan((current) => ({ x: current.x + deltaX, y: current.y + deltaY }));
  }

  function handleKeyDown(event) {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    const step = panStep(bounds, zoom);
    if (event.key === 'ArrowLeft') updatePan(-step, 0);
    if (event.key === 'ArrowRight') updatePan(step, 0);
    if (event.key === 'ArrowUp') updatePan(0, -step);
    if (event.key === 'ArrowDown') updatePan(0, step);
  }

  function beginMove(event, node, index) {
    event.preventDefault();
    setConnectionMenu(null);
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const point = svgPoint(svgRef.current, event);
    const position = nodePosition(node, index);
    setGesture({ mode: 'move', nodeId: node.id, offsetX: point.x - position.x, offsetY: point.y - position.y });
    onSelectNode?.(node.id);
    onSelectEdge?.(null);
  }

  function beginResize(event, node) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const point = svgPoint(svgRef.current, event);
    const size = nodeSize(node);
    setGesture({ mode: 'resize', nodeId: node.id, startX: point.x, startY: point.y, startWidth: size.width, startHeight: size.height });
    onSelectNode?.(node.id);
    onSelectEdge?.(null);
  }

  function beginPan(event) {
    if (!enableDragPan || event.button !== 0) return;
    event.preventDefault();
    setConnectionMenu(null);
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const point = svgPoint(svgRef.current, event);
    setGesture({ mode: 'pan', startX: point.x, startY: point.y, startPanX: pan.x, startPanY: pan.y });
  }

  function handlePointerMove(event) {
    if (!gesture || !svgRef.current) return;
    const point = svgPoint(svgRef.current, event);
    if (gesture.mode === 'move') {
      onMoveNode?.(gesture.nodeId, { x: point.x - gesture.offsetX, y: point.y - gesture.offsetY });
    }
    if (gesture.mode === 'resize') {
      onResizeNode?.(gesture.nodeId, {
        width: Math.max(190, gesture.startWidth + point.x - gesture.startX),
        height: Math.max(120, gesture.startHeight + point.y - gesture.startY),
      });
    }
    if (gesture.mode === 'pan') {
      setPan({
        x: gesture.startPanX - (point.x - gesture.startX),
        y: gesture.startPanY - (point.y - gesture.startY),
      });
    }
  }

  function finishGesture() {
    setGesture(null);
  }

  function handlePlusClick(event, node, index, handle) {
    event.preventDefault();
    event.stopPropagation();
    const handleCoordinates = nodeHandlePoint(node, index, handle);
    const menuPoint = plusPoint(handleCoordinates, handle);
    const nextPoint = { nodeId: node.id, handle };
    if (!connectionDraft) {
      setConnectionDraft(nextPoint);
      setConnectionMenu(null);
      return;
    }
    if (connectionDraft.nodeId === node.id && connectionDraft.handle === handle) {
      onConnectNodes?.(danglingParams(connectionDraft));
      setConnectionDraft({ ...connectionDraft, dangling: true });
      setConnectionMenu(null);
      return;
    }
    if (connectionDraft.handle === handle) {
      setConnectionDraft(nextPoint);
      setConnectionMenu(null);
      return;
    }
    setConnectionMenu({ x: menuPoint.x, y: menuPoint.y, start: connectionDraft, end: nextPoint });
  }

  function completeConnection(type) {
    if (!connectionMenu) return;
    onConnectNodes?.(connectionParams(connectionMenu.start, connectionMenu.end, type));
    setConnectionDraft(null);
    setConnectionMenu(null);
  }

  function handleDrop(event) {
    if (!onCreateNode || !svgRef.current) return;
    const type = event.dataTransfer?.getData(NODE_DRAG_DATA_TYPE) || event.dataTransfer?.getData('text/plain');
    if (!type) return;
    event.preventDefault();
    event.stopPropagation();
    const point = svgPoint(svgRef.current, event);
    onCreateNode(type, { x: point.x - 115, y: point.y - 65 });
  }

  function beginConnectionFromDraftEdge(event, edge) {
    event.preventDefault();
    event.stopPropagation();
    if (edge.source) setConnectionDraft({ nodeId: edge.source, handle: CONNECTION_HANDLES.output, edgeId: edge.id });
    if (edge.target) setConnectionDraft({ nodeId: edge.target, handle: CONNECTION_HANDLES.input, edgeId: edge.id });
    setConnectionMenu(null);
  }

  return (
    <div
      ref={canvasRef}
      tabIndex={0}
      role="application"
      aria-label="Functional flowchart canvas. Use arrow keys to pan the canvas."
      onKeyDown={handleKeyDown}
      className="relative h-[34rem] overflow-hidden rounded-[1.4rem] border border-white/10 bg-slate/40 outline-none focus:border-cyan-200/55 focus:ring-2 focus:ring-cyan-200/20"
    >
      {showZoomControls || showPanControls ? (
        <div className="absolute right-3 top-3 z-10 flex max-w-[calc(100%-1.5rem)] flex-wrap items-center justify-end gap-1 rounded-2xl border border-white/10 bg-slate/90 px-2 py-1.5 shadow-panel backdrop-blur">
          {showPanControls ? (
            <>
              <button type="button" className="rounded-xl border border-white/10 bg-white/6 px-2.5 py-1 text-xs font-semibold text-white hover:bg-white/12" aria-label="Pan flowchart left" onClick={() => updatePan(-panStep(bounds, zoom), 0)}>&larr;</button>
              <button type="button" className="rounded-xl border border-white/10 bg-white/6 px-2.5 py-1 text-xs font-semibold text-white hover:bg-white/12" aria-label="Pan flowchart up" onClick={() => updatePan(0, -panStep(bounds, zoom))}>&uarr;</button>
              <button type="button" className="rounded-xl border border-white/10 bg-white/6 px-2.5 py-1 text-xs font-semibold text-white hover:bg-white/12" aria-label="Pan flowchart down" onClick={() => updatePan(0, panStep(bounds, zoom))}>&darr;</button>
              <button type="button" className="rounded-xl border border-white/10 bg-white/6 px-2.5 py-1 text-xs font-semibold text-white hover:bg-white/12" aria-label="Pan flowchart right" onClick={() => updatePan(panStep(bounds, zoom), 0)}>&rarr;</button>
            </>
          ) : null}
          {showZoomControls ? (
            <>
              <button type="button" className="rounded-xl border border-white/10 bg-white/6 px-2.5 py-1 text-xs font-semibold text-white hover:bg-white/12" aria-label="Zoom out flowchart" onClick={() => updateZoom(-0.15)}>-</button>
              <button type="button" className="min-w-14 rounded-xl border border-white/10 bg-black/10 px-2.5 py-1 text-xs font-semibold text-sky-100/80 hover:bg-white/10" aria-label="Reset flowchart zoom" onClick={resetZoom}>{Math.round(zoom * 100)}%</button>
              <button type="button" className="rounded-xl border border-white/10 bg-white/6 px-2.5 py-1 text-xs font-semibold text-white hover:bg-white/12" aria-label="Zoom in flowchart" onClick={() => updateZoom(0.15)}>+</button>
            </>
          ) : null}
        </div>
      ) : null}
      <svg
        ref={svgRef}
        className="h-full w-full touch-none"
        viewBox={`${viewBox.minX} ${viewBox.minY} ${viewBox.width} ${viewBox.height}`}
        onPointerMove={handlePointerMove}
        onPointerUp={finishGesture}
        onPointerCancel={finishGesture}
        onPointerLeave={finishGesture}
        onDragOver={(event) => { if (onCreateNode) event.preventDefault(); }}
        onDrop={handleDrop}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            onSelectNode?.(null);
            onSelectEdge?.(null);
            setConnectionDraft(null);
            setConnectionMenu(null);
          }
        }}
      >
        <defs>
          <pattern id="react-canvas-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(148,163,184,0.14)" strokeWidth="1" />
          </pattern>
          <marker id="react-canvas-arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="strokeWidth">
            <path d="M2,2 L10,6 L2,10 Z" fill="rgba(226,232,240,0.88)" />
          </marker>
        </defs>
        <rect
          x={viewBox.minX}
          y={viewBox.minY}
          width={viewBox.width}
          height={viewBox.height}
          fill="url(#react-canvas-grid)"
          className={enableDragPan ? 'cursor-grab active:cursor-grabbing' : ''}
          onPointerDown={beginPan}
        />
        {(Array.isArray(edges) ? edges : []).filter((edge) => !edge.hidden).map((edge) => {
          const source = edge.source ? nodeIndex.get(edge.source) : null;
          const target = edge.target ? nodeIndex.get(edge.target) : null;
          if (!source && !target) return null;
          const start = source
            ? nodeHandlePoint(source.node, source.index, edge.sourceHandle || CONNECTION_HANDLES.output)
            : { x: nodeHandlePoint(target.node, target.index, edge.targetHandle || CONNECTION_HANDLES.input).x - 140, y: nodeHandlePoint(target.node, target.index, edge.targetHandle || CONNECTION_HANDLES.input).y };
          const end = target
            ? nodeHandlePoint(target.node, target.index, edge.targetHandle || CONNECTION_HANDLES.input)
            : { x: nodeHandlePoint(source.node, source.index, edge.sourceHandle || CONNECTION_HANDLES.output).x + 140, y: nodeHandlePoint(source.node, source.index, edge.sourceHandle || CONNECTION_HANDLES.output).y };
          const selected = edge.id === selectedEdgeId;
          const stroke = edgeStroke(edge.type, selected);
          const draft = Boolean(edge.draft || !source || !target);
          const midX = start.x + (end.x - start.x) / 2;
          const midY = start.y + (end.y - start.y) / 2;
          const loosePoint = draft ? (!target ? end : (!source ? start : null)) : null;
          const looseControlDirection = !target ? 1 : -1;
          return (
            <g key={edge.id} onClick={(event) => { event.stopPropagation(); onSelectEdge?.(edge.id); onSelectNode?.(null); }}>
              <path d={`M ${start.x} ${start.y} C ${midX} ${start.y}, ${midX} ${end.y}, ${end.x} ${end.y}`} fill="none" stroke={stroke} strokeWidth={selected ? 3.4 : 2.2} strokeDasharray={draft ? '8 7' : undefined} />
              <rect x={midX - 54} y={midY - 13} width="108" height="26" rx="13" fill="rgba(15,23,42,0.88)" stroke="rgba(255,255,255,0.12)" />
              <text x={midX} y={midY + 4} textAnchor="middle" className="fill-sky-50 text-[11px] font-semibold">{draft ? 'Unconnected' : (edge.label || edgeTypeLabel(edge.type))}</text>
              {loosePoint ? (
                <>
                  <g className="cursor-pointer" onPointerDown={(event) => beginConnectionFromDraftEdge(event, edge)}>
                    <circle cx={loosePoint.x + looseControlDirection * 18} cy={loosePoint.y} r="9" fill="rgba(34,211,238,0.95)" stroke="rgba(255,255,255,0.72)" />
                    <text x={loosePoint.x + looseControlDirection * 18} y={loosePoint.y + 4} textAnchor="middle" className="fill-white text-[13px] font-bold">+</text>
                  </g>
                  <g className="cursor-pointer" onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); onRemoveEdge?.(edge.id); }}>
                    <circle cx={loosePoint.x + looseControlDirection * 42} cy={loosePoint.y} r="9" fill="rgba(251,113,133,0.95)" stroke="rgba(255,255,255,0.72)" />
                    <text x={loosePoint.x + looseControlDirection * 42} y={loosePoint.y + 4} textAnchor="middle" className="fill-white text-[13px] font-bold">-</text>
                  </g>
                </>
              ) : null}
            </g>
          );
        })}
        {(Array.isArray(nodes) ? nodes : []).map((node, index) => {
          const position = nodePosition(node, index);
          const size = nodeSize(node);
          const type = String(node.type || 'system_action').toLowerCase();
          const visual = visualForType(type);
          const selected = node.id === selectedNodeId;
          const decisionPoints = nodeShape(type, position.x, position.y, size.width, size.height);
          const labelLines = wrapLabel(node.label || 'Untitled node');
          const inputPoint = nodeHandlePoint(node, index, CONNECTION_HANDLES.input);
          const outputPoint = nodeHandlePoint(node, index, CONNECTION_HANDLES.output);
          const inputPlusPoint = plusPoint(inputPoint, CONNECTION_HANDLES.input);
          const outputPlusPoint = plusPoint(outputPoint, CONNECTION_HANDLES.output);
          const inputActive = connectionDraft?.nodeId === node.id && connectionDraft?.handle === CONNECTION_HANDLES.input;
          const outputActive = connectionDraft?.nodeId === node.id && connectionDraft?.handle === CONNECTION_HANDLES.output;
          const inputDirections = handleDirections.get(handleDirectionKey(node.id, CONNECTION_HANDLES.input)) || {};
          const outputDirections = handleDirections.get(handleDirectionKey(node.id, CONNECTION_HANDLES.output)) || {};
          return (
            <g key={node.id} className="cursor-grab active:cursor-grabbing" onPointerDown={(event) => beginMove(event, node, index)} onClick={(event) => { event.stopPropagation(); onSelectNode?.(node.id); onSelectEdge?.(null); }}>
              {decisionPoints ? (
                <polygon points={decisionPoints} fill="rgba(251,191,36,0.2)" stroke={selected ? 'rgba(34,211,238,0.95)' : 'rgba(251,191,36,0.7)'} strokeWidth={selected ? 3 : 1.8} />
              ) : (
                <rect x={position.x} y={position.y} width={size.width} height={size.height} rx={type === 'start' ? size.height / 2 : 18} fill="rgba(15,23,42,0.94)" stroke={selected ? 'rgba(34,211,238,0.95)' : 'rgba(226,232,240,0.22)'} strokeWidth={selected ? 3 : 1.5} />
              )}
              <rect x={position.x + 12} y={position.y + 12} width={size.width - 24} height="28" rx="14" fill="rgba(255,255,255,0.08)" />
              <text x={position.x + size.width / 2} y={position.y + 31} textAnchor="middle" className="fill-sky-100 text-[10px] font-bold uppercase tracking-widest">{visual.label}</text>
              <g className="cursor-pointer" onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); onDeleteNode?.(node.id); }}>
                <rect x={position.x + size.width - 36} y={position.y + 16} width="18" height="19" rx="5" fill="rgba(251,113,133,0.16)" stroke="rgba(251,113,133,0.62)" />
                <path d={`M ${position.x + size.width - 31} ${position.y + 21} L ${position.x + size.width - 23} ${position.y + 21} M ${position.x + size.width - 29} ${position.y + 24} L ${position.x + size.width - 25} ${position.y + 24} M ${position.x + size.width - 30} ${position.y + 26} L ${position.x + size.width - 29} ${position.y + 32} M ${position.x + size.width - 25} ${position.y + 26} L ${position.x + size.width - 26} ${position.y + 32}`} fill="none" stroke="rgba(254,226,226,0.95)" strokeWidth="1.4" strokeLinecap="round" />
              </g>
              {labelLines.map((line, lineIndex) => (
                <text key={line} x={position.x + size.width / 2} y={position.y + 67 + lineIndex * 17} textAnchor="middle" className="fill-white text-[14px] font-semibold">{line}</text>
              ))}
              <text x={position.x + size.width / 2} y={position.y + size.height - 17} textAnchor="middle" className="apm-stable-id fill-sky-100/40 text-[10px]">{node.stableId || 'pending-save'}</text>
              <HandleDirectionMarker point={inputPoint} handle={CONNECTION_HANDLES.input} directions={inputDirections} active={inputActive} onPointerDown={(event) => event.stopPropagation()} />
              <g className="cursor-pointer" onPointerDown={(event) => handlePlusClick(event, node, index, CONNECTION_HANDLES.input)}>
                <circle cx={inputPlusPoint.x} cy={inputPlusPoint.y} r="9" fill={inputActive ? 'rgba(34,211,238,0.95)' : 'rgba(15,23,42,0.96)'} stroke="rgba(186,230,253,0.72)" />
                <text x={inputPlusPoint.x} y={inputPlusPoint.y + 4} textAnchor="middle" className="fill-white text-[13px] font-bold">+</text>
              </g>
              <HandleDirectionMarker point={outputPoint} handle={CONNECTION_HANDLES.output} directions={outputDirections} active={outputActive} onPointerDown={(event) => event.stopPropagation()} />
              <g className="cursor-pointer" onPointerDown={(event) => handlePlusClick(event, node, index, CONNECTION_HANDLES.output)}>
                <circle cx={outputPlusPoint.x} cy={outputPlusPoint.y} r="9" fill={outputActive ? 'rgba(34,211,238,0.95)' : 'rgba(15,23,42,0.96)'} stroke="rgba(186,230,253,0.72)" />
                <text x={outputPlusPoint.x} y={outputPlusPoint.y + 4} textAnchor="middle" className="fill-white text-[13px] font-bold">+</text>
              </g>
              {selected ? <rect x={position.x + size.width - 12} y={position.y + size.height - 12} width="18" height="18" rx="4" fill="rgba(34,211,238,0.95)" className="cursor-nwse-resize" onPointerDown={(event) => beginResize(event, node)} /> : null}
            </g>
          );
        })}
        {connectionMenu ? (
          <g transform={`translate(${connectionMenu.x + 14} ${connectionMenu.y - 18})`} onPointerDown={(event) => event.stopPropagation()}>
            <rect width="156" height={34 + EDGE_TYPES.length * 26} rx="14" fill="rgba(15,23,42,0.96)" stroke="rgba(186,230,253,0.48)" />
            <text x="14" y="22" className="fill-sky-100 text-[11px] font-bold uppercase tracking-widest">Connection type</text>
            {EDGE_TYPES.map((type, index) => (
              <g key={type} className="cursor-pointer" onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); completeConnection(type); }}>
                <rect x="8" y={32 + index * 26} width="140" height="22" rx="9" fill="rgba(255,255,255,0.06)" />
                <text x="18" y={47 + index * 26} className="fill-white text-[12px] font-semibold">{edgeTypeLabel(type)}</text>
              </g>
            ))}
          </g>
        ) : null}
      </svg>
    </div>
  );
}
