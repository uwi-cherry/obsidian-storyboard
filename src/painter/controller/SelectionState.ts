import type { SelectionRect } from '../painter-types';

export type SelectionMode = 'rect' | 'lasso' | 'magic';

export class SelectionState {
  mode: SelectionMode = 'rect';
  selectionRect?: SelectionRect;
  lassoPoints: { x: number; y: number }[] = [];
  magicClipPath?: Path2D;
  magicOutline?: Path2D;
  magicBounding?: SelectionRect;

  reset() {
    this.selectionRect = undefined;
    this.lassoPoints = [];
    this.magicClipPath = undefined;
    this.magicOutline = undefined;
    this.magicBounding = undefined;
  }

  hasSelection(): boolean {
    return (
      (this.mode === 'rect' && !!this.selectionRect) ||
      (this.mode === 'lasso' && this.lassoPoints.length > 0) ||
      (this.mode === 'magic' && !!this.magicClipPath)
    );
  }

  getBoundingRect(): SelectionRect | undefined {
    if (this.mode === 'rect') {
      return this.selectionRect;
    }
    if (this.mode === 'magic') {
      return this.magicBounding;
    }
    if (this.lassoPoints.length === 0) return undefined;
    const xs = this.lassoPoints.map(p => p.x);
    const ys = this.lassoPoints.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }
}
