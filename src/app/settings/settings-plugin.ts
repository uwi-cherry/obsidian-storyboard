import { Plugin } from 'obsidian';
import { StoryboardSettingTab } from './settings-view';
import { loadSettings, PluginSettings } from './settings-data';
import { usePluginSettingsStore } from '../../store/plugin-settings-store';

export class SettingsPlugin {
  private plugin: Plugin;
  private settings: PluginSettings | null = null;

  constructor(plugin: Plugin) {
    this.plugin = plugin;
  }

  async initialize(): Promise<void> {
    this.settings = await loadSettings(this.plugin);
    usePluginSettingsStore.getState().setSettings(this.settings);
    this.plugin.addSettingTab(
      new StoryboardSettingTab(this.plugin.app, this.plugin, this.settings)
    );
  }
}
