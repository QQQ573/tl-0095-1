import { create } from 'zustand';
import type { Point, Edge, NodePosition } from '../../shared/types';
import { mockRouteData } from '../data/mockRouteData';

interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface RouteState {
  points: Point[];
  edges: Edge[];
  nodePositions: Record<string, NodePosition>;
  selectedChain: string[];
  collapsedCategories: Set<string>;
  detailPointId: string | null;
  searchResultId: string | null;
  pulseIds: Set<string>;
  viewBox: ViewBox;
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
  setViewBox: (vb: ViewBox) => void;
  requestZoom: (type: 'in' | 'out' | 'reset') => void;
  clearZoomAction: () => void;
}

const MAX_CHAIN_LENGTH = 6;

export const useRouteStore = create<RouteState>((set, get) => ({
  points: mockRouteData.points,
  edges: mockRouteData.edges,
  nodePositions: {},
  selectedChain: [],
  collapsedCategories: new Set(),
  detailPointId: null,
  searchResultId: null,
  pulseIds: new Set(),
  viewBox: { x: 0, y: 0, w: 1200, h: 800 },
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

  setViewBox: (vb) => set({ viewBox: vb }),

  requestZoom: (type) => set({ zoomAction: { type, ts: Date.now() } }),

  clearZoomAction: () => set({ zoomAction: null }),
}));
