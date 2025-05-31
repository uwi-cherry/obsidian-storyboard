import { App, TFile, MarkdownView } from "obsidian";
import { StoryboardFactory } from "src/app/storyboard/storyboard-factory";
import { t } from "src/constants/obsidian-i18n";
import { toggleStoryboardViewTool } from "src/service/api/storyboard-tool/toggle-storyboard-view";
import { toolRegistry } from "src/service/core/tool-registry";


interface NavigationControlsProps {
  isPsdPainterOpen: boolean;
  currentImageUrl: string | null;
  onBackToStoryboard: () => void;
  onOpenPsdPainter: () => void;
  app: App;
}

export function NavigationControls({
  isPsdPainterOpen,
  currentImageUrl,
  onBackToStoryboard,
  onOpenPsdPainter,
  app,
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


  return (
    <div className="flex flex-col gap-2 mb-4">
      <div className="flex gap-2">
        <button
          onClick={onOpenPsdPainter}
          className={`px-3 py-2 bg-accent text-on-accent hover:bg-accent-hover rounded cursor-pointer ${currentImageUrl?.endsWith('.psd') && !isPsdPainterOpen ? '' : 'hidden'}`}
          title={t('OPEN_PSD')}
        >
          .psd
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
