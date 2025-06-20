import { Plugin } from 'obsidian';
import { AIPainterSettingTab } from './settings-view';
import { loadSettings, PluginSettings } from '../../storage/plugin-settings';
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
    this.plugin.addSettingTab(new AIPainterSettingTab(this.plugin.app, this.plugin, this.settings));
  }

  getSettings(): PluginSettings | null {
    return this.settings;
  }
}
