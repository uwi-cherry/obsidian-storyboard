import { Plugin } from 'obsidian';
import { PainterPlugin } from './src/app/painter/painter-plugin';
import { SettingsPlugin } from './src/app/settings/settings-plugin';
import { setAppInstance } from './src/constants/obsidian-i18n';
import { toolRegistry } from './src/service/core/tool-registry';
import { RightSidebarPlugin } from 'src/app/right-sidebar/right-sidebar-plugin';

export default class MyPlugin extends Plugin {
  private painterPlugin: PainterPlugin;
  private rightSidebarPlugin: RightSidebarPlugin;
  private settingsPlugin: SettingsPlugin;

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
    this.settingsPlugin = new SettingsPlugin(this);

    this.painterPlugin.initialize();
    this.rightSidebarPlugin.initialize();
    await this.settingsPlugin.initialize();

  }

  onunload() {
  }
}
