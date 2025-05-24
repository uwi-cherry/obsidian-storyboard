import React, { useEffect, useState } from 'react';
import { App, TFile } from 'obsidian';
import { useLayerContext } from '../../context/LayerContext';
import { useStoryboardContext } from '../../context/StoryboardContext';
import NavigationControls from './components/NavigationControls';
import LayerControls from './components/LayerControls';
import ChatBox from './components/ChatBox';
import { t } from '../../../obsidian-i18n';
import { toolRegistry } from '../../../service-api/core/tool-registry';

interface RightSidebarReactViewProps {
  view?: any;
  app?: App;
}

export default function RightSidebarReactView({ view, app }: RightSidebarReactViewProps) {
  const [isPsdPainterOpen, setIsPsdPainterOpen] = useState(false);

  let layerContext;
  try {
    layerContext = useLayerContext();
  } catch {
    layerContext = null;
  }

  let storyboardContext;
  try {
    storyboardContext = useStoryboardContext();
  } catch {
    storyboardContext = null;
  }

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

  // ストーリーボード行選択時にレイヤーを自動ロード
  useEffect(() => {
    if (!storyboardContext?.selectedFrame || !layerContext || !app) return;

    const frame = storyboardContext.selectedFrame;
    const hasPsd = frame.imageUrl?.endsWith('.psd');
    
    if (hasPsd && frame.imageUrl) {
      const loadLayers = async () => {
        try {
          const file = app.vault.getAbstractFileByPath(frame.imageUrl!);
          if (file instanceof TFile) {
            const result = await toolRegistry.executeTool('load_painter_file', {
              app,
              file
            });
            const psdData = JSON.parse(result);
            if (psdData.layers && psdData.layers.length > 0) {
              layerContext.setLayers(psdData.layers);
              layerContext.setCurrentLayerIndex(0);
              layerContext.setCurrentFile(file);
              console.log('ストーリーボード行選択により、PSDレイヤーを自動ロードしました:', file.name);
            }
          }
        } catch (error) {
          console.error('PSD レイヤー情報の読み込みに失敗しました:', error);
        }
      };
      
      loadLayers();
    }
  }, [storyboardContext?.selectedFrame, layerContext, app]);

  // PSDファイルを開いた時のレイヤー同期処理
  useEffect(() => {
    const handlePsdFileOpened = async (e: Event) => {
      const custom = e as CustomEvent;
      const { file } = custom.detail || {};
      if (!file || !layerContext || !app) return;

      try {
        const result = await toolRegistry.executeTool('load_painter_file', {
          app,
          file
        });
        const psdData = JSON.parse(result);
        if (psdData.layers && psdData.layers.length > 0) {
          layerContext.setLayers(psdData.layers);
          layerContext.setCurrentLayerIndex(0);
          layerContext.setCurrentFile(file);
          console.log('PSDファイルのレイヤーを同期しました:', file.name);
        }
      } catch (error) {
        console.error('PSDファイルのレイヤー同期に失敗しました:', error);
      }
    };

    window.addEventListener('psd-file-opened', handlePsdFileOpened as EventListener);
    return () => {
      window.removeEventListener('psd-file-opened', handlePsdFileOpened as EventListener);
    };
  }, [layerContext, app]);

  const handleImageChange = (url: string | null, prompt: string | null) => {
    // ストーリーボードコンテキストがある場合は更新
    // （注：これは将来的にはストーリーボード側で管理すべき）
  };

  // 現在選択されているフレームの情報を取得
  const currentImageUrl = storyboardContext?.selectedFrame?.imageUrl || null;
  const currentImagePrompt = storyboardContext?.selectedFrame?.imagePrompt || null;

  return (
    <div className="w-full h-full flex flex-col bg-primary border-l border-modifier-border">
      <NavigationControls
        view={view}
        app={app}
        isPsdPainterOpen={isPsdPainterOpen}
        currentImageUrl={currentImageUrl}
        currentImagePrompt={currentImagePrompt}
        onImageChange={handleImageChange}
      />
      {layerContext && layerContext.layers.length > 0 && <LayerControls />}
      <ChatBox plugin={app} />
    </div>
  );
}
