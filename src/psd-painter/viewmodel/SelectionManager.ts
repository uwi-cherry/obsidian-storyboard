import { ActionMenu } from '../components/ActionMenu';
import { DEFAULT_COLOR } from '../constants';
import { SelectionRect } from '../psd-painter-types';
import { PsdView } from '../psd-painter-view';

export type { SelectionRect };


export class SelectionManager {
  private view: PsdView;
  private actionMenu?: ActionMenu;
  private selectionRect?: SelectionRect;
  private mode: 'rect' | 'lasso' | 'magic' = 'rect';
  private lassoPoints: { x: number; y: number }[] = [];
  private magicClipPath?: Path2D;   // 選択内を示すパス（clip 用）
  private magicOutline?: Path2D;    // 境界線のみのパス（表示用）
  private magicBounding?: SelectionRect;
  private tolerance = 32; // マジックワンド許容誤差
  private isSelecting = false;
  private startX = 0;
  private startY = 0;
  private dashOffset = 0;
  private animId?: number;
  private readonly DASH_ANIMATION_SPEED = 0.5; // アニメーション速度を遅くする

  constructor(view: PsdView) {
    this.view = view;
  }

  /** ActionMenuを設定 */
  public setActionMenu(menu: ActionMenu) {
    this.actionMenu = menu;
  }

  /** 選択モードを切替 (rect | lasso | magic) */
  public setMode(mode: 'rect' | 'lasso' | 'magic') {
    // モード切替時は現在の選択をリセット
    if (this.mode !== mode) {
      this.cancelSelection();
    }
    this.mode = mode;
  }

  /** Pointer イベント */
  onPointerDown(x: number, y: number) {
    this.startX = x;
    this.startY = y;
    this.hideActionMenu();

    if (this.mode === 'magic') {
      // クリックした時点で色ベースの選択を作成
      this.isSelecting = false;
      this.computeMagicSelection(x, y);
      this.view.renderCanvas();
      return;
    }

    // rect または lasso の場合はドラッグ選択
    this.isSelecting = true;
    if (this.mode === 'rect') {
      this.selectionRect = { x, y, width: 0, height: 0 };
      this.lassoPoints = [];
      this.magicClipPath = undefined;
      this.magicOutline = undefined;
      this.magicBounding = undefined;
    } else {
      this.lassoPoints = [{ x, y }];
      this.selectionRect = undefined;
      this.magicClipPath = undefined;
      this.magicOutline = undefined;
      this.magicBounding = undefined;
    }

    this.view.renderCanvas();
    this.startAnimation();
  }

  onPointerMove(x: number, y: number) {
    if (!this.isSelecting) return;
    if (this.mode === 'rect') {
      const x0 = Math.min(this.startX, x);
      const y0 = Math.min(this.startY, y);
      const w = Math.abs(x - this.startX);
      const h = Math.abs(y - this.startY);
      this.selectionRect = { x: x0, y: y0, width: w, height: h };
    } else {
      this.lassoPoints.push({ x, y });
    }
    this.view.renderCanvas();
  }

  onPointerUp() {
    if (!this.isSelecting) return;
    this.isSelecting = false;

    let valid = false;
    if (this.mode === 'rect') {
      valid = !!(this.selectionRect && this.selectionRect.width > 2 && this.selectionRect.height > 2);
    } else {
      valid = this.lassoPoints.length > 2;
    }

    if (valid) {
      this.showActionMenu();
    } else {
      this.cancelSelection();
    }
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
      const active = (this.mode === 'rect' && !!this.selectionRect) ||
                     (this.mode === 'lasso' && this.lassoPoints.length > 0) ||
                     (this.mode === 'magic' && !!this.magicClipPath);
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
  private showActionMenu() {
    if (!this.actionMenu) return;
    const bounding = this.getBoundingRect();
    if (!bounding) return;
    this.actionMenu.showSelection(bounding, this);
  }

  private hideActionMenu() {
    this.actionMenu?.hide();
  }

  /** 操作 */
  cancelSelection() {
    this.selectionRect = undefined;
    this.lassoPoints = [];
    this.magicClipPath = undefined;
    this.magicOutline = undefined;
    this.magicBounding = undefined;
    this.hideActionMenu();
    this.stopAnimation();
    // 選択解除後はグローバルメニューを表示
    this.actionMenu?.showGlobal();
    this.view.renderCanvas();
  }

  copySelection() {
    if (this.mode === 'rect' && !this.selectionRect) return;
    if (this.mode === 'lasso' && this.lassoPoints.length === 0) return;
    if (this.mode === 'magic' && !this.magicClipPath) return;

    const bounding = this.getBoundingRect();
    const copyCanvas = document.createElement('canvas');
    copyCanvas.width = bounding.width;
    copyCanvas.height = bounding.height;
    const ctx = copyCanvas.getContext('2d');
if (!ctx) return;

    if (this.mode === 'rect') {
      if (!this.view.canvasElement) return;
      ctx.drawImage(
        this.view.canvasElement,
        bounding.x,
        bounding.y,
        bounding.width,
        bounding.height,
        0,
        0,
        bounding.width,
        bounding.height
      );
    } else if (this.mode === 'lasso') {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(this.lassoPoints[0].x - bounding.x, this.lassoPoints[0].y - bounding.y);
      for (let i = 1; i < this.lassoPoints.length; i++) {
        ctx.lineTo(this.lassoPoints[i].x - bounding.x, this.lassoPoints[i].y - bounding.y);
      }
      ctx.closePath();
      ctx.clip();
      if (!this.view.canvasElement) return;
      ctx.drawImage(this.view.canvasElement, -bounding.x, -bounding.y);
      ctx.restore();
    } else {
      // magic
      ctx.save();
      ctx.translate(-bounding.x, -bounding.y);
      if (this.magicClipPath) {
        if (this.magicClipPath) {
          ctx.clip(this.magicClipPath);
        }
      }
      if (!this.view.canvasElement) return;
      ctx.drawImage(this.view.canvasElement, -bounding.x, -bounding.y);
      ctx.restore();
    }
    copyCanvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        // @ts-ignore ClipboardItem はブラウザ環境で定義される
        await navigator.clipboard.write([
          // @ts-ignore
          new ClipboardItem({ [blob.type]: blob })
        ]);
      } catch (e) {
        console.error('Clipboard write failed', e);
      }
    });
  }

  private modifyCurrentLayer(cb: (ctx: CanvasRenderingContext2D) => void) {
    const layerCtx =
      this.view.psdDataHistory[this.view.currentIndex].layers[
        this.view.currentLayerIndex
      ].canvas.getContext('2d');
if (!layerCtx) return;
    cb(layerCtx);
    // ヒストリ保存
    if (typeof (this.view as PsdView).saveLayerStateToHistory === 'function') {
        (this.view as PsdView).saveLayerStateToHistory();
    }
  }

  clearSelection() {
    // 選択が無い場合はキャンバス全体を対象
    let bounding: SelectionRect;
    const hasSelection = (this.mode === 'rect' && !!this.selectionRect) ||
                         (this.mode === 'lasso' && this.lassoPoints.length > 0) ||
                         (this.mode === 'magic' && !!this.magicClipPath);

    if (hasSelection) {
      bounding = this.getBoundingRect();
    } else {
      if (!this.view.canvasElement) return;
      bounding = { x: 0, y: 0, width: this.view.canvasElement.width, height: this.view.canvasElement.height };
    }

    this.modifyCurrentLayer((ctx) => {
      if (hasSelection && this.mode === 'lasso') {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(this.lassoPoints[0].x, this.lassoPoints[0].y);
        for (let i = 1; i < this.lassoPoints.length; i++) {
          ctx.lineTo(this.lassoPoints[i].x, this.lassoPoints[i].y);
        }
        ctx.closePath();
        ctx.clip();
        ctx.clearRect(bounding.x, bounding.y, bounding.width, bounding.height);
        ctx.restore();
      } else if (hasSelection && this.mode === 'magic') {
        ctx.save();
        if (this.magicClipPath) {
          if (this.magicClipPath) {
            ctx.clip(this.magicClipPath);
          }
        }
        ctx.clearRect(bounding.x, bounding.y, bounding.width, bounding.height);
        ctx.restore();
      } else {
        ctx.clearRect(bounding.x, bounding.y, bounding.width, bounding.height);
      }
    });
    this.cancelSelection();
  }

  cutSelection() {
    this.copySelection();
    this.clearSelection();
  }

  fillSelection() {
    // 選択が無い場合はキャンバス全体を対象
    let bounding: SelectionRect;
    const hasSelection = (this.mode === 'rect' && !!this.selectionRect) ||
                         (this.mode === 'lasso' && this.lassoPoints.length > 0) ||
                         (this.mode === 'magic' && !!this.magicClipPath);

    if (hasSelection) {
      bounding = this.getBoundingRect();
    } else {
      if (!this.view.canvasElement) return;
      bounding = { x: 0, y: 0, width: this.view.canvasElement.width, height: this.view.canvasElement.height };
    }

    this.modifyCurrentLayer((ctx) => {
      ctx.fillStyle = this.view.currentColor ?? DEFAULT_COLOR;
      if (hasSelection && this.mode === 'lasso') {
        // lasso 選択時のみクリッピング
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(this.lassoPoints[0].x, this.lassoPoints[0].y);
        for (let i = 1; i < this.lassoPoints.length; i++) {
          ctx.lineTo(this.lassoPoints[i].x, this.lassoPoints[i].y);
        }
        ctx.closePath();
        ctx.clip();
        ctx.fillRect(bounding.x, bounding.y, bounding.width, bounding.height);
        ctx.restore();
      } else if (hasSelection && this.mode === 'magic') {
        ctx.save();
        if (this.magicClipPath) {
          if (this.magicClipPath) {
            ctx.clip(this.magicClipPath);
          }
        }
        ctx.fillRect(bounding.x, bounding.y, bounding.width, bounding.height);
        ctx.restore();
      } else {
        ctx.fillRect(bounding.x, bounding.y, bounding.width, bounding.height);
      }
    });
    this.cancelSelection();
  }

  private getBoundingRect(): SelectionRect {
    if (this.mode === 'rect') {
      return this.selectionRect as SelectionRect;
    }
    if (this.mode === 'magic') {
      return this.magicBounding as SelectionRect;
    }
    const xs = this.lassoPoints.map(p => p.x);
    const ys = this.lassoPoints.map(p => p.y);
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
      // 選択無し
      this.magicClipPath = undefined;
      this.magicOutline = undefined;
      this.magicBounding = undefined;
      return;
    }

    this.magicClipPath = clipPath;
    this.magicOutline = outlinePath;
    this.magicBounding = {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
    };

    // 描画更新 & アニメーション & メニュー表示
    this.startAnimation();
    this.showActionMenu();
  }

  /** 現在の選択を Path2D で取得 (共通化) */
  private getSelectionPath(): Path2D | null {
    if (this.mode === 'rect') {
      if (!this.selectionRect) return null;
      const p = new Path2D();
      p.rect(this.selectionRect.x + 0.5, this.selectionRect.y + 0.5, this.selectionRect.width, this.selectionRect.height);
      return p;
    }
    if (this.mode === 'lasso') {
      if (this.lassoPoints.length === 0) return null;
      const p = new Path2D();
      p.moveTo(this.lassoPoints[0].x + 0.5, this.lassoPoints[0].y + 0.5);
      for (let i = 1; i < this.lassoPoints.length; i++) {
        p.lineTo(this.lassoPoints[i].x + 0.5, this.lassoPoints[i].y + 0.5);
      }
      p.closePath();
      return p;
    }
    // magic
    return this.magicOutline ?? null;
  }
} 