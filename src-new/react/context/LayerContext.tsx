import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react';
import { Layer, PainterView, PainterData } from '../../types/painter-types';

interface LayerContextValue {
  view: PainterView | null;
  layers: Layer[];
  currentLayerIndex: number;
  painterData: PainterData | null;
  setLayers: (layers: Layer[]) => void;
  setCurrentLayerIndex: (index: number) => void;
  addLayer: (layer: Layer) => void;
  deleteLayer: (index: number) => void;
  updateLayer: (index: number, updates: Partial<Layer>) => void;
  duplicateLayer: (index: number) => void;
  mergeDown: (index: number) => void;
  flattenImage: () => void;
  initializePainterData: (view: PainterView) => void;
}

const LayerContext = createContext<LayerContextValue | null>(null);

interface LayerProviderProps {
  children: ReactNode;
  view?: PainterView | any;
}

export function LayerProvider({ children, view }: LayerProviderProps) {
  const [painterView, setPainterView] = useState<PainterView | null>(null);
  const instanceIdRef = useRef<string>(Math.random().toString(36).slice(2));
  const [layers, setLayers] = useState<Layer[]>([]);
  const [currentLayerIndex, setCurrentLayerIndex] = useState(0);
  const [painterData, setPainterData] = useState<PainterData | null>(null);

  // PainterViewを初期化
  const initializePainterData = useCallback((view: PainterView) => {
    if (!view) return;
    
    setPainterView(view);
    
    // 既存のレイヤーをロード
    if (view._painterData?.layers && view._painterData.layers.length > 0) {
      setLayers(view._painterData.layers);
      setCurrentLayerIndex(view._painterData.currentLayerIndex || 0);
      setPainterData(view._painterData);
    } else {
      // 新しいデフォルトレイヤーを作成
      const defaultLayer: Layer = {
        name: '背景',
        visible: true,
        opacity: 1,
        blendMode: 'normal',
        canvas: document.createElement('canvas')
      };
      
      // キャンバスを初期化
      defaultLayer.canvas.width = 800;
      defaultLayer.canvas.height = 600;
      const ctx = defaultLayer.canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, defaultLayer.canvas.width, defaultLayer.canvas.height);
      }
      
      const initialLayers = [defaultLayer];
      const initialData: PainterData = {
        layers: initialLayers,
        currentLayerIndex: 0,
        canvasWidth: 800,
        canvasHeight: 600
      };
      
      setLayers(initialLayers);
      setCurrentLayerIndex(0);
      setPainterData(initialData);
      
      // viewにデータを保存
      view._painterData = initialData;
    }
  }, []);

  // 他の LayerProvider からの更新を受け取る
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail) return;
      if (detail.view === painterView && detail.source !== instanceIdRef.current) {
        if (Array.isArray(detail.layers)) {
          setLayers(detail.layers);
        }
        if (typeof detail.currentLayerIndex === 'number') {
          setCurrentLayerIndex(detail.currentLayerIndex);
        }
      }
    };
    window.addEventListener('layer-context-sync', handler as EventListener);
    return () => window.removeEventListener('layer-context-sync', handler as EventListener);
  }, [painterView]);

  // レイヤー更新時にviewにも保存
  useEffect(() => {
    if (painterView && painterData) {
      painterView._painterData = {
        ...painterData,
        layers,
        currentLayerIndex
      };
      window.dispatchEvent(
        new CustomEvent('layer-context-sync', {
          detail: {
            view: painterView,
            layers,
            currentLayerIndex,
            source: instanceIdRef.current,
          }
        })
      );
    }
  }, [layers, currentLayerIndex, painterView, painterData]);

  const updateLayers = useCallback((newLayers: Layer[]) => {
    setLayers(newLayers);
  }, []);

  const updateCurrentLayerIndex = useCallback((index: number) => {
    if (index >= 0 && index < layers.length) {
      setCurrentLayerIndex(index);
    }
  }, [layers.length]);

  const addLayer = useCallback((layer: Layer) => {
    const newLayers = [...layers, layer];
    setLayers(newLayers);
    setCurrentLayerIndex(newLayers.length - 1);
  }, [layers]);

  const deleteLayer = useCallback((index: number) => {
    if (layers.length <= 1) return; // 最後のレイヤーは削除不可
    
    const newLayers = layers.filter((_, i) => i !== index);
    setLayers(newLayers);
    
    // currentLayerIndexを調整
    if (currentLayerIndex >= newLayers.length) {
      setCurrentLayerIndex(newLayers.length - 1);
    } else if (currentLayerIndex > index) {
      setCurrentLayerIndex(currentLayerIndex - 1);
    }
  }, [layers, currentLayerIndex]);

  const updateLayer = useCallback((index: number, updates: Partial<Layer>) => {
    if (index < 0 || index >= layers.length) return;
    
    const newLayers = [...layers];
    newLayers[index] = { ...newLayers[index], ...updates };
    setLayers(newLayers);
  }, [layers]);

  const duplicateLayer = useCallback((index: number) => {
    if (index < 0 || index >= layers.length) return;
    
    const layerToDuplicate = layers[index];
    const newCanvas = document.createElement('canvas');
    newCanvas.width = layerToDuplicate.canvas.width;
    newCanvas.height = layerToDuplicate.canvas.height;
    
    const newCtx = newCanvas.getContext('2d');
    if (newCtx) {
      newCtx.drawImage(layerToDuplicate.canvas, 0, 0);
    }
    
    const duplicatedLayer: Layer = {
      ...layerToDuplicate,
      name: `${layerToDuplicate.name} コピー`,
      canvas: newCanvas
    };
    
    const newLayers = [...layers];
    newLayers.splice(index + 1, 0, duplicatedLayer);
    setLayers(newLayers);
    setCurrentLayerIndex(index + 1);
  }, [layers]);

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

  const value: LayerContextValue = {
    view: painterView,
    layers,
    currentLayerIndex,
    painterData,
    setLayers: updateLayers,
    setCurrentLayerIndex: updateCurrentLayerIndex,
    addLayer,
    deleteLayer,
    updateLayer,
    duplicateLayer,
    mergeDown,
    flattenImage,
    initializePainterData,
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
