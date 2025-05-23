import React, { useRef, useCallback } from 'react';

export interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SelectionState {
  mode: 'rect' | 'lasso' | 'magic';
  selectionRect?: SelectionRect;
  lassoPoints: { x: number; y: number }[];
  magicClipPath?: Path2D;
  magicOutline?: Path2D;
  magicBounding?: SelectionRect;
  reset: () => void;
  hasSelection: () => boolean;
  getBoundingRect: () => SelectionRect | undefined;
}

export class SelectionController {
  private state: SelectionState;
  private tolerance = 32;
  private isSelecting = false;
  private startX = 0;
  private startY = 0;
  private dashOffset = 0;
  private animId?: number;
  private readonly DASH_ANIMATION_SPEED = 0.5;
  private canvas: HTMLCanvasElement | null = null;
  private renderCallback?: () => void;

  constructor(state: SelectionState, canvas: HTMLCanvasElement | null = null) {
    this.state = state;
    this.canvas = canvas;
  }

  setCanvas(canvas: HTMLCanvasElement | null) {
    this.canvas = canvas;
  }

  setRenderCallback(callback: () => void) {
    this.renderCallback = callback;
  }

  /** 選択モードを切替 */
  setMode(mode: 'rect' | 'lasso' | 'magic') {
    if (this.state.mode !== mode) {
      this.cancelSelection();
    }
    this.state.mode = mode;
  }

  /** ポインターイベント */
  onPointerDown(x: number, y: number) {
    this.startX = x;
    this.startY = y;

    if (this.state.mode === 'magic') {
      this.isSelecting = false;
      this.computeMagicSelection(x, y);
      this.renderCallback?.();
      return;
    }

    this.isSelecting = true;
    if (this.state.mode === 'rect') {
      this.state.selectionRect = { x, y, width: 0, height: 0 };
      this.state.lassoPoints = [];
      this.state.magicClipPath = undefined;
      this.state.magicOutline = undefined;
      this.state.magicBounding = undefined;
    } else {
      this.state.lassoPoints = [{ x, y }];
      this.state.selectionRect = undefined;
      this.state.magicClipPath = undefined;
      this.state.magicOutline = undefined;
      this.state.magicBounding = undefined;
    }

    this.renderCallback?.();
    this.startAnimation();
  }

  onPointerMove(x: number, y: number) {
    if (!this.isSelecting) return;
    
    if (this.state.mode === 'rect') {
      const x0 = Math.min(this.startX, x);
      const y0 = Math.min(this.startY, y);
      const w = Math.abs(x - this.startX);
      const h = Math.abs(y - this.startY);
      this.state.selectionRect = { x: x0, y: y0, width: w, height: h };
    } else {
      this.state.lassoPoints.push({ x, y });
    }
    
    this.renderCallback?.();
  }

  onPointerUp(): boolean {
    if (this.state.mode === 'magic') {
      const has = !!this.state.magicClipPath;
      if (!has) this.cancelSelection();
      return has;
    }

    if (!this.isSelecting) return false;
    this.isSelecting = false;

    let valid = false;
    if (this.state.mode === 'rect') {
      valid = !!(
        this.state.selectionRect &&
        this.state.selectionRect.width > 2 &&
        this.state.selectionRect.height > 2
      );
    } else {
      valid = this.state.lassoPoints.length > 2;
    }

    if (!valid) {
      this.cancelSelection();
    }
    return valid;
  }

  /** キャンバス上に破線枠を描画 */
  drawSelection(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.setLineDash([6]);
    ctx.lineDashOffset = -this.dashOffset;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;

    const path = this.getSelectionPath();
    if (!path) { 
      ctx.restore(); 
      return; 
    }
    
    ctx.stroke(path);
    ctx.restore();
  }

  /** 破線アニメーション */
  private startAnimation() {
    if (this.animId) cancelAnimationFrame(this.animId);
    
    const animate = () => {
      const active = (this.state.mode === 'rect' && !!this.state.selectionRect) ||
                     (this.state.mode === 'lasso' && this.state.lassoPoints.length > 0) ||
                     (this.state.mode === 'magic' && !!this.state.magicClipPath);
      
      if (active) {
        this.dashOffset = (this.dashOffset + this.DASH_ANIMATION_SPEED) % 12;
        this.renderCallback?.();
        this.animId = requestAnimationFrame(animate);
      }
    };
    
    this.animId = requestAnimationFrame(animate);
  }

  private stopAnimation() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = undefined;
    }
  }

  /** 選択をキャンセル */
  cancelSelection() {
    this.state.selectionRect = undefined;
    this.state.lassoPoints = [];
    this.state.magicClipPath = undefined;
    this.state.magicOutline = undefined;
    this.state.magicBounding = undefined;
    this.stopAnimation();
    this.renderCallback?.();
  }

  /** バウンディングボックスを取得 */
  getBoundingRect(): SelectionRect | undefined {
    if (this.state.mode === 'rect') {
      return this.state.selectionRect;
    }
    if (this.state.mode === 'magic') {
      return this.state.magicBounding;
    }
    
    if (this.state.lassoPoints.length === 0) return undefined;
    
    const xs = this.state.lassoPoints.map(p => p.x);
    const ys = this.state.lassoPoints.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }

  /** 自動選択（Magic Wand）の実装 */
  private computeMagicSelection(px: number, py: number) {
    if (!this.canvas) return;
    
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;
    
    const width = this.canvas.width;
    const height = this.canvas.height;

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
    const tol = this.tolerance;

    // Flood fill algorithm
    const queue: { x: number; y: number }[] = [{ x: sx, y: sy }];
    const visited = new Set<number>();

    while (queue.length > 0) {
      const { x, y } = queue.shift()!;
      const idx = toIndex(x, y);

      if (visited.has(idx)) continue;
      if (x < 0 || y < 0 || x >= width || y >= height) continue;

      const dataIdx = toDataIndex(x, y);
      const r = data[dataIdx];
      const g = data[dataIdx + 1];
      const b = data[dataIdx + 2];

      const dr = Math.abs(r - br);
      const dg = Math.abs(g - bg);
      const db = Math.abs(b - bb);

      if (dr + dg + db > tol) continue;

      visited.add(idx);
      mask[idx] = 1;

      queue.push({ x: x + 1, y });
      queue.push({ x: x - 1, y });
      queue.push({ x, y: y + 1 });
      queue.push({ x, y: y - 1 });
    }

    // Create selection path from mask
    this.createSelectionFromMask(mask, width, height);
  }

  private createSelectionFromMask(mask: Uint8Array, width: number, height: number) {
    // 簡略化した実装: バウンディングボックスを計算
    let minX = width, maxX = 0, minY = height, maxY = 0;
    let hasSelection = false;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (mask[y * width + x]) {
          hasSelection = true;
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    }

    if (hasSelection) {
      this.state.magicBounding = {
        x: minX,
        y: minY,
        width: maxX - minX + 1,
        height: maxY - minY + 1
      };

      // Create a simple rectangular path for now
      const path = new Path2D();
      path.rect(minX, minY, maxX - minX + 1, maxY - minY + 1);
      this.state.magicClipPath = path;
    }
  }

  private getSelectionPath(): Path2D | null {
    if (this.state.mode === 'rect' && this.state.selectionRect) {
      const path = new Path2D();
      const { x, y, width, height } = this.state.selectionRect;
      path.rect(x, y, width, height);
      return path;
    }

    if (this.state.mode === 'lasso' && this.state.lassoPoints.length > 0) {
      const path = new Path2D();
      const points = this.state.lassoPoints;
      path.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        path.lineTo(points[i].x, points[i].y);
      }
      path.closePath();
      return path;
    }

    if (this.state.mode === 'magic' && this.state.magicClipPath) {
      return this.state.magicClipPath;
    }

    return null;
  }

  /** 選択があるかどうか */
  hasSelection(): boolean {
    return this.state.hasSelection();
  }
} 