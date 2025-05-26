import React from 'react';
import { Notice, App, Menu, TFile, MarkdownView } from 'obsidian';
import { t } from '../../../../constants/obsidian-i18n';
import { toolRegistry } from '../../../../service-api/core/tool-registry';
import { StoryboardFactory } from '../../../../obsidian-api/storyboard/storyboard-factory';
import { toggleStoryboardViewTool } from '../../../../service-api/api/storyboard-tool/toggle-storyboard-view';

interface NavigationControlsProps {
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
  const handleModeSwitch = async (evt: React.MouseEvent) => {
    try {
      const activeFile = app.workspace.getActiveFile();
      if (!activeFile) {
        return;
      }

      const currentExtension = activeFile.extension;
      const menu = new Menu();

      // 現在のファイル形式に応じて変換オプションを追加
      if (currentExtension === 'md') {
        menu.addItem(item =>
          item
            .setTitle('STORYBOARDに変換')
            .setIcon('storyboard')
            .onClick(async () => {
              await convertFile('rename_file_extension', 'storyboard', 'STORYBOARD');
            })
        );
        menu.addItem(item =>
          item
            .setTitle('OTIOに変換')
            .setIcon('timeline')
            .onClick(async () => {
              await convertFile('convert_md_to_otio', 'otio', 'OTIO');
            })
        );
      } else if (currentExtension === 'storyboard') {
        menu.addItem(item =>
          item
            .setTitle('MDに変換')
            .setIcon('document')
            .onClick(async () => {
              await convertFile('rename_file_extension', 'md', 'Markdown');
            })
        );
        menu.addItem(item =>
          item
            .setTitle('OTIOに変換')
            .setIcon('timeline')
            .onClick(async () => {
              await convertFile('convert_md_to_otio', 'otio', 'OTIO');
            })
        );
      } else if (currentExtension === 'otio') {
        menu.addItem(item =>
          item
            .setTitle('MDに変換')
            .setIcon('document')
            .onClick(async () => {
              await convertFile('convert_otio_to_md', 'md', 'Markdown');
            })
        );
        menu.addItem(item =>
          item
            .setTitle('STORYBOARDに変換')
            .setIcon('storyboard')
            .onClick(async () => {
              await convertToStoryboard();
            })
        );
      } else {
        return;
      }

      menu.showAtMouseEvent(evt.nativeEvent);
    } catch (error) {
      console.error('Menu display failed:', error);
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
            if ((newFile.extension === 'storyboard' || newFile.extension === 'md') && targetLeaf) {
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
          } else {
          }
        } else {
        }
      } else {
        result = await toolRegistry.executeTool(toolName, {
          app,
          file: activeFile
        });
        
        
        // 変換後のファイルを開く
        const newFilePath = parsedResult.filePath;
        if (newFilePath) {
          const newFile = app.vault.getAbstractFileByPath(newFilePath);
          if (newFile && newFile instanceof TFile) {
            const leaf = app.workspace.getLeaf();
            
            // ファイルの拡張子に応じて適切なビューで開く
            if (newFile.extension === 'otio') {
              // OTIOファイルの場合はタイムラインビューで開く
              await leaf.setViewState({
                type: 'timeline-view',
                state: { file: newFile.path }
              });
            } else {
              // その他のファイルは通常通り開く
              await leaf.openFile(newFile);
              
              // ストーリーボードファイルの場合は明示的にストーリーボードビューに切り替え
              if (newFile.extension === 'storyboard') {
                // file-openイベントを手動で発火
                app.workspace.trigger('file-open', newFile);
              }
            }
          } else {
          }
        } else {
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

      // OTIO → MD → STORYBOARD の2段階変換
      const mdResult = await toolRegistry.executeTool('convert_otio_to_md', {
        app,
        file: activeFile
      });
      
      const mdData = JSON.parse(mdResult);
      const mdFile = app.vault.getAbstractFileByPath(mdData.filePath);
      
      if (mdFile) {
        const storyboardResult = await toolRegistry.executeTool('rename_file_extension', {
          app,
          file: mdFile,
          newExt: 'storyboard'
        });
        
        const storyboardData = JSON.parse(storyboardResult);
        
        const storyboardFile = app.vault.getAbstractFileByPath(storyboardData.newPath);
        if (storyboardFile && storyboardFile instanceof TFile) {
          const leaf = app.workspace.getLeaf();
          // ストーリーボードファイルは通常通り開く
          await leaf.openFile(storyboardFile);
          
          // 明示的にストーリーボードビューに切り替え
          // file-openイベントを手動で発火
          app.workspace.trigger('file-open', storyboardFile);
        } else {
        }
      } else {
      }
    } catch (error) {
      console.error('OTIO to STORYBOARD conversion failed:', error);
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
      console.error('PSD creation failed:', error);
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
          onClick={handleModeSwitch}
        >
          モード切替
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
