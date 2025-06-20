import { create } from "zustand";
import { TFile } from "obsidian";
import { toolRegistry } from "src/service/core/tool-registry";
import { subscribeWithSelector } from "zustand/middleware";
import { AdaptiveDebouncer } from "./adaptive-debouncer";
import type { Layer } from 'src/types/painter-types';


interface LayersState {
  layers: Layer[];
  currentPsdFile: TFile | null;
  mergedCanvas: HTMLCanvasElement | null;
  updateLayers: (layers: Layer[]) => void;
  initializeLayers: (layers: Layer[]) => void;
  addLayer: (layer: Layer) => void;
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
  generateMergedCanvas: (width: number, height: number) => HTMLCanvasElement | null;
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
    mergedCanvas: null,

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

    generateMergedCanvas: (width: number, height: number) => {
      const { layers } = get();
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (layers && layers.length > 0) {
        layers.forEach((layer: Layer, index: number) => {
          if (layer.visible && layer.canvas) {
            const originalAlpha = ctx.globalAlpha;
            ctx.globalAlpha = layer.opacity !== undefined ? layer.opacity : 1;

            const originalCompositeOperation = ctx.globalCompositeOperation;
            if (layer.blendMode && layer.blendMode !== 'normal') {
              try {
                ctx.globalCompositeOperation = layer.blendMode as GlobalCompositeOperation;
              } catch (e) {
                console.error(e);
              }
            }

            try {
              if (layer.clippingMask && index > 0) {
                // クリッピングマスク: 現在のレイヤーを直下のレイヤーの形でクリップ
                const baseLayer = layers[index - 1];
                if (baseLayer && baseLayer.canvas && baseLayer.visible) {
                  const temp = document.createElement('canvas');
                  temp.width = layer.canvas.width;
                  temp.height = layer.canvas.height;
                  const tctx = temp.getContext('2d');
                  if (tctx) {
                    // まず直下のレイヤーを描画（マスクとして使用）
                    tctx.drawImage(baseLayer.canvas, 0, 0);
                    // 現在のレイヤーをマスク内に描画
                    tctx.globalCompositeOperation = 'source-in';
                    tctx.drawImage(layer.canvas, 0, 0);
                    ctx.drawImage(temp, 0, 0);
                  }
                } else {
                  ctx.drawImage(layer.canvas, 0, 0);
                }
              } else {
                ctx.drawImage(layer.canvas, 0, 0);
              }
            } catch (error) {
              console.error(error);
            }

            ctx.globalAlpha = originalAlpha;
            ctx.globalCompositeOperation = originalCompositeOperation;
          }
        });
      }

      set({ mergedCanvas: canvas });
      return canvas;
    },
  }))
);
