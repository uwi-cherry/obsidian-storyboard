import React, { useEffect, useState } from 'react';
import usePainterPointer, { PainterTool } from '../../hooks/usePainterPointer';
import { useCurrentPsdFileStore } from '../../../obsidian-api/zustand/store/current-psd-file-store';
import { useLayersStore } from '../../../obsidian-api/zustand/store/layers-store';
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

  // zustandストアからの値を監視
  const zustandLayers = useLayersStore((state) => state.layers);
  const zustandCurrentLayerIndex = useCurrentLayerIndexStore((state) => state.currentLayerIndex);

  // zustandからの変更をローカルstateとviewに反映
  useEffect(() => {
    console.log('🔄 PainterPage: zustandレイヤー変更検知:', zustandLayers.length, 'レイヤー');
    if (zustandLayers.length > 0) {
      setLayers(zustandLayers);
      if (view) {
        view.layers = zustandLayers;
      }
    }
  }, [zustandLayers, view]);

  useEffect(() => {
    console.log('🔄 PainterPage: zustand現在レイヤー変更検知:', zustandCurrentLayerIndex);
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
        console.log('📝 初期履歴を保存しました:', zustandLayers.length, 'レイヤー');
      }
    }
  }, [zustandLayers, zustandCurrentLayerIndex]);

  // PSDファイルが開かれた時に適切なツールを実行
  useEffect(() => {
    console.log('🔍 PainterPage: useEffect発火 - view:', view, 'app:', app);
    console.log('🔍 PainterPage: view.file:', view?.file);
    console.log('🔍 PainterPage: view.file詳細:', view?.file ? {
      name: view.file.name,
      path: view.file.path,
      extension: view.file.extension
    } : 'ファイルなし');
    
    if (!view?.file || !app) {
      console.log('🔍 PainterPage: 条件不一致でリターン');
      return;
    }
    
    console.log('🔍 PainterPage: ファイル変化検知:', {
      file: view.file,
      extension: view.file.extension,
      path: view.file.path
    });
    
    if (view.file.extension === 'psd') {
      console.log('🔍 PainterPage: PSDファイルが開かれました:', view.file.path);
      
      // current-psd-file-storeを更新（サイドバーとの連携用）
      useCurrentPsdFileStore.getState().setCurrentPsdFile(view.file);
      console.log('🔍 PainterPage: current-psd-file-storeを設定しました:', view.file.path);
      
      // PSDファイルを読み込んでレイヤーデータを取得
      const loadPsdFile = async () => {
        try {
          console.log('🔍 PainterPage: PSDファイル読み込み開始');
          const result = await toolRegistry.executeTool('load_painter_file', {
            app: app,
            file: view.file
          });
          
          console.log('🔍 PainterPage: PSDファイル読み込み結果:', result);
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
                console.log('🔍 DataURLからCanvas変換成功:', layer.name);
              } catch (error) {
                console.warn('🔍 DataURLからCanvas変換エラー:', layer.name, error);
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
          
          console.log('🔍 変換後のレイヤー:', layersWithCanvas.length, '個');
          
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
          
          // zustandストアのみを更新（useEffectでローカルstateに反映される）
          useLayersStore.getState().setLayers(layersWithCanvas);
          useCurrentLayerIndexStore.getState().setCurrentLayerIndex(0);
          
          console.log('🔍 PainterPage: レイヤーデータを設定しました:', layersWithCanvas.length, 'レイヤー');
          
        } catch (error) {
          console.error('🔍 PainterPage: PSDファイル読み込みエラー:', error);
          
          // エラーの場合は初期化ツールを実行
          try {
            await toolRegistry.executeTool('initialize_painter_data', { view });
            // 初期化されたデータを取得
            if (view.layers) {
              // 履歴をクリアしてから新しいデータを設定
              usePainterHistoryStore.getState().clearHistory();
              
              // zustandストアのみを更新
              useLayersStore.getState().setLayers(view.layers);
              useCurrentLayerIndexStore.getState().setCurrentLayerIndex(view.currentLayerIndex || 0);
            }
          } catch (initError) {
            console.error('🔍 PainterPage: 初期化エラー:', initError);
          }
        }
      };
      
      loadPsdFile();
      
    } else {
      console.log('🔍 PainterPage: PSDファイルではありません:', view.file.extension);
      useCurrentPsdFileStore.getState().clearCurrentPsdFile();
      
      // PSDファイルでない場合は初期化
      const initializePainter = async () => {
        try {
          await toolRegistry.executeTool('initialize_painter_data', { view });
          // 初期化されたデータを取得
          if (view.layers) {
            // 履歴をクリアしてから新しいデータを設定
            usePainterHistoryStore.getState().clearHistory();
            
            // zustandストアのみを更新
            useLayersStore.getState().setLayers(view.layers);
            useCurrentLayerIndexStore.getState().setCurrentLayerIndex(view.currentLayerIndex || 0);
          }
        } catch (error) {
          console.error('🔍 PainterPage: 初期化エラー:', error);
        }
      };
      
      initializePainter();
    }
  }, [view, app, view?.file, view?.file?.path]);

  const containerClass = layoutDirection === 'horizontal' 
    ? "flex w-full h-full overflow-hidden"
    : "flex flex-col w-full h-full overflow-hidden";

  return (
  <div className={containerClass}>
    <Toolbar tool={pointer.tool} onChange={(tool) => pointer.setTool(tool as PainterTool)} />
    <CanvasContainer 
      pointer={pointer} 
      layers={layers} 
      currentLayerIndex={currentLayerIndex}
      view={view}
      zoom={zoom}
      rotation={rotation}
      setZoom={setZoom}
      setRotation={setRotation}
    />    
  </div>);
}
