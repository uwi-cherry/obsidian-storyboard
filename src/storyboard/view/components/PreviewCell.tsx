import React, { useState } from 'react';
import { t } from 'src/i18n';
import { BUTTON_ICONS } from 'src/icons';
import { App, Notice } from 'obsidian';
import MyPlugin from 'main';
import { generateVideoToAssets } from 'src/ai/action/videoGeneration';
import { loadSettings } from 'src/settings/settings';

interface PreviewCellProps {
  prompt?: string;
  startTime: string;
  endTime?: string;
  onPromptChange: (newVal: string) => void;
  onEndTimeChange: (newVal: string) => void;
  app: App;
}

const PreviewCell: React.FC<PreviewCellProps> = ({
  prompt,
  startTime,
  endTime,
  onPromptChange,
  onEndTimeChange,
  app,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (isGenerating) return;
    if (!prompt || prompt.trim() === '') {
      new Notice(t('PROMPT_REQUIRED'));
      return;
    }

    const plugin = (window as unknown as { __psdPainterPlugin?: MyPlugin }).__psdPainterPlugin;
    if (!plugin) {
      new Notice(t('PLUGIN_NOT_FOUND'));
      return;
    }

    setIsGenerating(true);
    try {
      const { apiKey } = await loadSettings(plugin);
      if (!apiKey) {
        new Notice('OpenAI APIキーが設定されていません');
        return;
      }
      const file = await generateVideoToAssets(prompt, apiKey, app);
      setVideoSrc(app.vault.getResourcePath(file));
      new Notice(`動画を生成しました: ${file.path}`);
    } catch (err) {
      console.error('動画生成に失敗しました:', err);
      new Notice(t('GENERATE_FAILED'));
    } finally {
      setIsGenerating(false);
    }
  };
  return (
    <div className="flex flex-col gap-1 items-start">
      <textarea
        value={prompt || ''}
        onChange={e => onPromptChange(e.target.value)}
        placeholder="prompt"
        className="w-full border-2 border-modifier-border p-1 text-xs bg-transparent"
      />
      <div className="flex items-center gap-1 text-xs">
        <input
          type="text"
          className="w-20 border border-modifier-border p-1 bg-transparent"
          value={startTime}
          readOnly
        />
        <span>→</span>
        <input
          type="text"
          className="w-20 border border-modifier-border p-1 bg-transparent"
          value={endTime || ''}
          onChange={e => onEndTimeChange(e.target.value)}
          placeholder="00:00:00"
        />
      </div>
      <button
        className="p-1 bg-accent text-on-accent rounded cursor-pointer hover:bg-accent-hover flex items-center justify-center text-xs disabled:opacity-50"
        onClick={handleGenerate}
        disabled={isGenerating}
        title={isGenerating ? t('GENERATING') : t('GENERATE_PREVIEW')}
        dangerouslySetInnerHTML={{ __html: BUTTON_ICONS.aiGenerate }}
      />
      {videoSrc && (
        <video src={videoSrc} controls className="w-full mt-1" />
      )}
    </div>
  );
};

export default PreviewCell;
