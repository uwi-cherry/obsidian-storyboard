import { App, PluginSettingTab, Setting } from 'obsidian';
import type MyPlugin from '../../main';
import { t } from '../i18n';

export interface PluginSettings {
  apiKey: string;
}

export const DEFAULT_SETTINGS: PluginSettings = {
  apiKey: '',
};

export class SettingTab extends PluginSettingTab {
  plugin: MyPlugin;
  settings: PluginSettings;

  constructor(app: App, plugin: MyPlugin, settings: PluginSettings) {
    super(app, plugin);
    this.plugin = plugin;
    this.settings = settings;
  }

  async display(): Promise<void> {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h2', { text: t('AI_SETTINGS') });

    // 設定値取得
    const settings: PluginSettings = this.settings;

    new Setting(containerEl)
      .setName('API Key')
      .setDesc('Enter your API key')
      .addText(text => text
        .setPlaceholder('sk-...')
        .setValue(settings.apiKey || '')
        .onChange(async (value) => {
          settings.apiKey = value;
          await saveSettings(this.plugin, settings);
        })
      );
  }
}

export async function loadSettings(plugin: MyPlugin): Promise<PluginSettings> {
  return Object.assign({}, DEFAULT_SETTINGS, await plugin.loadData());
}

export async function saveSettings(plugin: MyPlugin, settings: PluginSettings): Promise<void> {
  await plugin.saveData(settings);
}
