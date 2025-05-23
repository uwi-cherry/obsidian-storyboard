import React, { createContext, useContext, useEffect, useState } from 'react';
import { Layer } from '../../obsidian-api/painter/painter-types';

interface LayerContextValue {
  layers: Layer[];
  currentLayerIndex: number;
  setLayers: React.Dispatch<React.SetStateAction<Layer[]>>;
  setCurrentLayerIndex: React.Dispatch<React.SetStateAction<number>>;
}

const LayerContext = createContext<LayerContextValue | null>(null);

export function useLayerContext() {
  const ctx = useContext(LayerContext);
  if (!ctx) throw new Error('LayerContext not provided');
  return ctx;
}

interface ProviderProps {
  view: any;
  children: React.ReactNode;
}

export function LayerProvider({ view, children }: ProviderProps) {
  const [layers, setLayers] = useState<Layer[]>(view.layers || []);
  const [currentLayerIndex, setCurrentLayerIndex] = useState<number>(view.currentLayerIndex || 0);

  useEffect(() => {
    view.layers = layers;
    view.currentLayerIndex = currentLayerIndex;
    view.setLayers = setLayers;
    view.setCurrentLayerIndex = setCurrentLayerIndex;
  }, [layers, currentLayerIndex, view]);

  return (
    <LayerContext.Provider value={{ layers, currentLayerIndex, setLayers, setCurrentLayerIndex }}>
      {children}
    </LayerContext.Provider>
  );
}
