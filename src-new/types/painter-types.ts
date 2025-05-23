export interface Layer {
  name: string;
  visible: boolean;
  opacity: number;
  blendMode: string;
  canvas: HTMLCanvasElement;
}

export interface PainterData {
  layers: Layer[];
  currentLayerIndex: number;
  width: number;
  height: number;
}

export interface PainterViewData {
  layers: Layer[];
  currentLayerIndex: number;
  zoom: number;
  rotation: number;
  setLayers?: React.Dispatch<React.SetStateAction<Layer[]>>;
  setCurrentLayerIndex?: React.Dispatch<React.SetStateAction<number>>;
  saveHistory?: () => void;
} 