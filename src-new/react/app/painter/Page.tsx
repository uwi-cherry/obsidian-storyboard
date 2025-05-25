import React, { useEffect, useState } from 'react';
import usePainterPointer, { PainterTool } from '../../hooks/usePainterPointer';
import { useLayersStore } from '../../../obsidian-api/zustand/storage/layers-store';
import { useCurrentLayerIndexStore } from '../../../obsidian-api/zustand/store/current-layer-index-store';
import { usePainterHistoryStore } from '../../../obsidian-api/zustand/store/painter-history-store';
import { toolRegistry } from '../../../service-api/core/tool-registry';
import { usePainterLayoutStore } from '../../../obsidian-api/zustand/storage/painter-layout-store';
import CanvasContainer from './CanvasContainer';
import Toolbar from './Toolbar';

interface PainterPageProps {
  view?: any;
  app?: any;
}

export default function PainterPage({ view, app }: PainterPageProps) {
  if (!view) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-primary text-text-normal">
        Painter ビューが見つかりません
      </div>
    );
  }
  
  const pointer = usePainterPointer();
  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const { layoutDirection } = usePainterLayoutStore();
  
  const [layers, setLayers] = useState<any[]>([]);
  const [currentLayerIndex, setCurrentLayerIndex] = useState<number>(0);

  const zustandLayers = useLayersStore((state) => state.layers);
  const zustandCurrentLayerIndex = useCurrentLayerIndexStore((state) => state.currentLayerIndex);

  useEffect(() => {
    if (zustandLayers.length > 0) {
      setLayers(zustandLayers);
      if (view) {
        view.layers = zustandLayers;
      }
    }
  }, [zustandLayers, view]);

  useEffect(() => {
    setCurrentLayerIndex(zustandCurrentLayerIndex);
    if (view) {
      view.currentLayerIndex = zustandCurrentLayerIndex;
    }
  }, [zustandCurrentLayerIndex, view]);

  useEffect(() => {
    if (zustandLayers.length > 0) {
      const historyStore = usePainterHistoryStore.getState();
      if (historyStore.history.length === 0) {
        historyStore.saveHistory(zustandLayers, zustandCurrentLayerIndex);
      }
    }
  }, [zustandLayers, zustandCurrentLayerIndex]);

  useEffect(() => {
      name: view.file.name,
      path: view.file.path,
      extension: view.file.extension
    } : 'ファイルなし');
    
    if (!view?.file || !app) {
      return;
    }
    
      file: view.file,
      extension: view.file.extension,
      path: view.file.path
    });
    
    if (view.file.extension === 'psd') {
      
      useLayersStore.getState().setCurrentPsdFile(view.file);
      
      const loadPsdFile = async () => {
        try {
          
          useLayersStore.getState().setInitialLoad(true);
          
          const result = await toolRegistry.executeTool('load_painter_file', {
            app: app,
            file: view.file
          });
          
          const psdData = JSON.parse(result);
          
          const layersWithCanvas = await Promise.all(psdData.layers.map(async (layer: any) => {
            const canvas = document.createElement('canvas');
            canvas.width = layer.width || psdData.width;
            canvas.height = layer.height || psdData.height;
            
            if (layer.canvasDataUrl) {
              try {
                const img = new Image();
                await new Promise((resolve, reject) => {
                  img.onload = resolve;
                  img.onerror = reject;
                  img.src = layer.canvasDataUrl;
                });
                
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.drawImage(img, 0, 0);
                }
              } catch (error) {
              }
            }
            
            return {
              name: layer.name,
              visible: layer.visible,
              opacity: layer.opacity,
              blendMode: layer.blendMode,
              canvas: canvas
            };
          }));
          
          
          view.layers = layersWithCanvas;
          view.currentLayerIndex = 0;
          view._painterData = {
            layers: layersWithCanvas,
            currentLayerIndex: 0,
            canvasWidth: psdData.width,
            canvasHeight: psdData.height
          };
          
          usePainterHistoryStore.getState().clearHistory();
          
          useLayersStore.getState().setLayers(layersWithCanvas);
          useCurrentLayerIndexStore.getState().setCurrentLayerIndex(0);
          
          setTimeout(() => {
            useLayersStore.getState().setInitialLoad(false);
          }, 1000);
          
          
        } catch (error) {
          
          useLayersStore.getState().setInitialLoad(false);
          
          try {
            await toolRegistry.executeTool('initialize_painter_data', { view });
            if (view.layers) {
              usePainterHistoryStore.getState().clearHistory();
              
              useLayersStore.getState().setLayers(view.layers);
              useCurrentLayerIndexStore.getState().setCurrentLayerIndex(view.currentLayerIndex || 0);
            }
          } catch (initError) {
          }
        }
      };
      
      loadPsdFile();
      
    } else {
      useLayersStore.getState().clearCurrentPsdFile();
      
      const initializePainter = async () => {
        try {
          await toolRegistry.executeTool('initialize_painter_data', { view });
          if (view.layers) {
            usePainterHistoryStore.getState().clearHistory();
            
            useLayersStore.getState().setLayers(view.layers);
            useCurrentLayerIndexStore.getState().setCurrentLayerIndex(view.currentLayerIndex || 0);
          }
        } catch (error) {
        }
      };
      
      initializePainter();
    }
  }, [view?.file?.path, app]);

  const containerClass = layoutDirection === 'horizontal' 
    ? "flex w-full h-full overflow-hidden"
    : "flex flex-col w-full h-full overflow-hidden";

  return (
  <div className={containerClass}>
    <Toolbar tool={pointer.tool} onChange={(tool) => pointer.setTool(tool as PainterTool)} />
    <CanvasContainer 
      pointer={pointer} 
      view={view}
      zoom={zoom}
      rotation={rotation}
      setZoom={setZoom}
      setRotation={setRotation}
    />    
  </div>);
}
