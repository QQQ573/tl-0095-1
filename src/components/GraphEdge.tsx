import { memo } from 'react';
import type { Edge, NodePosition } from '../../shared/types';
import { useRouteStore } from '../store/useRouteStore';
import { getStrokeWidthByWalkMinutes, getCategoryColor } from '../utils/graphLayout';
import type { Point } from '../../shared/types';

interface GraphEdgeProps {
  edge: Edge;
  fromPos: NodePosition;
  toPos: NodePosition;
  fromPoint?: Point;
  toPoint?: Point;
}

export const GraphEdge = memo(function GraphEdge({
  edge,
  fromPos,
  toPos,
  fromPoint,
  toPoint,
}: GraphEdgeProps) {
  const selectedChain = useRouteStore((s) => s.selectedChain);
  const category = fromPoint?.category ?? toPoint?.category ?? 'humanity';
  const baseColor = getCategoryColor(category);
  const strokeWidth = getStrokeWidthByWalkMinutes(edge.walkMinutes);

  const fromIdx = selectedChain.indexOf(edge.from);
  const toIdx = selectedChain.indexOf(edge.to);
  const isInChain = fromIdx !== -1 && toIdx !== -1 && toIdx === fromIdx + 1;
  const hasChainSelection = selectedChain.length > 0;
  const opacity = hasChainSelection && !isInChain ? 0.15 : isInChain ? 1 : 0.55;

  const dx = toPos.x - fromPos.x;
  const dy = toPos.y - fromPos.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const fromRadius = fromPoint
    ? (fromPoint.isCategory ? 36 : 14 + ((fromPoint.educationWeight - 1) / 9) * 18)
    : 20;
  const toRadius = toPoint
    ? (toPoint.isCategory ? 36 : 14 + ((toPoint.educationWeight - 1) / 9) * 18)
    : 20;

  const startX = fromPos.x + (dx / dist) * (fromRadius + 4);
  const startY = fromPos.y + (dy / dist) * (fromRadius + 4);
  const endX = toPos.x - (dx / dist) * (toRadius + 10);
  const endY = toPos.y - (dy / dist) * (toRadius + 10);

  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;
  const perpX = -dy / dist;
  const perpY = dx / dist;
  const curve = 30;
  const cpx = midX + perpX * curve;
  const cpy = midY + perpY * curve;

  const path = `M ${startX} ${startY} Q ${cpx} ${cpy} ${endX} ${endY}`;

  const arrowAngle = Math.atan2(endY - cpy, endX - cpx);
  const arrowSize = isInChain ? 11 : 8;
  const arrowX1 = endX - Math.cos(arrowAngle - 0.4) * arrowSize;
  const arrowY1 = endY - Math.sin(arrowAngle - 0.4) * arrowSize;
  const arrowX2 = endX - Math.cos(arrowAngle + 0.4) * arrowSize;
  const arrowY2 = endY - Math.sin(arrowAngle + 0.4) * arrowSize;

  const labelX = (startX + cpx + endX) / 3;
  const labelY = (startY + cpy + endY) / 3;

  return (
    <g style={{ opacity, transition: 'opacity 300ms ease' }}>
      <path
        d={path}
        fill="none"
        stroke={baseColor}
        strokeWidth={strokeWidth + 4}
        strokeLinecap="round"
        opacity={0}
      />
      <path
        d={path}
        fill="none"
        stroke={isInChain ? '#f59e0b' : baseColor}
        strokeWidth={isInChain ? strokeWidth + 1.5 : strokeWidth}
        strokeLinecap="round"
        style={{
          transition: 'stroke 300ms ease, stroke-width 300ms ease',
          filter: isInChain ? `drop-shadow(0 0 6px ${baseColor})` : 'none',
        }}
      />
      <polygon
        points={`${endX},${endY} ${arrowX1},${arrowY1} ${arrowX2},${arrowY2}`}
        fill={isInChain ? '#f59e0b' : baseColor}
        style={{
          transition: 'fill 300ms ease',
          filter: isInChain ? `drop-shadow(0 0 4px ${baseColor})` : 'none',
        }}
      />
      {(isInChain || !hasChainSelection) && (
        <>
          <rect
            x={labelX - 22}
            y={labelY - 9}
            width={44}
            height={18}
            rx={9}
            fill="rgba(30, 58, 95, 0.85)"
            stroke={baseColor}
            strokeOpacity={0.4}
            strokeWidth={1}
          />
          <text
            x={labelX}
            y={labelY + 4}
            textAnchor="middle"
            fill="#e2e8f0"
            fontSize={10}
            fontWeight={600}
            style={{ fontFamily: '"Noto Sans SC", sans-serif', pointerEvents: 'none' }}
          >
            {edge.walkMinutes}分
          </text>
        </>
      )}
    </g>
  );
});
