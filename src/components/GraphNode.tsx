import { memo, useRef } from 'react';
import type { Point } from '../../shared/types';
import { useRouteStore } from '../store/useRouteStore';
import { getRadiusByWeight, getCategoryColor } from '../utils/graphLayout';
import { Landmark, Leaf, ChevronDown, ChevronRight } from 'lucide-react';

interface GraphNodeProps {
  point: Point;
  x: number;
  y: number;
  index: number;
  onMouseDown: (e: React.MouseEvent, pointId: string) => void;
  onDoubleClick: (pointId: string) => void;
}

export const GraphNode = memo(function GraphNode({
  point,
  x,
  y,
  index,
  onMouseDown,
  onDoubleClick,
}: GraphNodeProps) {
  const selectedChain = useRouteStore((s) => s.selectedChain);
  const collapsedCategories = useRouteStore((s) => s.collapsedCategories);
  const toggleCategoryCollapse = useRouteStore((s) => s.toggleCategoryCollapse);
  const toggleChainNode = useRouteStore((s) => s.toggleChainNode);
  const pulseIds = useRouteStore((s) => s.pulseIds);
  const triggerPulse = useRouteStore((s) => s.triggerPulse);
  const gRef = useRef<SVGGElement>(null);

  const radius = getRadiusByWeight(point.educationWeight, point.isCategory);
  const color = getCategoryColor(point.category);
  const isInChain = selectedChain.includes(point.id);
  const hasChainSelection = selectedChain.length > 0;
  const isPulsing = pulseIds.has(point.id);
  const isCollapsed = collapsedCategories.has(point.id);
  const chainOrder = selectedChain.indexOf(point.id);
  const opacity = hasChainSelection && !isInChain && !point.isCategory ? 0.25 : 1;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (point.isCategory) {
      toggleCategoryCollapse(point.id);
    } else {
      toggleChainNode(point.id);
      triggerPulse(point.id, 600);
    }
  };

  const Icon = point.category === 'humanity' ? Landmark : Leaf;

  return (
    <g
      ref={gRef}
      transform={`translate(${x}, ${y})`}
      style={{
        cursor: point.isCategory ? 'pointer' : 'grab',
        opacity,
        transition: 'opacity 300ms ease',
        animation: `nodeEnter 500ms ${index * 40}ms both ease-out`,
      }}
      onMouseDown={(e) => !point.isCategory && onMouseDown(e, point.id)}
      onClick={handleClick}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick(point.id);
      }}
      className={isPulsing ? 'graph-node-pulse' : ''}
    >
      <circle
        r={radius + 6}
        fill={color}
        opacity={isInChain ? 0.35 : 0.12}
        style={{ transition: 'opacity 300ms ease, r 300ms ease' }}
      />
      {isInChain && !point.isCategory && (
        <circle
          r={radius + 12}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={2}
          strokeDasharray="4 4"
          opacity={0.7}
        />
      )}
      <circle
        r={radius}
        fill={`${color}33`}
        stroke={color}
        strokeWidth={point.isCategory ? 3 : 2}
        style={{ transition: 'stroke-width 200ms ease' }}
      />
      {isInChain && !point.isCategory && (
        <text
          x={radius - 6}
          y={-radius + 10}
          fill="#fff"
          fontSize={11}
          fontWeight={700}
          textAnchor="middle"
        >
          <tspan>
            <circle cx={0} cy={0} r={9} fill="#f59e0b" />
            <tspan x={0} y={4} textAnchor="middle" fill="#1e3a5f" fontSize={11} fontWeight={800}>
              {chainOrder + 1}
            </tspan>
          </tspan>
        </text>
      )}
      <foreignObject x={-radius * 0.55} y={-radius * 0.55} width={radius * 1.1} height={radius * 1.1}>
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color,
          }}
        >
          {point.isCategory ? (
            isCollapsed ? (
              <ChevronRight size={Math.max(16, radius * 0.7)} strokeWidth={2.5} />
            ) : (
              <ChevronDown size={Math.max(16, radius * 0.7)} strokeWidth={2.5} />
            )
          ) : (
            <Icon size={Math.max(14, radius * 0.6)} strokeWidth={2} />
          )}
        </div>
      </foreignObject>
      <text
        y={radius + 16}
        textAnchor="middle"
        fill="#e2e8f0"
        fontSize={point.isCategory ? 14 : 11.5}
        fontWeight={point.isCategory ? 700 : 500}
        style={{
          fontFamily: '"Noto Serif SC", "Noto Sans SC", serif',
          textShadow: '0 1px 3px rgba(0,0,0,0.6)',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        {point.name}
      </text>
      {!point.isCategory && (
        <text
          y={radius + 30}
          textAnchor="middle"
          fill="#94a3b8"
          fontSize={9.5}
          style={{
            fontFamily: '"Noto Sans SC", sans-serif',
            pointerEvents: 'none',
            letterSpacing: '0.5px',
          }}
        >
          {point.id} · 停留{point.minStayMinutes}分
        </text>
      )}
    </g>
  );
});
