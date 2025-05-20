import { Plugin } from 'obsidian';
import { initializeStoryboardIntegration } from './src/storyboard/storyboard-plugin';
import { loadPlugin as initializePsdPainterIntegration } from './src/painter/painter-plugin';
import { initializeChatIntegration } from './src/ai/chatIntegration';
import { loadSettings, saveSettings, PluginSettings, DEFAULT_SETTINGS } from './src/settings/settings';
import { setLanguage } from './src/i18n';

export type MyPluginInstance = MyPlugin;

export default class MyPlugin extends Plugin {
        settings: PluginSettings = DEFAULT_SETTINGS;

        async onload() {
                this.settings = await loadSettings(this);
                setLanguage(this.settings.language);

                initializeStoryboardIntegration(this);
                initializePsdPainterIntegration(this);
                // AI設定タブとグローバル plugin インスタンスの登録
                initializeChatIntegration(this);
        }

        async saveSettings() {
                await saveSettings(this, this.settings);
        }
}
