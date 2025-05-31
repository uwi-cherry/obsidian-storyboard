import { useRef } from 'react';
import type { SelectionRect } from '../../types/ui';

export type SelectionMode =
  | 'none'
  | 'rect'
  | 'lasso'
  | 'magic'
  | 'select-pen'
  | 'select-eraser';


export interface SelectionState {
  mode: SelectionMode;
  selectionRect?: SelectionRect;
  lassoPoints: { x: number; y: number }[];
  magicClipPath?: Path2D;
  magicOutline?: Path2D;
  magicBounding?: SelectionRect;
  maskCanvas?: HTMLCanvasElement;
  maskClipPath?: Path2D;
  maskOutline?: Path2D;
  maskBounding?: SelectionRect;
  reset: () => void;
  hasSelection: () => boolean;
  getBoundingRect: () => SelectionRect | undefined;
}

export default function useSelectionState(): SelectionState {
  const stateRef = useRef<SelectionState | null>(null);

  if (!stateRef.current) {
    const state: SelectionState = {
      mode: 'rect',
      selectionRect: undefined,
      lassoPoints: [],
      magicClipPath: undefined,
      magicOutline: undefined,
      magicBounding: undefined,
      maskCanvas: undefined,
      maskClipPath: undefined,
      maskOutline: undefined,
      maskBounding: undefined,
      reset() {
        state.selectionRect = undefined;
        state.lassoPoints = [];
        state.magicClipPath = undefined;
        state.magicOutline = undefined;
        state.magicBounding = undefined;
        state.maskCanvas = undefined;
        state.maskClipPath = undefined;
        state.maskOutline = undefined;
        state.maskBounding = undefined;
      },
      hasSelection(): boolean {
        return (
          (state.mode === 'rect' && !!state.selectionRect) ||
          (state.mode === 'lasso' && state.lassoPoints.length > 0) ||
          (state.mode === 'magic' && !!state.magicClipPath) ||
          ((state.mode === 'select-pen' || state.mode === 'select-eraser') && !!state.maskClipPath)
        );
      },
      getBoundingRect(): SelectionRect | undefined {
        if (state.mode === 'rect') {
          return state.selectionRect;
        }
        if (state.mode === 'magic') {
          return state.magicBounding;
        }
        if (state.mode === 'select-pen' || state.mode === 'select-eraser') {
          return state.maskBounding;
        }
        if (state.lassoPoints.length === 0) return undefined;
        const xs = state.lassoPoints.map(p => p.x);
        const ys = state.lassoPoints.map(p => p.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
      }
    };
    stateRef.current = state;
  }

  return stateRef.current;
}
