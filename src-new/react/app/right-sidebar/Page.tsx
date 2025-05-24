import React, { useEffect, useState } from 'react';
import { App } from 'obsidian';
import { useLayerContext } from '../../context/LayerContext';
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
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [currentImagePrompt, setCurrentImagePrompt] = useState<string | null>(null);

  let layerContext;
  try {
    layerContext = useLayerContext();
  } catch {
    layerContext = null;
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

  // ストーリーボードからの行選択イベントを受け取る
  useEffect(() => {
    const handleStoryboardRowSelected = async (e: Event) => {
      const custom = e as CustomEvent;
      const { rowIndex, frame } = custom.detail || {};
      if (rowIndex === undefined) return;

      setCurrentImageUrl(frame?.imageUrl || '');
      setCurrentImagePrompt(frame?.imagePrompt || '');

      // PSDファイルの場合、レイヤー情報を読み込む
      const hasPsd = frame?.imageUrl?.endsWith('.psd');
      if (hasPsd && frame.imageUrl && layerContext && app) {
        try {
          const file = app.vault.getAbstractFileByPath(frame.imageUrl);
          if (file) {
            const result = await toolRegistry.executeTool('load_painter_file', {
              app,
              file
            });
            const psdData = JSON.parse(result);
            if (psdData.layers && psdData.layers.length > 0) {
              layerContext.setLayers(psdData.layers);
              layerContext.setCurrentLayerIndex(0);
            }
          }
        } catch (error) {
          console.error('PSD レイヤー情報の読み込みに失敗しました:', error);
        }
      }
    };

    window.addEventListener('storyboard-row-selected', handleStoryboardRowSelected as EventListener);
    return () => {
      window.removeEventListener('storyboard-row-selected', handleStoryboardRowSelected as EventListener);
    };
  }, [layerContext, app]);

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
    setCurrentImageUrl(url);
    setCurrentImagePrompt(prompt);
  };

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
