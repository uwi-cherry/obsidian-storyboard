import { create } from "domain";
import etro from "etro";
import { TFile } from "obsidian";
import { toolRegistry } from "src/service/core/tool-registry";
import { subscribeWithSelector } from "zustand/middleware";
import { AdaptiveDebouncer } from "./adaptive-debouncer";


interface LayersState {
  layers: import('src/types/painter-types').Layer[];
  currentPsdFile: TFile | null;
  updateLayers: (layers: import('src/types/painter-types').Layer[]) => void;
  initializeLayers: (layers: import('src/types/painter-types').Layer[]) => void;
  addLayer: (layer: import('src/types/painter-types').Layer) => void;
  removeLayer: (index: number) => void;
  toggleLayerVisibility: (index: number) => void;
  setLayerOpacity: (index: number, opacity: number) => void;
  setLayerBlendMode: (index: number, blendMode: string) => void;
  setLayerClippingMask: (index: number, clipping: boolean) => void;
  renameLayer: (index: number, name: string) => void;
  clearLayers: () => void;
  setCurrentPsdFile: (file: TFile | null) => void;
  clearCurrentPsdFile: () => void;
  getCurrentSaveDelay: () => number;
  triggerAutoSave: () => void;
}

// 自動保存機能
const autoSave = new AdaptiveDebouncer(async (layers: Layer[], currentPsdFile: TFile | null) => {
  // レイヤーが空、ファイルがない、PSDファイルでない場合はスキップ
  if (layers.length === 0 || !currentPsdFile || currentPsdFile.extension !== 'psd') {
    return;
  }

  try {
    // Obsidianのappインスタンスを取得
    const app = (window as any).app;

    if (app) {
      await toolRegistry.executeTool('save_painter_file', {
        app,
        file: currentPsdFile,
        layers
      });
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

    updateLayers: (layers) => {
      set({ layers });
      // setLayersは自動保存を実行
      const state = get();
      if (state.layers.length > 0) {
        autoSave.execute(state.layers, state.currentPsdFile);
      }
    },

    initializeLayers: (layers) => {
      // initializeLayersは自動保存を実行しない
      set({ layers });
    },

    addLayer: (layer) => set((state) => ({
      layers: [...state.layers, layer]
    })),

    removeLayer: (index) => set((state) => ({
      layers: state.layers.filter((_, i) => i !== index)
    })),

    toggleLayerVisibility: (index) => {
      set((state) => ({
        layers: state.layers.map((layer, i) =>
          i === index ? { ...layer, visible: !layer.visible } : layer
        )
      }));
      // 自動保存をトリガー
      const state = get();
      if (state.layers.length > 0) {
        autoSave.execute(state.layers, state.currentPsdFile);
      }
    },

    setLayerOpacity: (index, opacity) => {
      set((state) => ({
        layers: state.layers.map((layer, i) =>
          i === index ? { ...layer, opacity } : layer
        )
      }));
      // 自動保存をトリガー
      const state = get();
      if (state.layers.length > 0) {
        autoSave.execute(state.layers, state.currentPsdFile);
      }
    },

    setLayerBlendMode: (index, blendMode) => {
      set((state) => ({
        layers: state.layers.map((layer, i) =>
          i === index ? { ...layer, blendMode } : layer
        )
      }));
      // 自動保存をトリガー
      const state = get();
      if (state.layers.length > 0) {
        autoSave.execute(state.layers, state.currentPsdFile);
      }
    },

    setLayerClippingMask: (index, clipping) => {
      set((state) => ({
        layers: state.layers.map((layer, i) =>
          i === index ? { ...layer, clippingMask: clipping } : layer
        )
      }));
      const state = get();
      if (state.layers.length > 0) {
        autoSave.execute(state.layers, state.currentPsdFile);
      }
    },

    renameLayer: (index, name) => {
      set((state) => ({
        layers: state.layers.map((layer, i) =>
          i === index ? { ...layer, name } : layer
        )
      }));
      // 自動保存をトリガー
      const state = get();
      if (state.layers.length > 0) {
        autoSave.execute(state.layers, state.currentPsdFile);
      }
    },

    clearLayers: () => set({ layers: [], currentPsdFile: null }),

    setCurrentPsdFile: (file) => set({ currentPsdFile: file }),
    clearCurrentPsdFile: () => set({ currentPsdFile: null }),

    getCurrentSaveDelay: () => autoSave.getCurrentDelay(),

    triggerAutoSave: () => {
      const state = get();
      if (state.layers.length > 0) {
        autoSave.execute(state.layers, state.currentPsdFile);
      }
    },
  }))
);
