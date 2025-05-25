import { Plugin } from 'obsidian';
import { StoryboardSettingTab } from './settings-view';

export class SettingsPlugin {
  private plugin: Plugin;

  constructor(plugin: Plugin) {
    this.plugin = plugin;
  }

  initialize(): void {

    this.plugin.addSettingTab(new StoryboardSettingTab(this.plugin.app, this.plugin));
  }
} 
