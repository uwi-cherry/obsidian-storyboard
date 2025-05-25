import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Layer } from '../../../types/painter-types';
import { toolRegistry } from '../../../service-api/core/tool-registry';
import { useCurrentPsdFileStore } from '../store/current-psd-file-store';

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
  setLayers: (layers: Layer[]) => void;
  addLayer: (layer: Layer) => void;
  removeLayer: (index: number) => void;
  toggleLayerVisibility: (index: number) => void;
  setLayerOpacity: (index: number, opacity: number) => void;
  setLayerBlendMode: (index: number, blendMode: string) => void;
  renameLayer: (index: number, name: string) => void;
  clearLayers: () => void;
}

export const useLayersStore = create<LayersState>()(
  subscribeWithSelector((set) => ({
    layers: [],
    
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
    
    clearLayers: () => set({ layers: [] }),
  }))
);

// 自動保存機能
const autoSave = debounce(async (layers: Layer[]) => {
  try {
    const currentPsdFileStore = useCurrentPsdFileStore.getState();
    const currentFile = currentPsdFileStore.currentPsdFile;
    
    // Obsidianのappインスタンスを取得
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
}, 2000); // 2秒のデバウンス

// レイヤーの変更を監視して自動保存
useLayersStore.subscribe(
  (state) => {
    // 空のレイヤー配列の場合は保存しない
    if (state.layers.length > 0) {
      console.log('🔄 レイヤー変更検知:', state.layers.length, 'レイヤー');
      autoSave(state.layers);
    }
  }
);

// 手動保存機能（必要に応じて使用）
export async function manualSavePainter() {
  const layersStore = useLayersStore.getState();
  const currentPsdFileStore = useCurrentPsdFileStore.getState();
  const currentFile = currentPsdFileStore.currentPsdFile;
  const app = (window as any).app;
  
  if (layersStore.layers.length > 0 && currentFile && app && currentFile.extension === 'psd') {
    console.log('🔄 手動保存開始:', currentFile.path);
    
    try {
      await toolRegistry.executeTool('save_painter_file', {
        app,
        file: currentFile,
        layers: layersStore.layers
      });
      
      console.log('✅ 手動保存完了:', currentFile.path);
      return true;
    } catch (error) {
      console.error('❌ 手動保存エラー:', error);
      return false;
    }
  }
  
  console.warn('⚠️ 保存条件が満たされていません');
  return false;
} 