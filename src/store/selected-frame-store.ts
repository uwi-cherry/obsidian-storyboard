import { create } from 'zustand';
import type { StoryboardFrame } from '../types/storyboard';

interface SelectedFrameState {
  selectedFrame: StoryboardFrame | null;
  setSelectedFrame: (frame: StoryboardFrame | null) => void;
  clearSelectedFrame: () => void;
}

export const useSelectedFrameStore = create<SelectedFrameState>((set) => ({
  selectedFrame: null,
  setSelectedFrame: (frame) => set({ selectedFrame: frame }),
  clearSelectedFrame: () => set({ selectedFrame: null }),
})); 
