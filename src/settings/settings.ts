import { App, PluginSettingTab, Setting } from 'obsidian';
import type MyPlugin from '../../main';
import { setLanguage, Language, t } from '../i18n';

export interface PluginSettings {
  apiKey: string;
  language: Language;
}

export const DEFAULT_SETTINGS: PluginSettings = {
  apiKey: '',
  language: 'ja',
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

    // OpenAI公式リンク追加
    const docLink = containerEl.createEl('div');
    docLink.innerHTML = `<a href="https://platform.openai.com/docs/overview" target="_blank" rel="noopener noreferrer" style="color:var(--interactive-accent);text-decoration:underline;">OpenAI API公式ドキュメントはこちら</a>`;
    docLink.style.marginBottom = '1em';

    // 設定値取得
    const settings: PluginSettings = this.settings;

    new Setting(containerEl)
      .setName(t('OPENAI_API_KEY'))
      .setDesc(t('OPENAI_API_KEY_DESC'))
      .addText(text => text
        .setPlaceholder('sk-...')
        .setValue(settings.apiKey || '')
        .onChange(async (value) => {
          settings.apiKey = value;
          await saveSettings(this.plugin, settings);
        })
      );

    new Setting(containerEl)
      .setName(t('LANGUAGE'))
      .setDesc(t('LANGUAGE_DESC'))
      .addDropdown(drop =>
        drop.addOption('ja', '日本語')
            .addOption('en', 'English')
            .setValue(settings.language)
            .onChange(async (value) => {
              settings.language = value as Language;
              setLanguage(settings.language);
              await saveSettings(this.plugin, settings);
              await this.display();
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
