import React, { useEffect, useState } from 'react';
import { App, TFile } from 'obsidian';
import { NavigationControls } from './components/NavigationControls';
import LayerControls from './components/LayerControls';
import ChatBox from './components/ChatBox';
import { t } from '../../../constants/obsidian-i18n';
import { toolRegistry } from '../../../service-api/core/tool-registry';
import { GLOBAL_VARIABLE_KEYS } from '../../../constants/constants';
import { useSelectedFrameStore } from '../../../obsidian-api/zustand/store/selected-frame-store';
import { useLayersStore } from '../../../obsidian-api/zustand/store/layers-store';
import { useCurrentLayerIndexStore } from '../../../obsidian-api/zustand/store/current-layer-index-store';

interface RightSidebarReactViewProps {
  view?: any;
  app?: App;
}

export default function RightSidebarReactView({ view, app }: RightSidebarReactViewProps) {
  const [isPsdPainterOpen, setIsPsdPainterOpen] = useState(false);
  const selectedFrame = useSelectedFrameStore((state) => state.selectedFrame);
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

  // ストーリーボード行選択時にレイヤーを自動ロード
  useEffect(() => {
    if (!selectedFrame || !app) return;

    const frame = selectedFrame;
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
              useLayersStore.getState().setLayers(psdData.layers);
              useCurrentLayerIndexStore.getState().setCurrentLayerIndex(0);
              setCurrentFile(file);
              console.log('ストーリーボード行選択により、PSDレイヤーを自動ロードしました:', file.name);
            }
          }
        } catch (error) {
          console.error('PSD レイヤー情報の読み込みに失敗しました:', error);
        }
      };
      
      loadLayers();
    }
  }, [selectedFrame, app]);

  // PSDファイルを開いた時のレイヤー同期処理
  useEffect(() => {
    const handlePsdFileOpened = async (e: Event) => {
      const custom = e as CustomEvent;
      const { file } = custom.detail || {};
      if (!file || !app) return;

      try {
        const result = await toolRegistry.executeTool('load_painter_file', {
          app,
          file
        });
        const psdData = JSON.parse(result);
        if (psdData.layers && psdData.layers.length > 0) {
          useLayersStore.getState().setLayers(psdData.layers);
          useCurrentLayerIndexStore.getState().setCurrentLayerIndex(0);
          setCurrentFile(file);
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
  }, [app]);

  const handleImageChange = (url: string | null) => {
    // ストーリーボードコンテキストがある場合は更新
    // （注：これは将来的にはストーリーボード側で管理すべき）
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
      console.error('PSDファイルを開けませんでした:', error);
    }
  };

  const handleBackToStoryboard = () => {
    if (!app) return;
    
    try {
      app.workspace.getLeavesOfType('psd-view').forEach((l) => l.detach());
      const storyboardLeaf = app.workspace
        .getLeavesOfType('markdown')
        .find((l) => {
          const v = l.view as any;
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
      console.error('ストーリーボードに戻れませんでした:', error);
    }
  };

  const handleExportImage = () => {
    // エクスポート機能は後で実装
  };

  // 現在選択されているフレームの情報を取得
  const currentImageUrl = selectedFrame?.imageUrl || null;

  return (
    <div className="w-full h-full flex flex-col bg-primary border-l border-modifier-border">
      <NavigationControls
        view={view}
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
