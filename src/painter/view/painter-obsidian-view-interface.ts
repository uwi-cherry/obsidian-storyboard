import type { Layer } from '../painter-types';
import type { LayersState } from '../hooks/useLayers';
import type { TransformEditController } from '../controller/transform-edit-controller';

export interface PainterViewInterface {
  readonly canvasElement: HTMLCanvasElement | undefined;
  readonly currentColor: string;
  psdDataHistory: { layers: Layer[] }[];
  currentIndex: number;
  currentLayerIndex: number;
  layers: LayersState;
  zoom: number;
  renderCanvas(): void;
  saveLayerStateToHistory?(): void;
  editController?: TransformEditController;
}
