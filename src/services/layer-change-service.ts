export interface ILayerChangeService {
  onChange(cb: () => void): void;
  emitChange(): void;
}

export class LayerChangeService implements ILayerChangeService {
  private callbacks: Array<() => void> = [];

  onChange(cb: () => void): void {
    this.callbacks.push(cb);
  }

  emitChange(): void {
    for (const cb of this.callbacks) {
      cb();
    }
  }
}
