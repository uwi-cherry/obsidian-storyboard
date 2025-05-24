import { Plugin } from 'obsidian';
import { PainterPlugin } from './src-new/obsidian-api/painter/painter-plugin';
import { TimelinePlugin } from './src-new/obsidian-api/timeline/timeline-plugin';
import { StoryboardPlugin } from './src-new/obsidian-api/storyboard/storyboard-plugin';
import { SettingsPlugin } from './src-new/obsidian-api/settings/settings-plugin';
import { CreateMenuPlugin } from './src-new/obsidian-api/create-menu/create-menu-plugin';
import { setAppInstance } from './src-new/constants/obsidian-i18n';
import { toolRegistry } from './src-new/service-api/core/tool-registry';
import { RightSidebarPlugin } from 'src-new/obsidian-api/right-sidebar/right-sidebar-plugin';

/**
 * メインプラグインクラス
 */
export default class MyPlugin extends Plugin {
  private painterPlugin: PainterPlugin;
  private rightSidebarPlugin: RightSidebarPlugin;
  private timelinePlugin: TimelinePlugin;
  private storyboardPlugin: StoryboardPlugin;
  private settingsPlugin: SettingsPlugin;
  private createMenuPlugin: CreateMenuPlugin;

  async onload() {
    console.log('🚀 Loading plugin...');

    // Obsidian標準の翻訳システムを初期化
    setAppInstance(this.app);

    // Zustand ストアを利用するため GlobalVariableManager は不要になりました

    // Service API層の初期化（最初に実行）
    console.log('🔧 Initializing Service API...');
    
    // 利用可能なツールを確認
    const availableTools = toolRegistry.getRegisteredToolNames();
    console.log('📋 Available tools:', availableTools);
    
    if (availableTools.length === 0) {
      console.warn('⚠️ No tools registered. Service API may not be working correctly.');
    } else {
      console.log('✅ Service API initialized successfully');
    }

    // Obsidian API層の初期化
    this.painterPlugin = new PainterPlugin(this);
    this.rightSidebarPlugin = new RightSidebarPlugin(this);
    this.timelinePlugin = new TimelinePlugin(this);
    this.storyboardPlugin = new StoryboardPlugin(this);
    this.settingsPlugin = new SettingsPlugin(this);
    this.createMenuPlugin = new CreateMenuPlugin(this);

    // 各ファクトリの初期化
    this.painterPlugin.initialize();
    this.rightSidebarPlugin.initialize();
    this.timelinePlugin.initialize();
    this.storyboardPlugin.initialize();
    this.settingsPlugin.initialize();
    this.createMenuPlugin.initialize();

    console.log('✅ Plugin loaded successfully');
  }

  onunload() {
    console.log('🔄 Unloading plugin...');
    // 必要に応じてクリーンアップ処理
    console.log('✅ Plugin unloaded');
  }
}
