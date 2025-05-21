import React, { useRef, useEffect, useState } from 'react';
import { App, TFile, normalizePath } from 'obsidian';
import { BUTTON_ICONS } from 'src/icons';
import { t } from 'src/i18n';

interface SeInputCellProps {
  sePrompt?: string;
  onSePromptChange: (newPrompt: string) => void;
  focusPrevCellPrompt?: () => void;
  focusNextCellPrompt?: () => void;
  refCallback?: (el: HTMLTextAreaElement | null) => void;
  app: App;
}

const SeInputCell: React.FC<SeInputCellProps> = ({
  sePrompt,
  onSePromptChange,
  focusPrevCellPrompt,
  focusNextCellPrompt,
  refCallback,
  app,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);

  useEffect(() => {
    if (refCallback) refCallback(textareaRef.current);
    return () => { if (refCallback) refCallback(null); };
  }, [refCallback]);

  useEffect(() => {
    if (!sePrompt) {
      setAudioSrc(null);
      return;
    }
    const fileObj = app.vault.getAbstractFileByPath(sePrompt);
    if (fileObj instanceof TFile) {
      setAudioSrc(app.vault.getResourcePath(fileObj));
    } else {
      setAudioSrc(null);
    }
  }, [sePrompt, app]);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onSePromptChange(e.target.value);
  };

  const handlePromptKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd, value } = textarea;
    if (e.key === 'ArrowUp' && selectionStart === 0) {
      e.preventDefault();
      focusPrevCellPrompt?.();
    } else if (e.key === 'ArrowDown' && selectionEnd === value.length) {
      e.preventDefault();
      focusNextCellPrompt?.();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const vaultFiles = app.vault.getFiles();
    const found = vaultFiles.find(f => f.name === file.name);
    let path: string;
    if (found) {
      path = found.path;
    } else {
      const arrayBuffer = await file.arrayBuffer();
      const storyboardDir = app.workspace.getActiveFile()?.parent?.path || '';
      const assetsDir = storyboardDir ? normalizePath(`${storyboardDir}/assets`) : 'assets';
      try {
        if (!app.vault.getAbstractFileByPath(assetsDir)) {
          await app.vault.createFolder(assetsDir);
        }
      } catch (err) {
        console.error('Failed to create assets folder:', err);
      }
      path = normalizePath(`${assetsDir}/${file.name}`);
      await app.vault.createBinary(path, arrayBuffer);
    }

    onSePromptChange(path);
  };

  const handleClearPath = () => {
    onSePromptChange('');
    setAudioSrc(null);
  };

  const handleAiGenerate = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    // TODO: AIによる音声生成処理を実装
    setIsGenerating(false);
  };

  return (
    <>
      <div className="flex gap-2 mb-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".mp3,.wav,.ogg"
          className="hidden"
          onChange={handleFileSelect}
        />
        <button
          className="p-1 bg-accent text-on-accent rounded cursor-pointer hover:bg-accent-hover disabled:opacity-50 flex items-center justify-center"
          onClick={e => { e.stopPropagation(); handleAiGenerate(); }}
          disabled={isGenerating}
          title={isGenerating ? t('GENERATING') : t('AI_GENERATE')}
          dangerouslySetInnerHTML={{ __html: BUTTON_ICONS.aiGenerate }}
        />
        <button
          className="p-1 bg-primary border border-modifier-border text-text-normal rounded cursor-pointer hover:bg-modifier-hover flex items-center justify-center"
          onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
          title={t('FILE_SELECT')}
          dangerouslySetInnerHTML={{ __html: BUTTON_ICONS.fileSelect }}
        />
        <button
          className="p-1 bg-primary border border-modifier-border text-text-normal rounded cursor-pointer hover:bg-modifier-hover flex items-center justify-center"
          onClick={e => { e.stopPropagation(); handleClearPath(); }}
          title={t('CLEAR_PATH')}
          dangerouslySetInnerHTML={{ __html: BUTTON_ICONS.clearPath }}
        />
      </div>
      {audioSrc && (
        <audio controls src={audioSrc} className="mb-2 w-full" />
      )}
      <textarea
        ref={textareaRef}
        value={sePrompt || ''}
        onChange={handlePromptChange}
        onKeyDown={handlePromptKeyDown}
        placeholder={t('SE_PROMPT_PLACEHOLDER')}
        className="w-full border-none focus:border-none focus:outline-none focus:shadow-none shadow-none rounded-none bg-transparent p-0 text-text-normal placeholder-text-faint leading-tight resize-none field-sizing-content overflow-y-hidden [@supports_not(field-sizing:content)]:overflow-y-auto"
      />
    </>
  );
};

export default SeInputCell;
