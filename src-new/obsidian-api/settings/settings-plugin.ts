import { Plugin } from 'obsidian';
import { StoryboardSettingTab } from './settings-view';

/**
 * Settings Plugin - Obsidian Plugin Integration
 */
export class SettingsPlugin {
  private plugin: Plugin;

  constructor(plugin: Plugin) {
    this.plugin = plugin;
  }

  initialize(): void {
    // 設定タブを追加
    this.plugin.addSettingTab(new StoryboardSettingTab(this.plugin.app, this.plugin));
  }
} 