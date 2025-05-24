import { Plugin, addIcon, Menu, TFile } from 'obsidian';
import { ADD_ICON_SVG } from '../../constants/icons';
import { toolRegistry } from '../../service-api/core/tool-registry';
import { TOOL_NAMES } from '../../constants/tools-config';

/**
 * Create Menu Plugin - provides a single ribbon icon to create various items
 */
export class CreateMenuPlugin {
  private plugin: Plugin;

  constructor(plugin: Plugin) {
    this.plugin = plugin;
  }

  initialize(): void {
    console.log('📋 CreateMenuPlugin: Initializing...');
    addIcon('create-menu', ADD_ICON_SVG);
    console.log('📋 CreateMenuPlugin: Icon added');
    console.log('📋 CreateMenuPlugin: ADD_ICON_SVG content:', ADD_ICON_SVG);
    
    const ribbonIcon = this.plugin.addRibbonIcon('create-menu', '新規作成', async (evt: MouseEvent) => {
      console.log('📋 CreateMenuPlugin: Ribbon icon clicked');
      const menu = new Menu();
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
            const leaf = this.plugin.app.workspace.getLeaf(true);
            await leaf.setViewState({ type: 'timeline-view', active: true });
            this.plugin.app.workspace.revealLeaf(leaf);
          })
      );
      menu.addItem(item =>
        item
          .setTitle('Storyboard')
          .setIcon('storyboard')
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
                // ignore parse error and fall back
              }
              const activeLeaf = this.plugin.app.workspace.getLeaf(true);
              const storyboardFiles = this.plugin.app.vault.getFiles().filter(f => f.extension === 'storyboard');
              if (storyboardFiles.length > 0) {
                const latestFile = storyboardFiles[storyboardFiles.length - 1];
                await activeLeaf.openFile(latestFile);
              }
            } catch (error) {
              console.error('ストーリーボードファイル作成エラー:', error);
            }
          })
      );
      menu.showAtMouseEvent(evt);
    });
    console.log('📋 CreateMenuPlugin: Ribbon icon created:', ribbonIcon);
    console.log('📋 CreateMenuPlugin: Initialization complete');
  }
}
