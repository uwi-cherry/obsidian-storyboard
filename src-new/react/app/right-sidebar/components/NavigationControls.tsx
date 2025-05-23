import React from 'react';
import { Notice, App, TFile } from 'obsidian';
import { t } from '../../../../obsidian-i18n';

interface NavigationControlsProps {
  view?: any;
  app?: App;
  isPsdPainterOpen: boolean;
  currentImageUrl: string | null;
  currentImagePrompt: string | null;
  onImageChange: (url: string | null, prompt: string | null) => void;
}

export default function NavigationControls({
  view,
  app,
  isPsdPainterOpen,
  currentImageUrl,
  currentImagePrompt,
  onImageChange,
}: NavigationControlsProps) {
  const handleExportVideo = async () => {
    try {
      new Notice('動画エクスポート機能は開発中です');
    } catch (error) {
      console.error('Export video failed:', error);
      new Notice('動画エクスポートに失敗しました');
    }
  };

  const handleCreateNewPsd = async () => {
    try {
      new Notice('新しいPSDファイルを作成中...');
      // PSD作成のロジックはここに実装
      onImageChange('new-psd-path', '');
    } catch (error) {
      console.error('Create PSD failed:', error);
      new Notice('PSD作成に失敗しました');
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
      console.error('Open PSD failed:', error);
      new Notice('PSDファイルを開けませんでした');
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
      console.error('Back to storyboard failed:', error);
    }
  };

  const handleExportImage = () => {
    new Notice('画像エクスポート機能は開発中です');
  };

  return (
    <div className="p-2 border-b border-modifier-border">
      <div className="flex gap-2 flex-col">
        <div className="flex gap-2">
          <button
            className={`flex-1 p-2 bg-accent text-on-accent rounded cursor-pointer text-xs hover:bg-accent-hover ${!currentImageUrl?.endsWith('.psd') && !isPsdPainterOpen ? '' : 'hidden'}`}
            onClick={handleCreateNewPsd}
          >
            {t('CREATE_PSD') || 'PSD作成'}
          </button>
          <button
            className={`flex-1 p-2 bg-accent text-on-accent rounded cursor-pointer text-xs hover:bg-accent-hover ${currentImageUrl?.endsWith('.psd') && !isPsdPainterOpen ? '' : 'hidden'}`}
            onClick={handleOpenPsdPainter}
          >
            {t('OPEN_PSD') || 'PSD開く'}
          </button>
          <button
            className={`flex-1 p-2 bg-accent text-on-accent rounded cursor-pointer text-xs hover:bg-accent-hover ${!isPsdPainterOpen ? '' : 'hidden'}`}
            onClick={handleExportVideo}
          >
            {t('EXPORT_VIDEO') || '動画出力'}
          </button>
        </div>

        <div className="flex gap-2">
          <button
            className={`flex-1 p-2 bg-accent text-on-accent rounded cursor-pointer text-xs hover:bg-accent-hover ${isPsdPainterOpen ? '' : 'hidden'}`}
            onClick={handleBackToStoryboard}
          >
            {t('BACK_TO_STORYBOARD') || 'ストーリーボードに戻る'}
          </button>
          <button
            className={`flex-1 p-2 bg-accent text-on-accent rounded cursor-pointer text-xs hover:bg-accent-hover ${isPsdPainterOpen ? '' : 'hidden'}`}
            onClick={handleExportImage}
          >
            {t('EXPORT_IMAGE') || '画像出力'}
          </button>
        </div>
      </div>
    </div>
  );
} 