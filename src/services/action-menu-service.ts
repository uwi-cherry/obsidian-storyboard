import { DEFAULT_COLOR } from '../constants';
import type { SelectionState } from '../painter/hooks/useSelectionState';
import type { SelectionRect } from '../painter/painter-types';
import type { PainterView } from '../painter/view/painter-obsidian-view';
import { TransformEditController } from '../painter/controller/transform-edit-controller';

export interface IActionMenuService {
  fill(view: PainterView, state: SelectionState): void;
  clear(view: PainterView, state: SelectionState): void;
  edit(view: PainterView, state: SelectionState): void;
}

export class ActionMenuService implements IActionMenuService {
  private modifyCurrentLayer(
    view: PainterView,
    cb: (ctx: CanvasRenderingContext2D) => void
  ) {
    const layerCtx =
      view.layers.history[view.layers.currentIndex].layers[
        view.layers.currentLayerIndex
      ].canvas.getContext('2d');
    if (!layerCtx) return;
    cb(layerCtx);
    if (typeof view.saveLayerStateToHistory === 'function') {
      view.saveLayerStateToHistory();
    }
  }

  private getBounding(
    view: PainterView,
    state: SelectionState
  ): SelectionRect | undefined {
    if (state.hasSelection()) {
      return state.getBoundingRect();
    }
    const canvas = view.canvasElement;
    if (!canvas) return undefined;
    return { x: 0, y: 0, width: canvas.width, height: canvas.height };
  }

  fill(view: PainterView, state: SelectionState) {
    const bounding = this.getBounding(view, state);
    if (!bounding) return;
    const hasSelection = state.hasSelection();
    this.modifyCurrentLayer(view, (ctx) => {
      ctx.fillStyle = view.currentColor ?? DEFAULT_COLOR;
      if (hasSelection && state.mode === 'lasso') {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(state.lassoPoints[0].x, state.lassoPoints[0].y);
        for (let i = 1; i < state.lassoPoints.length; i++) {
          ctx.lineTo(state.lassoPoints[i].x, state.lassoPoints[i].y);
        }
        ctx.closePath();
        ctx.clip();
        ctx.fillRect(bounding.x, bounding.y, bounding.width, bounding.height);
        ctx.restore();
      } else if (hasSelection && state.mode === 'magic') {
        ctx.save();
        if (state.magicClipPath) {
          ctx.clip(state.magicClipPath);
        }
        ctx.fillRect(bounding.x, bounding.y, bounding.width, bounding.height);
        ctx.restore();
      } else {
        ctx.fillRect(bounding.x, bounding.y, bounding.width, bounding.height);
      }
    });
  }

  clear(view: PainterView, state: SelectionState) {
    const bounding = this.getBounding(view, state);
    if (!bounding) return;
    const hasSelection = state.hasSelection();
    this.modifyCurrentLayer(view, (ctx) => {
      if (hasSelection && state.mode === 'lasso') {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(state.lassoPoints[0].x, state.lassoPoints[0].y);
        for (let i = 1; i < state.lassoPoints.length; i++) {
          ctx.lineTo(state.lassoPoints[i].x, state.lassoPoints[i].y);
        }
        ctx.closePath();
        ctx.clip();
        ctx.clearRect(bounding.x, bounding.y, bounding.width, bounding.height);
        ctx.restore();
      } else if (hasSelection && state.mode === 'magic') {
        ctx.save();
        if (state.magicClipPath) {
          ctx.clip(state.magicClipPath);
        }
        ctx.clearRect(bounding.x, bounding.y, bounding.width, bounding.height);
        ctx.restore();
      } else {
        ctx.clearRect(bounding.x, bounding.y, bounding.width, bounding.height);
      }
    });
  }

  edit(view: PainterView, state: SelectionState) {
    if (view.editController) {
      return;
    }
    let rect: SelectionRect | undefined;
    if (state.hasSelection()) {
      rect = state.getBoundingRect();
    } else {
      const canvas = view.canvasElement;
      if (canvas) {
        rect = { x: 0, y: 0, width: canvas.width, height: canvas.height };
      }
    }
    if (!rect) return;
    view.editController = new TransformEditController(view, rect, () => {
      view.editController = undefined;
    });
    view.editController.start();
  }
}
