import * as React from 'react';
import { Notice, App, Menu, TFile, MarkdownView } from 'obsidian';
import { t } from '../../../../constants/obsidian-i18n';
import { toolRegistry } from '../../../../service-api/core/tool-registry';
import { StoryboardFactory } from '../../../../obsidian-api/storyboard/storyboard-factory';
import { toggleStoryboardViewTool } from '../../../../service-api/api/storyboard-tool/toggle-storyboard-view';
import { useSelectedRowIndexStore } from '../../../../zustand/store/selected-row-index-store';
import { useSelectedFrameStore } from '../../../../zustand/store/selected-frame-store';

interface NavigationControlsProps {
  isPsdPainterOpen: boolean;
  currentImageUrl: string | null;
  onBackToStoryboard: () => void;
  onOpenPsdPainter: () => void;
  app: App;
  onImageUrlChange: (newUrl: string | null) => void;
}

export function NavigationControls({
  isPsdPainterOpen,
  currentImageUrl,
  onBackToStoryboard,
  onOpenPsdPainter,
  app,
  onImageUrlChange,
}: NavigationControlsProps) {
  const handleConvertToBoard = async () => {
    const activeFile = app.workspace.getActiveFile();
    if (!activeFile) return;
    
    if (activeFile.extension === 'md') {
      await convertFile('rename_file_extension', 'board', 'BOARD');
    } else if (activeFile.extension === 'usda') {
      await convertToStoryboard();
    }
  };

  const handleConvertToMd = async () => {
    const activeFile = app.workspace.getActiveFile();
    if (!activeFile) return;
    
    if (activeFile.extension === 'board') {
      await convertFile('rename_file_extension', 'md', 'Markdown');
    } else if (activeFile.extension === 'usda') {
      await convertFile('convert_usd_to_md', 'md', 'Markdown');
    }
  };

  const handleConvertToUsd = async () => {
    const activeFile = app.workspace.getActiveFile();
    if (!activeFile) return;
    
    if (activeFile.extension === 'md' || activeFile.extension === 'board') {
      await convertFile('convert_md_to_usd', 'usda', 'USD');
    }
  };

  const convertFile = async (toolName: string, targetExtension: string, modeName: string) => {
    try {
      const activeFile = app.workspace.getActiveFile();
      if (!activeFile) {
        return;
      }
      
        let result: string;
        if (toolName === 'rename_file_extension') {
          result = await toolRegistry.executeTool(toolName, {
            app,
            file: activeFile,
            newExt: targetExtension
          });

          const parsedResult = JSON.parse(result);

          // リネーム後のファイルを開く
          const newFilePath = parsedResult.newPath;
        
        if (newFilePath) {
          const newFile = app.vault.getAbstractFileByPath(newFilePath);

          if (newFile && newFile instanceof TFile) {

            // ストーリーボードファイルが開かれているMarkdownViewのリーフを探す
            const markdownLeaves = app.workspace.getLeavesOfType('markdown');

            let targetLeaf = null;
            for (const leaf of markdownLeaves) {
              if (leaf.view instanceof MarkdownView && leaf.view.file?.path === newFile.path) {
                targetLeaf = leaf;
                break;
              }
            }
            
            // toggle-storyboard-viewツールを使用してビュー切り替え
            if ((newFile.extension === 'board' || newFile.extension === 'md') && targetLeaf) {
              try {
                const factory = new StoryboardFactory();
                const result = await toggleStoryboardViewTool.execute({
                  app,
                  leaf: targetLeaf,
                  factory
                });
              } catch (error) {
                console.error('Failed to toggle view:', error);
                // フォールバック: file-openイベントを発火
                app.workspace.trigger('file-open', newFile);
              }
            } else if (!targetLeaf) {
              app.workspace.trigger('file-open', newFile);
            }
          }
        }
      } else {
        result = await toolRegistry.executeTool(toolName, {
          app,
          file: activeFile
        });

        const parsedResult = JSON.parse(result);

        // 変換後のファイルを開く
        const newFilePath = parsedResult.filePath;
        if (newFilePath) {
          const newFile = app.vault.getAbstractFileByPath(newFilePath);
          if (newFile && newFile instanceof TFile) {
            const leaf = app.workspace.getLeaf();
            
            // ファイルの拡張子に応じて適切なビューで開く
            if (newFile.extension === 'usda') {
              // USDファイルの場合はタイムラインビューで開く
              await leaf.setViewState({
                type: 'timeline-view',
                state: { file: newFile.path }
              });
            } else {
              // その他のファイルは通常通り開く
              await leaf.openFile(newFile);
              
              // ストーリーボードファイルの場合は明示的にストーリーボードビューに切り替え
              if (newFile.extension === 'board') {
                // file-openイベントを手動で発火
                app.workspace.trigger('file-open', newFile);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(`Conversion to ${modeName} failed:`, error);
    }
  };

  const convertToStoryboard = async () => {
    try {
      const activeFile = app.workspace.getActiveFile();
      if (!activeFile) {
        return;
      }

      // USD → MD → STORYBOARD の2段階変換
      const mdResult = await toolRegistry.executeTool('convert_usd_to_md', {
        app,
        file: activeFile
      });

      const mdData = JSON.parse(mdResult);
      const mdFile = app.vault.getAbstractFileByPath(mdData.filePath);

      if (mdFile) {
        const boardResult = await toolRegistry.executeTool('rename_file_extension', {
          app,
          file: mdFile,
          newExt: 'board'
        });
        const boardData = JSON.parse(boardResult);

        const boardFile = app.vault.getAbstractFileByPath(boardData.newPath);
        if (boardFile && boardFile instanceof TFile) {
          const leaf = app.workspace.getLeaf();
          // ストーリーボードファイルは通常通り開く
          await leaf.openFile(boardFile);

          // 明示的にストーリーボードビューに切り替え
          // file-openイベントを手動で発火
          app.workspace.trigger('file-open', boardFile);
        }
      }
	} catch (error) {
      console.error('USD to STORYBOARD conversion failed:', error);
    }
  };

  const handleCreateNewPsd = async () => {
    try {
      const boardPath = app.workspace.getActiveFile()?.parent?.path || '';
      
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
      onOpenPsdPainter();
    } catch (error) {
      console.error('PSD creation failed:', error);
    }
  };

  return (
    <div className="flex flex-col gap-2 mb-4">
      <div className="flex gap-2">
        <button
          onClick={handleCreateNewPsd}
          className={`px-3 py-2 bg-accent text-on-accent hover:bg-accent-hover rounded cursor-pointer ${!currentImageUrl?.endsWith('.psd') && !isPsdPainterOpen ? '' : 'hidden'}`}
          title={t('CREATE_PSD')}
        >
          .psd (new)
        </button>
        <button
          onClick={onOpenPsdPainter}
          className={`px-3 py-2 bg-accent text-on-accent hover:bg-accent-hover rounded cursor-pointer ${currentImageUrl?.endsWith('.psd') && !isPsdPainterOpen ? '' : 'hidden'}`}
          title={t('OPEN_PSD')}
        >
          .psd (open)
        </button>
        <button
          onClick={handleConvertToMd}
          className={`px-3 py-2 bg-accent text-on-accent hover:bg-accent-hover rounded cursor-pointer ${!isPsdPainterOpen ? '' : 'hidden'}`}
          title="MDに変換"
        >
          .md
        </button>
        <button
          onClick={handleConvertToBoard}
          className={`px-3 py-2 bg-accent text-on-accent hover:bg-accent-hover rounded cursor-pointer ${!isPsdPainterOpen ? '' : 'hidden'}`}
          title="BOARDに変換"
        >
          .board
        </button>
        <button
          onClick={handleConvertToUsd}
          className={`px-3 py-2 bg-accent text-on-accent hover:bg-accent-hover rounded cursor-pointer ${!isPsdPainterOpen ? '' : 'hidden'}`}
          title="USDに変換"
        >
          .usda
        </button>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onBackToStoryboard}
          className={`px-3 py-2 bg-accent text-on-accent hover:bg-accent-hover rounded cursor-pointer ${isPsdPainterOpen ? '' : 'hidden'}`}
          title={t('BACK_TO_STORYBOARD')}
        >
          .board
        </button>
      </div>
    </div>
  );
}
