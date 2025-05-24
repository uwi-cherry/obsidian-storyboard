import { create } from 'zustand';
import { Layer } from '../../../types/painter-types';

interface LayersState {
  layers: Layer[];
  setLayers: (layers: Layer[]) => void;
  addLayer: (layer: Layer) => void;
  removeLayer: (index: number) => void;
  toggleLayerVisibility: (index: number) => void;
  updateLayer: (index: number, updates: Partial<Layer>) => void;
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
  
  updateLayer: (index, updates) => set((state) => ({
    layers: state.layers.map((layer, i) => 
      i === index ? { ...layer, ...updates } : layer
    )
  })),
  
  clearLayers: () => set({ layers: [] }),
})); 