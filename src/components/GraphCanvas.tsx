import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { GraphNode } from './GraphNode';
import { GraphEdge } from './GraphEdge';
import { useRouteStore } from '../store/useRouteStore';
import { getVisiblePoints, getVisibleEdges } from '../utils/graphLayout';
import { useForceGraph } from '../hooks/useForceGraph';
import { useDebounce } from '../hooks/useDebounce';

interface GraphCanvasProps {
  containerWidth: number;
  containerHeight: number;
}

export function GraphCanvas({ containerWidth, containerHeight }: GraphCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ w: 1200, h: 800 });

  const debouncedW = useDebounce(containerWidth, 300);
  const debouncedH = useDebounce(containerHeight, 300);

  const points = useRouteStore((s) => s.points);
  const edges = useRouteStore((s) => s.edges);
  const collapsedCategories = useRouteStore((s) => s.collapsedCategories);
  const nodePositions = useRouteStore((s) => s.nodePositions);
  const setDetailPoint = useRouteStore((s) => s.setDetailPoint);
  const pulseIds = useRouteStore((s) => s.pulseIds);
  const viewBox = useRouteStore((s) => s.viewBox);
  const setViewBox = useRouteStore((s) => s.setViewBox);
  const zoomAction = useRouteStore((s) => s.zoomAction);
  const clearZoomAction = useRouteStore((s) => s.clearZoomAction);

  useEffect(() => {
    if (debouncedW > 0 && debouncedH > 0) {
      setDimensions({ w: debouncedW, h: debouncedH });
      setViewBox({ x: 0, y: 0, w: debouncedW, h: debouncedH });
    }
  }, [debouncedW, debouncedH, setViewBox]);

  const visiblePoints = useMemo(
    () => getVisiblePoints(points, collapsedCategories),
    [points, collapsedCategories]
  );

  const visiblePointIds = useMemo(
    () => new Set(visiblePoints.map((p) => p.id)),
    [visiblePoints]
  );

  const visibleEdges = useMemo(
    () => getVisibleEdges(edges, visiblePointIds),
    [edges, visiblePointIds]
  );

  const { fixNode, releaseNode, dragMove } = useForceGraph({
    width: dimensions.w,
    height: dimensions.h,
    visiblePoints,
    visibleEdges,
  });

  useEffect(() => {
    for (const id of pulseIds) {
      const pos = nodePositions[id];
      if (pos) {
        setViewBox({
          x: pos.x - viewBox.w / 2,
          y: pos.y - viewBox.h / 2,
          w: viewBox.w,
          h: viewBox.h,
        });
        break;
      }
    }
  }, [pulseIds]);

  useEffect(() => {
    if (!zoomAction) return;
    const { type } = zoomAction;
    if (type === 'reset') {
      setViewBox({ x: 0, y: 0, w: dimensions.w, h: dimensions.h });
    } else {
      const scale = type === 'in' ? 0.8 : 1.25;
      const cx = viewBox.x + viewBox.w / 2;
      const cy = viewBox.y + viewBox.h / 2;
      const newW = Math.max(400, Math.min(viewBox.w * scale, 4000));
      const newH = Math.max(300, Math.min(viewBox.h * scale, 3000));
      setViewBox({
        x: cx - newW / 2,
        y: cy - newH / 2,
        w: newW,
        h: newH,
      });
    }
    clearZoomAction();
  }, [zoomAction]);

  const screenToSvg = useCallback(
    (clientX: number, clientY: number) => {
      if (!svgRef.current) return { x: 0, y: 0 };
      const rect = svgRef.current.getBoundingClientRect();
      const x = viewBox.x + ((clientX - rect.left) / rect.width) * viewBox.w;
      const y = viewBox.y + ((clientY - rect.top) / rect.height) * viewBox.h;
      return { x, y };
    },
    [viewBox]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, pointId: string) => {
      e.preventDefault();
      e.stopPropagation();
      const svgPoint = screenToSvg(e.clientX, e.clientY);
      const pos = nodePositions[pointId];
      if (!pos) return;
      setIsDragging(pointId);
      dragOffset.current = { x: svgPoint.x - pos.x, y: svgPoint.y - pos.y };
      fixNode(pointId, pos.x, pos.y);
    },
    [screenToSvg, nodePositions, fixNode]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        const svgPoint = screenToSvg(e.clientX, e.clientY);
        dragMove(
          isDragging,
          svgPoint.x - dragOffset.current.x,
          svgPoint.y - dragOffset.current.y
        );
      } else if (isPanning) {
        const dx = (e.clientX - panStart.current.x) * (viewBox.w / containerWidth);
        const dy = (e.clientY - panStart.current.y) * (viewBox.h / containerHeight);
        setViewBox({
          ...viewBox,
          x: panStart.current.vx - dx,
          y: panStart.current.vy - dy,
        });
      }
    },
    [isDragging, isPanning, screenToSvg, viewBox, containerWidth, containerHeight, dragMove, setViewBox]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      releaseNode(isDragging);
      setIsDragging(null);
    }
    setIsPanning(false);
  }, [isDragging, releaseNode]);

  const handleSvgMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    panStart.current = {
      x: e.clientX,
      y: e.clientY,
      vx: viewBox.x,
      vy: viewBox.y,
    };
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const scale = e.deltaY > 0 ? 1.12 : 0.88;
    const svgPoint = screenToSvg(e.clientX, e.clientY);
    const newW = Math.max(400, Math.min(viewBox.w * scale, 4000));
    const newH = Math.max(300, Math.min(viewBox.h * scale, 3000));
    const ratioX = (svgPoint.x - viewBox.x) / viewBox.w;
    const ratioY = (svgPoint.y - viewBox.y) / viewBox.h;
    setViewBox({
      x: svgPoint.x - ratioX * newW,
      y: svgPoint.y - ratioY * newH,
      w: newW,
      h: newH,
    });
  };

  const handleDoubleClick = useCallback(
    (pointId: string) => {
      const p = points.find((pt) => pt.id === pointId);
      if (p && !p.isCategory) {
        setDetailPoint(pointId);
      }
    },
    [points, setDetailPoint]
  );

  return (
    <svg
      ref={svgRef}
      className="w-full h-full select-none"
      viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
      onMouseDown={handleSvgMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
    >
      <defs>
        <radialGradient id="bgGradient" cx="50%" cy="40%" r="80%">
          <stop offset="0%" stopColor="#1e3a5f" stopOpacity="1" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="1" />
        </radialGradient>
        <pattern id="gridPattern" width="50" height="50" patternUnits="userSpaceOnUse">
          <path
            d="M 50 0 L 0 0 0 50"
            fill="none"
            stroke="rgba(148,163,184,0.045)"
            strokeWidth="1"
          />
        </pattern>
        <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect x={viewBox.x - 2000} y={viewBox.y - 2000} width={viewBox.w + 4000} height={viewBox.h + 4000} fill="url(#bgGradient)" />
      <rect x={viewBox.x - 2000} y={viewBox.y - 2000} width={viewBox.w + 4000} height={viewBox.h + 4000} fill="url(#gridPattern)" />

      <g
        ref={gRef}
        style={{
          cursor: isDragging ? 'grabbing' : undefined,
        }}
      >
        <g>
          {visibleEdges.map((edge) => {
            const fromPos = nodePositions[edge.from];
            const toPos = nodePositions[edge.to];
            if (!fromPos || !toPos) return null;
            const fromPoint = points.find((p) => p.id === edge.from);
            const toPoint = points.find((p) => p.id === edge.to);
            return (
              <GraphEdge
                key={edge.id}
                edge={edge}
                fromPos={fromPos}
                toPos={toPos}
                fromPoint={fromPoint}
                toPoint={toPoint}
              />
            );
          })}
        </g>

        <g>
          {visiblePoints.map((point, i) => {
            const pos = nodePositions[point.id];
            if (!pos) return null;
            return (
              <GraphNode
                key={point.id}
                point={point}
                x={pos.x}
                y={pos.y}
                index={i}
                onMouseDown={handleMouseDown}
                onDoubleClick={handleDoubleClick}
              />
            );
          })}
        </g>
      </g>
    </svg>
  );
}
