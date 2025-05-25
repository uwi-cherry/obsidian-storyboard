import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Layer } from '../../../types/painter-types';
import { toolRegistry } from '../../../service-api/core/tool-registry';
import { TFile } from 'obsidian';

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

const autoSave = debounce(async (layers: Layer[], isInitialLoad: boolean) => {
  if (isInitialLoad) {
    console.log('🔄 初期読み込み中のため自動保存をスキップ');
    return;
  }

  try {
    const currentPsdFileStore = useLayersStore.getState().currentPsdFile;
    const currentFile = currentPsdFileStore;
    
    const app = (window as any).app;
    
    if (layers.length > 0 && currentFile && app && currentFile.extension === 'psd') {
      console.log('🔄 自動保存開始:', currentFile.path, 'レイヤー数:', layers.length);
      
      await toolRegistry.executeTool('save_painter_file', {
        app,
        file: currentFile,
        layers
      });
      
      console.log('✅ 自動保存完了:', currentFile.path);
    }
  } catch (error) {
    console.error('❌ 自動保存エラー:', error);
  }
}, 5000);

useLayersStore.subscribe(
  (state) => {
    if (state.layers.length > 0) {
      console.log('🔄 レイヤー変更検知:', state.layers.length, 'レイヤー');
      autoSave(state.layers, state.isInitialLoad);
    }
  }
);

useLayersStore.subscribe(
  (state, prevState) => {
    if (prevState.currentPsdFile && 
        (state.currentPsdFile?.path !== prevState.currentPsdFile?.path || state.currentPsdFile === null)) {
      console.log('🔄 PSDファイル切り替え検知、前のファイルを保存:', prevState.currentPsdFile.path);
      
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

export async function manualSavePainter() {
  const layersStore = useLayersStore.getState();
  const currentPsdFileStore = layersStore.currentPsdFile;
  const app = (window as any).app;
  
  if (layersStore.layers.length > 0 && currentPsdFileStore && app && currentPsdFileStore.extension === 'psd') {
    console.log('🔄 手動保存開始:', currentPsdFileStore.path);
    
    try {
      await toolRegistry.executeTool('save_painter_file', {
        app,
        file: currentPsdFileStore,
        layers: layersStore.layers
      });
      
      console.log('✅ 手動保存完了:', currentPsdFileStore.path);
      return true;
    } catch (error) {
      console.error('❌ 手動保存エラー:', error);
      return false;
    }
  }
  
  console.warn('⚠️ 保存条件が満たされていません');
  return false;
} 
