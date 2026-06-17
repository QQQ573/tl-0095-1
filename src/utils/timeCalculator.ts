import type { Point, Edge, ChainConflictInfo } from '../../shared/types';

export function calculateChainInfo(
  chainIds: string[],
  points: Point[],
  edges: Edge[]
): ChainConflictInfo {
  const conflicts: string[] = [];
  let totalWalkMinutes = 0;
  let totalStayMinutes = 0;

  const chainPoints = chainIds
    .map((id) => points.find((p) => p.id === id))
    .filter((p): p is Point => !!p);

  for (let i = 0; i < chainIds.length - 1; i++) {
    const from = chainIds[i];
    const to = chainIds[i + 1];
    const edge = edges.find((e) => e.from === from && e.to === to);
    if (edge) {
      totalWalkMinutes += edge.walkMinutes;
    } else {
      conflicts.push(`${points.find((p) => p.id === from)?.name} → ${points.find((p) => p.id === to)?.name} 无直连路线`);
    }
  }

  for (const p of chainPoints) {
    totalStayMinutes += p.minStayMinutes;
  }

  for (let i = 0; i < chainPoints.length; i++) {
    for (let j = i + 1; j < chainPoints.length; j++) {
      if (chainPoints[i].closeWindow && chainPoints[i].closeWindow === chainPoints[j].closeWindow && chainPoints[i].closeWindow !== '无') {
        conflicts.push(`${chainPoints[i].name} 与 ${chainPoints[j].name} 同日闭馆（${chainPoints[i].closeWindow}）`);
      }
    }
  }

  const edgeMap = new Map(edges.map((e) => [`${e.from}-${e.to}`, e]));
  const pointMap = new Map(points.map((p) => [p.id, p]));
  for (let i = 0; i < chainIds.length - 1; i++) {
    const from = chainIds[i];
    const to = chainIds[i + 1];
    const key = `${from}-${to}`;
    const reverseKey = `${to}-${from}`;
    if (!edgeMap.has(key) && edgeMap.has(reverseKey)) {
      const reverseEdge = edgeMap.get(reverseKey)!;
      const fromPoint = pointMap.get(from);
      const toPoint = pointMap.get(to);
      conflicts.push(`依赖顺序错误：须先游览 ${toPoint?.name} 再进入 ${fromPoint?.name}`);
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
    totalWalkMinutes,
    totalStayMinutes,
    totalMinutes: totalWalkMinutes + totalStayMinutes,
  };
}

export function findDependents(pointId: string, edges: Edge[]): string[] {
  return edges.filter((e) => e.from === pointId).map((e) => e.to);
}

export function findPrerequisites(pointId: string, edges: Edge[]): string[] {
  return edges.filter((e) => e.to === pointId).map((e) => e.from);
}
