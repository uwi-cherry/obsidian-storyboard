
import { DEFAULT_COLOR } from '../constants';
import type { SelectionRect } from '../painter-types';
import type { PsdView } from '../view/painter-obsidian-view';
import { ActionMenu } from '../view/components/ActionMenu';
import { SelectionState } from './SelectionState';

export class ActionMenuManager {
  private menu: ActionMenu;

  constructor(private view: PsdView, private state: SelectionState) {
    this.menu = new ActionMenu(view);
  }

  dispose() {
    this.menu.dispose();
  }

  showGlobal() {
    this.menu.showGlobal({
      fill: () => this.fillSelection(),
      clear: () => this.clearSelection(),
    });
  }

  showSelection(onCancel: () => void) {
    const rect = this.state.getBoundingRect();
    if (!rect) return;
    this.menu.showSelection(rect, {
      fill: () => this.fillSelection(),
      clear: () => this.clearSelection(),
      cancel: onCancel,
    });
  }

  hide() {
    this.menu.hide();
  }

  private modifyCurrentLayer(cb: (ctx: CanvasRenderingContext2D) => void) {
    const layerCtx =
      this.view.psdDataHistory[this.view.currentIndex].layers[
        this.view.currentLayerIndex
      ].canvas.getContext('2d');
    if (!layerCtx) return;
    cb(layerCtx);
    if (typeof (this.view as PsdView).saveLayerStateToHistory === 'function') {
      (this.view as PsdView).saveLayerStateToHistory();
    }
  }

  copySelection() {
    if (!this.state.hasSelection()) return;
    const bounding = this.state.getBoundingRect();
    if (!bounding) return;

    const copyCanvas = document.createElement('canvas');
    copyCanvas.width = bounding.width;
    copyCanvas.height = bounding.height;
    const ctx = copyCanvas.getContext('2d');
    if (!ctx) return;

    if (this.state.mode === 'rect') {
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
    } else if (this.state.mode === 'lasso') {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(this.state.lassoPoints[0].x - bounding.x, this.state.lassoPoints[0].y - bounding.y);
      for (let i = 1; i < this.state.lassoPoints.length; i++) {
        ctx.lineTo(this.state.lassoPoints[i].x - bounding.x, this.state.lassoPoints[i].y - bounding.y);
      }
      ctx.closePath();
      ctx.clip();
      if (!this.view.canvasElement) return;
      ctx.drawImage(this.view.canvasElement, -bounding.x, -bounding.y);
      ctx.restore();
    } else {
      ctx.save();
      ctx.translate(-bounding.x, -bounding.y);
      if (this.state.magicClipPath) {
        ctx.clip(this.state.magicClipPath);
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

  clearSelection() {
    let bounding: SelectionRect;
    const hasSelection = this.state.hasSelection();

    if (hasSelection) {
      const rect = this.state.getBoundingRect();
      if (!rect) return;
      bounding = rect;
    } else {
      const canvas = this.view.canvasElement;
      if (!canvas) return;
      bounding = { x: 0, y: 0, width: canvas.width, height: canvas.height };
    }

    this.modifyCurrentLayer((ctx) => {
      if (hasSelection && this.state.mode === 'lasso') {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(this.state.lassoPoints[0].x, this.state.lassoPoints[0].y);
        for (let i = 1; i < this.state.lassoPoints.length; i++) {
          ctx.lineTo(this.state.lassoPoints[i].x, this.state.lassoPoints[i].y);
        }
        ctx.closePath();
        ctx.clip();
        ctx.clearRect(bounding.x, bounding.y, bounding.width, bounding.height);
        ctx.restore();
      } else if (hasSelection && this.state.mode === 'magic') {
        ctx.save();
        if (this.state.magicClipPath) {
          ctx.clip(this.state.magicClipPath);
        }
        ctx.clearRect(bounding.x, bounding.y, bounding.width, bounding.height);
        ctx.restore();
      } else {
        ctx.clearRect(bounding.x, bounding.y, bounding.width, bounding.height);
      }
    });
  }

  cutSelection() {
    this.copySelection();
    this.clearSelection();
  }

  fillSelection() {
    let bounding: SelectionRect;
    const hasSelection = this.state.hasSelection();

    if (hasSelection) {
      const rect = this.state.getBoundingRect();
      if (!rect) return;
      bounding = rect;
    } else {
      const canvas = this.view.canvasElement;
      if (!canvas) return;
      bounding = { x: 0, y: 0, width: canvas.width, height: canvas.height };
    }

    this.modifyCurrentLayer((ctx) => {
      ctx.fillStyle = this.view.currentColor ?? DEFAULT_COLOR;
      if (hasSelection && this.state.mode === 'lasso') {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(this.state.lassoPoints[0].x, this.state.lassoPoints[0].y);
        for (let i = 1; i < this.state.lassoPoints.length; i++) {
          ctx.lineTo(this.state.lassoPoints[i].x, this.state.lassoPoints[i].y);
        }
        ctx.closePath();
        ctx.clip();
        ctx.fillRect(bounding.x, bounding.y, bounding.width, bounding.height);
        ctx.restore();
      } else if (hasSelection && this.state.mode === 'magic') {
        ctx.save();
        if (this.state.magicClipPath) {
          ctx.clip(this.state.magicClipPath);
        }
        ctx.fillRect(bounding.x, bounding.y, bounding.width, bounding.height);
        ctx.restore();
      } else {
        ctx.fillRect(bounding.x, bounding.y, bounding.width, bounding.height);
      }
    });
  }
}

