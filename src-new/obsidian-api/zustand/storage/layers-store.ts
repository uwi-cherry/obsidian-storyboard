import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Layer } from '../../../types/painter-types';
import { toolRegistry } from '../../../service-api/core/tool-registry';
import { TFile } from 'obsidian';
import { AdaptiveDebouncer } from '../adaptive-debouncer';

interface LayersState {
  layers: Layer[];
  currentPsdFile: TFile | null;
  isInitialLoad: boolean;
  setLayers: (layers: Layer[]) => void;
  addLayer: (layer: Layer) => void;
  removeLayer: (index: number) => void;
  toggleLayerVisibility: (index: number) => void;
  setLayerOpacity: (index: number, opacity: number) => void;
  setLayerBlendMode: (index: number, blendMode: string) => void;
  renameLayer: (index: number, name: string) => void;
  clearLayers: () => void;
  setInitialLoad: (isLoading: boolean) => void;
  setCurrentPsdFile: (file: TFile | null) => void;
  clearCurrentPsdFile: () => void;
  getCurrentSaveDelay: () => number;
  triggerAutoSave: () => void;
}

// 自動保存機能
const autoSave = new AdaptiveDebouncer(async (layers: Layer[], isInitialLoad: boolean, currentPsdFile: TFile | null) => {
  // 初期読み込み中は自動保存しない
  if (isInitialLoad) {
    return;
  }

  // レイヤーが空、ファイルがない、PSDファイルでない場合はスキップ
  if (layers.length === 0 || !currentPsdFile || currentPsdFile.extension !== 'psd') {
    return;
  }

  try {
    // Obsidianのappインスタンスを取得
    const app = (window as any).app;
    
    if (app) {
      console.log('💾 自動保存開始:', currentPsdFile.path);
      
      await toolRegistry.executeTool('save_painter_file', {
        app,
        file: currentPsdFile,
        layers
      });
      
      console.log('✅ 自動保存完了:', currentPsdFile.path);
    } else {
      console.warn('⚠️ Obsidian appインスタンスが見つかりません');
    }
  } catch (error) {
    console.error('❌ 自動保存エラー:', error);
  }
});

export const useLayersStore = create<LayersState>()(
  subscribeWithSelector((set, get) => ({
    layers: [],
    currentPsdFile: null,
    isInitialLoad: false,
    
    setLayers: (layers) => set({ layers }),
    
    addLayer: (layer) => set((state) => ({
      layers: [...state.layers, layer]
    })),
    
    removeLayer: (index) => set((state) => ({
      layers: state.layers.filter((_, i) => i !== index)
    })),
    
    toggleLayerVisibility: (index) => set((state) => ({
      layers: state.layers.map((layer, i) => 
        i === index ? { ...layer, visible: !layer.visible } : layer
      )
    })),
    
    setLayerOpacity: (index, opacity) => set((state) => ({
      layers: state.layers.map((layer, i) => 
        i === index ? { ...layer, opacity } : layer
      )
    })),
    
    setLayerBlendMode: (index, blendMode) => set((state) => ({
      layers: state.layers.map((layer, i) => 
        i === index ? { ...layer, blendMode } : layer
      )
    })),
    
    renameLayer: (index, name) => set((state) => ({
      layers: state.layers.map((layer, i) => 
        i === index ? { ...layer, name } : layer
      )
    })),
    
    clearLayers: () => set({ layers: [], currentPsdFile: null }),
    
    setInitialLoad: (isLoading) => set({ isInitialLoad: isLoading }),
    
    setCurrentPsdFile: (file) => set({ currentPsdFile: file }),
    clearCurrentPsdFile: () => set({ currentPsdFile: null }),
    
    getCurrentSaveDelay: () => autoSave.getCurrentDelay(),
    
    triggerAutoSave: () => {
      const state = get();
      if (state.layers.length > 0) {
        autoSave.execute(state.layers, state.isInitialLoad, state.currentPsdFile);
      }
    },
  }))
);

// レイヤーの変更を監視して自動保存
useLayersStore.subscribe(
  (state) => {
    state.triggerAutoSave();
  }
);