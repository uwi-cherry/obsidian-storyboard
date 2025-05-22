// Controller for layer change notifications
export interface ILayerChangeController {
  onChange(cb: () => void): void;
  emitChange(): void;
}

export class LayerChangeController implements ILayerChangeController {
  private listeners: Array<() => void> = [];

  onChange(cb: () => void): void {
    this.listeners.push(cb);
  }

  emitChange(): void {
    for (const cb of this.listeners) {
      cb();
    }
  }
}
