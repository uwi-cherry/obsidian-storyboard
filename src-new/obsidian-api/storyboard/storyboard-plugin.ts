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
    addIcon('storyboard', OBSIDIAN_ICONS.STORYBOARD_ICON_SVG);
    addIcon('storyboard-toggle', OBSIDIAN_ICONS.STORYBOARD_TOGGLE_ICON_SVG);

    this.plugin.registerExtensions(['storyboard'], 'markdown');
    
    const ensureButtonsInAllMarkdownViews = () => {
      this.plugin.app.workspace.getLeavesOfType('markdown').forEach((leaf: WorkspaceLeaf) => {
        if (leaf.view instanceof MarkdownView) {
          this.factory.ensureStoryboardToggleButtonForLeaf(leaf, this.plugin.app);
        }
      });
    };

    const handleActiveLeafChange = (leaf: WorkspaceLeaf | null) => {
      if (leaf && leaf.view instanceof MarkdownView) {
        this.factory.ensureStoryboardToggleButtonForLeaf(leaf, this.plugin.app);
      }
    };

    this.plugin.registerEvent(this.plugin.app.workspace.on('layout-change', ensureButtonsInAllMarkdownViews));
    this.plugin.registerEvent(this.plugin.app.workspace.on('active-leaf-change', handleActiveLeafChange));

    ensureButtonsInAllMarkdownViews();

    const handleFileOpen = async (file: TFile) => {
      const activeLeaf = this.plugin.app.workspace.activeLeaf;
      if (!activeLeaf || !(activeLeaf.view instanceof MarkdownView)) return;

      if (file.extension === 'storyboard') {
        await this.factory.switchToStoryboardViewMode(activeLeaf, this.plugin.app);
      } else if (this.factory.getCurrentViewMode(activeLeaf) === 'storyboard') {
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