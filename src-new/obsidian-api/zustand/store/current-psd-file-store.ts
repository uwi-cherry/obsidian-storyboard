import { create } from 'zustand';
import { TFile } from 'obsidian';

interface CurrentPsdFileState {
  currentPsdFile: TFile | null;
  setCurrentPsdFile: (file: TFile | null) => void;
  clearCurrentPsdFile: () => void;
}

export const useCurrentPsdFileStore = create<CurrentPsdFileState>((set) => ({
  currentPsdFile: null,
  setCurrentPsdFile: (file) => set({ currentPsdFile: file }),
  clearCurrentPsdFile: () => set({ currentPsdFile: null }),
})); 