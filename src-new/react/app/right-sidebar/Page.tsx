import React, { useEffect, useState } from 'react';
import { App, TFile, ItemView } from 'obsidian';
import type { RightSidebarView } from '../../obsidian-api/right-sidebar/right-sidebar-view';
import { NavigationControls } from './components/NavigationControls';
import LayerControls from './components/LayerControls';
import ChatBox from './components/ChatBox';
import { t } from '../../../constants/obsidian-i18n';
import { toolRegistry } from '../../../service-api/core/tool-registry';
import { useSelectedFrameStore } from '../../../obsidian-api/zustand/store/selected-frame-store';
import { useLayersStore } from '../../../obsidian-api/zustand/storage/layers-store';
import { useCurrentLayerIndexStore } from '../../../obsidian-api/zustand/store/current-layer-index-store';

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

    setCurrentFile(currentPsdFile);  }, [currentPsdFile, app]);

  useEffect(() => {
    const handlePsdFileOpened = async (e: Event) => {
      const custom = e as CustomEvent;
      const { file } = custom.detail || {};
      if (!file || !app) return;

      setCurrentFile(file);    };

    window.addEventListener('psd-file-opened', handlePsdFileOpened as EventListener);
    return () => {
      window.removeEventListener('psd-file-opened', handlePsdFileOpened as EventListener);
    };
  }, [app]);

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
    }
  };

  const handleExportImage = () => {
    
  };

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
