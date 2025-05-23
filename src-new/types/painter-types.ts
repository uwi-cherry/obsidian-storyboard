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
  canvasWidth: number;
  canvasHeight: number;
  history?: Array<{
    layers: Layer[];
    currentLayerIndex: number;
  }>;
  historyIndex?: number;
}

export interface PainterView {
  _canvas?: HTMLCanvasElement | null;
  _painterData?: PainterData;
  
  // 履歴機能
  saveHistory?: () => void;
  undo?: () => void;
  redo?: () => void;
  
  // 描画機能
  renderCanvas?: () => void;
  
  // イベント処理
  onPointerDown?: (event: PointerEvent) => void;
  onPointerMove?: (event: PointerEvent) => void;
  onPointerUp?: (event: PointerEvent) => void;
  
  // その他のプロパティ
  app?: any;
  containerEl?: HTMLElement;
}

export interface PainterViewData {
  painterView: PainterView | null;
  layers: Layer[];
  currentLayerIndex: number;
  canvasTransform: {
    zoom: number;
    rotation: number;
    offsetX: number;
    offsetY: number;
  };
} 