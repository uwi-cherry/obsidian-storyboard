import { create } from 'zustand';

interface CurrentLayerIndexState {
  currentLayerIndex: number;
  setCurrentLayerIndex: (index: number) => void;
}

export const useCurrentLayerIndexStore = create<CurrentLayerIndexState>((set) => ({
  currentLayerIndex: 0,
  setCurrentLayerIndex: (index) => set({ currentLayerIndex: index }),
})); 