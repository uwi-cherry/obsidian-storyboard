import React, { useEffect, useState } from 'react';
import NavigationControls from './components/NavigationControls';
import LayerControls from './components/LayerControls';
import ChatBox from './components/ChatBox';

interface RightSidebarReactViewProps {
  view?: any;
  app?: any;
}

export default function RightSidebarReactView({ view, app }: RightSidebarReactViewProps) {
  const [isPsdPainterOpen, setIsPsdPainterOpen] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [currentImagePrompt, setCurrentImagePrompt] = useState<string | null>(null);

  useEffect(() => {
    if (!view?.app) return;
    
    const updatePsdPainterState = () => {
      setIsPsdPainterOpen(
        view.app.workspace.getLeavesOfType('psd-view').length > 0
      );
    };

    view.app.workspace.on('active-leaf-change', updatePsdPainterState);
    return () => {
      view.app.workspace.off('active-leaf-change', updatePsdPainterState);
    };
  }, [view?.app]);

  const handleImageChange = (url: string | null, prompt: string | null) => {
    setCurrentImageUrl(url);
    setCurrentImagePrompt(prompt);
  };

  return (
    <div className="w-full h-full flex flex-col bg-primary border-l border-modifier-border">
      {/* ナビゲーション コントロール */}
      <NavigationControls
        view={view}
        app={app || view?.app}
        isPsdPainterOpen={isPsdPainterOpen}
        currentImageUrl={currentImageUrl}
        currentImagePrompt={currentImagePrompt}
        onImageChange={handleImageChange}
      />

      {/* レイヤー コントロール */}
      <LayerControls />

      {/* チャット ボックス */}
      <div className="flex-1">
        <ChatBox />
      </div>
    </div>
  );
} 