import { App, PluginSettingTab, Setting } from 'obsidian';
import type MyPlugin from '../../main';

export interface AiSettings {
  apiKey: string;
}

export const DEFAULT_AI_SETTINGS: AiSettings = {
  apiKey: '',
};

export class AiSettingTab extends PluginSettingTab {
  plugin: MyPlugin;

  constructor(app: App, plugin: MyPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  async display(): Promise<void> {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h2', { text: 'AI設定' });

    // OpenAI公式リンク追加
    const docLink = containerEl.createEl('div');
    docLink.innerHTML = `<a href="https://platform.openai.com/docs/overview" target="_blank" rel="noopener noreferrer" style="color:#2563eb;text-decoration:underline;">OpenAI API公式ドキュメントはこちら</a>`;
    docLink.style.marginBottom = '1em';

    // 設定値取得
    const settings: AiSettings = Object.assign({}, DEFAULT_AI_SETTINGS, await this.plugin.loadData());

    new Setting(containerEl)
      .setName('OpenAI APIキー')
      .setDesc('openaiで利用するAPIキーを入力してください')
      .addText(text => text
        .setPlaceholder('sk-...')
        .setValue(settings.apiKey || '')
        .onChange(async (value) => {
          settings.apiKey = value;
          await this.plugin.saveData(settings);
        })
      );
  }
}

export async function loadAiSettings(plugin: MyPlugin): Promise<AiSettings> {
  return Object.assign({}, DEFAULT_AI_SETTINGS, await plugin.loadData());
}

export async function saveAiSettings(plugin: MyPlugin, settings: AiSettings): Promise<void> {
  await plugin.saveData(settings);
}
