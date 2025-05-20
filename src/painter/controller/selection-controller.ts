import { SelectionRect } from '../painter-types';
import { PainterView } from '../view/painter-obsidian-view';
import type { SelectionState } from '../hooks/useSelectionState';

export type { SelectionRect };


export class SelectionController {
  private view: PainterView;
  private state: SelectionState;
  private tolerance = 32; // マジックワンド許容誤差
  private isSelecting = false;
  private startX = 0;
  private startY = 0;
  private dashOffset = 0;
  private animId?: number;
  private readonly DASH_ANIMATION_SPEED = 0.5; // アニメーション速度を遅くする

  constructor(view: PainterView, state: SelectionState) {
    this.view = view;
    this.state = state;
  }

  /** 選択モードを切替 (rect | lasso | magic) */
  public setMode(mode: 'rect' | 'lasso' | 'magic') {
    if (this.state.mode !== mode) {
      this.cancelSelection();
    }
    this.state.mode = mode;
  }

  /** Pointer イベント */
  onPointerDown(x: number, y: number) {
    this.startX = x;
    this.startY = y;

    if (this.state.mode === 'magic') {
      // クリックした時点で色ベースの選択を作成
      this.isSelecting = false;
      this.computeMagicSelection(x, y);
      this.view.renderCanvas();
      return;
    }

    // rect または lasso の場合はドラッグ選択
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

    this.view.renderCanvas();
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
    this.view.renderCanvas();
  }

  onPointerUp(): boolean {
    // Magic ワンドは onPointerDown 時点で選択範囲が確定するため
    // isSelecting フラグに関わらず選択の有無を判定する
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
    if (!path) { ctx.restore(); return; }
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
        this.view.renderCanvas();
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

  /** アクションメニュー */

  /** 操作 */
  cancelSelection() {
    this.state.selectionRect = undefined;
    this.state.lassoPoints = [];
    this.state.magicClipPath = undefined;
    this.state.magicOutline = undefined;
    this.state.magicBounding = undefined;
    this.stopAnimation();
    this.view.renderCanvas();
  }


  private getBoundingRect(): SelectionRect {
    if (this.state.mode === 'rect') {
      return this.state.selectionRect as SelectionRect;
    }
    if (this.state.mode === 'magic') {
      return this.state.magicBounding as SelectionRect;
    }
    const xs = this.state.lassoPoints.map(p => p.x);
    const ys = this.state.lassoPoints.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }

  /** Magic ワンドにより選択領域を計算 */
  private computeMagicSelection(px: number, py: number) {
    const canvas = this.view.canvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
if (!ctx) return;
    const width = canvas.width;
    const height = canvas.height;

    // 範囲外なら無視
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

    const stack: number[] = [sx, sy];
    while (stack.length) {
      const y = stack.pop();
if (y === undefined) return;
      const x = stack.pop();
if (x === undefined) return;
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

    // 境界線を検出
    const clipPath = new Path2D();
    const outlinePath = new Path2D();
    let minX = width, minY = height, maxX = 0, maxY = 0;
    let hasSelection = false;

    // 境界線を検出する関数
    const isEdge = (x: number, y: number) => {
      if (x < 0 || y < 0 || x >= width || y >= height) return false;
      const idx = toIndex(x, y);
      if (!mask[idx]) return false;
      // 上下左右のいずれかが未選択なら境界
      return (x === 0 || !mask[toIndex(x - 1, y)]) ||
             (x === width - 1 || !mask[toIndex(x + 1, y)]) ||
             (y === 0 || !mask[toIndex(x, y - 1)]) ||
             (y === height - 1 || !mask[toIndex(x, y + 1)]);
    };

    // パス生成 (clipPath: 全ピクセル, outlinePath: 境界線)
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
          // clipPath は常に追加
          clipPath.rect(x, y, 1, 1);
          // outline 判定
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
      this.state.magicClipPath = undefined;
      this.state.magicOutline = undefined;
      this.state.magicBounding = undefined;
      return;
    }

    this.state.magicClipPath = clipPath;
    this.state.magicOutline = outlinePath;
    this.state.magicBounding = {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
    };

    // 描画更新 & アニメーション & メニュー表示
    this.startAnimation();
    // メニュー表示は呼び出し側で行う
  }

  /** 現在の選択を Path2D で取得 (共通化) */
  private getSelectionPath(): Path2D | null {
    if (this.state.mode === 'rect') {
      if (!this.state.selectionRect) return null;
      const p = new Path2D();
      p.rect(this.state.selectionRect.x + 0.5, this.state.selectionRect.y + 0.5, this.state.selectionRect.width, this.state.selectionRect.height);
      return p;
    }
    if (this.state.mode === 'lasso') {
      if (this.state.lassoPoints.length === 0) return null;
      const p = new Path2D();
      p.moveTo(this.state.lassoPoints[0].x + 0.5, this.state.lassoPoints[0].y + 0.5);
      for (let i = 1; i < this.state.lassoPoints.length; i++) {
        p.lineTo(this.state.lassoPoints[i].x + 0.5, this.state.lassoPoints[i].y + 0.5);
      }
      p.closePath();
      return p;
    }
    return this.state.magicOutline ?? null;
  }
} 