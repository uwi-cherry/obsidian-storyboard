import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Layer } from '../../../types/painter-types';
import { toolRegistry } from '../../../service-api/core/tool-registry';
import { TFile } from 'obsidian';

// シンプルなdebounce関数
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout | null = null;
  return ((...args: any[]) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

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
}

export const useLayersStore = create<LayersState>()(
  subscribeWithSelector((set) => ({
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
  }))
);

// 自動保存機能
const autoSave = debounce(async (layers: Layer[], isInitialLoad: boolean, currentPsdFile: TFile | null) => {
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
}, 5000); // デバウンス時間を5秒に延長

// レイヤーの変更を監視して自動保存
useLayersStore.subscribe(
  (state) => {
    // 空のレイヤー配列の場合は保存しない
    if (state.layers.length > 0) {
      autoSave(state.layers, state.isInitialLoad, state.currentPsdFile);
    }
  }
);

// PSDファイル切り替え時の処理
useLayersStore.subscribe(
  (state, prevState) => {
    // PSDファイルが変更された場合（PSDファイル→別PSDファイル、またはPSDファイル→null）
    if (prevState.currentPsdFile && 
        (state.currentPsdFile?.path !== prevState.currentPsdFile?.path || state.currentPsdFile === null)) {
      console.log('🔄 PSDファイル切り替え検知:', prevState.currentPsdFile.path);
      
      const app = (window as any).app;
      
      if (prevState.layers.length > 0 && app && prevState.currentPsdFile.extension === 'psd') {
        toolRegistry.executeTool('save_painter_file', {
          app,
          file: prevState.currentPsdFile,
          layers: prevState.layers
        }).then(() => {
          console.log('✅ 前のPSDファイル保存完了:', prevState.currentPsdFile?.path);
        }).catch((error) => {
          console.error('❌ 前のPSDファイル保存エラー:', error);
        });
      }
    }
  }
);

// 手動保存機能（必要に応じて使用）
export async function manualSavePainter() {
  const layersStore = useLayersStore.getState();
  const currentPsdFileStore = layersStore.currentPsdFile;
  const app = (window as any).app;
  
  if (layersStore.layers.length > 0 && currentPsdFileStore && app && currentPsdFileStore.extension === 'psd') {
    
    try {
      await toolRegistry.executeTool('save_painter_file', {
        app,
        file: currentPsdFileStore,
        layers: layersStore.layers
      });
      
      return true;
    } catch (error) {
      return false;
    }
  }
  
  return false;
} 