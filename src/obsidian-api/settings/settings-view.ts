import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { PluginSettings, saveSettings } from './settings-data';

export class StoryboardSettingTab extends PluginSettingTab {
  plugin: Plugin;
  settings: PluginSettings;

  constructor(app: App, plugin: Plugin, settings: PluginSettings) {
    super(app, plugin);
    this.plugin = plugin;
    this.settings = settings;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    
    containerEl.createEl('h2', { text: 'AI Settings' });

    new Setting(containerEl)
      .setName('API Provider')
      .setDesc('Choose API provider')
      .addDropdown(dropdown =>
        dropdown
          .addOption('fal', 'fal.ai')
          .addOption('replicate', 'Replicate')
          .setValue(this.settings.provider)
          .onChange(async (value) => {
            this.settings.provider = value as 'fal' | 'replicate';
            await saveSettings(this.plugin, this.settings);
          })
      );

    new Setting(containerEl)
      .setName('fal.ai API Key')
      .setDesc('API key for fal.ai')
      .addText(text =>
        text
          .setPlaceholder('fal-...')
          .setValue(this.settings.falApiKey || '')
          .onChange(async (value) => {
            this.settings.falApiKey = value;
            await saveSettings(this.plugin, this.settings);
          })
      );

    new Setting(containerEl)
      .setName('Replicate API Key')
      .setDesc('API key for Replicate')
      .addText(text =>
        text
          .setPlaceholder('r8-...')
          .setValue(this.settings.replicateApiKey || '')
          .onChange(async (value) => {
            this.settings.replicateApiKey = value;
            await saveSettings(this.plugin, this.settings);
          })
      );
  }
}
