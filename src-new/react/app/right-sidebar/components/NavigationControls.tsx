import React from 'react';
import { Notice, App, Menu, TFile, MarkdownView } from 'obsidian';
import { t } from '../../../../constants/obsidian-i18n';
import { toolRegistry } from '../../../../service-api/core/tool-registry';
import { StoryboardFactory } from '../../../../obsidian-api/storyboard/storyboard-factory';
import { toggleStoryboardViewTool } from '../../../../service-api/api/storyboard-tool/toggle-storyboard-view';
import { useSelectedRowIndexStore } from '../../../../obsidian-api/zustand/store/selected-row-index-store';
import IconButtonGroup from '../../../components/IconButtonGroup';
import {
  PSD_ICON_SVG,
  PAINTER_ICON_SVG,
  STORYBOARD_TOGGLE_ICON_SVG,
  STORYBOARD_ICON_SVG,
  TIMELINE_ICON_SVG,
} from '../../../../constants/icons';

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
  const handleModeSwitch = async (evt: React.MouseEvent) => {
    try {
      console.log('handleModeSwitch called');
      const activeFile = app.workspace.getActiveFile();
      if (!activeFile) {
        console.log('No active file');
        return;
      }

      const currentExtension = activeFile.extension;
      console.log('Current file extension:', currentExtension);
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
        console.log('Unsupported file format:', currentExtension);
        return;
      }

      console.log('Showing menu');
      menu.showAtMouseEvent(evt.nativeEvent);
    } catch (error) {
      console.error('Menu display failed:', error);
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
        console.log('All vault files:', app.vault.getFiles().map(f => f.path));
        
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
        console.log('All vault files:', app.vault.getFiles().map(f => f.path));
        if (newFilePath) {
          const newFile = app.vault.getAbstractFileByPath(newFilePath);
          console.log('Found file object:', newFile);
          if (newFile && newFile instanceof TFile) {
            console.log('Opening converted file:', newFile.path);
            const leaf = app.workspace.getLeaf();
            console.log('Got leaf:', leaf);
            
            // ファイルの拡張子に応じて適切なビューで開く
            if (newFile.extension === 'otio') {
              // OTIOファイルの場合はタイムラインビューで開く
              await leaf.setViewState({
                type: 'timeline-view',
                state: { file: newFile.path }
              });
              console.log('OTIO file opened with timeline view');
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
      console.log('Converting OTIO to STORYBOARD (2-step process)');
      const activeFile = app.workspace.getActiveFile();
      if (!activeFile) {
        console.log('No active file for OTIO to STORYBOARD conversion');
        return;
      }

      console.log('Step 1: OTIO → MD');
      // OTIO → MD → STORYBOARD の2段階変換
      const mdResult = await toolRegistry.executeTool('convert_otio_to_md', {
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
      console.error('OTIO to STORYBOARD conversion failed:', error);
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
      <IconButtonGroup
        gap="gap-2"
        buttons={[
          {
            icon: PSD_ICON_SVG,
            onClick: handleCreateNewPsd,
            title: t('CREATE_PSD'),
            variant: 'accent',
            className: !currentImageUrl?.endsWith('.psd') && !isPsdPainterOpen ? '' : 'hidden',
          },
          {
            icon: PAINTER_ICON_SVG,
            onClick: onOpenPsdPainter,
            title: t('OPEN_PSD'),
            variant: 'accent',
            className: currentImageUrl?.endsWith('.psd') && !isPsdPainterOpen ? '' : 'hidden',
          },
          {
            icon: STORYBOARD_TOGGLE_ICON_SVG,
            onClick: handleModeSwitch,
            title: 'モード切替',
            variant: 'accent',
            className: !isPsdPainterOpen ? '' : 'hidden',
          },
        ]}
      />
      <IconButtonGroup
        gap="gap-2"
        buttons={[
          {
            icon: STORYBOARD_ICON_SVG,
            onClick: onBackToStoryboard,
            title: t('BACK_TO_STORYBOARD'),
            variant: 'accent',
            className: isPsdPainterOpen ? '' : 'hidden',
          },
        ]}
      />
    </div>
  );
}; 
