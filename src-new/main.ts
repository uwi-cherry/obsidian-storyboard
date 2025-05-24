import { Plugin } from 'obsidian';
import { PainterPlugin } from './obsidian-api/painter/painter-plugin';
import { RightSidebarPlugin } from './obsidian-api/right-sidebar/right-sidebar-plugin';
import { TimelinePlugin } from './obsidian-api/timeline/timeline-plugin';
import { StoryboardPlugin } from './obsidian-api/storyboard/storyboard-plugin';
import { SettingsPlugin } from './obsidian-api/settings/settings-plugin';
import { toolRegistry } from './service-api/core/tool-registry';
import { GlobalVariableManager } from './obsidian-api/core/global-variable-manager';

/**
 * メインプラグインクラス
 */
export default class MyPlugin extends Plugin {
  private painterPlugin: PainterPlugin;
  private rightSidebarPlugin: RightSidebarPlugin;
  private timelinePlugin: TimelinePlugin;
  private storyboardPlugin: StoryboardPlugin;
  private settingsPlugin: SettingsPlugin;
  public globalVariableManager: GlobalVariableManager;

  async onload() {
    console.log('🚀 Loading plugin...');

    // GlobalVariableManagerを初期化
    this.globalVariableManager = new GlobalVariableManager(this);

    // Service API層の初期化（最初に実行）
    try {
      console.log('🔧 Initializing Service API...');
      // toolRegistryは既にコンストラクタで自動初期化されているため、
      // 初期化完了まで少し待つ
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 利用可能なツールを確認
      const availableTools = toolRegistry.getRegisteredToolNames();
      console.log('📋 Available tools:', availableTools);
      
      if (availableTools.length === 0) {
        console.warn('⚠️ No tools registered. Service API may not be working correctly.');
      } else {
        console.log('✅ Service API initialized successfully');
      }
    } catch (error) {
      console.error('❌ Service API initialization failed:', error);
    }

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
    // グローバル変数をクリーンアップ
    if (this.globalVariableManager) {
      // 必要に応じてクリーンアップ処理を追加
    }
    console.log('✅ Plugin unloaded');
  }
} 