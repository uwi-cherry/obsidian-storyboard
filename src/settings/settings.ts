import { App, PluginSettingTab, Setting } from 'obsidian';
import type MyPlugin from '../../main';
import { t } from '../i18n';

export interface PluginSettings {
  provider: 'fal' | 'replicate';
  falApiKey: string;
  replicateApiKey: string;
}

export const DEFAULT_SETTINGS: PluginSettings = {
  provider: 'fal',
  falApiKey: '',
  replicateApiKey: '',
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
      .setName(t('API_PROVIDER'))
      .setDesc(t('API_PROVIDER_DESC'))
      .addDropdown(drop =>
        drop
          .addOption('fal', 'fal.ai')
          .addOption('replicate', 'Replicate')
          .setValue(settings.provider)
          .onChange(async value => {
            settings.provider = value as 'fal' | 'replicate';
            await saveSettings(this.plugin, settings);
          }),
      );

    new Setting(containerEl)
      .setName(t('FAL_API_KEY'))
      .setDesc(t('FAL_API_KEY_DESC'))
      .addText(text =>
        text
          .setPlaceholder('fal-...')
          .setValue(settings.falApiKey || '')
          .onChange(async value => {
            settings.falApiKey = value;
            await saveSettings(this.plugin, settings);
          }),
      );

    new Setting(containerEl)
      .setName(t('REPLICATE_API_KEY'))
      .setDesc(t('REPLICATE_API_KEY_DESC'))
      .addText(text =>
        text
          .setPlaceholder('r8-...')
          .setValue(settings.replicateApiKey || '')
          .onChange(async value => {
            settings.replicateApiKey = value;
            await saveSettings(this.plugin, settings);
          }),
      );
  }
}

export async function loadSettings(plugin: MyPlugin): Promise<PluginSettings> {
  return Object.assign({}, DEFAULT_SETTINGS, await plugin.loadData());
}

export async function saveSettings(plugin: MyPlugin, settings: PluginSettings): Promise<void> {
  await plugin.saveData(settings);
}
