import type { App, TFile } from 'obsidian';

export interface Layer {
  name: string;
  visible: boolean;
  opacity: number;
  blendMode: string;
  clippingMask?: boolean;
  canvas: HTMLCanvasElement;
  width?: number;
  height?: number;
  canvasDataUrl?: string;
}

export interface PsdLayerData {
  name: string;
  visible: boolean;
  opacity: number;
  blendMode: string;
  clippingMask?: boolean;
  width: number;
  height: number;
  canvasDataUrl?: string;
  canvas?: HTMLCanvasElement;
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
  
  saveHistory?: () => void;
  undo?: () => void;
  redo?: () => void;
  
  renderCanvas?: () => void;
  
  onPointerDown?: (event: PointerEvent) => void;
  onPointerMove?: (event: PointerEvent) => void;
  onPointerUp?: (event: PointerEvent) => void;
  
  app?: App;
  containerEl?: HTMLElement;
  
  // FileViewから継承されるプロパティ
  file?: TFile;
  
  // Painterビュー固有のプロパティ
  layers?: Layer[];
  currentLayerIndex?: number;
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
