'use client';

import { ReactFlowchartImplementation } from '@/features/functional-spec/components/flowchart/react-flowchart-implementation';
import { ReactCanvasFlowchartImplementation } from '@/features/functional-spec/components/flowchart/react-canvas-flowchart-implementation';

export const FLOWCHART_RENDERERS = {
  reactCanvas: 'react-canvas',
  reactFlow: 'react-flow',
};

const RENDERERS = {
  [FLOWCHART_RENDERERS.reactCanvas]: ReactCanvasFlowchartImplementation,
  [FLOWCHART_RENDERERS.reactFlow]: ReactFlowchartImplementation,
};

export function FunctionalFlowchartCanvas({
  renderer = FLOWCHART_RENDERERS.reactCanvas,
  showZoomControls = true,
  showPanControls = true,
  enableWheelZoom = true,
  enableDragPan = true,
  trapWheelScroll = true,
  minZoom = 0.35,
  maxZoom = 2.5,
  ...props
}) {
  const Renderer = RENDERERS[renderer] || RENDERERS[FLOWCHART_RENDERERS.reactCanvas];
  return <Renderer showZoomControls={showZoomControls} showPanControls={showPanControls} enableWheelZoom={enableWheelZoom} enableDragPan={enableDragPan} trapWheelScroll={trapWheelScroll} minZoom={minZoom} maxZoom={maxZoom} {...props} />;
}
