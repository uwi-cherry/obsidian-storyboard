import { Plugin } from 'obsidian';
import { PainterPlugin } from './src-new/obsidian-api/painter/painter-plugin';
import { RightSidebarPlugin } from './src-new/obsidian-api/right-sidebar/right-sidebar-plugin';
import { TimelinePlugin } from './src-new/obsidian-api/timeline/timeline-plugin';
import { StoryboardPlugin } from './src-new/obsidian-api/storyboard/storyboard-plugin';

/**
 * メインプラグインクラス
 */
export default class MyPlugin extends Plugin {
  private painterFactory: PainterPlugin;
  private rightSidebarFactory: RightSidebarPlugin;
  private timelineFactory: TimelinePlugin;
  private storyboardFactory: StoryboardPlugin;

  async onload() {
    console.log('🚀 Loading plugin...');

    // Obsidian API層の初期化
    this.painterFactory = new PainterPlugin(this);
    this.rightSidebarFactory = new RightSidebarPlugin(this);
    this.timelineFactory = new TimelinePlugin(this);
    this.storyboardFactory = new StoryboardPlugin(this);

    // 各ファクトリの初期化
    this.painterFactory.initialize();
    this.rightSidebarFactory.initialize();
    this.timelineFactory.initialize();
    this.storyboardFactory.initialize();

    console.log('✅ Plugin loaded successfully');
  }

  onunload() {
    console.log('🔄 Unloading plugin...');
    // 必要に応じてクリーンアップ処理
    console.log('✅ Plugin unloaded');
  }
}
