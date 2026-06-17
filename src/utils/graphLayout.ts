import type { Point, Edge, ChainConflictInfo } from '../../shared/types';

export function getRadiusByWeight(weight: number, isCategory = false): number {
  if (isCategory) return 36;
  const min = 14;
  const max = 32;
  return min + ((Math.max(1, Math.min(10, weight)) - 1) / 9) * (max - min);
}

export function getStrokeWidthByWalkMinutes(minutes: number): number {
  const min = 1;
  const max = 6;
  const clamped = Math.max(3, Math.min(45, minutes));
  return min + ((clamped - 3) / 42) * (max - min);
}

export function getCategoryColor(category: 'humanity' | 'ecology'): string {
  return category === 'humanity' ? '#f59e0b' : '#10b981';
}

export function getVisiblePoints(
  points: Point[],
  collapsedCategories: Set<string>
): Point[] {
  const hiddenParentIds = new Set(
    points.filter((p) => p.isCategory && collapsedCategories.has(p.id)).map((p) => p.id)
  );
  return points.filter((p) => {
    if (p.isCategory) return true;
    if (!p.parentId) return true;
    return !hiddenParentIds.has(p.parentId);
  });
}

export function getVisibleEdges(
  edges: Edge[],
  visiblePointIds: Set<string>
): Edge[] {
  return edges.filter((e) => visiblePointIds.has(e.from) && visiblePointIds.has(e.to));
}

export function formatMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}分钟`;
  if (m === 0) return `${h}小时`;
  return `${h}小时${m}分钟`;
}
