import React, { useEffect, useState } from 'react';
import { App } from 'obsidian';
import { useLayerContext } from '../../context/LayerContext';
import NavigationControls from './components/NavigationControls';
import LayerControls from './components/LayerControls';
import ChatBox from './components/ChatBox';
import { t } from '../../../obsidian-i18n';

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
