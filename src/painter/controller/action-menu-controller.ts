
import type { PainterView } from '../view/painter-obsidian-view';
import { ActionMenu } from '../view/components/ActionMenu';
import type { SelectionState } from '../hooks/useSelectionState';
import { DEFAULT_COLOR } from '../../constants';
import type { SelectionRect } from '../painter-types';
import { TransformEditController } from './transform-edit-controller';

export class ActionMenuController {
  private menu: ActionMenu;

  constructor(
    private view: PainterView,
    private state: SelectionState
  ) {
    this.menu = new ActionMenu(view as any);
  }

  dispose() {
    this.menu.dispose();
  }

  showGlobal() {
    this.menu.showGlobal({
      fill: () => this.fill(),
      clear: () => this.clear(),
      edit: () => this.edit(),
    });
  }

  showSelection(onCancel: () => void) {
    const rect = this.state.getBoundingRect();
    if (!rect) return;
    this.menu.showSelection(rect, {
      fill: () => this.fill(),
      clear: () => this.clear(),
      edit: () => this.edit(),
      cancel: () => {
        onCancel();
        this.showGlobal();
      },
    });
  }

  hide() {
    this.menu.hide();
  }

  private modifyCurrentLayer(cb: (ctx: CanvasRenderingContext2D) => void) {
    const layerCtx =
      this.view.layers.history[this.view.layers.currentIndex].layers[
        this.view.layers.currentLayerIndex
      ].canvas.getContext('2d');
    if (!layerCtx) return;
    cb(layerCtx);
    if (typeof (this.view as any).saveLayerStateToHistory === 'function') {
      (this.view as any).saveLayerStateToHistory();
    }
  }

  private getBounding(): SelectionRect | undefined {
    if (this.state.hasSelection()) {
      return this.state.getBoundingRect();
    }
    const canvas = this.view.canvasElement;
    if (!canvas) return undefined;
    return { x: 0, y: 0, width: canvas.width, height: canvas.height };
  }

  fill() {
    const bounding = this.getBounding();
    if (!bounding) return;
    const hasSelection = this.state.hasSelection();
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

  clear() {
    const bounding = this.getBounding();
    if (!bounding) return;
    const hasSelection = this.state.hasSelection();
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

  edit() {
    if (this.view.editController) {
      return;
    }
    let rect: SelectionRect | undefined;
    if (this.state.hasSelection()) {
      rect = this.state.getBoundingRect();
    } else {
      const canvas = this.view.canvasElement;
      if (canvas) {
        rect = { x: 0, y: 0, width: canvas.width, height: canvas.height };
      }
    }
    if (!rect) return;
    this.view.editController = new TransformEditController(this.view, rect, () => {
      this.view.editController = undefined;
    });
    this.view.editController.start();
  }
}

