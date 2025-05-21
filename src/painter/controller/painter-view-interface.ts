import type { Layer } from '../painter-types';

export interface PainterViewInterface {
  readonly canvasElement: HTMLCanvasElement | undefined;
  readonly currentColor: string;
  psdDataHistory: { layers: Layer[] }[];
  currentIndex: number;
  currentLayerIndex: number;
  zoom: number;
  renderCanvas(): void;
  saveLayerStateToHistory?(): void;
  editController?: unknown;
}
