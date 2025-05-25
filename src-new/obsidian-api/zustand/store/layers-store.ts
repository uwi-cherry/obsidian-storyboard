import { create } from 'zustand';
import { Layer } from '../../../types/painter-types';

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

export const useLayersStore = create<LayersState>((set) => ({
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
})); 