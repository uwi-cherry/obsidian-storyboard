import { Plugin, addIcon, TFile, WorkspaceLeaf, MarkdownView } from 'obsidian';
import { StoryboardFactory } from './storyboard-factory';
import { OBSIDIAN_ICONS } from '../../constants/icons';
import { toolRegistry } from '../../service-api/core/tool-registry';
import { TOOL_NAMES } from '../../constants/tools-config';

export class StoryboardPlugin {
  private plugin: Plugin;
  private factory: StoryboardFactory;

  constructor(plugin: Plugin) {
    this.plugin = plugin;
    this.factory = new StoryboardFactory();
  }

  initialize(): void {
    addIcon('board', OBSIDIAN_ICONS.STORYBOARD_ICON_SVG);
    addIcon('board-toggle', OBSIDIAN_ICONS.STORYBOARD_TOGGLE_ICON_SVG);

    this.plugin.registerExtensions(['board'], 'markdown');
    
    // 絵コンテ切替ボタンは削除（モード切替に統合）

    const handleFileOpen = async (file: TFile) => {
      const activeLeaf = this.plugin.app.workspace.activeLeaf;
      if (!activeLeaf || !(activeLeaf.view instanceof MarkdownView)) return;

      if (file.extension === 'board') {
        await this.factory.switchToStoryboardViewMode(activeLeaf, this.plugin.app);
      } else if (this.factory.getCurrentViewMode(activeLeaf) === 'board') {
        this.factory.switchToMarkdownViewMode(activeLeaf);
      }
    };
    this.plugin.registerEvent(this.plugin.app.workspace.on('file-open', handleFileOpen));
    
    this.plugin.register(() => {
      this.factory.cleanupStoryboardViewRoots(this.plugin.app);
    });
  }

  getFactory(): StoryboardFactory {
    return this.factory;
  }
} 
