import { useEffect, useRef } from 'react';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type Simulation,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force';
import type { Point, Edge, NodePosition } from '../../shared/types';
import { getRadiusByWeight } from '../utils/graphLayout';
import { useRouteStore } from '../store/useRouteStore';

interface SimNode extends SimulationNodeDatum {
  id: string;
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  value: number;
}

interface UseForceGraphOptions {
  width: number;
  height: number;
  visiblePoints: Point[];
  visibleEdges: Edge[];
}

export function useForceGraph({ width, height, visiblePoints, visibleEdges }: UseForceGraphOptions) {
  const simulationRef = useRef<Simulation<SimNode, SimLink> | null>(null);
  const setAllPositions = useRouteStore((s) => s.setAllPositions);
  const setNodePosition = useRouteStore((s) => s.setNodePosition);
  const nodePositions = useRouteStore((s) => s.nodePositions);

  useEffect(() => {
    if (width <= 0 || height <= 0 || visiblePoints.length === 0) return;

    const nodes: SimNode[] = visiblePoints.map((p) => {
      const existing = nodePositions[p.id];
      return {
        id: p.id,
        x: existing?.x ?? width / 2 + (Math.random() - 0.5) * 200,
        y: existing?.y ?? height / 2 + (Math.random() - 0.5) * 200,
        vx: existing?.vx ?? 0,
        vy: existing?.vy ?? 0,
        fx: existing?.fx ?? undefined,
        fy: existing?.fy ?? undefined,
      };
    });

    const pointIds = new Set(visiblePoints.map((p) => p.id));
    const links: SimLink[] = visibleEdges
      .filter((e) => pointIds.has(e.from) && pointIds.has(e.to))
      .map((e) => ({
        source: e.from,
        target: e.to,
        value: e.walkMinutes,
      }));

    const simulation = forceSimulation<SimNode, SimLink>(nodes)
      .force(
        'link',
        forceLink<SimNode, SimLink>(links)
          .id((d) => d.id)
          .distance((d) => 80 + (d as SimLink).value * 2)
          .strength(0.3)
      )
      .force('charge', forceManyBody().strength((d) => {
        const node = d as SimNode;
        const point = visiblePoints.find((p) => p.id === node.id);
        if (!point) return -200;
        return point.isCategory ? -600 : -280;
      }))
      .force('center', forceCenter(width / 2, height / 2).strength(0.05))
      .force(
        'collide',
        forceCollide<SimNode>().radius((d) => {
          const point = visiblePoints.find((p) => p.id === d.id);
          if (!point) return 20;
          return getRadiusByWeight(point.educationWeight, point.isCategory) + 8;
        }).strength(0.8)
      )
      .alphaDecay(0.02);

    simulationRef.current = simulation;

    let tickCount = 0;
    simulation.on('tick', () => {
      tickCount++;
      if (tickCount % 2 === 0) {
        const positions: Record<string, NodePosition> = {};
        for (const n of simulation.nodes()) {
          positions[n.id] = {
            id: n.id,
            x: n.x ?? width / 2,
            y: n.y ?? height / 2,
            vx: n.vx,
            vy: n.vy,
            fx: n.fx,
            fy: n.fy,
          };
        }
        setAllPositions(positions);
      }
    });

    return () => {
      simulation.stop();
      simulationRef.current = null;
    };
  }, [visiblePoints.map((p) => p.id).join(','), visibleEdges.map((e) => e.id).join(','), width, height]);

  const fixNode = (id: string, x: number, y: number) => {
    setNodePosition(id, { fx: x, fy: y, x, y });
    const sim = simulationRef.current;
    if (sim) {
      const node = sim.nodes().find((n) => n.id === id);
      if (node) {
        node.fx = x;
        node.fy = y;
        node.x = x;
        node.y = y;
      }
      sim.alpha(0.3).restart();
    }
  };

  const releaseNode = (id: string) => {
    setNodePosition(id, { fx: null, fy: null });
    const sim = simulationRef.current;
    if (sim) {
      const node = sim.nodes().find((n) => n.id === id);
      if (node) {
        node.fx = null;
        node.fy = null;
      }
      sim.alpha(0.3).restart();
    }
  };

  const dragMove = (id: string, x: number, y: number) => {
    fixNode(id, x, y);
  };

  const reheat = () => {
    simulationRef.current?.alpha(0.6).restart();
  };

  return { fixNode, releaseNode, dragMove, reheat };
}
