import { create } from 'zustand';
import type { Point, Edge, NodePosition } from '../../shared/types';
import { mockRouteData } from '../data/mockRouteData';

interface RouteState {
  points: Point[];
  edges: Edge[];
  nodePositions: Record<string, NodePosition>;
  selectedChain: string[];
  collapsedCategories: Set<string>;
  detailPointId: string | null;
  searchResultId: string | null;
  pulseIds: Set<string>;
  zoomAction: { type: 'in' | 'out' | 'reset'; ts: number } | null;

  setNodePosition: (id: string, pos: Partial<NodePosition>) => void;
  setAllPositions: (positions: Record<string, NodePosition>) => void;
  toggleChainNode: (pointId: string) => void;
  clearChain: () => void;
  toggleCategoryCollapse: (categoryId: string) => void;
  setDetailPoint: (pointId: string | null) => void;
  setSearchResult: (pointId: string | null) => void;
  triggerPulse: (pointId: string, duration?: number) => void;
  initPositions: (positions: Record<string, NodePosition>) => void;
  requestZoom: (type: 'in' | 'out' | 'reset') => void;
  clearZoomAction: () => void;
}

const MAX_CHAIN_LENGTH = 6;

function createInitialPositions(points: Point[], width = 900, height = 700): Record<string, NodePosition> {
  const positions: Record<string, NodePosition> = {};
  const categories = points.filter((p) => p.isCategory);
  const regularPoints = points.filter((p) => !p.isCategory);

  categories.forEach((cat, i) => {
    const cx = width * (i === 0 ? 0.25 : 0.75);
    const cy = height * 0.28;
    positions[cat.id] = { id: cat.id, x: cx, y: cy };
  });

  const catGroups: Record<string, Point[]> = {};
  for (const p of regularPoints) {
    const pid = p.parentId || 'cat-humanity';
    if (!catGroups[pid]) catGroups[pid] = [];
    catGroups[pid].push(p);
  }

  for (const cat of categories) {
    const group = catGroups[cat.id] || [];
    const catPos = positions[cat.id];
    if (!catPos) continue;
    const radiusX = width * 0.18;
    const radiusY = height * 0.28;
    const startAngle = cat.id === 'cat-humanity' ? -Math.PI * 0.7 : -Math.PI * 0.3;

    group.forEach((p, i) => {
      const angle = startAngle + (i / Math.max(group.length - 1, 1)) * Math.PI * 0.8;
      const x = catPos.x + Math.cos(angle) * radiusX + (Math.random() - 0.5) * 30;
      const y = catPos.y + Math.sin(angle) * radiusY + 60 + (Math.random() - 0.5) * 30;
      positions[p.id] = { id: p.id, x, y };
    });
  }

  for (const p of regularPoints) {
    if (!positions[p.id]) {
      positions[p.id] = {
        id: p.id,
        x: width / 2 + (Math.random() - 0.5) * 400,
        y: height / 2 + (Math.random() - 0.5) * 300,
      };
    }
  }

  return positions;
}

export const useRouteStore = create<RouteState>((set, get) => ({
  points: mockRouteData.points,
  edges: mockRouteData.edges,
  nodePositions: createInitialPositions(mockRouteData.points),
  selectedChain: [],
  collapsedCategories: new Set(),
  detailPointId: null,
  searchResultId: null,
  pulseIds: new Set(),
  zoomAction: null,

  setNodePosition: (id, pos) =>
    set((state) => ({
      nodePositions: {
        ...state.nodePositions,
        [id]: { ...state.nodePositions[id], ...pos, id },
      },
    })),

  setAllPositions: (positions) => set({ nodePositions: positions }),

  toggleChainNode: (pointId) => {
    const { selectedChain } = get();
    const point = get().points.find((p) => p.id === pointId);
    if (!point || point.isCategory) return;

    const index = selectedChain.indexOf(pointId);
    if (index !== -1) {
      set({ selectedChain: selectedChain.filter((_, i) => i !== index) });
    } else if (selectedChain.length < MAX_CHAIN_LENGTH) {
      set({ selectedChain: [...selectedChain, pointId] });
    }
  },

  clearChain: () => set({ selectedChain: [] }),

  toggleCategoryCollapse: (categoryId) =>
    set((state) => {
      const next = new Set(state.collapsedCategories);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return { collapsedCategories: next };
    }),

  setDetailPoint: (pointId) => set({ detailPointId: pointId }),

  setSearchResult: (pointId) => set({ searchResultId: pointId }),

  triggerPulse: (pointId, duration = 1200) => {
    set((state) => {
      const next = new Set(state.pulseIds);
      next.add(pointId);
      return { pulseIds: next };
    });
    setTimeout(() => {
      set((state) => {
        const next = new Set(state.pulseIds);
        next.delete(pointId);
        return { pulseIds: next };
      });
    }, duration);
  },

  initPositions: (positions) => set({ nodePositions: positions }),

  requestZoom: (type) => set({ zoomAction: { type, ts: Date.now() } }),

  clearZoomAction: () => set({ zoomAction: null }),
}));
