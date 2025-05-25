import { create } from 'zustand';

export type SelectionMode = 'rect' | 'lasso' | 'magic';

export interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SelectionStateSnapshot {
  mode: SelectionMode;
  selectionRect?: SelectionRect;
  lassoPoints: { x: number; y: number }[];
  magicBounding?: SelectionRect;
}

interface SelectionState extends SelectionStateSnapshot {
  setMode: (mode: SelectionMode) => void;
  setSelectionRect: (rect: SelectionRect | undefined) => void;
  setLassoPoints: (points: { x: number; y: number }[]) => void;
  setMagicBounding: (rect: SelectionRect | undefined) => void;
  reset: () => void;
  hasSelection: () => boolean;
  getBoundingRect: () => SelectionRect | undefined;
  applySnapshot: (snapshot: SelectionStateSnapshot) => void;
}

export const useSelectionStateStore = create<SelectionState>((set, get) => ({
  mode: 'rect',
  selectionRect: undefined,
  lassoPoints: [],
  magicBounding: undefined,
  setMode: (mode) => set({ mode }),
  setSelectionRect: (rect) => set({ selectionRect: rect }),
  setLassoPoints: (points) => set({ lassoPoints: points }),
  setMagicBounding: (rect) => set({ magicBounding: rect }),
  reset: () => set({
    selectionRect: undefined,
    lassoPoints: [],
    magicBounding: undefined
  }),
  hasSelection: () => {
    const state = get();
    return (
      (state.mode === 'rect' && !!state.selectionRect) ||
      (state.mode === 'lasso' && state.lassoPoints.length > 0)
    );
  },
  getBoundingRect: () => {
    const state = get();
    if (state.mode === 'rect') {
      return state.selectionRect;
    }
    if (state.mode === 'lasso') {
      if (state.lassoPoints.length === 0) return undefined;
      const xs = state.lassoPoints.map(p => p.x);
      const ys = state.lassoPoints.map(p => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }
    return state.magicBounding;
  },
  applySnapshot: (snapshot) => set({
    mode: snapshot.mode,
    selectionRect: snapshot.selectionRect,
    lassoPoints: [...snapshot.lassoPoints],
    magicBounding: snapshot.magicBounding
  })
}));
