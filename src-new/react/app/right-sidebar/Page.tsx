import React, { useEffect, useState } from 'react';
import { App, TFile } from 'obsidian';
import { NavigationControls } from './components/NavigationControls';
import LayerControls from './components/LayerControls';
import ChatBox from './components/ChatBox';
import { t } from '../../../constants/obsidian-i18n';
import { toolRegistry } from '../../../service-api/core/tool-registry';
import { useSelectedFrameStore } from '../../../obsidian-api/zustand/store/selected-frame-store';
import { useLayersStore } from '../../../obsidian-api/zustand/store/layers-store';
import { useCurrentLayerIndexStore } from '../../../obsidian-api/zustand/store/current-layer-index-store';
import { useCurrentPsdFileStore } from '../../../obsidian-api/zustand/store/current-psd-file-store';

interface RightSidebarReactViewProps {
  view?: any;
  app?: App;
}

export default function RightSidebarReactView({ view, app }: RightSidebarReactViewProps) {
  const [isPsdPainterOpen, setIsPsdPainterOpen] = useState(false);
  const selectedFrame = useSelectedFrameStore((state) => state.selectedFrame);
  const currentPsdFile = useCurrentPsdFileStore((state) => state.currentPsdFile);
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

  // current-psd-file-storeの変化を監視してレイヤーを読み込み
  useEffect(() => {
    if (!app) return;

    if (!currentPsdFile) {
      // PSDファイルがない場合はレイヤーをクリア
      useLayersStore.getState().clearLayers();
      useCurrentLayerIndexStore.getState().setCurrentLayerIndex(0);
      setCurrentFile(null);
      return;
    }

    const loadLayers = async () => {
      try {
        console.log('🔍 RightSidebar: PSDファイルを読み込み中:', currentPsdFile.path);
        
        const result = await toolRegistry.executeTool('load_painter_file', {
          app,
          file: currentPsdFile
        });
        const psdData = JSON.parse(result);
        if (psdData.layers && psdData.layers.length > 0) {
          useLayersStore.getState().setLayers(psdData.layers);
          useCurrentLayerIndexStore.getState().setCurrentLayerIndex(0);
          setCurrentFile(currentPsdFile);
          console.log('PSDレイヤーを自動ロードしました:', currentPsdFile.name);
        }
      } catch (error) {
      }
    };

    loadLayers();
  }, [currentPsdFile, app]);

  
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
        }
      } catch (error) {
      }
    };

    window.addEventListener('psd-file-opened', handlePsdFileOpened as EventListener);
    return () => {
      window.removeEventListener('psd-file-opened', handlePsdFileOpened as EventListener);
    };
  }, [app]);

  // デバッグ: レイヤー状態をログ出力
  useEffect(() => {
    console.log('🔍 RightSidebar: レイヤー状態変化:', {
      layers: layers,
      layersLength: layers?.length,
      currentPsdFile: currentPsdFile?.path,
      isPsdPainterOpen: isPsdPainterOpen
    });
  }, [layers, currentPsdFile, isPsdPainterOpen]);

  const handleImageChange = (url: string | null) => {
    
    
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
    }
  };

  const handleExportImage = () => {
    
  };

  
  const currentImageUrl = selectedFrame?.imageUrl || null;

  console.log('🔍 RightSidebar: レンダリング時の状態:', {
    layers: layers,
    layersLength: layers?.length,
    showLayerControls: layers && layers.length > 0,
    currentPsdFile: currentPsdFile?.path
  });

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
