import type { Layer } from '../painter-types';
import type { LayersState } from '../hooks/useLayers';
import type { TransformEditController } from '../controller/transform-edit-controller';
import type { SelectionController } from '../controller/selection-controller';
import type { ActionMenuController } from '../controller/action-menu-controller';
import type { SelectionState } from '../hooks/useSelectionState';

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

export interface PainterControllerFactories {
  createSelectionController: (
    view: PainterViewInterface,
    state: SelectionState
  ) => SelectionController;
  createActionMenuController: (
    view: PainterViewInterface,
    state: SelectionState
  ) => ActionMenuController;
}
