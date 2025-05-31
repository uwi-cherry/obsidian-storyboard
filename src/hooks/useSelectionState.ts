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
  version: number; // 強制再レンダリング用
  
  // 統一された選択領域表現（マスクベース）
  selectionMask?: HTMLCanvasElement;
  selectionClipPath?: Path2D;
  selectionOutline?: Path2D;
  selectionBounding?: SelectionRect;
  
  // 作業用の一時データ（モード固有の編集中データ）
  tempRect?: SelectionRect;
  tempLassoPoints: { x: number; y: number }[];
  
  reset: () => void;
  hasSelection: () => boolean;
  getBoundingRect: () => SelectionRect | undefined;
  setMode: (newMode: SelectionMode) => void;
  forceUpdate: () => void;
}

export default function useSelectionState(): SelectionState {
  const stateRef = useRef<SelectionState | null>(null);

  if (!stateRef.current) {
    const state: SelectionState = {
      mode: 'rect',
      version: 0,
      
      // 統一された選択領域
      selectionMask: undefined,
      selectionClipPath: undefined,
      selectionOutline: undefined,
      selectionBounding: undefined,
      
      // 作業用の一時データ
      tempRect: undefined,
      tempLassoPoints: [],
      
      reset() {
        state.selectionMask = undefined;
        state.selectionClipPath = undefined;
        state.selectionOutline = undefined;
        state.selectionBounding = undefined;
        state.tempRect = undefined;
        state.tempLassoPoints = [];
      },
      hasSelection(): boolean {
        return !!(state.selectionMask || state.selectionClipPath);
      },
      getBoundingRect(): SelectionRect | undefined {
        return state.selectionBounding;
      },
      setMode(newMode: SelectionMode): void {
        state.mode = newMode;
        // 作業用データのみクリア、既存選択は保持
        state.tempRect = undefined;
        state.tempLassoPoints = [];
        state.version++;
      },
      forceUpdate(): void {
        state.version++;
      }
    };
    stateRef.current = state;
  }

  return stateRef.current;
}
