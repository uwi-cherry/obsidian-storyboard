import { useEffect, useState, useRef } from 'react';
import type { App } from 'obsidian';
import usePainterPointer, { PainterTool } from '../../hooks/usePainterPointer';
import { useLayersStore } from '../../../zustand/storage/layers-store';
import { useCurrentLayerIndexStore } from '../../../zustand/store/current-layer-index-store';
import { usePainterHistoryStore } from '../../../zustand/store/painter-history-store';
import { toolRegistry } from '../../../service-api/core/tool-registry';
import { usePainterLayoutStore } from '../../../zustand/storage/painter-layout-store';
import type { Layer, PainterView } from '../../../types/painter-types';
import CanvasContainer from './CanvasContainer';
import Toolbar from './Toolbar';

interface PainterPageProps {
  view?: PainterView;
  app?: App;
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

  // ズームが変更された時にタイトルを更新
  useEffect(() => {
    if (view && view._painterData && view.updateTitle) {
      view.updateTitle(
        view._painterData.canvasWidth,
        view._painterData.canvasHeight,
        zoom
      );
    }
  }, [zoom, view]);
  
  const [layers, setLayers] = useState<Layer[]>([]);
  const [currentLayerIndex, setCurrentLayerIndex] = useState<number>(0);

  // 処理済みファイルを追跡するref
  const processedFileRef = useRef<Set<string>>(new Set());
  const isProcessingRef = useRef<boolean>(false);

  // zustandストアからの値を監視
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
    if (!view?.file?.path || !app) {
      return;
    }

    const fileKey = `${view.file.path}-${app.vault.getName()}`;
    
    // 既に処理済みまたは処理中の場合はスキップ
    if (processedFileRef.current.has(fileKey) || isProcessingRef.current) {
      return;
    }

    // 処理開始をマーク
    processedFileRef.current.add(fileKey);
    isProcessingRef.current = true;
    


    const processFile = async () => {
      try {
        if (view.file?.extension === 'psd') {
          // current-psd-file-storeを更新
          useLayersStore.getState().setCurrentPsdFile(view.file);
          
          const result = await toolRegistry.executeTool('load_painter_file', {
            app: app,
            file: view.file
          });
          
          const psdData = JSON.parse(result);
          
          const layersWithCanvas = await Promise.all(psdData.layers.map(async (layer: Layer) => {
            const canvas = document.createElement('canvas');
            canvas.width = layer.width || psdData.width;
            canvas.height = layer.height || psdData.height;
            
            if (layer.canvasDataUrl) {
              try {
                const img = new Image();
                await new Promise((resolve, reject) => {
                  img.onload = resolve;
                  img.onerror = reject;
                  img.src = layer.canvasDataUrl!;
                });
                
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.drawImage(img, 0, 0);
                }
              } catch (error) {
                console.warn('Canvas変換エラー:', layer.name, error);
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
          
          // ビューにレイヤーデータを設定
          view.layers = layersWithCanvas;
          view.currentLayerIndex = 0;
          view._painterData = {
            layers: layersWithCanvas,
            currentLayerIndex: 0,
            canvasWidth: psdData.width,
            canvasHeight: psdData.height
          };
          
          usePainterHistoryStore.getState().clearHistory();
          
          // zustandストアを更新
          useLayersStore.getState().initializeLayers(layersWithCanvas);
          useCurrentLayerIndexStore.getState().setCurrentLayerIndex(0);
          
          // タイトルを更新
          view.updateTitle?.(psdData.width, psdData.height, zoom);
          

          
        } else {
          useLayersStore.getState().clearCurrentPsdFile();
          

        }
      } catch (error) {
        console.error('❌ ファイル処理エラー:', error);
        
        // エラー時は処理済みマークを削除
        processedFileRef.current.delete(fileKey);
      } finally {
        isProcessingRef.current = false;
      }
    };

    processFile();
  }, [view?.file?.path, app]); // ファイルパスとappが変更された時に実行

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
