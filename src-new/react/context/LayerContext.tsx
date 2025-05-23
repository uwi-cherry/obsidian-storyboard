import React, { createContext, useContext, useEffect, useState } from 'react';
import { Layer } from '../../obsidian-api/painter/painter-types';
import { toolRegistry } from '../../service-api/core/tool-registry';

interface LayerContextValue {
  view: any;
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
    const load = async () => {
      if (view.file) {
        try {
          const result = await toolRegistry.executeTool('load_painter_file', {
            app: view.app,
            file: view.file
          });
          const data = JSON.parse(result);
          const ls = data.layers || [];
          setLayers(ls);
          setCurrentLayerIndex(0);
          view.layers = ls;
          view.currentLayerIndex = 0;
          view.saveHistory();
        } catch (e) {
          console.error('PSD読み込み失敗', e);
        }
      } else {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        const initial = [{ name: 'Background', visible: true, opacity: 1, blendMode: 'normal', canvas }];
        setLayers(initial);
        setCurrentLayerIndex(0);
        view.layers = initial;
        view.currentLayerIndex = 0;
        view.saveHistory();
      }
    };
    load();
  }, [view]);

  useEffect(() => {
    view.layers = layers;
    view.currentLayerIndex = currentLayerIndex;
    view.setLayers = setLayers;
    view.setCurrentLayerIndex = setCurrentLayerIndex;
    if (view.file) {
      toolRegistry.executeTool('save_painter_file', {
        app: view.app,
        file: view.file,
        layers
      }).catch((e) => console.error('PSD保存失敗', e));
    }
  }, [layers, currentLayerIndex, view]);

  return (
    <LayerContext.Provider value={{ view, layers, currentLayerIndex, setLayers, setCurrentLayerIndex }}>
      {children}
    </LayerContext.Provider>
  );
}
