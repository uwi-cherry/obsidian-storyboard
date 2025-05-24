import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react';
import { Layer, PainterView, PainterData } from '../../types/painter-types';
import { toolRegistry } from '../../service-api/core/tool-registry';
import { TFile } from 'obsidian';

interface LayerContextValue {
  view: PainterView | null;
  layers: Layer[];
  currentLayerIndex: number;
  painterData: PainterData | null;
  currentFile: TFile | null;
  setLayers: (layers: Layer[]) => void;
  setCurrentLayerIndex: (index: number) => void;
  addLayer: (layer: Layer) => void;
  deleteLayer: (index: number) => void;
  updateLayer: (index: number, updates: Partial<Layer>) => void;
  duplicateLayer: (index: number) => void;
  mergeDown: (index: number) => void;
  flattenImage: () => void;
  initializePainterData: (view: PainterView) => void;
  loadFromFile: (file: TFile) => Promise<void>;
  saveToFile: (file?: TFile) => Promise<void>;
  setCurrentFile: (file: TFile | null) => void;
}

const LayerContext = createContext<LayerContextValue | null>(null);

interface LayerProviderProps {
  children: ReactNode;
  view?: PainterView | any;
}

export function LayerProvider({ children, view }: LayerProviderProps) {
  const [painterView, setPainterView] = useState<PainterView | null>(null);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [currentLayerIndex, setCurrentLayerIndex] = useState(0);
  const [painterData, setPainterData] = useState<PainterData | null>(null);
  const [currentFile, setCurrentFile] = useState<TFile | null>(null);

  // PainterViewを初期化
  const initializePainterData = useCallback(async (view: PainterView) => {
    if (!view) return;
    try {
      await toolRegistry.executeTool('initialize_painter_data', { view });
    } catch (error) {
      console.error('Failed to initialize painter data:', error);
    }
  }, []);

  // PainterViewが提供されている場合は、それを設定・初期化
  useEffect(() => {
    if (view && view !== painterView) {
      setPainterView(view);
      initializePainterData(view);
    }
  }, [view, painterView, initializePainterData]);

  const updateLayers = useCallback((newLayers: Layer[]) => {
    setLayers(newLayers);
  }, []);

  const updateCurrentLayerIndex = useCallback(async (index: number) => {
    if (!view || index < 0 || index >= layers.length) return;
    setCurrentLayerIndex(index);
    try {
      await toolRegistry.executeTool('set_current_layer', { view, index });
    } catch (error) {
      console.error('Failed to set current layer:', error);
    }
  }, [view, layers.length]);

  const addLayer = useCallback(async (layer: Layer) => {
    if (!view) return;
    try {
      await toolRegistry.executeTool('add_layer', {
        view,
        name: layer.name
      });
    } catch (error) {
      console.error('Failed to add layer:', error);
    }
  }, [view]);

  const deleteLayer = useCallback(async (index: number) => {
    if (!view) return;
    try {
      await toolRegistry.executeTool('delete_layer', { view, index });
    } catch (error) {
      console.error('Failed to delete layer:', error);
    }
  }, [view]);

  const updateLayer = useCallback(async (index: number, updates: Partial<Layer>) => {
    if (!view) return;
    try {
      await toolRegistry.executeTool('update_layer', { view, index, updates });
    } catch (error) {
      console.error('Failed to update layer:', error);
    }
  }, [view]);

  const duplicateLayer = useCallback(async (index: number) => {
    if (!view) return;
    try {
      await toolRegistry.executeTool('duplicate_layer', { view, index });
    } catch (error) {
      console.error('Failed to duplicate layer:', error);
    }
  }, [view]);

  const mergeDown = useCallback((index: number) => {
    if (index <= 0 || index >= layers.length) return;
    
    const upperLayer = layers[index];
    const lowerLayer = layers[index - 1];
    
    // 下のレイヤーに上のレイヤーを合成
    const lowerCtx = lowerLayer.canvas.getContext('2d');
    if (lowerCtx) {
      lowerCtx.globalAlpha = upperLayer.opacity;
      lowerCtx.globalCompositeOperation = upperLayer.blendMode as GlobalCompositeOperation;
      lowerCtx.drawImage(upperLayer.canvas, 0, 0);
      lowerCtx.globalAlpha = 1;
      lowerCtx.globalCompositeOperation = 'source-over';
    }
    
    // 上のレイヤーを削除
    deleteLayer(index);
  }, [layers, deleteLayer]);

  const flattenImage = useCallback(() => {
    if (layers.length === 0) return;
    
    const firstLayer = layers[0];
    const flattenedCanvas = document.createElement('canvas');
    flattenedCanvas.width = firstLayer.canvas.width;
    flattenedCanvas.height = firstLayer.canvas.height;
    
    const flattenedCtx = flattenedCanvas.getContext('2d');
    if (!flattenedCtx) return;
    
    // 全レイヤーを合成
    layers.forEach(layer => {
      if (layer.visible) {
        flattenedCtx.globalAlpha = layer.opacity;
        flattenedCtx.globalCompositeOperation = layer.blendMode as GlobalCompositeOperation;
        flattenedCtx.drawImage(layer.canvas, 0, 0);
      }
    });
    
    flattenedCtx.globalAlpha = 1;
    flattenedCtx.globalCompositeOperation = 'source-over';
    
    // 統合されたレイヤーで置き換え
    const flattenedLayer: Layer = {
      name: '統合',
      visible: true,
      opacity: 1,
      blendMode: 'normal',
      canvas: flattenedCanvas
    };
    
    setLayers([flattenedLayer]);
    setCurrentLayerIndex(0);
  }, [layers]);

  const loadFromFile = useCallback(async (file: TFile) => {
    if (!file) return;
    try {
      const result = await toolRegistry.executeTool('load_painter_file', {
        app: view?.app,
        file
      });
      const psdData = JSON.parse(result);
      if (psdData.layers && psdData.layers.length > 0) {
        setLayers(psdData.layers);
        setCurrentLayerIndex(0);
        setCurrentFile(file);
      }
    } catch (error) {
      console.error('Failed to load file:', error);
    }
  }, [view]);

  // PSDファイルオープンイベントを監視してレイヤーを自動ロード
  useEffect(() => {
    const handlePsdFileOpened = async (e: Event) => {
      const custom = e as CustomEvent;
      const { file } = custom.detail || {};
      if (!file || !view?.app) return;

      try {
        await loadFromFile(file);
      } catch (error) {
        console.error('PSDファイルの自動ロードに失敗しました:', error);
      }
    };

    window.addEventListener('psd-file-opened', handlePsdFileOpened as EventListener);
    return () => {
      window.removeEventListener('psd-file-opened', handlePsdFileOpened as EventListener);
    };
  }, [loadFromFile, view]);

  const saveToFile = useCallback(async (file?: TFile) => {
    const targetFile = file || currentFile;
    if (!targetFile || layers.length === 0) return;
    try {
      await toolRegistry.executeTool('save_painter_file', {
        app: view?.app,
        file: targetFile,
        layers
      });
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  }, [view, currentFile, layers]);

  const value: LayerContextValue = {
    view: painterView,
    layers,
    currentLayerIndex,
    painterData,
    currentFile,
    setLayers: updateLayers,
    setCurrentLayerIndex: updateCurrentLayerIndex,
    addLayer,
    deleteLayer,
    updateLayer,
    duplicateLayer,
    mergeDown,
    flattenImage,
    initializePainterData,
    loadFromFile,
    saveToFile,
    setCurrentFile,
  };

  return (
    <LayerContext.Provider value={value}>
      {children}
    </LayerContext.Provider>
  );
}

export function useLayerContext(): LayerContextValue {
  const context = useContext(LayerContext);
  if (!context) {
    throw new Error('useLayerContext must be used within a LayerProvider');
  }
  return context;
}
