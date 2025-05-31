import { Plugin } from 'obsidian';
import { StoryboardSettingTab } from './settings-view';
import { loadSettings, PluginSettings } from './settings-data';
import { setPluginSettings } from '../../constants/plugin-settings';

export class SettingsPlugin {
  private plugin: Plugin;
  private settings: PluginSettings | null = null;

  constructor(plugin: Plugin) {
    this.plugin = plugin;
  }

  async initialize(): Promise<void> {
    this.settings = await loadSettings(this.plugin);
    setPluginSettings(this.settings);
    this.plugin.addSettingTab(new StoryboardSettingTab(this.plugin.app, this.plugin, this.settings));
  }

  getSettings(): PluginSettings | null {
    return this.settings;
  }
}
