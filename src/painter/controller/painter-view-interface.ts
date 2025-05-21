import type { Layer } from '../painter-types';

export interface PainterViewInterface {
  readonly canvasElement: HTMLCanvasElement | undefined;
  psdDataHistory: { layers: Layer[] }[];
  currentIndex: number;
  currentLayerIndex: number;
  zoom: number;
  renderCanvas(): void;
  editController?: unknown;
}
