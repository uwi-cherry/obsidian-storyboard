import { useEffect } from 'react';
import { App, TFile } from 'obsidian';
import type { RightSidebarView } from '../../app/right-sidebar/right-sidebar-view';
import LayerControls from './controls/LayerControls';
import ChatBox from './controls/ChatBox';
import { toolRegistry } from '../../service/core/tool-registry';
import type { Layer } from '../../types/painter-types';
import { useLayersStore } from 'src/storage/layers-store';
import { useCurrentLayerIndexStore } from 'src/store/current-layer-index-store';

interface RightSidebarReactViewProps {
  view?: RightSidebarView;
  app?: App;
}

export default function RightSidebarReactView({ view, app }: RightSidebarReactViewProps) {
  const currentPsdFile = useLayersStore((state) => state.currentPsdFile);
  const layers = useLayersStore((state) => state.layers);

  useEffect(() => {
    if (!app) return;

    if (!currentPsdFile) {
      useLayersStore.getState().clearLayers();
      useCurrentLayerIndexStore.getState().setCurrentLayerIndex(0);
      return;
    }
    
    // PSDファイルを読み込んでレイヤーストアに設定
    const loadPsdFile = async () => {
      try {
        const result = await toolRegistry.executeTool('load_painter_file', {
          app: app,
          file: currentPsdFile
        });
        
        const psdData = JSON.parse(result);
        
        // PsdLayerDataをLayerに変換
        const layers: Layer[] = await Promise.all(psdData.layers.map(async (layerData: any) => {
          let canvas: HTMLCanvasElement;
          
          if (layerData.canvasDataUrl) {
            // canvasDataUrlからcanvasを復元
            canvas = document.createElement('canvas');
            canvas.width = layerData.width;
            canvas.height = layerData.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              await new Promise<void>((resolve) => {
                const img = new Image();
                img.onload = () => {
                  ctx.drawImage(img, 0, 0);
                  resolve();
                };
                img.onerror = () => {
                  console.error('画像の読み込みに失敗しました');
                  resolve();
                };
                img.src = layerData.canvasDataUrl;
              });
            }
          } else if (layerData.canvas) {
            canvas = layerData.canvas;
          } else {
            // 空のcanvasを作成
            canvas = document.createElement('canvas');
            canvas.width = layerData.width;
            canvas.height = layerData.height;
          }
          
          return {
            name: layerData.name,
            visible: layerData.visible,
            opacity: layerData.opacity,
            blendMode: layerData.blendMode,
            clippingMask: layerData.clippingMask,
            canvas: canvas
          };
        }));
        
        // レイヤーストアを初期化（自動保存を実行しない）
        useLayersStore.getState().initializeLayers(layers);
        useCurrentLayerIndexStore.getState().setCurrentLayerIndex(0);
        
      } catch (error) {
        console.error('❌ PSDファイルの読み込みに失敗しました:', error);
      }
    };
    
    loadPsdFile();
  }, [currentPsdFile, app]);

  // PSDファイルが開かれた際の処理は、currentPsdFileの変更で自動的に処理される


  return (
    <div className="w-full h-full flex flex-col bg-primary border-l border-modifier-border">
      {layers && layers.length > 0 && <LayerControls />}
      <div className="flex-1"></div>
      <ChatBox app={app || ({} as App)} />
    </div>
  );
}
