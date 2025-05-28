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

export const NavigationControls: React.FC<NavigationControlsProps> = ({
  isPsdPainterOpen,
  currentImageUrl,
  onBackToStoryboard,
  onOpenPsdPainter,
  app,
  onImageUrlChange,
}) => {
  const handleConvertToStoryboard = async () => {
    const activeFile = app.workspace.getActiveFile();
    if (!activeFile) return;
    
    if (activeFile.extension === 'md') {
      await convertFile('rename_file_extension', 'storyboard', 'STORYBOARD');
    } else if (activeFile.extension === 'usda') {
      await convertToStoryboard();
    }
  };

  const handleConvertToMd = async () => {
    const activeFile = app.workspace.getActiveFile();
    if (!activeFile) return;
    
    if (activeFile.extension === 'storyboard') {
      await convertFile('rename_file_extension', 'md', 'Markdown');
    } else if (activeFile.extension === 'usda') {
      await convertFile('convert_usd_to_md', 'md', 'Markdown');
    }
  };

  const handleConvertToUsd = async () => {
    const activeFile = app.workspace.getActiveFile();
    if (!activeFile) return;
    
    if (activeFile.extension === 'md' || activeFile.extension === 'storyboard') {
      await convertFile('convert_md_to_usd', 'usda', 'USD');
    }
  };

  const convertFile = async (toolName: string, targetExtension: string, modeName: string) => {
    try {
      console.log(`Converting to ${modeName} using tool: ${toolName}`);
      const activeFile = app.workspace.getActiveFile();
      if (!activeFile) {
        console.log('No active file for conversion');
        return;
      }

      console.log(`Converting file: ${activeFile.path}`);
      
      let result: string;
      if (toolName === 'rename_file_extension') {
        console.log(`Renaming extension to: ${targetExtension}`);
        result = await toolRegistry.executeTool(toolName, {
          app,
          file: activeFile,
          newExt: targetExtension
        });
        
        console.log('Rename result:', result);
        const parsedResult = JSON.parse(result);
        console.log('Parsed result:', parsedResult);
        
        // リネーム後のファイルを開く
        const newFilePath = parsedResult.newPath;
        console.log('New file path:', newFilePath);
        console.log('Original file path:', activeFile.path);
        console.log('Parent path:', activeFile.parent?.path);
        console.log('Base name:', activeFile.basename);
        console.log(
          'All vault files:',
          app.vault.getFiles().map((f: TFile) => f.path)
        );
        
        if (newFilePath) {
          const newFile = app.vault.getAbstractFileByPath(newFilePath);
          console.log('Found file object:', newFile);
          
          if (newFile && newFile instanceof TFile) {
            console.log('File extension changed to:', newFile.extension);
            
            // ストーリーボードファイルが開かれているMarkdownViewのリーフを探す
            const markdownLeaves = app.workspace.getLeavesOfType('markdown');
            console.log('Found markdown leaves:', markdownLeaves.length);
            
            let targetLeaf = null;
            for (const leaf of markdownLeaves) {
              if (leaf.view instanceof MarkdownView && leaf.view.file?.path === newFile.path) {
                targetLeaf = leaf;
                console.log('Found target leaf with matching file:', leaf);
                break;
              }
            }
            
            // toggle-storyboard-viewツールを使用してビュー切り替え
            if ((newFile.extension === 'storyboard' || newFile.extension === 'md') && targetLeaf) {
              console.log('Using toggle-storyboard-view tool for renamed file');
              try {
                const factory = new StoryboardFactory();
                const result = await toggleStoryboardViewTool.execute({
                  app,
                  leaf: targetLeaf,
                  factory
                });
                console.log('Toggle result:', result);
              } catch (error) {
                console.error('Failed to toggle view:', error);
                // フォールバック: file-openイベントを発火
                console.log('Trying fallback: triggering file-open event');
                app.workspace.trigger('file-open', newFile);
              }
            } else if (!targetLeaf) {
              console.log('No target leaf found, triggering file-open event');
              app.workspace.trigger('file-open', newFile);
            }
            console.log('File extension change completed');
          } else {
            console.log('Renamed file not found in vault');
          }
        } else {
          console.log('No newPath in result');
        }
      } else {
        console.log(`Using conversion tool: ${toolName}`);
        result = await toolRegistry.executeTool(toolName, {
          app,
          file: activeFile
        });
        
        console.log('Conversion result:', result);
        const parsedResult = JSON.parse(result);
        console.log('Parsed result:', parsedResult);
        
        // 変換後のファイルを開く
        const newFilePath = parsedResult.filePath;
        console.log('New file path:', newFilePath);
        console.log(
          'All vault files:',
          app.vault.getFiles().map((f: TFile) => f.path)
        );
        if (newFilePath) {
          const newFile = app.vault.getAbstractFileByPath(newFilePath);
          console.log('Found file object:', newFile);
          if (newFile && newFile instanceof TFile) {
            console.log('Opening converted file:', newFile.path);
            const leaf = app.workspace.getLeaf();
            console.log('Got leaf:', leaf);
            
            // ファイルの拡張子に応じて適切なビューで開く
            if (newFile.extension === 'usda') {
              // USDファイルの場合はタイムラインビューで開く
              await leaf.setViewState({
                type: 'timeline-view',
                state: { file: newFile.path }
              });
              console.log('USD file opened with timeline view');
            } else {
              // その他のファイルは通常通り開く
              await leaf.openFile(newFile);
              console.log('File opened successfully');
              
              // ストーリーボードファイルの場合は明示的にストーリーボードビューに切り替え
              if (newFile.extension === 'storyboard') {
                console.log('Triggering storyboard view switch for converted file:', newFile.path);
                // file-openイベントを手動で発火
                app.workspace.trigger('file-open', newFile);
              }
            }
          } else {
            console.log('Converted file not found in vault');
          }
        } else {
          console.log('No filePath in result');
        }
      }
    } catch (error) {
      console.error(`Conversion to ${modeName} failed:`, error);
    }
  };

  const convertToStoryboard = async () => {
    try {
      console.log('Converting USD to STORYBOARD (2-step process)');
      const activeFile = app.workspace.getActiveFile();
      if (!activeFile) {
        console.log('No active file for USD to STORYBOARD conversion');
        return;
      }

      console.log('Step 1: USD → MD');
      // USD → MD → STORYBOARD の2段階変換
      const mdResult = await toolRegistry.executeTool('convert_usd_to_md', {
        app,
        file: activeFile
      });
      
      console.log('MD conversion result:', mdResult);
      const mdData = JSON.parse(mdResult);
      const mdFile = app.vault.getAbstractFileByPath(mdData.filePath);
      
      if (mdFile) {
        console.log('Step 2: MD → STORYBOARD');
        const storyboardResult = await toolRegistry.executeTool('rename_file_extension', {
          app,
          file: mdFile,
          newExt: 'storyboard'
        });
        
        console.log('STORYBOARD conversion result:', storyboardResult);
        const storyboardData = JSON.parse(storyboardResult);
        
        const storyboardFile = app.vault.getAbstractFileByPath(storyboardData.newPath);
        if (storyboardFile && storyboardFile instanceof TFile) {
          console.log('Opening STORYBOARD file:', storyboardFile.path);
          const leaf = app.workspace.getLeaf();
          // ストーリーボードファイルは通常通り開く
          await leaf.openFile(storyboardFile);
          console.log('STORYBOARD file opened successfully');
          
          // 明示的にストーリーボードビューに切り替え
          console.log('Triggering storyboard view switch for 2-step conversion:', storyboardFile.path);
          // file-openイベントを手動で発火
          app.workspace.trigger('file-open', storyboardFile);
        } else {
          console.log('STORYBOARD file not found in vault');
        }
      } else {
        console.log('MD file not found after conversion');
      }
    } catch (error) {
      console.error('USD to STORYBOARD conversion failed:', error);
    }
  };

  const handleCreateNewPsd = async () => {
    try {
      console.log('Creating new PSD file');
      const storyboardPath = app.workspace.getActiveFile()?.parent?.path || '';
      console.log('Storyboard path:', storyboardPath);
      
      const result = await toolRegistry.executeTool('create_painter_file', { 
        app 
      });
      console.log('PSD creation result:', result);
      const parsedResult = JSON.parse(result);
      
      // ストーリーボードのImageInputCellと同じように直接データを更新
      const selectedRowIndex = useSelectedRowIndexStore.getState().selectedRowIndex;
      const activeFile = app.workspace.getActiveFile();
      
      if (selectedRowIndex !== null && activeFile && activeFile.extension === 'storyboard') {
        try {
          // 現在のストーリーボードデータを読み込み
          const loadResult = await toolRegistry.executeTool('load_storyboard_data', {
            app,
            file: activeFile
          });
          const storyboardData = JSON.parse(loadResult);
          
          // 選択された行のimageUrlを更新
          let globalIndex = 0;
          let found = false;
          for (let chapterIndex = 0; chapterIndex < storyboardData.chapters.length; chapterIndex++) {
            const chapter = storyboardData.chapters[chapterIndex];
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
              data: JSON.stringify(storyboardData)
            });
            console.log('Storyboard data updated with new PSD path');
            
            // Zustandストアを更新してストーリーボードの再描画を促す
            const selectedFrame = useSelectedFrameStore.getState().selectedFrame;
            if (selectedFrame) {
              const updatedFrame = { ...selectedFrame, imageUrl: parsedResult.filePath };
              useSelectedFrameStore.getState().setSelectedFrame(updatedFrame);
            }
          }
        } catch (error) {
          console.error('Failed to update storyboard data:', error);
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
          onClick={handleConvertToStoryboard}
          className={`px-3 py-2 bg-accent text-on-accent hover:bg-accent-hover rounded cursor-pointer ${!isPsdPainterOpen ? '' : 'hidden'}`}
          title="STORYBOARDに変換"
        >
          .storyboard
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
          .storyboard
        </button>
      </div>
    </div>
  );
}; 
