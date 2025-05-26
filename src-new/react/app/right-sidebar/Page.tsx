import React, { useEffect, useState } from 'react';
import { App, TFile, ItemView } from 'obsidian';
import type { RightSidebarView } from '../../../obsidian-api/right-sidebar/right-sidebar-view';
import { NavigationControls } from './components/NavigationControls';
import LayerControls from './components/LayerControls';
import ChatBox from './components/ChatBox';
import { t } from '../../../constants/obsidian-i18n';
import { toolRegistry } from '../../../service-api/core/tool-registry';
import { useSelectedFrameStore } from '../../../obsidian-api/zustand/store/selected-frame-store';
import { useSelectedRowIndexStore } from '../../../obsidian-api/zustand/store/selected-row-index-store';
import { useLayersStore } from '../../../obsidian-api/zustand/storage/layers-store';
import { useCurrentLayerIndexStore } from '../../../obsidian-api/zustand/store/current-layer-index-store';
import type { Layer } from '../../../types/painter-types';

interface RightSidebarReactViewProps {
  view?: RightSidebarView;
  app?: App;
}

export default function RightSidebarReactView({ view, app }: RightSidebarReactViewProps) {
  const [isPsdPainterOpen, setIsPsdPainterOpen] = useState(false);
  const selectedFrame = useSelectedFrameStore((state) => state.selectedFrame);
  const currentPsdFile = useLayersStore((state) => state.currentPsdFile);
  const layers = useLayersStore((state) => state.layers);
  const [currentFile, setCurrentFile] = useState<TFile | null>(null);

  useEffect(() => {
    if (!view?.app) return;
    const updateState = () => {
      setIsPsdPainterOpen(view.app.workspace.getLeavesOfType('psd-view').length > 0);
    };
    view.app.workspace.on('active-leaf-change', updateState);
    updateState();
    return () => {
      view.app.workspace.off('active-leaf-change', updateState);
    };
  }, [view?.app]);

  useEffect(() => {
    if (!app) return;

    if (!currentPsdFile) {
      useLayersStore.getState().clearLayers();
      useCurrentLayerIndexStore.getState().setCurrentLayerIndex(0);
      setCurrentFile(null);
      return;
    }

    setCurrentFile(currentPsdFile);
    
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
        
        console.log('✅ PSDファイルのレイヤーを読み込みました:', currentPsdFile.path, layers.length, 'layers');
      } catch (error) {
        console.error('❌ PSDファイルの読み込みに失敗しました:', error);
      }
    };
    
    loadPsdFile();
  }, [currentPsdFile, app]);

  // PSDファイルが開かれた際の処理は、currentPsdFileの変更で自動的に処理される

  const handleImageChange = (url: string | null) => {
    // 選択されたフレームのimageUrlを更新
    const selectedFrame = useSelectedFrameStore.getState().selectedFrame;
    
    if (selectedFrame && url) {
      // 選択されたフレームのストアを更新
      const updatedFrame = { ...selectedFrame, imageUrl: url };
      useSelectedFrameStore.getState().setSelectedFrame(updatedFrame);
      
      // PSDファイルの場合は、レイヤーストアも更新
      if (url.endsWith('.psd') && app) {
        const file = app.vault.getAbstractFileByPath(url);
        if (file instanceof TFile) {
          useLayersStore.getState().setCurrentPsdFile(file);
        }
      }
    }
  };

  const handleOpenPsdPainter = async () => {
    if (!currentImageUrl || !app) return;
    
    try {
      const fileObj = app.vault.getAbstractFileByPath(currentImageUrl);
      if (fileObj instanceof TFile) {
        const leaf = app.workspace.getLeaf(true);
        await leaf.openFile(fileObj, { active: true });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleBackToStoryboard = () => {
    if (!app) return;
    
    try {
      app.workspace.getLeavesOfType('psd-view').forEach((l) => l.detach());
      const storyboardLeaf = app.workspace
        .getLeavesOfType('markdown')
        .find((l) => {
          const v = l.view as ItemView;
          return (
            v &&
            v.contentEl &&
            v.contentEl.querySelector('.storyboard-view-container')
          );
        });
      if (storyboardLeaf) {
        app.workspace.setActiveLeaf(storyboardLeaf);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleExportImage = () => {
    
  };

  const currentImageUrl = selectedFrame?.imageUrl || null;
  return (
    <div className="w-full h-full flex flex-col bg-primary border-l border-modifier-border">
      <NavigationControls
        isPsdPainterOpen={isPsdPainterOpen}
        currentImageUrl={currentImageUrl}
        onBackToStoryboard={handleBackToStoryboard}
        onOpenPsdPainter={handleOpenPsdPainter}
        onExportImage={handleExportImage}
        app={app || ({} as App)}
        onImageUrlChange={handleImageChange}
      />
      {layers && layers.length > 0 && <LayerControls />}
      <ChatBox />
    </div>
  );
}
