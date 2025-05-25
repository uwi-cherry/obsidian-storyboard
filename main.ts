import { Plugin } from 'obsidian';
import { PainterPlugin } from './src-new/obsidian-api/painter/painter-plugin';
import { TimelinePlugin } from './src-new/obsidian-api/timeline/timeline-plugin';
import { StoryboardPlugin } from './src-new/obsidian-api/storyboard/storyboard-plugin';
import { SettingsPlugin } from './src-new/obsidian-api/settings/settings-plugin';
import { CreateMenuPlugin } from './src-new/obsidian-api/create-menu/create-menu-plugin';
import { setAppInstance } from './src-new/constants/obsidian-i18n';
import { toolRegistry } from './src-new/service-api/core/tool-registry';
import { RightSidebarPlugin } from 'src-new/obsidian-api/right-sidebar/right-sidebar-plugin';

export default class MyPlugin extends Plugin {
  private painterPlugin: PainterPlugin;
  private rightSidebarPlugin: RightSidebarPlugin;
  private timelinePlugin: TimelinePlugin;
  private storyboardPlugin: StoryboardPlugin;
  private settingsPlugin: SettingsPlugin;
  private createMenuPlugin: CreateMenuPlugin;

  async onload() {

    setAppInstance(this.app);


    
    const availableTools = toolRegistry.getRegisteredToolNames();

    if (availableTools.length === 0) {
      console.warn('登録済みツールがありません');
    }

    this.painterPlugin = new PainterPlugin(this);
    this.rightSidebarPlugin = new RightSidebarPlugin(this);
    this.timelinePlugin = new TimelinePlugin(this);
    this.storyboardPlugin = new StoryboardPlugin(this);
    this.settingsPlugin = new SettingsPlugin(this);
    this.createMenuPlugin = new CreateMenuPlugin(this);

    this.painterPlugin.initialize();
    this.rightSidebarPlugin.initialize();
    this.timelinePlugin.initialize();
    this.storyboardPlugin.initialize();
    this.settingsPlugin.initialize();
    this.createMenuPlugin.initialize();

  }

  onunload() {
  }
}
