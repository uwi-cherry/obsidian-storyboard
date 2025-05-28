import { App, normalizePath, Notice, TFile } from 'obsidian';
import React, { useEffect, useRef, useState } from 'react';
import { BUTTON_ICONS } from '../../../constants/icons';
import { t } from '../../../constants/obsidian-i18n';
import IconButtonGroup from '../../components/IconButtonGroup';
import TextAreaField from '../../components/TextAreaField';
import ThumbnailViewer from '../../components/ThumbnailViewer';
import useTextareaArrowNav from '../../hooks/useTextareaArrowNav';
import { toolRegistry } from '../../../service-api/core/tool-registry';

interface ImageInputCellProps {
  imageUrl?: string;
  imagePrompt?: string;
  
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
            try {
              
              const result = await toolRegistry.executeTool('generate_thumbnail', { 
                app, 
                file 
              });
              const parsedResult = JSON.parse(result);
              const thumbnailData = parsedResult.thumbnailData;
              if (!cancelled) {
                setThumbnail(thumbnailData);
                lastModifiedRef.current = currentModified;
              }
            } catch (error) {
              if (!cancelled) {
                setThumbnail(null);
                lastModifiedRef.current = null;
              }
            }
          }
        }
      } catch (error) {
        if (!cancelled) {
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



  const handlePromptKeyDown = useTextareaArrowNav(textareaRef, {
    onArrowUp: focusPrevCellPrompt,
    onArrowDown: focusNextCellPrompt,
  });

  const handleThumbnailDoubleClick = async () => {
    if (!imageUrl?.endsWith('.psd')) return;
    const file = app.vault.getAbstractFileByPath(imageUrl);
    if (file instanceof TFile) {
      const leaf = app.workspace.getLeaf(true);
      await leaf.openFile(file, { active: true });
      
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
        console.error(err);
      }
      path = normalizePath(`${assetsDir}/${file.name}`);
      const newFile = await app.vault.createBinary(path, arrayBuffer);
      path = newFile.path;
    }

    const ext = path.toLowerCase().split('.').pop();
    if (ext && ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) {
      const imageFile = app.vault.getAbstractFileByPath(path);
      if (imageFile instanceof TFile) {
        try {
          const storyboardDir = app.workspace.getActiveFile()?.parent?.path || '';
          const psdDir = storyboardDir ? `${storyboardDir}/psd` : undefined;
          
          const result = await toolRegistry.executeTool('create_painter_file', { 
            app, 
            imageFile,
            targetDir: psdDir,
            baseFileName: imageFile.basename
          });
          const parsedResult = JSON.parse(result);
          path = parsedResult.filePath;
        } catch (error) {
          console.error(error);
        }
      }
    }

    onImageUrlChange(path);
  };

  const handleClearPath = () => {
    
    setThumbnail(null);
    lastModifiedRef.current = null;
    
    onImageUrlChange(null);
  };

  const handleAiGenerate = async () => {
    if (isGenerating) return; 

    if (!imagePrompt || imagePrompt.trim() === '') {
      new Notice(t('PROMPT_REQUIRED'));
      return;
    }

    new Notice('AI生成機能は実装予定です');
  };

  return (
    <>
      <IconButtonGroup
        buttons={[
          {
            icon: BUTTON_ICONS.aiGenerate,
            onClick: (e) => {
              e.stopPropagation();
              handleAiGenerate();
            },
            title: isGenerating ? t('GENERATING') : t('AI_GENERATE'),
            disabled: isGenerating,
            variant: 'accent'
          },
          {
            icon: BUTTON_ICONS.fileSelect,
            onClick: (e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            },
            title: t('FILE_SELECT'),
            variant: 'primary'
          }
        ]}
        className="mb-2"
      />
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".psd,.png,.jpg,.jpeg,.gif,.webp"
        className="hidden"
        onChange={handleFileSelect}
      />
      
      {thumbnail ? (
        <ThumbnailViewer
          src={thumbnail}
          alt={t('PSD_THUMBNAIL')}
          title={imageUrl || ''}
          onDoubleClick={handleThumbnailDoubleClick}
          onClear={handleClearPath}
          clearButtonIcon={BUTTON_ICONS.clearPath}
          clearButtonTitle={t('CLEAR_PATH')}
        />
      ) : (
        <TextAreaField
          ref={textareaRef}
          value={imagePrompt}
          onChange={onImagePromptChange}
          onKeyDown={handlePromptKeyDown}
          placeholder={t('IMAGE_PROMPT_PLACEHOLDER')}
        />
      )}
    </>
  );
};

export default ImageInputCell; 
