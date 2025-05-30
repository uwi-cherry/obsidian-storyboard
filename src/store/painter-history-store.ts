import { Layer } from 'etro';
import { MAX_HISTORY_SIZE } from 'src/constants/constants';
import { create } from 'zustand';

interface HistorySnapshot {
  layers: Layer[];
  currentLayerIndex: number;
  timestamp: number;
}

interface PainterHistoryState {
  history: HistorySnapshot[];
  currentIndex: number;
  maxHistorySize: number;
  
  saveHistory: (layers: Layer[], currentLayerIndex: number) => void;
  undo: () => HistorySnapshot | null;
  redo: () => HistorySnapshot | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;
}

export const usePainterHistoryStore = create<PainterHistoryState>((set, get) => ({
  history: [],
  currentIndex: -1,
  maxHistorySize: MAX_HISTORY_SIZE,
  
  saveHistory: (layers, currentLayerIndex) => {
    const state = get();
    
    const layersCopy = layers.map(layer => {
      const canvas = document.createElement('canvas');
      canvas.width = layer.canvas.width;
      canvas.height = layer.canvas.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(layer.canvas, 0, 0);
      }
      return {
        ...layer,
        canvas
      };
    });
    
    const snapshot: HistorySnapshot = {
      layers: layersCopy,
      currentLayerIndex,
      timestamp: Date.now()
    };
    
    const newHistory = state.history.slice(0, state.currentIndex + 1);
    newHistory.push(snapshot);
    
    if (newHistory.length > state.maxHistorySize) {
      newHistory.shift();
    } else {
      set({ currentIndex: state.currentIndex + 1 });
    }
    
    set({ history: newHistory });
  },
  
  undo: () => {
    const state = get();
    if (state.currentIndex > 0) {
      const newIndex = state.currentIndex - 1;
      set({ currentIndex: newIndex });
      return state.history[newIndex];
    }
    return null;
  },
  
  redo: () => {
    const state = get();
    if (state.currentIndex < state.history.length - 1) {
      const newIndex = state.currentIndex + 1;
      set({ currentIndex: newIndex });
      return state.history[newIndex];
    }
    return null;
  },
  
  canUndo: () => {
    const state = get();
    return state.currentIndex > 0;
  },
  
  canRedo: () => {
    const state = get();
    return state.currentIndex < state.history.length - 1;
  },
  
  clearHistory: () => set({ history: [], currentIndex: -1 })
})); 
