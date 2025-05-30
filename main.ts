import { Plugin } from 'obsidian';
import { PainterPlugin } from './src/app/painter/painter-plugin';
import { TimelinePlugin } from './src/app/timeline/timeline-plugin';
import { StoryboardPlugin } from './src/app/storyboard/storyboard-plugin';
import { SettingsPlugin } from './src/app/settings/settings-plugin';
import { CreateMenuPlugin } from './src/app/create-menu/create-menu-plugin';
import { setAppInstance } from './src/constants/obsidian-i18n';
import { toolRegistry } from './src/service/core/tool-registry';
import { RightSidebarPlugin } from 'src/app/right-sidebar/right-sidebar-plugin';

export default class MyPlugin extends Plugin {
  private painterPlugin: PainterPlugin;
  private rightSidebarPlugin: RightSidebarPlugin;
  private timelinePlugin: TimelinePlugin;
  private boardPlugin: StoryboardPlugin;
  private settingsPlugin: SettingsPlugin;
  private createMenuPlugin: CreateMenuPlugin;

  async onload() {

    setAppInstance(this.app);

    // ツールの登録完了を待つ
    await toolRegistry.ready;
    const availableTools = toolRegistry.getRegisteredToolNames();

    if (availableTools.length === 0) {
      console.warn('登録済みツールがありません');
    }

    this.painterPlugin = new PainterPlugin(this);
    this.rightSidebarPlugin = new RightSidebarPlugin(this);
    this.timelinePlugin = new TimelinePlugin(this);
    this.boardPlugin = new StoryboardPlugin(this);
    this.settingsPlugin = new SettingsPlugin(this);
    this.createMenuPlugin = new CreateMenuPlugin(this);

    this.painterPlugin.initialize();
    this.rightSidebarPlugin.initialize();
    this.timelinePlugin.initialize();
    this.boardPlugin.initialize();
    await this.settingsPlugin.initialize();
    this.createMenuPlugin.initialize();

  }

  onunload() {
  }
}
