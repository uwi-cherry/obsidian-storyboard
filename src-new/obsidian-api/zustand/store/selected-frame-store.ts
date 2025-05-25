import { create } from 'zustand';

interface SelectedFrameState {
  selectedFrame: any | null;
  setSelectedFrame: (frame: any | null) => void;
  clearSelectedFrame: () => void;
}

export const useSelectedFrameStore = create<SelectedFrameState>((set) => ({
  selectedFrame: null,
  setSelectedFrame: (frame) => set({ selectedFrame: frame }),
  clearSelectedFrame: () => set({ selectedFrame: null }),
})); 
