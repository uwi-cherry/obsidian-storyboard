import React, { useEffect, useState, useRef } from 'react';
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
  
  // ペインター内で直接管理するレイヤーデータ
  const [layers, setLayers] = useState<any[]>([]);
  const [currentLayerIndex, setCurrentLayerIndex] = useState<number>(0);

  // 処理済みファイルを追跡するref
  const processedFileRef = useRef<Set<string>>(new Set());
  const isProcessingRef = useRef<boolean>(false);

  // zustandストアからの値を監視
  const zustandLayers = useLayersStore((state) => state.layers);
  const zustandCurrentLayerIndex = useCurrentLayerIndexStore((state) => state.currentLayerIndex);

  // zustandからの変更をローカルstateとviewに反映
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

  // レイヤーデータが設定された後に初期履歴を保存
  useEffect(() => {
    if (zustandLayers.length > 0) {
      const historyStore = usePainterHistoryStore.getState();
      // 履歴が空の場合のみ初期履歴を保存
      if (historyStore.history.length === 0) {
        historyStore.saveHistory(zustandLayers, zustandCurrentLayerIndex);
      }
    }
  }, [zustandLayers, zustandCurrentLayerIndex]);

  // PSDファイルが開かれた時に適切なツールを実行
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
    
    console.log('📂 PSDファイル処理開始:', view.file.path);

    const processFile = async () => {
      try {
        if (view.file.extension === 'psd') {
          // current-psd-file-storeを更新
          useLayersStore.getState().setCurrentPsdFile(view.file);
          useLayersStore.getState().setInitialLoad(true);
          
          const result = await toolRegistry.executeTool('load_painter_file', {
            app: app,
            file: view.file
          });
          
          const psdData = JSON.parse(result);
          
          // DataURLからCanvasに変換
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
          
          // 履歴をクリアしてから新しいデータを設定
          usePainterHistoryStore.getState().clearHistory();
          
          // zustandストアを更新
          useLayersStore.getState().setLayers(layersWithCanvas);
          useCurrentLayerIndexStore.getState().setCurrentLayerIndex(0);
          useLayersStore.getState().setInitialLoad(false);
          
          console.log('✅ PSDファイル読み込み完了:', layersWithCanvas.length, 'レイヤー');
          
        } else {
          useLayersStore.getState().clearCurrentPsdFile();
          
          await toolRegistry.executeTool('initialize_painter_data', { view });
          if (view.layers) {
            usePainterHistoryStore.getState().clearHistory();
            useLayersStore.getState().setLayers(view.layers);
            useCurrentLayerIndexStore.getState().setCurrentLayerIndex(view.currentLayerIndex || 0);
          }
        }
      } catch (error) {
        console.error('❌ ファイル処理エラー:', error);
        useLayersStore.getState().setInitialLoad(false);
        
        // エラー時は処理済みマークを削除
        processedFileRef.current.delete(fileKey);
      } finally {
        isProcessingRef.current = false;
      }
    };

    processFile();
  }, []); // 依存配列を空にして一度だけ実行

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
