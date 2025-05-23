import { Plugin } from 'obsidian';

export default class StoryboardPlugin extends Plugin {
	async onload() {
		console.log('Storyboard plugin loaded');
		// プラグインの初期化処理をここに追加
	}

	onunload() {
		console.log('Storyboard plugin unloaded');
	}
} 