import { Plugin } from 'obsidian';
import { initializeStoryboardIntegration } from './src/storyboard/storyboard-plugin';
import { loadPlugin as initializePsdPainterIntegration } from './src/painter/painter-plugin';
import { initializeChatIntegration } from './src/ai/chatIntegration';

export type MyPluginInstance = MyPlugin;

export default class MyPlugin extends Plugin {
	async onload() {
		initializeStoryboardIntegration(this);
		initializePsdPainterIntegration(this);
		// AI設定タブとグローバル plugin インスタンスの登録
		initializeChatIntegration(this);
	}
}
