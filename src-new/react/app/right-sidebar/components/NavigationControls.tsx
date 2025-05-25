import React from 'react';
import { Notice, App, Menu, TFile } from 'obsidian';
import { t } from '../../../../constants/obsidian-i18n';
import { toolRegistry } from '../../../../service-api/core/tool-registry';

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
            console.log('Opening renamed file:', newFile.path);
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
              // その他のファイルは通常通り開く（ストーリーボードファイルはfile-openイベントで自動切り替え）
              await leaf.openFile(newFile);
              console.log('File opened successfully');
            }
          } else {
            console.log('Renamed file not found in vault');
            console.log('Trying alternative search...');
            
            // 代替検索: ファイル名で検索
            const allFiles = app.vault.getFiles();
            const targetFileName = newFilePath.split('/').pop();
            const foundFile = allFiles.find(f => f.name === targetFileName);
            console.log('Alternative search result:', foundFile);
            
            if (foundFile) {
              console.log('Opening file found by alternative search:', foundFile.path);
              const leaf = app.workspace.getLeaf();
              
              // ファイルの拡張子に応じて適切なビューで開く
              if (foundFile.extension === 'otio') {
                // OTIOファイルの場合はタイムラインビューで開く
                await leaf.setViewState({
                  type: 'timeline-view',
                  state: { file: foundFile.path }
                });
                console.log('OTIO file opened with timeline view (alternative)');
              } else {
                // その他のファイルは通常通り開く
                await leaf.openFile(foundFile);
                console.log('Alternative file opened successfully');
              }
            }
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
          // ストーリーボードファイルは通常通り開く（file-openイベントで自動切り替え）
          await leaf.openFile(storyboardFile);
          console.log('STORYBOARD file opened successfully');
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
