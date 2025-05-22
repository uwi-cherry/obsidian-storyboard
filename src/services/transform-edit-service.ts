import type { SelectionRect } from '../painter/painter-types';
import type { PainterView } from '../painter/view/painter-obsidian-view';
import { TransformEditController } from '../painter/controller/transform-edit-controller';

export interface ITransformEditService {
  start(view: PainterView, rect: SelectionRect): void;
  addFinishHandler(handler: () => void): void;
  finish(): void;
}

export class TransformEditService implements ITransformEditService {
  private finishHandlers: Array<() => void> = [];

  start(view: PainterView, rect: SelectionRect) {
    if (view.editController) return;
    view.editController = new TransformEditController(view, rect, this);
    view.editController.start();
  }

  addFinishHandler(handler: () => void) {
    this.finishHandlers.push(handler);
  }

  finish() {
    this.finishHandlers.forEach(h => h());
    this.finishHandlers = [];
  }
}

