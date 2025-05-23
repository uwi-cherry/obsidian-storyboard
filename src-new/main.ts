import { Plugin } from 'obsidian';
import { PainterPlugin } from './obsidian-api/painter/painter-plugin';
import { RightSidebarPlugin } from './obsidian-api/right-sidebar/right-sidebar-plugin';
import { TimelinePlugin } from './obsidian-api/timeline/timeline-plugin';
import { StoryboardPlugin } from './obsidian-api/storyboard/storyboard-plugin';

/**
 * メインプラグインクラス
 */
export default class MyPlugin extends Plugin {
  private painterPlugin: PainterPlugin;
  private rightSidebarPlugin: RightSidebarPlugin;
  private timelinePlugin: TimelinePlugin;
  private storyboardPlugin: StoryboardPlugin;

  async onload() {
    console.log('🚀 Loading plugin...');

    // Obsidian API層の初期化
    this.painterPlugin = new PainterPlugin(this);
    this.rightSidebarPlugin = new RightSidebarPlugin(this);
    this.timelinePlugin = new TimelinePlugin(this);
    this.storyboardPlugin = new StoryboardPlugin(this);

    // 各ファクトリの初期化
    this.painterPlugin.initialize();
    this.rightSidebarPlugin.initialize();
    this.timelinePlugin.initialize();
    this.storyboardPlugin.initialize();

    console.log('✅ Plugin loaded successfully');
  }

  onunload() {
    console.log('🔄 Unloading plugin...');
    // 必要に応じてクリーンアップ処理
    console.log('✅ Plugin unloaded');
  }
} 