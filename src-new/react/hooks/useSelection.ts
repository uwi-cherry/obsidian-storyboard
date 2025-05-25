import { useRef, useState } from 'react';
import useSelectionState, { SelectionMode, SelectionRect, SelectionState } from './useSelectionState';

export interface MagicSelectionResult {
  clipPath?: Path2D;
  outline?: Path2D;
  bounding?: SelectionRect;
}

export function computeMagicSelection(
  canvas: HTMLCanvasElement | null,
  px: number,
  py: number,
  tolerance = 32
): MagicSelectionResult {
  if (!canvas) return {};
  const ctx = canvas.getContext('2d');
  if (!ctx) return {};
  const width = canvas.width;
  const height = canvas.height;

  if (px < 0 || py < 0 || px >= width || py >= height) return {};

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
  const tol = tolerance;

  const stack: number[] = [sx, sy];
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
    if (Math.abs(r - br) > tol || Math.abs(g - bg) > tol || Math.abs(b - bb) > tol) continue;
    mask[idx] = 1;
    if (x > 0) stack.push(x - 1, y);
    if (x < width - 1) stack.push(x + 1, y);
    if (y > 0) stack.push(x, y - 1);
    if (y < height - 1) stack.push(x, y + 1);
  }

  const clipPath = new Path2D();
  const outlinePath = new Path2D();
  let minX = width, minY = height, maxX = 0, maxY = 0;
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
        } else {
          if (segmentStart !== -1) {
            outlinePath.moveTo(segmentStart + 0.5, y + 0.5);
            outlinePath.lineTo(x + 0.5, y + 0.5);
            segmentStart = -1;
          }
        }
      } else {
        if (segmentStart !== -1) {
          outlinePath.moveTo(segmentStart + 0.5, y + 0.5);
          outlinePath.lineTo(x + 0.5, y + 0.5);
          segmentStart = -1;
        }
      }
    }
    if (segmentStart !== -1) {
      outlinePath.moveTo(segmentStart + 0.5, y + 0.5);
      outlinePath.lineTo(width + 0.5, y + 0.5);
    }
  }

  if (!hasSelection || minX > maxX || minY > maxY) {
    return {};
  }

  return {
    clipPath,
    outline: outlinePath,
    bounding: {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1
    }
  };
}

export interface SelectionController {
  state: SelectionState;
  setMode: (mode: SelectionMode) => void;
  onPointerDown: (x: number, y: number) => void;
  onPointerMove: (x: number, y: number) => void;
  onPointerUp: () => boolean;
  draw: (ctx: CanvasRenderingContext2D) => void;
  cancel: () => void;
  tick: number;
}

export default function useSelection(
  canvasRef: React.RefObject<HTMLCanvasElement>
): SelectionController {
  const state = useSelectionState();
  const [tick, setTick] = useState(0);
  const forceRender = () => setTick(t => t + 1);
  const isSelecting = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const dashOffset = useRef(0);
  const animId = useRef<number>();
  const DASH_ANIMATION_SPEED = 0.5;

  const getSelectionPath = (): Path2D | null => {
    if (state.mode === 'rect') {
      if (!state.selectionRect) return null;
      const p = new Path2D();
      p.rect(state.selectionRect.x + 0.5, state.selectionRect.y + 0.5, state.selectionRect.width, state.selectionRect.height);
      return p;
    }
    if (state.mode === 'lasso') {
      if (state.lassoPoints.length === 0) return null;
      const p = new Path2D();
      p.moveTo(state.lassoPoints[0].x + 0.5, state.lassoPoints[0].y + 0.5);
      for (let i = 1; i < state.lassoPoints.length; i++) {
        p.lineTo(state.lassoPoints[i].x + 0.5, state.lassoPoints[i].y + 0.5);
      }
      p.closePath();
      return p;
    }
    return state.magicOutline ?? null;
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.setLineDash([6]);
    ctx.lineDashOffset = -dashOffset.current;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    const path = getSelectionPath();
    if (path) ctx.stroke(path);
    ctx.restore();
  };

  const startAnimation = () => {
    if (animId.current) cancelAnimationFrame(animId.current);
    const animate = () => {
      if (state.hasSelection()) {
        dashOffset.current = (dashOffset.current + DASH_ANIMATION_SPEED) % 12;
        forceRender();
        animId.current = requestAnimationFrame(animate);
      }
    };
    animId.current = requestAnimationFrame(animate);
  };

  const stopAnimation = () => {
    if (animId.current) {
      cancelAnimationFrame(animId.current);
      animId.current = undefined;
    }
  };

  const cancel = () => {
    state.reset();
    stopAnimation();
    forceRender();
  };

  const setMode = (mode: SelectionMode) => {
    if (state.mode !== mode) {
      cancel();
    }
    state.mode = mode;
  };

  const onPointerDown = (x: number, y: number) => {
    startX.current = x;
    startY.current = y;
    if (state.mode === 'magic') {
      isSelecting.current = false;
      const res = computeMagicSelection(canvasRef.current, x, y);
      state.magicClipPath = res.clipPath;
      state.magicOutline = res.outline;
      state.magicBounding = res.bounding;
      forceRender();
      startAnimation();
      return;
    }
    isSelecting.current = true;
    if (state.mode === 'rect') {
      state.selectionRect = { x, y, width: 0, height: 0 };
      state.lassoPoints = [];
      state.magicClipPath = undefined;
      state.magicOutline = undefined;
      state.magicBounding = undefined;
    } else {
      state.lassoPoints = [{ x, y }];
      state.selectionRect = undefined;
      state.magicClipPath = undefined;
      state.magicOutline = undefined;
      state.magicBounding = undefined;
    }
    forceRender();
    startAnimation();
  };

  const onPointerMove = (x: number, y: number) => {
    if (!isSelecting.current) return;
    if (state.mode === 'rect') {
      const x0 = Math.min(startX.current, x);
      const y0 = Math.min(startY.current, y);
      const w = Math.abs(x - startX.current);
      const h = Math.abs(y - startY.current);
      state.selectionRect = { x: x0, y: y0, width: w, height: h };
    } else {
      state.lassoPoints.push({ x, y });
    }
    forceRender();
  };

  const onPointerUp = (): boolean => {
    if (state.mode === 'magic') {
      const has = !!state.magicClipPath;
      if (!has) cancel();
      return has;
    }
    if (!isSelecting.current) return false;
    isSelecting.current = false;
    let valid = false;
    if (state.mode === 'rect') {
      valid = !!(state.selectionRect && state.selectionRect.width > 2 && state.selectionRect.height > 2);
    } else {
      valid = state.lassoPoints.length > 2;
    }
    if (!valid) cancel();
    return valid;
  };

  return { state, setMode, onPointerDown, onPointerMove, onPointerUp, draw, cancel, tick };
}
