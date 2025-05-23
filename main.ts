import { Plugin } from 'obsidian';
import { PainterPlugin } from './src-new/obsidian-api/painter/painter-plugin';
import { RightSidebarPlugin } from './src-new/obsidian-api/right-sidebar/right-sidebar-plugin';
import { TimelinePlugin } from './src-new/obsidian-api/timeline/timeline-plugin';
import { StoryboardPlugin } from './src-new/obsidian-api/storyboard/storyboard-plugin';
import { SettingsPlugin } from './src-new/obsidian-api/settings/settings-plugin';
import { setAppInstance } from './src-new/obsidian-i18n';

/**
 * メインプラグインクラス
 */
export default class MyPlugin extends Plugin {
  private painterPlugin: PainterPlugin;
  private rightSidebarPlugin: RightSidebarPlugin;
  private timelinePlugin: TimelinePlugin;
  private storyboardPlugin: StoryboardPlugin;
  private settingsPlugin: SettingsPlugin;

  async onload() {
    console.log('🚀 Loading plugin...');

    // Obsidian標準の翻訳システムを初期化
    setAppInstance(this.app);

    // Obsidian API層の初期化
    this.painterPlugin = new PainterPlugin(this);
    this.rightSidebarPlugin = new RightSidebarPlugin(this);
    this.timelinePlugin = new TimelinePlugin(this);
    this.storyboardPlugin = new StoryboardPlugin(this);
    this.settingsPlugin = new SettingsPlugin(this);

    // 各ファクトリの初期化
    this.painterPlugin.initialize();
    this.rightSidebarPlugin.initialize();
    this.timelinePlugin.initialize();
    this.storyboardPlugin.initialize();
    this.settingsPlugin.initialize();

    console.log('✅ Plugin loaded successfully');
  }

  onunload() {
    console.log('🔄 Unloading plugin...');
    // 必要に応じてクリーンアップ処理
    console.log('✅ Plugin unloaded');
  }
}
