import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { GraphNode } from './GraphNode';
import { GraphEdge } from './GraphEdge';
import { useRouteStore } from '../store/useRouteStore';
import { getVisiblePoints, getVisibleEdges, getRadiusByWeight } from '../utils/graphLayout';
import { useForceGraph } from '../hooks/useForceGraph';
import { useDebounce } from '../hooks/useDebounce';

interface GraphCanvasProps {
  containerWidth: number;
  containerHeight: number;
}

function computeBounds(positions: Record<string, { x: number; y: number }>, padding = 100) {
  const vals = Object.values(positions);
  if (vals.length === 0) return { x: 0, y: 0, w: 1200, h: 800 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of vals) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return {
    x: minX - padding,
    y: minY - padding,
    w: maxX - minX + padding * 2,
    h: maxY - minY + padding * 2,
  };
}

function fitViewBox(
  bounds: { x: number; y: number; w: number; h: number },
  containerW: number,
  containerH: number
) {
  const fitScale = Math.min(containerW / bounds.w, containerH / bounds.h);
  const maxScale = 1.4;
  const minScale = Math.min(1, fitScale);
  const scale = Math.min(Math.max(fitScale, 0.55), maxScale);
  const viewW = containerW / scale;
  const viewH = Math.min(containerH / scale, bounds.h * 1.8);
  return {
    x: bounds.x + bounds.w / 2 - viewW / 2,
    y: bounds.y + bounds.h / 2 - viewH / 2,
    w: viewW,
    h: viewH,
  };
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function GraphCanvas({ containerWidth, containerHeight }: GraphCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const [viewBox, setViewBoxState] = useState({ x: 0, y: 0, w: 1200, h: 800 });
  const targetViewBox = useRef(viewBox);
  const animFrame = useRef<number | null>(null);
  const [firstRender, setFirstRender] = useState(true);

  const debouncedW = useDebounce(containerWidth, 300);
  const debouncedH = useDebounce(containerHeight, 300);

  const points = useRouteStore((s) => s.points);
  const edges = useRouteStore((s) => s.edges);
  const collapsedCategories = useRouteStore((s) => s.collapsedCategories);
  const nodePositions = useRouteStore((s) => s.nodePositions);
  const setDetailPoint = useRouteStore((s) => s.setDetailPoint);
  const pulseIds = useRouteStore((s) => s.pulseIds);
  const zoomAction = useRouteStore((s) => s.zoomAction);
  const clearZoomAction = useRouteStore((s) => s.clearZoomAction);

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

  const simWidth = 1200;
  const simHeight = 800;

  const { fixNode, releaseNode, dragMove } = useForceGraph({
    width: simWidth,
    height: simHeight,
    visiblePoints,
    visibleEdges,
  });

  const animateTo = useCallback((target: typeof viewBox) => {
    targetViewBox.current = target;
    const startVb = { ...viewBox };
    const startTime = performance.now();
    const duration = 500;

    const tick = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(1, elapsed / duration);
      const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      setViewBoxState({
        x: lerp(startVb.x, target.x, easeT),
        y: lerp(startVb.y, target.y, easeT),
        w: lerp(startVb.w, target.w, easeT),
        h: lerp(startVb.h, target.h, easeT),
      });
      if (t < 1) {
        animFrame.current = requestAnimationFrame(tick);
      }
    };
    if (animFrame.current) cancelAnimationFrame(animFrame.current);
    animFrame.current = requestAnimationFrame(tick);
  }, [viewBox]);

  // Initial fit to view - runs once when positions are ready
  useEffect(() => {
    if (containerWidth <= 0 || containerHeight <= 0) return;
    if (Object.keys(nodePositions).length === 0) return;
    if (!firstRender) return;

    const bounds = computeBounds(nodePositions, 150);
    const fitted = fitViewBox(bounds, containerWidth, containerHeight);
    setViewBoxState(fitted);
    targetViewBox.current = fitted;
    setFirstRender(false);
  }, [containerWidth, containerHeight, nodePositions, firstRender]);

  useEffect(() => {
    if (firstRender) return;
    if (containerWidth <= 0 || containerHeight <= 0) return;
    const bounds = computeBounds(nodePositions, 120);
    const fitted = fitViewBox(bounds, containerWidth, containerHeight);
    animateTo(fitted);
  }, [collapsedCategories, containerWidth, containerHeight, nodePositions, animateTo, firstRender]);

  useEffect(() => {
    if (pulseIds.size === 0) return;
    const firstId = Array.from(pulseIds)[0];
    const pos = nodePositions[firstId];
    if (!pos || containerWidth <= 0 || containerHeight <= 0) return;
    const radius = getRadiusByWeight(
      visiblePoints.find((p) => p.id === firstId)?.educationWeight ?? 5,
      false
    );
    const r = Math.max(100, radius * 4);
    const nodeBounds = {
      x: pos.x - r,
      y: pos.y - r,
      w: r * 2,
      h: r * 2,
    };
    const fitted = fitViewBox(nodeBounds, containerWidth, containerHeight);
    animateTo(fitted);
  }, [pulseIds, nodePositions, containerWidth, containerHeight, visiblePoints, animateTo]);

  useEffect(() => {
    if (!zoomAction || debouncedW <= 0 || debouncedH <= 0) return;
    const { type } = zoomAction;
    if (type === 'reset') {
      const bounds = computeBounds(nodePositions, 120);
      const fitted = fitViewBox(bounds, debouncedW, debouncedH);
      animateTo(fitted);
    } else {
      const scale = type === 'in' ? 0.8 : 1.25;
      const cx = viewBox.x + viewBox.w / 2;
      const cy = viewBox.y + viewBox.h / 2;
      const newW = Math.max(200, Math.min(viewBox.w * scale, 4000));
      const newH = Math.max(150, Math.min(viewBox.h * scale, 3000));
      const target = {
        x: cx - newW / 2,
        y: cy - newH / 2,
        w: newW,
        h: newH,
      };
      animateTo(target);
    }
    clearZoomAction();
  }, [zoomAction, debouncedW, debouncedH, nodePositions, viewBox, animateTo, clearZoomAction]);

  useEffect(() => {
    return () => {
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
    };
  }, []);

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
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
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
        if (animFrame.current) cancelAnimationFrame(animFrame.current);
        const dx = (e.clientX - panStart.current.x) * (viewBox.w / containerWidth);
        const dy = (e.clientY - panStart.current.y) * (viewBox.h / containerHeight);
        const newVb = {
          ...viewBox,
          x: panStart.current.vx - dx,
          y: panStart.current.vy - dy,
        };
        setViewBoxState(newVb);
        targetViewBox.current = newVb;
      }
    },
    [isDragging, isPanning, screenToSvg, viewBox, containerWidth, containerHeight, dragMove]
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
    if (animFrame.current) cancelAnimationFrame(animFrame.current);
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
    if (animFrame.current) cancelAnimationFrame(animFrame.current);
    const scale = e.deltaY > 0 ? 1.12 : 0.88;
    const svgPoint = screenToSvg(e.clientX, e.clientY);
    const newW = Math.max(200, Math.min(viewBox.w * scale, 4000));
    const newH = Math.max(150, Math.min(viewBox.h * scale, 3000));
    const ratioX = (svgPoint.x - viewBox.x) / viewBox.w;
    const ratioY = (svgPoint.y - viewBox.y) / viewBox.h;
    const newVb = {
      x: svgPoint.x - ratioX * newW,
      y: svgPoint.y - ratioY * newH,
      w: newW,
      h: newH,
    };
    setViewBoxState(newVb);
    targetViewBox.current = newVb;
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
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect x={viewBox.x - 2000} y={viewBox.y - 2000} width={viewBox.w + 4000} height={viewBox.h + 4000} fill="url(#bgGradient)" pointerEvents="none" />
      <rect x={viewBox.x - 2000} y={viewBox.y - 2000} width={viewBox.w + 4000} height={viewBox.h + 4000} fill="url(#gridPattern)" pointerEvents="none" />

      <g
        ref={gRef}
        style={{
          cursor: isDragging ? 'grabbing' : undefined,
        }}
      >
        <g>
          {visibleEdges.map((edge, idx) => {
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
                index={idx}
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
