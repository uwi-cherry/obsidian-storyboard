import { useRef } from 'react';
import type { SelectionRect } from '../types/ui';

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
  computeMagicSelection: (
    canvas: HTMLCanvasElement,
    px: number,
    py: number
  ) => void;
  updateMaskSelection: (
    canvasSize: { width: number; height: number },
    from: { x: number; y: number },
    to: { x: number; y: number },
    mode: 'select-pen' | 'select-eraser',
    lineWidth: number
  ) => void;
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
      },
      computeMagicSelection(canvas: HTMLCanvasElement, px: number, py: number): void {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const width = canvas.width;
        const height = canvas.height;
        if (px < 0 || py < 0 || px >= width || py >= height) return;

        const img = ctx.getImageData(0, 0, width, height);
        const data = img.data;
        const mask = new Uint8Array(width * height);

        const toIndex = (x: number, y: number) => y * width + x;
        const toDataIndex = (x: number, y: number) => (y * width + x) * 4;

        const sx = Math.round(px);
        const sy = Math.round(py);
        const baseI = toDataIndex(sx, sy);
        const br = data[baseI];
        const bg = data[baseI + 1];
        const bb = data[baseI + 2];

        const stack: number[] = [sx, sy];
        const TOLERANCE = 32;
        while (stack.length) {
          const y = stack.pop();
          const x = stack.pop();
          if (x === undefined || y === undefined) break;
          const idx = toIndex(x, y);
          if (mask[idx]) continue;
          const di = idx * 4;
          const r = data[di];
          const g = data[di + 1];
          const b = data[di + 2];
          if (Math.abs(r - br) > TOLERANCE || Math.abs(g - bg) > TOLERANCE || Math.abs(b - bb) > TOLERANCE) continue;
          mask[idx] = 1;
          if (x > 0) stack.push(x - 1, y);
          if (x < width - 1) stack.push(x + 1, y);
          if (y > 0) stack.push(x, y - 1);
          if (y < height - 1) stack.push(x, y + 1);
        }

        const clipPath = new Path2D();
        const outlinePath = new Path2D();
        let minX = width,
          minY = height,
          maxX = 0,
          maxY = 0;
        let hasSelection = false;

        const isEdge = (x: number, y: number) => {
          if (x < 0 || y < 0 || x >= width || y >= height) return false;
          const idx = toIndex(x, y);
          if (!mask[idx]) return false;
          return (
            (x === 0 || !mask[toIndex(x - 1, y)]) ||
            (x === width - 1 || !mask[toIndex(x + 1, y)]) ||
            (y === 0 || !mask[toIndex(x, y - 1)]) ||
            (y === height - 1 || !mask[toIndex(x, y + 1)])
          );
        };

        for (let y = 0; y < height; y++) {
          let segmentStart = -1;
          for (let x = 0; x < width; x++) {
            const idx = toIndex(x, y);
            if (mask[idx]) {
              hasSelection = true;
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
              clipPath.rect(x, y, 1, 1);
              const edge = isEdge(x, y);
              if (edge) {
                if (segmentStart === -1) segmentStart = x;
              } else if (segmentStart !== -1) {
                outlinePath.moveTo(segmentStart + 0.5, y + 0.5);
                outlinePath.lineTo(x + 0.5, y + 0.5);
                segmentStart = -1;
              }
            } else if (segmentStart !== -1) {
              outlinePath.moveTo(segmentStart + 0.5, y + 0.5);
              outlinePath.lineTo(x + 0.5, y + 0.5);
              segmentStart = -1;
            }
          }
          if (segmentStart !== -1) {
            outlinePath.moveTo(segmentStart + 0.5, y + 0.5);
            outlinePath.lineTo(width + 0.5, y + 0.5);
          }
        }

        if (!hasSelection || minX > maxX || minY > maxY) {
          state.selectionClipPath = undefined;
          state.selectionOutline = undefined;
          state.selectionBounding = undefined;
          state.version++;
          return;
        }

        state.selectionClipPath = clipPath;
        state.selectionOutline = outlinePath;
        state.selectionBounding = {
          x: minX,
          y: minY,
          width: maxX - minX + 1,
          height: maxY - minY + 1
        };
        state.version++;
      },
      updateMaskSelection(
        canvasSize: { width: number; height: number },
        from: { x: number; y: number },
        to: { x: number; y: number },
        mode: 'select-pen' | 'select-eraser',
        lineWidth: number
      ): void {
        if (!state.selectionMask) {
          state.selectionMask = document.createElement('canvas');
          state.selectionMask.width = canvasSize.width;
          state.selectionMask.height = canvasSize.height;

          if (state.selectionClipPath) {
            const mctx = state.selectionMask.getContext('2d');
            if (mctx) {
              mctx.fillStyle = 'white';
              mctx.fill(state.selectionClipPath);
            }
          }
        }

        const mctx = state.selectionMask.getContext('2d');
        if (!mctx) return;

        mctx.lineCap = 'round';
        mctx.lineJoin = 'round';
        mctx.lineWidth = lineWidth;

        if (mode === 'select-eraser') {
          mctx.globalCompositeOperation = 'destination-out';
          mctx.strokeStyle = 'rgba(0,0,0,1)';
        } else {
          mctx.globalCompositeOperation = 'source-over';
          mctx.strokeStyle = 'rgba(255,255,255,1)';
        }

        mctx.beginPath();
        mctx.moveTo(from.x, from.y);
        mctx.lineTo(to.x, to.y);
        mctx.stroke();

        mctx.globalCompositeOperation = 'source-over';

        const { width, height } = state.selectionMask;
        const data = mctx.getImageData(0, 0, width, height).data;
        const clipPath = new Path2D();
        const outlinePath = new Path2D();
        let minX = width,
          minY = height,
          maxX = 0,
          maxY = 0;
        let has = false;

        const idx = (x: number, y: number) => (y * width + x) * 4 + 3;

        for (let y = 0; y < height; y++) {
          let segment = -1;
          for (let x = 0; x < width; x++) {
            const alpha = data[idx(x, y)];
            if (alpha > 0) {
              has = true;
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
              clipPath.rect(x, y, 1, 1);

              const left = x === 0 ? 0 : data[idx(x - 1, y)];
              const right = x === width - 1 ? 0 : data[idx(x + 1, y)];
              const up = y === 0 ? 0 : data[idx(x, y - 1)];
              const down = y === height - 1 ? 0 : data[idx(x, y + 1)];
              const edge = !(left && right && up && down);
              if (edge) {
                if (segment === -1) segment = x;
              } else if (segment !== -1) {
                outlinePath.moveTo(segment + 0.5, y + 0.5);
                outlinePath.lineTo(x + 0.5, y + 0.5);
                segment = -1;
              }
            } else if (segment !== -1) {
              outlinePath.moveTo(segment + 0.5, y + 0.5);
              outlinePath.lineTo(x + 0.5, y + 0.5);
              segment = -1;
            }
          }
          if (segment !== -1) {
            outlinePath.moveTo(segment + 0.5, y + 0.5);
            outlinePath.lineTo(width + 0.5, y + 0.5);
          }
        }

        if (!has) {
          state.selectionClipPath = undefined;
          state.selectionOutline = undefined;
          state.selectionBounding = undefined;
          state.version++;
          return;
        }

        state.selectionClipPath = clipPath;
        state.selectionOutline = outlinePath;
        state.selectionBounding = {
          x: minX,
          y: minY,
          width: maxX - minX + 1,
          height: maxY - minY + 1
        };
        state.version++;
      }
    };
    stateRef.current = state;
  }

  return stateRef.current;
}
