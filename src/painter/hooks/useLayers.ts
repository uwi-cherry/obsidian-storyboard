import { useRef } from 'react';
import { MAX_HISTORY_SIZE } from '../../constants';
import type { Layer } from '../painter-types';

export interface LayersState {
  history: { layers: Layer[] }[];
  currentIndex: number;
  currentLayerIndex: number;
  maxHistorySize: number;
  saveHistory: () => void;
  undo: () => void;
  redo: () => void;
}

export function useLayers(initialLayers: Layer[] = []): LayersState {
  const ref = useRef<LayersState>();
  if (!ref.current) {
    const state: LayersState = {
      history: [{ layers: initialLayers }],
      currentIndex: 0,
      currentLayerIndex: 0,
      maxHistorySize: MAX_HISTORY_SIZE,
      saveHistory() {
        const snapshot = {
          layers: state.history[state.currentIndex].layers.map(layer => {
            const c = document.createElement('canvas');
            c.width = layer.canvas.width;
            c.height = layer.canvas.height;
            const ctx = c.getContext('2d');
            if (ctx) ctx.drawImage(layer.canvas, 0, 0);
            return { ...layer, canvas: c };
          })
        };
        state.history = state.history.slice(0, state.currentIndex + 1);
        state.history.push(snapshot);
        state.currentIndex = state.history.length - 1;
        if (state.history.length > state.maxHistorySize) {
          state.history.shift();
          state.currentIndex--;
        }
      },
      undo() {
        if (state.currentIndex > 0) {
          state.currentIndex--;
        }
      },
      redo() {
        if (state.currentIndex < state.history.length - 1) {
          state.currentIndex++;
        }
      }
    };
    ref.current = state;
  }
  return ref.current as LayersState;
}
