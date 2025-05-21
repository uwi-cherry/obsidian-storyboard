import React, { useEffect, useState, useRef } from 'react';
import { App, TFile, normalizePath, Notice } from 'obsidian';
import MyPlugin from 'main';
import { BUTTON_ICONS } from 'src/icons';
import { generatePsdFromPrompt } from 'src/ai/action/generatePsdFromPrompt';
import { t } from 'src/i18n';
interface ImageInputCellProps {
  imageUrl?: string;
  imagePrompt?: string;
  /** 画像ファイルの変更を親へ通知する */
  onImageUrlChange: (newUrl: string | null) => void;
  onImagePromptChange: (newPrompt: string) => void;
  className?: string;
  app: App;
  generateThumbnail: (app: App, file: TFile) => Promise<string | null>;
  createPsd: (
    app: App,
    imageFile?: TFile,
    layerName?: string,
    isOpen?: boolean,
    targetDir?: string
  ) => Promise<TFile>;
  focusPrevCellPrompt?: () => void;
  focusNextCellPrompt?: () => void;
  refCallback?: (el: HTMLTextAreaElement | null) => void;
}

const ImageInputCell: React.FC<ImageInputCellProps> = ({
  imageUrl,
  imagePrompt,
  onImageUrlChange,
  onImagePromptChange,
  app,
  generateThumbnail,
  createPsd,
  focusPrevCellPrompt,
  focusNextCellPrompt,
  refCallback,
}) => {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const lastModifiedRef = useRef<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (refCallback) {
      refCallback(textareaRef.current);
    }
    return () => {
      if (refCallback) refCallback(null);
    };
  }, [refCallback]);

  useEffect(() => {
    let cancelled = false;

    const loadThumbnail = async () => {
      if (!imageUrl?.endsWith('.psd')) {
        setThumbnail(null);
        lastModifiedRef.current = null;
        return;
      }

      try {
        const file = app.vault.getAbstractFileByPath(imageUrl);
        if (file instanceof TFile) {
          const currentModified = file.stat.mtime;
          if (lastModifiedRef.current === null || currentModified > lastModifiedRef.current) {
            const thumbnailData = await generateThumbnail(app, file);
            if (!cancelled) {
              setThumbnail(thumbnailData);
              lastModifiedRef.current = currentModified;
            }
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error('サムネイルの読み込みに失敗しました:', error);
          setThumbnail(null);
          lastModifiedRef.current = null;
        }
      }
    };

    loadThumbnail();

    return () => {
      cancelled = true;
    };
  }, [imageUrl, app]);

  const handleImagePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onImagePromptChange(e.target.value);
  };

  const handlePromptKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd, value } = textarea;
    if (e.key === 'ArrowUp') {
      if (selectionStart === 0) {
        e.preventDefault();
        if (focusPrevCellPrompt) focusPrevCellPrompt();
      }
    } else if (e.key === 'ArrowDown') {
      if (selectionEnd === value.length) {
        e.preventDefault();
        if (focusNextCellPrompt) focusNextCellPrompt();
      }
    }
  };

  // サムネイルダブルクリックでPSDを開く
  const handleThumbnailDoubleClick = async () => {
    if (!imageUrl?.endsWith('.psd')) return;
    const file = app.vault.getAbstractFileByPath(imageUrl);
    if (file instanceof TFile) {
      const leaf = app.workspace.getLeaf(true);
      await leaf.openFile(file, { active: true });
    }
  };

  // ファイル選択
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
      const newFile = await app.vault.createBinary(path, arrayBuffer);
      path = newFile.path;
    }

    // 画像ファイルの場合、PSDファイルを生成
    const ext = path.toLowerCase().split('.').pop();
    if (ext && ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) {
      const imageFile = app.vault.getAbstractFileByPath(path);
      if (imageFile instanceof TFile) {
        // ストーリーボードのディレクトリを取得
        const storyboardPath = app.workspace.getActiveFile()?.parent?.path || '';
        const psdFile = await createPsd(app, imageFile, imageFile.basename, false, storyboardPath);
        path = psdFile.path;
      }
    }

    onImageUrlChange(path);
  };

  // パスをクリア
  const handleClearPath = () => {
    // サムネイル即時非表示
    setThumbnail(null);
    lastModifiedRef.current = null;
    // 親へ空文字列を渡して imageUrl 自体をクリア
    onImageUrlChange('');
  };

  // AI生成（OpenAI Image API で画像生成 → PSD 作成 → URL 更新）
  const handleAiGenerate = async () => {
    if (isGenerating) return; // 連打防止

    if (!imagePrompt || imagePrompt.trim() === '') {
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
      await generatePsdFromPrompt(plugin, imagePrompt);
      // 最新のPSDファイルを探す
      const psdFiles = app.vault.getFiles().filter(f => f.extension === 'psd');
      const latestPsd = psdFiles.sort((a, b) => b.stat.mtime - a.stat.mtime)[0];
      if (latestPsd) {
        onImageUrlChange(latestPsd.path);
      }
    } catch (err) {
      console.error('AI画像生成に失敗しました:', err);
      new Notice(t('GENERATE_FAILED'));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <div className="flex gap-2 mb-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".psd,.png,.jpg,.jpeg,.gif,.webp"
          className="hidden"
          onChange={handleFileSelect}
        />
        <button
          className="p-1 bg-accent text-on-accent rounded cursor-pointer hover:bg-accent-hover disabled:opacity-50 flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            handleAiGenerate();
          }}
          disabled={isGenerating}
          title={isGenerating ? t('GENERATING') : t('AI_GENERATE')}
          dangerouslySetInnerHTML={{ __html: BUTTON_ICONS.aiGenerate }}
        />
        <button
          className="p-1 bg-primary border border-modifier-border text-text-normal rounded cursor-pointer hover:bg-modifier-hover flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          title={t('FILE_SELECT')}
          dangerouslySetInnerHTML={{ __html: BUTTON_ICONS.fileSelect }}
        />
        <button
          className="p-1 bg-primary border border-modifier-border text-text-normal rounded cursor-pointer hover:bg-modifier-hover flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            handleClearPath();
          }}
          title={t('CLEAR_PATH')}
          dangerouslySetInnerHTML={{ __html: BUTTON_ICONS.clearPath }}
        />
      </div>
      
      {thumbnail ? (
        <img
          src={thumbnail}
          alt="PSD thumbnail"
          title={imageUrl || ''}
          className="w-auto object-contain bg-secondary rounded cursor-pointer"
          onDoubleClick={handleThumbnailDoubleClick}
          tabIndex={0}
        />
      ) : (
        <textarea
          ref={textareaRef}
          value={imagePrompt || ''}
          onChange={handleImagePromptChange}
          onKeyDown={handlePromptKeyDown}
          placeholder={t('IMAGE_PROMPT_PLACEHOLDER')}
          className="w-full border-none focus:border-none focus:outline-none focus:shadow-none shadow-none rounded-none bg-transparent p-0 text-text-normal placeholder-text-faint leading-tight resize-none field-sizing-content overflow-y-hidden [@supports_not(field-sizing:content)]:overflow-y-auto"
        />
      )}
    </>
  );
};

export default ImageInputCell;
