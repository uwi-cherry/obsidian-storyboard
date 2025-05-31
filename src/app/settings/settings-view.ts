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
      .setName('作風指示')
      .setDesc('AIが参考にするスタイル指示')
      .addTextArea(text =>
        text
          .setPlaceholder('例: コミカルで分かりやすいトーン')
          .setValue(this.settings.styleInstructions || '')
          .onChange(async (value) => {
            this.settings.styleInstructions = value;
            await saveSettings(this.plugin, this.settings);
          })
      );
  }
}
