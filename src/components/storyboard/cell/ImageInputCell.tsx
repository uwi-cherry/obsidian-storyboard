import { App, normalizePath, Notice, TFile } from 'obsidian';
import { useEffect, useRef, useState } from 'react';
import type { FC, ChangeEvent } from 'react';
import IconButtonGroup from 'src/components/utils/IconButtonGroup';
import TextAreaField from 'src/components/utils/TextAreaField';
import ThumbnailViewer from 'src/components/utils/ThumbnailViewer';
import { BUTTON_ICONS } from 'src/constants/icons';
import { t } from 'src/constants/obsidian-i18n';
import useTextareaArrowNav from 'src/hooks/useTextareaArrowNav';
import { toolRegistry } from 'src/service/core/tool-registry';
import { useSelectedFrameStore } from 'src/store/selected-frame-store';
import { useSelectedRowIndexStore } from 'src/store/selected-row-index-store';

interface ImageInputCellProps {
  imageUrl?: string;
  imagePrompt?: string;
  
  onImageUrlChange: (newUrl: string | null) => void;
  onImagePromptChange: (newPrompt: string) => void;
  className?: string;
  app: App;
  focusPrevCellPrompt?: () => void;
  focusNextCellPrompt?: () => void;
  refCallback?: (el: HTMLTextAreaElement | null) => void;
}

const ImageInputCell: FC<ImageInputCellProps> = ({
  imageUrl,
  imagePrompt,
  onImageUrlChange,
  onImagePromptChange,
  app,
  focusPrevCellPrompt,
  focusNextCellPrompt,
  refCallback,
}) => {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const lastModifiedRef = useRef<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
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

  const handleCreateNewPsd = async () => {
    try {
      const result = await toolRegistry.executeTool('create_painter_file', {
        app
      });
      const parsedResult = JSON.parse(result);
      
      // ストーリーボードのImageInputCellと同じように直接データを更新
      const selectedRowIndex = useSelectedRowIndexStore.getState().selectedRowIndex;
      const activeFile = app.workspace.getActiveFile();
      
      if (selectedRowIndex !== null && activeFile && activeFile.extension === 'board') {
        try {
          // 現在のストーリーボードデータを読み込み
          const loadResult = await toolRegistry.executeTool('load_storyboard_data', {
            app,
            file: activeFile
          });
          const boardData = JSON.parse(loadResult);
          
          // 選択された行のimageUrlを更新
          let globalIndex = 0;
          let found = false;
          for (let chapterIndex = 0; chapterIndex < boardData.chapters.length; chapterIndex++) {
            const chapter = boardData.chapters[chapterIndex];
            for (let frameIndex = 0; frameIndex < chapter.frames.length; frameIndex++) {
              if (globalIndex === selectedRowIndex) {
                chapter.frames[frameIndex].imageUrl = parsedResult.filePath;
                found = true;
                break;
              }
              globalIndex++;
            }
            if (found) break;
          }
          
          // 更新されたデータを保存
          if (found) {
            await toolRegistry.executeTool('save_storyboard_data', {
              app,
              file: activeFile,
              data: JSON.stringify(boardData)
            });
            
            // Zustandストアを更新してストーリーボードの再描画を促す
            const selectedFrame = useSelectedFrameStore.getState().selectedFrame;
            if (selectedFrame) {
              const updatedFrame = { ...selectedFrame, imageUrl: parsedResult.filePath };
              useSelectedFrameStore.getState().setSelectedFrame(updatedFrame);
            }
          }
        } catch (error) {
          console.error('Failed to update board data:', error);
        }
      }
      
      onImageUrlChange(parsedResult.filePath);
    } catch (error) {
      console.error('PSD creation failed:', error);
    }
  };


  return (
    <>
      <IconButtonGroup
        buttons={[
          {
            icon: BUTTON_ICONS.fileSelect,
            onClick: (e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            },
            title: t('FILE_SELECT'),
            variant: 'primary'
          },
          {
            icon: BUTTON_ICONS.createPsd,
            onClick: (e) => {
              e.stopPropagation();
              handleCreateNewPsd();
            },
            title: t('CREATE_PSD'),
            variant: 'accent'
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
