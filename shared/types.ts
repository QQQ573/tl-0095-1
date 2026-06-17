export interface Point {
  id: string;
  name: string;
  category: 'humanity' | 'ecology';
  minStayMinutes: number;
  openTime: string;
  closeWindow: string;
  summary: string;
  educationWeight: number;
  isCategory?: boolean;
  parentId?: string | null;
}

export interface Edge {
  id: string;
  from: string;
  to: string;
  walkMinutes: number;
}

export interface RouteData {
  points: Point[];
  edges: Edge[];
}

export interface NodePosition {
  id: string;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface ChainConflictInfo {
  hasConflict: boolean;
  conflicts: string[];
  totalWalkMinutes: number;
  totalStayMinutes: number;
  totalMinutes: number;
}
