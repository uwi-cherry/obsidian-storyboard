import { Plugin, addIcon, Menu, TFile } from 'obsidian';
import { OBSIDIAN_ICONS } from '../../constants/icons';
import { toolRegistry } from '../../service/core/tool-registry';
import { TOOL_NAMES } from '../../constants/tools-config';

export class CreateMenuPlugin {
  private plugin: Plugin;

  constructor(plugin: Plugin) {
    this.plugin = plugin;
  }

  initialize(): void {
    addIcon('create-menu', OBSIDIAN_ICONS.ADD_ICON_SVG);
    
    this.plugin.addRibbonIcon('create-menu', '新規作成', async (evt: MouseEvent) => {
      const menu = new Menu();
      
      menu.addItem(item =>
        item
          .setTitle('Storyboard')
          .setIcon('board')
          .onClick(async () => {
            try {
              const result = await toolRegistry.executeTool(TOOL_NAMES.CREATE_STORYBOARD_FILE, { app: this.plugin.app });
              try {
                const resultData = JSON.parse(result);
                if (resultData.filePath) {
                  const file = this.plugin.app.vault.getAbstractFileByPath(resultData.filePath);
                  if (file instanceof TFile) {
                    const activeLeaf = this.plugin.app.workspace.getLeaf(true);
                    await activeLeaf.openFile(file);
                    return;
                  }
                }
              } catch {
                // JSON parse error is ignored
              }
              const activeLeaf = this.plugin.app.workspace.getLeaf(true);
              const storyboardFiles = this.plugin.app.vault.getFiles().filter(f => f.extension === 'board');
              if (storyboardFiles.length > 0) {
                const latestFile = storyboardFiles[storyboardFiles.length - 1];
                await activeLeaf.openFile(latestFile);
              }
            } catch (error) {
              console.error(error);
            }
          })
      );

      menu.addItem(item =>
        item
          .setTitle('Painter')
          .setIcon('palette')
          .onClick(async () => {
            await toolRegistry.executeTool(TOOL_NAMES.CREATE_PAINTER_FILE, { app: this.plugin.app });
          })
      );
      
      menu.addItem(item =>
        item
          .setTitle('Timeline')
          .setIcon('timeline')
          .onClick(async () => {
            try {
              const result = await toolRegistry.executeTool(TOOL_NAMES.CREATE_USD_FILE, { app: this.plugin.app });
              const resultData = JSON.parse(result);
              if (resultData.filePath) {
                const file = this.plugin.app.vault.getAbstractFileByPath(resultData.filePath);
                if (file instanceof TFile) {
                  const leaf = this.plugin.app.workspace.getLeaf(true);
                  await leaf.openFile(file);
                }
              }
            } catch (error) {
              console.error('タイムラインファイル作成エラー:', error);
            }
          })
      );
      menu.showAtMouseEvent(evt);
    });
  }
}
