import React from 'react';
import { Notice, App } from 'obsidian';
import { t } from '../../../../constants/obsidian-i18n';
import { toolRegistry } from '../../../../service-api/core/tool-registry';

interface NavigationControlsProps {
  view: any;
  isPsdPainterOpen: boolean;
  currentImageUrl: string | null;
  onBackToStoryboard: () => void;
  onOpenPsdPainter: () => void;
  onExportImage: () => void;
  app: App;
  onImageUrlChange: (newUrl: string | null) => void;
}

export const NavigationControls: React.FC<NavigationControlsProps> = ({
  isPsdPainterOpen,
  currentImageUrl,
  onBackToStoryboard,
  onOpenPsdPainter,
  onExportImage,
  app,
  onImageUrlChange,
}) => {
  const handleExportVideo = async () => {
    try {
      new Notice('動画エクスポート機能は実装予定です');
    } catch (error) {
      new Notice('動画エクスポートに失敗しました');
    }
  };

  const handleCreateNewPsd = async () => {
    try {
      
      const storyboardPath = app.workspace.getActiveFile()?.parent?.path || '';
      
      const result = await toolRegistry.executeTool('create_painter_file', { 
        app 
      });
      const parsedResult = JSON.parse(result);
      
      onImageUrlChange(parsedResult.filePath);
      onOpenPsdPainter();
    } catch (error) {
      new Notice('PSD作成に失敗しました: ' + (error as Error).message);
    }
  };

  return (
    <div className="flex gap-2 flex-col mb-4">
      <div className="flex gap-2">
        <button
          className={`flex-1 p-1 bg-accent text-on-accent rounded cursor-pointer text-xs hover:bg-accent-hover ${!currentImageUrl?.endsWith('.psd') && !isPsdPainterOpen ? '' : 'hidden'}`}
          onClick={handleCreateNewPsd}
        >
          {t('CREATE_PSD')}
        </button>
        <button
          className={`flex-1 p-1 bg-accent text-on-accent rounded cursor-pointer text-xs hover:bg-accent-hover ${currentImageUrl?.endsWith('.psd') && !isPsdPainterOpen ? '' : 'hidden'}`}
          onClick={onOpenPsdPainter}
        >
          {t('OPEN_PSD')}
        </button>
        <button
          className={`flex-1 p-1 bg-accent text-on-accent rounded cursor-pointer text-xs hover:bg-accent-hover ${!isPsdPainterOpen ? '' : 'hidden'}`}
          onClick={handleExportVideo}
        >
          {t('EXPORT_VIDEO')}
        </button>
      </div>

      <div className="flex gap-2">
        <button
          className={`flex-1 p-1 bg-accent text-on-accent rounded cursor-pointer text-xs hover:bg-accent-hover ${isPsdPainterOpen ? '' : 'hidden'}`}
          onClick={onBackToStoryboard}
        >
          {t('BACK_TO_STORYBOARD')}
        </button>
        <button
          className={`flex-1 p-1 bg-accent text-on-accent rounded cursor-pointer text-xs hover:bg-accent-hover ${isPsdPainterOpen ? '' : 'hidden'}`}
          onClick={onExportImage}
        >
          {t('EXPORT_IMAGE')}
        </button>
      </div>
    </div>
  );
}; 
